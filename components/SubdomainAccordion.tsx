
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, ClipboardIcon, CheckIcon, SparklesIcon, ShieldCheckIcon, InformationCircleIcon, ClipboardListIcon, DocumentIcon, BeakerIcon } from './Icons';
import type { Domain, Control, Subdomain, GeneratedContent, PolicyDocument, Permission, PolicyTone, PolicyLength } from '../types';
import { ComplianceAuditModal } from './ComplianceAuditModal';

interface ControlDetailProps {
  control: Control;
  isActive: boolean;
  domain: Domain;
  subdomain: Subdomain;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent, generatedBy: 'user' | 'AI Agent') => void;
  onGeneratePolicyWithAI?: (control: Control, subdomain: Subdomain, domain: Domain, tone: PolicyTone, length: PolicyLength) => Promise<void>;
  documentRepository: PolicyDocument[];
  permissions: Set<Permission>;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-56 text-center z-10 font-normal normal-case leading-relaxed">
    {text}
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
  </div>
);

const ControlDetail = React.forwardRef<HTMLDivElement, ControlDetailProps>(
  ({ control, isActive, domain, subdomain, onAddDocument, onGeneratePolicyWithAI, documentRepository, permissions }, ref) => {
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const [showGenSettings, setShowGenSettings] = useState(false);
    const [selectedTone, setSelectedTone] = useState<PolicyTone>('Standard');
    const [selectedLength, setSelectedLength] = useState<PolicyLength>('Standard');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Audit State
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    
    const canGenerate = permissions.has('documents:generate');
    const existingDoc = documentRepository.find(doc => doc.controlId === control.id);

    const handleCopy = (text: string, sectionId: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setCopiedSection(sectionId);
          setTimeout(() => setCopiedSection(null), 2000);
        }).catch(err => {
          console.error('Failed to copy: ', err);
        });
      }
    };
    
    const CopyButton: React.FC<{ textToCopy: string; sectionId: string }> = ({ textToCopy, sectionId }) => {
      const isCopied = copiedSection === sectionId;
      return (
        <button
          onClick={() => handleCopy(textToCopy, sectionId)}
          className="flex items-center text-xs text-gray-400 hover:text-teal-600 transition-colors ml-2"
          disabled={isCopied}
        >
          {isCopied ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <ClipboardIcon className="w-3.5 h-3.5" />}
        </button>
      );
    };

    const handleGenerateClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if(onGeneratePolicyWithAI) {
            setIsGenerating(true);
            try {
              await onGeneratePolicyWithAI(control, subdomain, domain, selectedTone, selectedLength);
              setShowGenSettings(false);
            } finally {
              setIsGenerating(false);
            }
        }
    };
    
    const handleUpdateDocument = (updatedDoc: PolicyDocument) => {
         setIsAuditModalOpen(false);
    };
    
    return (
    <div
      ref={ref}
      className={`bg-white dark:bg-gray-800 rounded-lg p-5 border transition-all duration-500 ${
        isActive ? 'border-teal-500 shadow-md ring-1 ring-teal-500/20' : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-5 border-b border-gray-50 dark:border-gray-700 pb-3">
        <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-300 font-mono tracking-tight">{control.id}</h4>
        <div className="flex items-center gap-2">
            {existingDoc && (
                <button
                    onClick={(e) => { e.stopPropagation(); setIsAuditModalOpen(true); }}
                    className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 transition-colors"
                >
                    <ShieldCheckIcon className="w-3 h-3" />
                    {existingDoc.agentSignatures?.length ? 'Signed' : 'Audit'}
                </button>
            )}

            {canGenerate && onGeneratePolicyWithAI && (
                <div className="relative inline-flex" role="group">
                    <button 
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                        className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1.5 rounded-l border-r border-black/5 dark:border-white/5 ${existingDoc ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'text-white bg-purple-600'}`}
                    >
                        {isGenerating ? <SparklesIcon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                        {isGenerating ? 'Wait' : 'Draft'}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowGenSettings(!showGenSettings); }}
                        className={`px-1.5 py-1.5 rounded-r ${existingDoc ? 'bg-gray-100 text-gray-600 dark:bg-gray-700' : 'text-white bg-purple-600'}`}
                    >
                        <ChevronDownIcon className="w-3 h-3" />
                    </button>
                </div>
            )}
            
            <span className="text-[10px] text-gray-400 font-mono pl-2">v{control.version}</span>
        </div>
      </div>
      
      <div className="space-y-5">
        <div className="bg-blue-50/30 dark:bg-blue-900/5 p-4 rounded-lg border border-blue-100/50 dark:border-blue-800/20">
            <div className="flex justify-between items-start mb-1.5">
                <h5 className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <InformationCircleIcon className="w-3.5 h-3.5" />
                    Description
                </h5>
                <CopyButton textToCopy={control.description} sectionId={`desc-${control.id}`} />
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">{control.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-2.5 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/20 rounded-t-lg">
                        <h5 className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                            <ClipboardListIcon className="w-3.5 h-3.5 text-teal-600" />
                            Requirements
                        </h5>
                        <CopyButton textToCopy={control.implementationGuidelines.join('\n')} sectionId={`impl-${control.id}`} />
                    </div>
                    <div className="p-4">
                        <ul className="space-y-2">
                            {control.implementationGuidelines.map((guideline, index) => (
                                <li key={index} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                                    <div className="h-4 w-4 flex items-center justify-center mr-2 mt-0.5">
                                        <span className="h-1 w-1 rounded-full bg-teal-500"></span>
                                    </div>
                                    <span className="leading-relaxed">{guideline}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-purple-50/30 dark:bg-purple-900/5 rounded-t-lg">
                        <h5 className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                            <DocumentIcon className="w-3.5 h-3.5" />
                            Deliverables
                        </h5>
                    </div>
                    <div className="p-4">
                        <ul className="space-y-1.5">
                            {control.expectedDeliverables.map((deliverable, index) => (
                                <li key={index} className="flex items-start text-[11px] text-gray-600 dark:text-gray-400">
                                    <span className="mr-1.5 text-purple-400">•</span>
                                    {deliverable}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {control.relevantTools && control.relevantTools.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 bg-amber-50/30 dark:bg-amber-900/5 rounded-t-lg">
                            <h5 className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                                <BeakerIcon className="w-3.5 h-3.5" />
                                Tools
                            </h5>
                        </div>
                        <div className="p-3 flex flex-wrap gap-1.5">
                            {control.relevantTools.map((tool, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                                    {tool}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

       {control.history && control.history.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-50 dark:border-gray-700">
            <button
              onClick={() => setIsHistoryVisible(!isHistoryVisible)}
              className="w-full flex justify-between items-center text-left text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <span>History</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isHistoryVisible ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {existingDoc && isAuditModalOpen && (
            <ComplianceAuditModal
                doc={existingDoc}
                controlData={{ control, subdomain, domain }}
                onClose={() => setIsAuditModalOpen(false)}
                onUpdateDocument={handleUpdateDocument}
            />
        )}
    </div>
    );
  }
);

interface SubdomainAccordionProps {
  domain: Domain;
  subdomain: Subdomain;
  activeControlId: string | null;
  setActiveControlId: (id: string | null) => void;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, generatedContent: GeneratedContent, generatedBy: 'user' | 'AI Agent') => void;
  onGeneratePolicyWithAI?: (control: Control, subdomain: Subdomain, domain: Domain, tone: PolicyTone, length: PolicyLength) => Promise<void>;
  documentRepository: PolicyDocument[];
  permissions: Set<Permission>;
}

export const SubdomainAccordion: React.FC<SubdomainAccordionProps> = ({
  domain,
  subdomain,
  activeControlId,
  setActiveControlId,
  onAddDocument,
  onGeneratePolicyWithAI,
  documentRepository,
  permissions
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const controlRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const hasActiveControl = subdomain.controls.some(c => c.id === activeControlId);
    if (hasActiveControl) {
        setIsOpen(true);
    }
  }, [activeControlId, subdomain.controls]);

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 mb-3 overflow-hidden shadow-sm">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
            <div className="flex items-center text-left">
                <span className="font-mono text-xs font-semibold text-gray-400 mr-3">{subdomain.id}</span>
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{subdomain.title}</h3>
                    <p className="text-[11px] text-gray-500 font-normal mt-0.5">{subdomain.objective}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded uppercase">{subdomain.controls.length} Controls</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
        </button>
        
        {isOpen && (
            <div className="p-4 space-y-3 border-t border-gray-50 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-800">
                {subdomain.controls.map(control => (
                    <div key={control.id} onClick={(e) => { e.stopPropagation(); setActiveControlId(control.id); }}>
                        <ControlDetail
                            ref={(el) => { controlRefs.current[control.id] = el; }}
                            control={control}
                            isActive={activeControlId === control.id}
                            domain={domain}
                            subdomain={subdomain}
                            onAddDocument={onAddDocument}
                            onGeneratePolicyWithAI={onGeneratePolicyWithAI}
                            documentRepository={documentRepository}
                            permissions={permissions}
                        />
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
