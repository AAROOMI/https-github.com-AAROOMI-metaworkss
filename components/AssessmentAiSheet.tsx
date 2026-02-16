import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AssessmentItem, ControlStatus } from '../types';

interface AssessmentAiSheetProps {
    assessmentData: AssessmentItem[];
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    isEditable: boolean;
    canUpdate: boolean;
}

const allStatuses: ControlStatus[] = ['Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'];

// A new component for a single editable control row.
const EditableControlRow: React.FC<{
    item: AssessmentItem;
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    isEditable: boolean;
    canUpdate: boolean;
    index: number;
}> = ({ item, onUpdateItem, isEditable, canUpdate, index }) => {
    const [localItem, setLocalItem] = useState(item);
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        setLocalItem(item);
    }, [item]);

    const handleBlur = () => {
        if (JSON.stringify(localItem) !== JSON.stringify(item)) {
            onUpdateItem(localItem.controlCode, localItem);
            setIsSaving(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => setIsSaving(false), 2000);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalItem(prev => ({...prev, [name]: value}));
    };
    
    const isDisabled = !isEditable || !canUpdate;

    return (
         <div className="p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
             {isSaving && (
                 <div className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 animate-fade-out">
                     Saved
                 </div>
            )}
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200`}>
                    {index + 1}
                </div>
                <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-300 font-mono">{item.controlCode}</h3>
                    <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{item.controlName}</p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div className="md:col-span-2">
                            <label htmlFor={`currentStatusDescription-${item.controlCode}`} className="font-medium text-gray-500 dark:text-gray-400">Current Status Description</label>
                            <textarea
                                id={`currentStatusDescription-${item.controlCode}`}
                                name="currentStatusDescription"
                                value={localItem.currentStatusDescription}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                rows={2}
                                className="mt-1 block w-full text-sm rounded-md bg-transparent border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                            />
                        </div>
                        <div>
                             <label htmlFor={`controlStatus-${item.controlCode}`} className="font-medium text-gray-500 dark:text-gray-400">Control Status</label>
                             <select
                                id={`controlStatus-${item.controlCode}`}
                                name="controlStatus"
                                value={localItem.controlStatus}
                                onChange={(e) => {
                                    const newItem = { ...localItem, controlStatus: e.target.value as ControlStatus };
                                    setLocalItem(newItem);
                                    onUpdateItem(newItem.controlCode, newItem); // Update immediately for select for better UX
                                }}
                                disabled={isDisabled}
                                className="mt-1 block w-full text-sm rounded-md bg-transparent border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                            >
                                {allStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                         <div className="md:col-span-2">
                            <label htmlFor={`recommendation-${item.controlCode}`} className="font-medium text-gray-500 dark:text-gray-400">Recommendation</label>
                            <textarea
                                id={`recommendation-${item.controlCode}`}
                                name="recommendation"
                                value={localItem.recommendation}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                rows={2}
                                className="mt-1 block w-full text-sm rounded-md bg-transparent border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                            />
                        </div>
                        <div>
                             <label htmlFor={`managementResponse-${item.controlCode}`} className="font-medium text-gray-500 dark:text-gray-400">Management Response</label>
                            <textarea
                                id={`managementResponse-${item.controlCode}`}
                                name="managementResponse"
                                value={localItem.managementResponse}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                rows={2}
                                className="mt-1 block w-full text-sm rounded-md bg-transparent border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                            />
                        </div>
                        <div>
                             <label htmlFor={`targetDate-${item.controlCode}`} className="font-medium text-gray-500 dark:text-gray-400">Target Date</label>
                             <input
                                type="date"
                                id={`targetDate-${item.controlCode}`}
                                name="targetDate"
                                value={localItem.targetDate}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                className="mt-1 block w-full text-sm rounded-md bg-transparent border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const AssessmentAiSheet: React.FC<AssessmentAiSheetProps> = ({ assessmentData, onUpdateItem, isEditable, canUpdate }) => {
    const domains = useMemo(() => {
        const grouped: Record<string, AssessmentItem[]> = {};
        assessmentData.forEach(item => {
            if (!grouped[item.domainName]) {
                grouped[item.domainName] = [];
            }
            grouped[item.domainName].push(item);
        });
        return Object.entries(grouped);
    }, [assessmentData]);

    let controlCounter = 0;

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">NCA ECC Assessment: Full Sheet View</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                    {isEditable && canUpdate ? "Edit all assessment controls on a single page." : "Read-only view of the full assessment sheet."}
                </p>
                 {isEditable && canUpdate && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-500/50 rounded-md text-sm text-blue-800 dark:text-blue-200">
                        You are in edit mode. Changes are saved automatically when you click away from a field.
                    </div>
                )}
            </div>
            
            {domains.map(([domainName, controls]) => (
                <div key={domainName} className="bg-transparent space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-4">{domainName}</h2>
                    <div className="space-y-6">
                        {controls.map(item => {
                            const currentIndex = controlCounter;
                            controlCounter++;
                            
                            return (
                                <EditableControlRow
                                    key={item.controlCode}
                                    item={item}
                                    onUpdateItem={onUpdateItem}
                                    isEditable={isEditable}
                                    canUpdate={canUpdate}
                                    index={currentIndex}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes fade-out {
                    0% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .animate-fade-out {
                    animation: fade-out 2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};