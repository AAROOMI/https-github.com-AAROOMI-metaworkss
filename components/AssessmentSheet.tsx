
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
        const baseClass = "mt-1 block w-full text-xs rounded-lg border-gray-200 dark:border-gray-700 bg-transparent focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-50 dark:disabled:bg-gray-800/50 transition-all p-3";
        if (activeField === fieldName) {
            return `${baseClass} active-field-glow`;
        }
        return baseClass;
    };
    
    return (
         <div ref={rowRef} className={`p-8 border rounded-[2rem] transition-all duration-700 border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md relative ${activeField ? 'shadow-2xl border-teal-500/50 scale-[1.02]' : 'shadow-sm'}`}>
             {isSaving && (
                 <div className="absolute top-4 right-8 px-3 py-1 text-[10px] font-black rounded-full bg-teal-50 text-teal-600 animate-pulse uppercase tracking-widest border border-teal-200">
                     Vault Synchronized
                 </div>
            )}
            <div className="flex items-start gap-6">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner transition-all duration-500 ${activeField ? 'bg-teal-600 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {index + 1}
                </div>
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-black text-teal-700 dark:text-teal-400 font-mono uppercase tracking-tighter">{item.controlCode}</h3>
                        <div className="h-px flex-grow bg-gray-100 dark:bg-gray-700"></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed max-w-3xl">{item.controlName}</p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Field 1: Status Description */}
                        <div className="md:col-span-2 group">
                            <label className="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-[10px] mb-2 group-hover:text-teal-500 transition-colors">
                                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">1</span>
                                Status Description
                            </label>
                            <textarea
                                name="currentStatusDescription"
                                value={localItem.currentStatusDescription}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled}
                                rows={2}
                                className={getFieldClass('currentStatusDescription')}
                                placeholder="Describe the current implementation level..."
                            />
                        </div>

                        {/* Field 2: Control Status */}
                        <div className="group">
                             <label className="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-[10px] mb-2 group-hover:text-teal-500 transition-colors">
                                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">2</span>
                                Compliance Level
                            </label>
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

                        {/* Field 3: Evidence */}
                         <div className="group">
                            <label className="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-[10px] mb-2 group-hover:text-teal-500 transition-colors">
                                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">3</span>
                                Evidence Artifact
                            </label>
                            <div className="mt-1">
                                {localItem.evidence ? (
                                    <div className="flex items-center justify-between p-3 bg-teal-50/50 dark:bg-teal-900/10 rounded-xl border border-teal-100 dark:border-teal-800">
                                        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 truncate flex items-center">
                                            <PaperClipIcon className="w-4 h-4 mr-2 opacity-70"/>
                                            {localItem.evidence.fileName}
                                        </span>
                                        {isEditable && (
                                            <button onClick={removeEvidence} className="text-red-400 hover:text-red-600 transition-colors"><CloseIcon className="w-4 h-4"/></button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-[11px] text-gray-400 italic py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">No artifact attached to this control.</div>
                                )}
                                {isEditable && (
                                     <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest hover:text-teal-700 flex items-center gap-1.5 ml-1">
                                        <UploadIcon className="w-3.5 h-3.5"/>
                                        {localItem.evidence ? 'Replace Evidence' : 'Secure Upload'}
                                     </button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            </div>
                        </div>

                        {/* Field 4: AI Recommendation */}
                        <div className="group">
                            <label className="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-[10px] mb-2 group-hover:text-teal-500 transition-colors">
                                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">4</span>
                                Strategic Recommendation
                            </label>
                            <textarea
                                name="recommendation"
                                value={localItem.recommendation}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={isDisabled || isGenerating}
                                rows={2}
                                className={getFieldClass('recommendation')}
                                placeholder="AI suggesting remediation paths..."
                            />
                        </div>

                        {/* Field 5 & 6: Management & Date */}
                        <div className="grid grid-cols-2 gap-4 group">
                            <div>
                                <label className="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-[10px] mb-2 group-hover:text-teal-500 transition-colors">
                                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">5</span>
                                    Management
                                </label>
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
                                <label className="flex items-center gap-2 font-black text-gray-400 uppercase tracking-widest text-[10px] mb-2 group-hover:text-teal-500 transition-colors">
                                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">6</span>
                                    Target Date
                                </label>
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
        <div className="space-y-16 pb-24">
            {filteredDomains.map(({ name: domainName, items: controls }) => {
                const domainStartIndex = controlCounter;
                controlCounter += controls.length;
                return (
                    <div key={domainName} className="space-y-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{domainName}</h2>
                            <div className="h-px flex-grow bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700 dark:to-transparent"></div>
                        </div>
                        <div className="space-y-8">
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
