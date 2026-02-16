
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { AssessmentItem, ControlStatus, Permission } from '../types';
import { SearchIcon, DownloadIcon, UploadIcon, MicrophoneIcon } from './Icons';
import { CMADomainComplianceBarChart } from './CMADomainComplianceBarChart';
import { AssessmentSheet } from './AssessmentSheet';
import { NooraAssistant } from './NooraAssistant';


declare const Chart: any;

const allStatuses: ControlStatus[] = ['Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'];

const getStatusChartColor = (status: ControlStatus | 'Not Covered', opacity = 1) => {
    switch (status) {
        case 'Implemented': return `rgba(16, 185, 129, ${opacity})`; // green-500
        case 'Partially Implemented': return `rgba(245, 158, 11, ${opacity})`; // amber-500
        case 'Not Implemented': return `rgba(239, 68, 68, ${opacity})`; // red-500
        case 'Not Applicable': return `rgba(107, 114, 128, ${opacity})`; // gray-500
        default: return `rgba(156, 163, 175, ${opacity})`; // gray-400
    }
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <Card>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {description && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
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
                        labels: { color: textColor, padding: 15, boxWidth: 12 }
                    },
                }
            }
        });

        return () => chartRef.current?.destroy();
    }, [data]);
    
    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Status Distribution</h3>
            <div className="h-64">
                <canvas ref={canvasRef} />
            </div>
        </Card>
    );
};

interface CMAAssessmentPageProps {
    assessmentData: AssessmentItem[];
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    status: 'idle' | 'in-progress' | 'completed' | 'implementation';
    onInitiate: () => void;
    onComplete: () => void;
    permissions: Set<Permission>;
    onGenerateReport: (summary: string) => void;
}

export const CMAAssessmentPage: React.FC<CMAAssessmentPageProps> = ({ assessmentData, onUpdateItem, status, onInitiate, onComplete, permissions, onGenerateReport }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ControlStatus | 'All'>('All');
    const [domainFilter, setDomainFilter] = useState('All');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // AI State
    const [isVoiceAssisted, setIsVoiceAssisted] = useState(false);
    const [currentVoiceControlIndex, setCurrentVoiceControlIndex] = useState(0);
    // Visual highlighting
    const [activeControlCode, setActiveControlCode] = useState<string | null>(null);
    const [activeField, setActiveField] = useState<keyof AssessmentItem | null>(null);

    const isEditable = status === 'in-progress';
    const canUpdate = permissions.has('cmaAssessment:update');

    const stats = useMemo(() => {
        const totalApplicable = assessmentData.filter(d => d.controlStatus !== 'Not Applicable').length;
        const implemented = assessmentData.filter(d => d.controlStatus === 'Implemented').length;
        const partially = assessmentData.filter(d => d.controlStatus === 'Partially Implemented').length;
        const notImplemented = assessmentData.filter(d => d.controlStatus === 'Not Implemented').length;
        const compliance = totalApplicable > 0 ? (implemented / totalApplicable) * 100 : 0;

        return { compliance, implemented, partially, notImplemented, total: assessmentData.length };
    }, [assessmentData]);

    const statusDistribution = useMemo(() => {
        const dist: Record<string, number> = {
            'Implemented': 0, 'Partially Implemented': 0, 'Not Implemented': 0, 'Not Applicable': 0
        };
        assessmentData.forEach(item => {
            dist[item.controlStatus]++;
        });
        return dist;
    }, [assessmentData]);
    
    const domains = useMemo(() => {
        const domainMap: Record<string, AssessmentItem[]> = {};
        for(const item of assessmentData) {
            if (!domainMap[item.domainName]) {
                domainMap[item.domainName] = [];
            }
            domainMap[item.domainName].push(item);
        }
        return Object.entries(domainMap).map(([name, items]) => ({ name, items }));
    }, [assessmentData]);

    const filteredDomains = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        
        return domains
            .filter(domain => domainFilter === 'All' || domain.name === domainFilter)
            .map(domain => {
                const filteredItems = domain.items.filter(item => 
                    (statusFilter === 'All' || item.controlStatus === statusFilter) &&
                    (
                        item.controlCode.toLowerCase().includes(lowerSearch) ||
                        item.controlName.toLowerCase().includes(lowerSearch) ||
                        item.currentStatusDescription.toLowerCase().includes(lowerSearch) ||
                        item.recommendation.toLowerCase().includes(lowerSearch)
                    )
                );
                return { ...domain, items: filteredItems };
            })
            .filter(domain => domain.items.length > 0);
    }, [domains, searchTerm, statusFilter, domainFilter]);

    const handleExportCSV = () => {
        const dataToExport = filteredDomains.flatMap(domain => domain.items);
        if (dataToExport.length === 0) {
            alert("No data to export based on current filters.");
            return;
        }

        const headers = [
            'Domain Code', 'Domain Name', 'Sub-Domain Code', 'Sub-Domain Name', 
            'Control Code', 'Control Name', 'Current Status', 'Control Status', 
            'Recommendation', 'Management Response', 'Target Date'
        ];

        const escapeCSV = (field: string) => {
            if (field === null || field === undefined) return '';
            let str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = [headers.join(',')];
        dataToExport.forEach(item => {
            const row = [
                escapeCSV(item.domainCode), escapeCSV(item.domainName), escapeCSV(item.subDomainCode),
                escapeCSV(item.subdomainName), escapeCSV(item.controlCode), escapeCSV(item.controlName),
                escapeCSV(item.currentStatusDescription), escapeCSV(item.controlStatus), escapeCSV(item.recommendation),
                escapeCSV(item.managementResponse), escapeCSV(item.targetDate),
            ];
            csvRows.push(row.join(','));
        });
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cma_assessment_export_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split('\n').filter(row => row.trim() !== '');
                if (rows.length < 2) throw new Error('CSV file must have a header and at least one data row.');

                const headerRow = rows[0].trim();
                const delimiter = headerRow.includes(';') ? ';' : ',';
                const headers = headerRow.split(delimiter).map(h => h.trim().replace(/^#/, '').replace(/"/g, ''));
                
                if (!headers.includes('Control Code')) {
                    throw new Error(`CSV is missing required header: 'Control Code'.`);
                }

                const indices: Record<string, number> = {};
                headers.forEach((h, i) => indices[h] = i);
                
                const keyMap: Record<string, keyof AssessmentItem> = {
                    'Current Status': 'currentStatusDescription',
                    'Control Status': 'controlStatus',
                    'Recommendation': 'recommendation',
                    'Management Response': 'managementResponse',
                    'Target Date': 'targetDate',
                };

                let updatedCount = 0;
                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].trim().split(delimiter);
                    const controlCode = (values[indices['Control Code']] || '').trim().replace(/"/g, '');
                    if (!controlCode) continue;
                    
                    const existingItem = assessmentData.find(item => item.controlCode === controlCode);

                    if (existingItem) {
                        const updatedItem = { ...existingItem };
                        let hasUpdate = false;
                        for (const header of Object.keys(keyMap)) {
                            if (indices[header] !== undefined) {
                                const key = keyMap[header];
                                const value = (values[indices[header]] || '').trim().replace(/"/g, '');

                                if (key === 'controlStatus' && value && !allStatuses.includes(value as ControlStatus)) {
                                    console.warn(`Skipping update for ${controlCode}: Invalid status "${value}"`);
                                    continue;
                                }
                                if ((updatedItem as any)[key] !== value) {
                                    (updatedItem as any)[key] = value;
                                    hasUpdate = true;
                                }
                            }
                        }
                         if (hasUpdate) {
                            onUpdateItem(controlCode, updatedItem);
                            updatedCount++;
                        }
                    }
                }
                alert(`${updatedCount} records updated successfully from the CSV file.`);
            } catch (error: any) {
                alert(`Error importing CSV: ${error.message}`);
            }
        };
        reader.readAsText(file);
        if (event.target) event.target.value = ''; // Reset file input
    };
    
    const handleCmaItemUpdate = async (controlCode: string, updatedItem: AssessmentItem) => {
        onUpdateItem(controlCode, updatedItem);
    };

    const handleActiveFieldChange = (controlCode: string | null, field: keyof AssessmentItem | null) => {
        setActiveControlCode(controlCode);
        setActiveField(field);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">CMA Assessment</h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Analysis of the assessment against the Capital Market Authority (CMA) framework.</p>
                </div>
                 {canUpdate && (
                     <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                        {status === 'in-progress' && (
                            <>
                                <button 
                                    onClick={() => setIsVoiceAssisted(!isVoiceAssisted)} 
                                    className={`p-3 rounded-full transition-all duration-300 shadow-md flex items-center justify-center ${isVoiceAssisted ? 'bg-green-100 text-green-600 ring-2 ring-green-400 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
                                    title={isVoiceAssisted ? "AI Assistant Active" : "Start AI Voice Assessment"}
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                </button>
                                <button onClick={onComplete} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                                    Complete Assessment
                                </button>
                            </>
                        )}
                        <button onClick={onInitiate} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            Initiate New Assessment
                        </button>
                    </div>
                )}
            </div>

            {status === 'implementation' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/50 border-l-4 border-green-400">
                    <h3 className="font-bold text-green-800 dark:text-green-200">Implementation Phase</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">This assessment has been approved and is now in the implementation phase.</p>
                </div>
            )}

            {isEditable && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-400">
                    <h3 className="font-bold text-blue-800 dark:text-blue-200">Assessment in Progress</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">You are in edit mode. Changes are saved automatically as you update fields. Click "Complete Assessment" when you are finished.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Overall Compliance" value={`${stats.compliance.toFixed(1)}%`} description="Based on applicable controls" />
                <StatCard title="Implemented" value={stats.implemented} />
                <StatCard title="Partially Implemented" value={stats.partially} />
                <StatCard title="Not Implemented" value={stats.notImplemented} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search controls, recommendations, etc."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500">
                                    <option value="All">All Domains</option>
                                    {domains.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500">
                                    <option value="All">All Statuses</option>
                                    {allStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!isEditable || !canUpdate}
                                className="w-full h-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <UploadIcon className="w-5 h-5" />
                                <span>Import CSV</span>
                            </button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileImport}
                                className="hidden"
                                accept=".csv, text/csv"
                            />
                            <button
                                onClick={handleExportCSV}
                                className="w-full h-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-800"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                <span>Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <StatusDistributionChart data={statusDistribution} />
                </div>
            </div>

            <Card>
                <CMADomainComplianceBarChart data={assessmentData} />
            </Card>

            <AssessmentSheet
                filteredDomains={filteredDomains}
                onUpdateItem={handleCmaItemUpdate}
                isEditable={isEditable && canUpdate}
                canUpdate={canUpdate}
                activeControlCode={activeControlCode}
                activeField={activeField}
            />

            {/* Headless AI Assistant */}
            {isVoiceAssisted && (
                <NooraAssistant
                    hidden={true}
                    isAssessing={isVoiceAssisted}
                    onClose={() => setIsVoiceAssisted(false)}
                    assessmentData={assessmentData}
                    onUpdateItem={onUpdateItem}
                    currentControlIndex={currentVoiceControlIndex}
                    onNextControl={() => setCurrentVoiceControlIndex(prev => Math.min(prev + 1, assessmentData.length - 1))}
                    assessmentType="CMA"
                    onInitiate={onInitiate}
                    onActiveFieldChange={handleActiveFieldChange}
                    onRequestEvidenceUpload={(controlCode) => alert(`Upload requested for ${controlCode}`)}
                    onGenerateReport={onGenerateReport}
                />
            )}
        </div>
    );
};
