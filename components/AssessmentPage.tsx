import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { AssessmentItem, ControlStatus, Permission } from '../types';
import { SearchIcon, DownloadIcon, UploadIcon } from './Icons';
import { DomainComplianceBarChart } from './DomainComplianceBarChart';
import { AssessmentSheet } from './AssessmentSheet';
import { NooraAssistant } from './NooraAssistant';

declare const Chart: any;

const allStatuses: ControlStatus[] = ['Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'];

const getStatusChartColor = (status: ControlStatus | 'Not Covered', opacity = 1) => {
    switch (status) {
        case 'Implemented': return `rgba(16, 185, 129, ${opacity})`;
        case 'Partially Implemented': return `rgba(245, 158, 11, ${opacity})`;
        case 'Not Implemented': return `rgba(239, 68, 68, ${opacity})`;
        case 'Not Applicable': return `rgba(107, 114, 128, ${opacity})`;
        default: return `rgba(156, 163, 175, ${opacity})`;
    }
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <Card>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{value}</p>
        {description && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </Card>
);

const StatusDistributionChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current || typeof Chart === 'undefined') return;
        
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#E5E7EB' : '#374151';

        const chartData = {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: Object.keys(data).map(status => getStatusChartColor(status as ControlStatus, 0.8)),
                borderColor: isDark ? '#1f2937' : '#ffffff',
                borderWidth: 2,
            }]
        };

        if (chartRef.current) chartRef.current.destroy();

        chartRef.current = new Chart(canvasRef.current, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: textColor, padding: 10, boxWidth: 10, font: { size: 10 } }
                    },
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [data]);
    
    return (
        <Card>
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-4 uppercase tracking-widest">Status Breakdown</h3>
            <div className="h-48">
                <canvas ref={canvasRef} />
            </div>
        </Card>
    );
};

interface AssessmentPageProps {
    assessmentData: AssessmentItem[];
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    status: 'idle' | 'in-progress' | 'completed' | 'implementation';
    onInitiate: () => void;
    onComplete: () => void;
    permissions: Set<Permission>;
    onSetView: (view: any) => void;
    onGenerateReport: (summary: string) => void;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ assessmentData, onUpdateItem, status, onInitiate, onComplete, permissions, onSetView, onGenerateReport }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ControlStatus | 'All'>('All');
    const [domainFilter, setDomainFilter] = useState('All');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isVoiceAssisted, setIsVoiceAssisted] = useState(false);
    const [currentVoiceControlIndex, setCurrentVoiceControlIndex] = useState(0);
    const [activeControlCode, setActiveControlCode] = useState<string | null>(null);
    const [activeField, setActiveField] = useState<keyof AssessmentItem | null>(null);
    
    const isEditable = status === 'in-progress';
    const canUpdate = permissions.has('assessment:update');

    const stats = useMemo(() => {
        const totalApplicable = assessmentData.filter(d => d.controlStatus !== 'Not Applicable').length;
        const implemented = assessmentData.filter(d => d.controlStatus === 'Implemented').length;
        const partially = assessmentData.filter(d => d.controlStatus === 'Partially Implemented').length;
        const notImplemented = assessmentData.filter(d => d.controlStatus === 'Not Implemented').length;
        const compliance = totalApplicable > 0 ? (implemented / totalApplicable) * 100 : 0;
        return { compliance, implemented, partially, notImplemented, total: assessmentData.length };
    }, [assessmentData]);

    const statusDistribution = useMemo(() => {
        const dist: Record<string, number> = { 'Implemented': 0, 'Partially Implemented': 0, 'Not Implemented': 0, 'Not Applicable': 0 };
        assessmentData.forEach(item => dist[item.controlStatus]++);
        return dist;
    }, [assessmentData]);
    
    const domains = useMemo(() => {
        const domainMap: Record<string, AssessmentItem[]> = {};
        for(const item of assessmentData) {
            if (!domainMap[item.domainName]) domainMap[item.domainName] = [];
            domainMap[item.domainName].push(item);
        }
        return Object.entries(domainMap).map(([name, items]) => ({ name, items }));
    }, [assessmentData]);

    const filteredDomains = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return domains
            .filter(domain => domainFilter === 'All' || domain.name === domainFilter)
            .map(domain => ({
                ...domain,
                items: domain.items.filter(item => 
                    (statusFilter === 'All' || item.controlStatus === statusFilter) &&
                    (item.controlCode.toLowerCase().includes(lowerSearch) || item.controlName.toLowerCase().includes(lowerSearch))
                )
            }))
            .filter(domain => domain.items.length > 0);
    }, [domains, searchTerm, statusFilter, domainFilter]);

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">NCA ECC Assessment</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Compliance Analysis for Essential Cybersecurity Controls.</p>
                </div>
                {canUpdate && (
                    <div className="flex gap-2">
                        {status === 'in-progress' ? (
                            <>
                                <button onClick={() => setIsVoiceAssisted(true)} className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors uppercase tracking-widest">AI Voice</button>
                                <button onClick={onComplete} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors uppercase tracking-widest">Finalize</button>
                            </>
                        ) : (
                            <button onClick={onInitiate} className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors uppercase tracking-widest">Start New</button>
                        )}
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Compliance Score" value={`${stats.compliance.toFixed(1)}%`} description="Relative to applicable controls" />
                <StatCard title="Implemented" value={stats.implemented} />
                <StatCard title="Partial" value={stats.partially} />
                <StatCard title="Not Met" value={stats.notImplemented} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="space-y-4">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search controls..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} className="block w-full py-2 px-3 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-teal-500">
                                <option value="All">All Domains</option>
                                {domains.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="block w-full py-2 px-3 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-teal-500">
                                <option value="All">All Statuses</option>
                                {allStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                </Card>
                <div className="lg:col-span-1">
                    <StatusDistributionChart data={statusDistribution} />
                </div>
            </div>

            <AssessmentSheet
                filteredDomains={filteredDomains}
                onUpdateItem={onUpdateItem}
                isEditable={isEditable}
                canUpdate={canUpdate}
                activeControlCode={activeControlCode}
                activeField={activeField}
            />

            {isVoiceAssisted && (
                <NooraAssistant
                    isAssessing={isVoiceAssisted}
                    onClose={() => setIsVoiceAssisted(false)}
                    assessmentData={assessmentData}
                    onUpdateItem={onUpdateItem}
                    currentControlIndex={currentVoiceControlIndex}
                    onNextControl={() => setCurrentVoiceControlIndex(prev => Math.min(prev + 1, assessmentData.length - 1))}
                    assessmentType="NCA ECC"
                    onInitiate={onInitiate}
                    onActiveFieldChange={(c, f) => { setActiveControlCode(c); setActiveField(f); }}
                    onRequestEvidenceUpload={(controlCode) => alert(`Upload requested for ${controlCode}`)}
                    onGenerateReport={onGenerateReport}
                />
            )}
        </div>
    );
};