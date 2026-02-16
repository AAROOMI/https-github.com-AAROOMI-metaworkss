
import React, { useState, useMemo } from 'react';
import type { AssessmentItem, ControlStatus, Permission, PolicyDocument, Control, Subdomain, Domain, GeneratedContent } from '../types';
import { DomainComplianceBarChart } from './DomainComplianceBarChart';
import { AssessmentSheet } from './AssessmentSheet';
import { SearchIcon, DownloadIcon, SparklesIcon } from './Icons';

interface FrameworkAssessmentPageProps {
    title: string;
    frameworkId: string;
    assessmentData: AssessmentItem[];
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    onAddDocument?: (doc: PolicyDocument) => void;
    permissions: Set<Permission>;
}

export const FrameworkAssessmentPage: React.FC<FrameworkAssessmentPageProps> = ({ 
    title, 
    frameworkId,
    assessmentData, 
    onUpdateItem, 
    onAddDocument,
    permissions 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ControlStatus | 'All'>('All');
    
    const canUpdate = permissions.has('assessment:update');

    const stats = useMemo(() => {
        const totalApplicable = assessmentData.filter(d => d.controlStatus !== 'Not Applicable').length;
        const implemented = assessmentData.filter(d => d.controlStatus === 'Implemented').length;
        const compliance = totalApplicable > 0 ? (implemented / totalApplicable) * 100 : 0;
        return { compliance, implemented, total: assessmentData.length };
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
            .map(domain => {
                const filteredItems = domain.items.filter(item => 
                    (statusFilter === 'All' || item.controlStatus === statusFilter) &&
                    (
                        item.controlCode.toLowerCase().includes(lowerSearch) ||
                        item.controlName.toLowerCase().includes(lowerSearch)
                    )
                );
                return { ...domain, items: filteredItems };
            })
            .filter(domain => domain.items.length > 0);
    }, [domains, searchTerm, statusFilter]);

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                        {title} Assessment
                    </h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400 font-medium">
                        Standardized compliance tracking for {title}.
                    </p>
                </div>
                <div className="flex gap-3">
                     <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800 text-center min-w-[120px]">
                        <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Compliance</p>
                        <p className="text-3xl font-black text-teal-700 dark:text-teal-300 italic">{stats.compliance.toFixed(0)}%</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search controls..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                            />
                        </div>
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value as any)} 
                            className="bg-gray-50 dark:bg-gray-700/50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Implemented">Implemented</option>
                            <option value="Partially Implemented">Partial</option>
                            <option value="Not Implemented">Not Implemented</option>
                        </select>
                    </div>

                    <div className="h-64">
                        <DomainComplianceBarChart data={assessmentData} />
                    </div>
                </div>

                <div className="lg:col-span-1 bg-teal-600 rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-teal-500/20">
                    <div>
                        <SparklesIcon className="w-12 h-12 mb-6" />
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Agentic Audit</h3>
                        <p className="text-teal-50 text-sm font-medium leading-relaxed">
                            Deploy specialized AI agents to scan your {title} implementation and auto-generate compliance artifacts.
                        </p>
                    </div>
                    <button className="mt-8 w-full py-4 bg-white text-teal-600 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-50 transition-colors">
                        Run Smart Scan
                    </button>
                </div>
            </div>

            <AssessmentSheet
                filteredDomains={filteredDomains}
                onUpdateItem={onUpdateItem}
                isEditable={canUpdate}
                canUpdate={canUpdate}
            />
        </div>
    );
};
