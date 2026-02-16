
import React, { useState, useMemo } from 'react';
import type { AssessmentItem, ControlStatus, Permission } from '../types';
import { DomainComplianceBarChart } from './DomainComplianceBarChart';
import { AssessmentSheet } from './AssessmentSheet';
import { SearchIcon, DownloadIcon, UploadIcon } from './Icons';

interface GenericAssessmentPageProps {
    title: string;
    description: string;
    assessmentData: AssessmentItem[];
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    status: 'idle' | 'in-progress' | 'completed' | 'implementation';
    onInitiate: () => void;
    onComplete: () => void;
    permissions: Set<Permission>;
    permissionName: string; // Dynamic permission check
}

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

export const GenericAssessmentPage: React.FC<GenericAssessmentPageProps> = ({ 
    title, 
    description, 
    assessmentData, 
    onUpdateItem, 
    status, 
    onInitiate, 
    onComplete, 
    permissions,
    permissionName
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ControlStatus | 'All'>('All');
    
    // Fallback to assessment:update if specific permission missing in types, or assume permissionName is valid
    const canUpdate = permissions.has(permissionName as any) || permissions.has('assessment:update');
    const isEditable = status === 'in-progress';

    const stats = useMemo(() => {
        const totalApplicable = assessmentData.filter(d => d.controlStatus !== 'Not Applicable').length;
        const implemented = assessmentData.filter(d => d.controlStatus === 'Implemented').length;
        const partially = assessmentData.filter(d => d.controlStatus === 'Partially Implemented').length;
        const notImplemented = assessmentData.filter(d => d.controlStatus === 'Not Implemented').length;
        const compliance = totalApplicable > 0 ? (implemented / totalApplicable) * 100 : 0;

        return { compliance, implemented, partially, notImplemented };
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
                        item.controlName.toLowerCase().includes(lowerSearch) ||
                        item.currentStatusDescription.toLowerCase().includes(lowerSearch) ||
                        item.recommendation.toLowerCase().includes(lowerSearch)
                    )
                );
                return { ...domain, items: filteredItems };
            })
            .filter(domain => domain.items.length > 0);
    }, [domains, searchTerm, statusFilter]);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{title}</h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                {canUpdate && (
                    <div className="flex items-center gap-2">
                        {status === 'in-progress' && (
                            <button onClick={onComplete} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                                Complete Assessment
                            </button>
                        )}
                        <button onClick={onInitiate} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            {status === 'idle' ? 'Initiate Assessment' : 'Reset Assessment'}
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Overall Compliance" value={`${stats.compliance.toFixed(1)}%`} description="Based on applicable controls" />
                <StatCard title="Implemented" value={stats.implemented} />
                <StatCard title="Partially Implemented" value={stats.partially} />
                <StatCard title="Not Implemented" value={stats.notImplemented} />
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search controls..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500">
                            <option value="All">All Statuses</option>
                            <option value="Implemented">Implemented</option>
                            <option value="Partially Implemented">Partially</option>
                            <option value="Not Implemented">Not Implemented</option>
                            <option value="Not Applicable">N/A</option>
                        </select>
                    </div>
                </div>
            </div>

            <Card>
                <DomainComplianceBarChart data={assessmentData} />
            </Card>

            <AssessmentSheet
                filteredDomains={filteredDomains}
                onUpdateItem={onUpdateItem}
                isEditable={isEditable && canUpdate}
                canUpdate={canUpdate}
            />
        </div>
    );
};
