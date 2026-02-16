
import React, { useState, useEffect, useRef } from 'react';
import type { AssessmentItem, ControlStatus } from '../types';
import { UploadIcon, PaperClipIcon, CloseIcon } from './Icons';

const allStatuses: ControlStatus[] = ['Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'];

interface EditableControlRowProps {
    item: AssessmentItem;
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    isEditable: boolean;
    canUpdate: boolean;
    index: number;
    isGenerating?: boolean;
    activeField?: keyof AssessmentItem | null;
}

const EditableControlRow: React.FC<EditableControlRowProps> = ({ item, onUpdateItem, isEditable, canUpdate, index, isGenerating, activeField }) => {
    const [localItem, setLocalItem] = useState(item);
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalItem(item);
    }, [item]);

    useEffect(() => {
        if (activeField && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeField]);

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

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as ControlStatus;
        const newItem = { ...localItem, controlStatus: newStatus };
        setLocalItem(newItem);
        onUpdateItem(newItem.controlCode, newItem);
        setIsSaving(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setIsSaving(false), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                const newItem = {
                    ...localItem,
                    evidence: { fileName: file.name, dataUrl: dataUrl }
                };
                setLocalItem(newItem);
                onUpdateItem(newItem.controlCode, newItem);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeEvidence = () => {
        const { evidence, ...rest } = localItem;
        const newItem = rest as AssessmentItem;
        setLocalItem(newItem);
        onUpdateItem(newItem.controlCode, newItem);
    };
    
    const isDisabled = !isEditable || !canUpdate;
    
    const getFieldClass = (fieldName: keyof AssessmentItem) => {
        const baseClass = "mt-1 block w-full text-xs rounded border-gray-200 dark:border-gray-700 bg-transparent focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 transition-all";
        if (activeField === fieldName) {
            return `${baseClass} ring-2 ring-teal-500/50 border-teal-500 bg-white dark:bg-gray-800`;
        }
        return baseClass;
    };
    
    return (
         <div ref={rowRef} className={`p-5 border rounded-xl transition-all duration-300 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 relative ${activeField ? 'shadow-lg border-teal-200 dark:border-teal-800' : 'shadow-sm'}`}>
             {isSaving && (
                 <div className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-semibold rounded bg-teal-50 text-teal-600 animate-pulse">
                     SYNCED
                 </div>
            )}
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs ${activeField ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {index + 1}
                </div>
                <div className="flex-grow">
                    <h3 className="text-xs font-semibold text-teal-700 dark:text-teal-400 font-mono uppercase tracking-tighter">{item.controlCode}</h3>
                    <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-300 font-normal leading-relaxed">{item.controlName}</p>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 text-[11px]">
                        <div className="md:col-span-2">
                            <label className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">Status Description</label>
                            <textarea
                                name="currentStatusDescription"
                                value={localItem.currentStatusDescription}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                rows={2}
                                className={getFieldClass('currentStatusDescription')}
                            />
                        </div>
                        <div>
                             <label className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">Status</label>
                             <select
                                name="controlStatus"
                                value={localItem.controlStatus}
                                onChange={handleStatusChange}
                                disabled={isDisabled}
                                className={getFieldClass('controlStatus')}
                            >
                                {allStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">Evidence</label>
                            <div className="mt-1">
                                {localItem.evidence ? (
                                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-100 dark:border-gray-600">
                                        <span className="text-[10px] text-teal-600 truncate flex items-center">
                                            <PaperClipIcon className="w-3 h-3 mr-1.5 opacity-60"/>
                                            {localItem.evidence.fileName}
                                        </span>
                                        {isEditable && (
                                            <button onClick={removeEvidence} className="text-gray-400 hover:text-red-500"><CloseIcon className="w-3.5 h-3.5"/></button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-gray-400 italic py-1.5">No artifact attached.</div>
                                )}
                                {isEditable && (
                                     <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-1 text-[10px] font-semibold text-teal-600 hover:underline flex items-center">
                                        <UploadIcon className="w-3 h-3 mr-1"/>
                                        {localItem.evidence ? 'Replace' : 'Upload Artifact'}
                                     </button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            </div>
                        </div>
                        <div>
                            <label className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">AI Recommendation</label>
                            <textarea
                                name="recommendation"
                                value={localItem.recommendation}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled || isGenerating}
                                rows={2}
                                className={getFieldClass('recommendation')}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">Management</label>
                                <textarea
                                    name="managementResponse"
                                    value={localItem.managementResponse}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isDisabled}
                                    rows={1}
                                    className={getFieldClass('managementResponse')}
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">Target Date</label>
                                <input
                                    type="date"
                                    name="targetDate"
                                    value={localItem.targetDate}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isDisabled}
                                    className={getFieldClass('targetDate')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface AssessmentSheetProps {
    filteredDomains: { name: string; items: AssessmentItem[] }[];
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    isEditable: boolean;
    canUpdate: boolean;
    generatingRecommendationFor?: string | null;
    activeControlCode?: string | null;
    activeField?: keyof AssessmentItem | null;
}

export const AssessmentSheet: React.FC<AssessmentSheetProps> = ({ filteredDomains, onUpdateItem, isEditable, canUpdate, generatingRecommendationFor, activeControlCode, activeField }) => {
    let controlCounter = 0;
    return (
        <div className="space-y-12">
            {filteredDomains.map(({ name: domainName, items: controls }) => {
                const domainStartIndex = controlCounter;
                controlCounter += controls.length;
                return (
                    <div key={domainName} className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-3">{domainName}</h2>
                        <div className="space-y-4">
                            {controls.map((item, index) => (
                                <EditableControlRow
                                    key={item.controlCode}
                                    item={item}
                                    onUpdateItem={onUpdateItem}
                                    isEditable={isEditable}
                                    canUpdate={canUpdate}
                                    index={domainStartIndex + index}
                                    isGenerating={generatingRecommendationFor === item.controlCode}
                                    activeField={activeControlCode === item.controlCode ? activeField : null}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
