import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { PolicyDocument, UserRole, DocumentStatus, Control, Subdomain, Domain, GeneratedContent, PrebuiltPolicyTemplate, User, Permission, CompanyProfile, ApprovalStep, AgentSignature } from '../types';
import { eccData } from '../data/controls';
import { policyTemplates } from '../data/templates';
import { CheckIcon, CloseIcon, SparklesIcon, ShieldCheckIcon, UploadIcon, PrinterIcon, DocumentTextIcon, DownloadIcon, TrashIcon, PencilIcon, DocumentChartBarIcon, SearchIcon, ChevronDownIcon, InformationCircleIcon, ClipboardListIcon, UserCircleIcon, PaperClipIcon } from './Icons';

// Use declare to get libraries from the global scope (from script tags)
declare const jspdf: any;
declare const html2canvas: any;
declare const QRCode: any;
declare const JsBarcode: any;

const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'Pending CISO Approval':
        case 'Pending CTO Approval':
        case 'Pending CIO Approval':
        case 'Pending CEO Approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

const statusToRoleMap: Record<string, UserRole> = {
    'Pending CISO Approval': 'CISO',
    'Pending CTO Approval': 'CTO',
    'Pending CIO Approval': 'CIO',
    'Pending CEO Approval': 'CEO',
};

const roleApprovalOrder: UserRole[] = ['CISO', 'CTO', 'CIO', 'CEO'];

const renderMarkdown = (markdown: string) => {
    if (!markdown) return '';
    let html = markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold mt-8 mb-4">$1</h1>')
        .replace(/^\s*[-*] (.*$)/gim, '<li class="mb-1 ml-4">$1</li>')
        .replace(/<\/li><li/gim, '</li><li')
        .replace(/\n/g, '<br/>');

    html = html.replace(/<li/gim, '<ul><li').replace(/<\/li><br\/><ul><li/gim, '</li><li').replace(/<\/li><br\/>/gim, '</li></ul><br/>');
    const listCount = (html.match(/<ul/g) || []).length;
    const endListCount = (html.match(/<\/ul/g) || []).length;
    if (listCount > endListCount) {
        html += '</ul>'.repeat(listCount - endListCount);
    }
    
    return `<div class="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 text-sm">${html.replace(/<br\/><br\/>/g, '</p><p>').replace(/<br\/>/g, '')}</div>`;
};

const WorkflowTimeline: React.FC<{ doc: PolicyDocument }> = ({ doc }) => {
    const history = useMemo(() => {
        const items: { type: 'human' | 'agent', data: ApprovalStep | AgentSignature, timestamp: number }[] = [];
        doc.approvalHistory.forEach(h => items.push({ type: 'human', data: h, timestamp: h.timestamp }));
        doc.agentSignatures?.forEach(s => items.push({ type: 'agent', data: s, timestamp: s.timestamp }));
        return items.sort((a, b) => b.timestamp - a.timestamp);
    }, [doc]);

    if (history.length === 0) {
        return (
            <div className="text-center py-12">
                <ClipboardListIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium text-sm">No review comments or approval history yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ClipboardListIcon className="w-4 h-4 text-teal-600" />
                Review & Approval Audit Trail
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                {history.map((item, idx) => {
                    const isHuman = item.type === 'human';
                    const data = item.data as any;
                    const isApproved = data.decision === 'Approved';

                    return (
                        <div key={idx} className="relative group">
                            <div className={`absolute -left-6 mt-1 w-5 h-5 rounded-full border-4 border-white dark:border-gray-800 z-10 flex items-center justify-center ${isApproved ? 'bg-green-500' : 'bg-red-500'}`}>
                                {isApproved ? <CheckIcon className="w-2.5 h-2.5 text-white" /> : <CloseIcon className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm transition-shadow">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                                            {isHuman ? data.role : data.agentRole}
                                        </span>
                                        {!isHuman && <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase">AI Agent</span>}
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-400">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div className={`text-[10px] font-bold mb-2 uppercase ${isApproved ? 'text-green-600' : 'text-red-600'}`}>
                                    {data.decision}
                                </div>
                                {data.comments && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                                        "{data.comments}"
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface DocumentHeaderProps {
  doc: PolicyDocument;
  company: CompanyProfile;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ doc, company }) => {
    const identifierData = useMemo(() => {
        for (const domain of eccData) {
            for (const subdomain of domain.subdomains) {
                const control = subdomain.controls.find(c => c.id === doc.controlId);
                if (control) {
                    return { domain, subdomain, control };
                }
            }
        }
        return null;
    }, [doc.controlId]);

    const controlIdentifier = useMemo(() => {
        if (!identifierData) return '';
        const { domain, subdomain, control } = identifierData;
        return `ECC://${domain.id}/${subdomain.id}/${control.id}`;
    }, [identifierData]);

    if (!identifierData && !doc.controlId.startsWith('REPORT-')) {
        return null;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-700 space-y-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    {company.logo ? (
                        <img src={company.logo} alt={`${company.name} Logo`} className="h-16 w-16 object-contain" />
                    ) : (
                        <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                            <ShieldCheckIcon className="h-8 w-8 text-teal-600" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{company.name}</h2>
                        <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1">Official Compliance Artifact</p>
                    </div>
                </div>
            </div>
            {controlIdentifier && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Control Reference</p>
                    <p className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">{controlIdentifier}</p>
                </div>
            )}
        </div>
    );
};

const DocumentVerificationFooter: React.FC<{ doc: PolicyDocument }> = ({ doc }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (typeof QRCode !== 'undefined') {
            const verificationData = `DOC-ID:${doc.id}|STATUS:${doc.status}|VERIFY:https://metaworks.grc/v/${doc.id}`;
            QRCode.toDataURL(verificationData, { width: 100, margin: 1, color: { dark: '#111827', light: '#ffffff00' } }, (err: any, url: string) => {
                if (!err) setQrCodeUrl(url);
            });
        }
        
        if (typeof JsBarcode !== 'undefined' && barcodeRef.current) {
            try {
                JsBarcode(barcodeRef.current, doc.controlId, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 10,
                    height: 25,
                    margin: 0,
                    background: "transparent",
                    lineColor: "#374151"
                });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }
    }, [doc]);

    return (
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                    <div>
                        <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">System Validation</p>
                        <svg ref={barcodeRef} className="max-w-full h-8 mt-1"></svg>
                    </div>
                </div>
                {qrCodeUrl && (
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200">VERIFY AUTHENTICITY</p>
                            <p className="text-[9px] text-gray-500">Scan for lifecycle audit.</p>
                        </div>
                        <img src={qrCodeUrl} alt="QR" className="w-16 h-16 border border-gray-200 dark:border-gray-600 rounded bg-white" />
                    </div>
                )}
            </div>
        </div>
    );
};

const ExportableDocumentContent: React.FC<{ doc: PolicyDocument, company: CompanyProfile }> = ({ doc, company }) => {
    return (
        <div className="p-10 bg-white text-black font-sans min-h-[297mm] w-[210mm] relative mx-auto">
            <DocumentHeader doc={doc} company={company} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4 text-gray-900 border-b-2 border-teal-600 pb-2">Policy Statement</h1>
                {doc.uploadedFile ? (
                    <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
                         <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                         <p className="text-sm font-bold text-gray-900">External Artifact: {doc.uploadedFile.name}</p>
                         <p className="text-xs text-gray-500 mt-1">This is a reference to a manually uploaded security artifact.</p>
                    </div>
                ) : (
                    <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content.policy) }} />
                )}
            </div>
            <div className="mt-auto">
                <DocumentVerificationFooter doc={doc} />
            </div>
        </div>
    );
};

interface DocumentDetailModalProps {
  doc: PolicyDocument;
  onClose: () => void;
  currentUser: User;
  onApprovalAction: (documentId: string, decision: 'Approved' | 'Rejected', comments?: string) => void;
  onUpdateContent: (documentId: string, content: GeneratedContent) => void;
  permissions: Set<Permission>;
  company: CompanyProfile;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ doc, onClose, currentUser, onApprovalAction, onUpdateContent, permissions, company }) => {
    const [activeTab, setActiveTab] = useState<'policy' | 'procedure' | 'guideline' | 'history' | 'json'>('policy');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState<GeneratedContent>(doc.content);

    const canApprove = permissions.has('documents:approve');
    const isActionable = canApprove && statusToRoleMap[doc.status] === currentUser.role;
    const isPending = doc.status.startsWith('Pending');

    useEffect(() => {
        setEditContent(doc.content);
    }, [doc.content]);

    const handleDecision = (decision: 'Approved' | 'Rejected') => {
        const comments = prompt(`Review comments for ${decision.toLowerCase()}:`);
        if (comments !== null) {
            onApprovalAction(doc.id, decision, comments || undefined);
        }
    };

    const handleSaveEdit = () => {
        onUpdateContent(doc.id, editContent);
        setIsEditing(false);
    };

    const handleDownloadPDF = async () => {
        const exportContainer = document.createElement('div');
        exportContainer.style.position = 'absolute';
        exportContainer.style.left = '-9999px';
        document.body.appendChild(exportContainer);
        const root = ReactDOM.createRoot(exportContainer);
        root.render(<ExportableDocumentContent doc={doc} company={company} />);
        await new Promise(r => setTimeout(r, 500));
        const canvas = await html2canvas(exportContainer, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`${doc.controlId}.pdf`);
        document.body.removeChild(exportContainer);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-tighter">{doc.controlId}</h2>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${getStatusColor(doc.status)}`}>{doc.status}</span>
                    </div>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5 text-gray-500" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <nav className="-mb-px flex space-x-6">
                                {['policy', 'procedure', 'guideline', 'history', 'json'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-widest ${activeTab === tab ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500'}`}
                                    >
                                        {tab === 'history' ? 'Workflow' : tab}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="mt-4 min-h-[300px]">
                            {activeTab === 'json' ? (
                                <div className="bg-gray-900 text-teal-400 p-4 rounded-lg font-mono text-[10px] overflow-x-auto">
                                    <pre>{JSON.stringify(doc, null, 2)}</pre>
                                </div>
                            ) : activeTab === 'history' ? (
                                <WorkflowTimeline doc={doc} />
                            ) : isEditing ? (
                                <textarea
                                    className="w-full h-80 p-4 rounded-lg border bg-transparent text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-teal-500"
                                    value={editContent[activeTab as keyof GeneratedContent]}
                                    onChange={e => setEditContent({ ...editContent, [activeTab]: e.target.value })}
                                />
                            ) : (
                                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content[activeTab as keyof GeneratedContent] || '') }} />
                            )}
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between bg-white dark:bg-gray-800 rounded-b-xl">
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold uppercase hover:bg-gray-200 transition-colors">
                        <DownloadIcon className="w-4 h-4"/>
                        Export PDF
                    </button>
                    <div className="flex gap-3">
                        {isEditing ? (
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-teal-700">Save</button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                                <PencilIcon className="w-4 h-4"/>
                                Edit
                            </button>
                        )}
                        {isPending && isActionable && (
                            <>
                                <button onClick={() => handleDecision('Rejected')} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase hover:bg-red-100">Reject</button>
                                <button onClick={() => handleDecision('Approved')} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-teal-700">Approve & Sign</button>
                            </>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

const UploadDocumentModal: React.FC<{
    onClose: () => void;
    onUpload: (control: Control, subdomain: Subdomain, domain: Domain, file: File, dataUrl: string) => void;
}> = ({ onClose, onUpload }) => {
    const [selectedControl, setSelectedControl] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const allControls = useMemo(() => eccData.flatMap(domain => domain.subdomains.flatMap(subdomain => subdomain.controls.map(control => ({...control, subdomain, domain})))), []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (selectedControl && file) {
            const controlData = allControls.find(c => c.id === selectedControl);
            if(controlData) {
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                    onUpload(controlData, controlData.subdomain, controlData.domain, file, loadEvent.target?.result as string);
                    onClose();
                };
                reader.readAsDataURL(file);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[160] flex items-center justify-center p-4" onClick={onClose}>
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Upload Artifact</h2>
                    <div className="flex gap-1">
                        {['PDF', 'CSV', 'DOCX'].map(ext => (
                            <span key={ext} className="px-2 py-0.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[9px] font-bold text-gray-500 uppercase">{ext}</span>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Target Compliance Control</label>
                        <select 
                            value={selectedControl} 
                            onChange={(e) => setSelectedControl(e.target.value)}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-gray-100 p-3 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                        >
                            <option value="">-- Select Control --</option>
                            {allControls.map(c => <option key={c.id} value={c.id}>{c.id}: {c.description.substring(0, 40)}...</option>)}
                        </select>
                    </div>
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.csv,.xlsx,.json" />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-teal-50 dark:hover:bg-teal-500/5 transition-all group"
                        >
                            <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-full text-teal-600 group-hover:scale-110 transition-transform">
                                <UploadIcon className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file ? file.name : "Select or Drop Document"}</p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Supports PDF, CSV, Word, and Excel</p>
                            </div>
                        </button>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm uppercase tracking-wider">Cancel</button>
                        <button 
                            disabled={!file || !selectedControl} 
                            onClick={handleUpload}
                            className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-teal-500/20 disabled:bg-gray-300 dark:disabled:bg-gray-700"
                        >
                            Complete Upload
                        </button>
                    </div>
                </div>
             </div>
        </div>
    );
};

interface DocumentsPageProps {
  repository: PolicyDocument[];
  currentUser: User;
  onApprovalAction: (documentId: string, decision: 'Approved' | 'Rejected', comments?: string) => void;
  onAddDocument: (control: Control, subdomain: Subdomain, domain: Domain, content: GeneratedContent, generatedBy: 'user' | 'AI Agent', uploadedFile?: any) => void;
  onBatchImport?: (documents: PolicyDocument[]) => void;
  permissions: Set<Permission>;
  company: CompanyProfile;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ repository, currentUser, onApprovalAction, onAddDocument, onBatchImport, permissions, company }) => {
  const [selectedDoc, setSelectedDoc] = useState<PolicyDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = useMemo(() => {
    return repository.filter(doc => 
        doc.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.controlDescription.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [repository, searchTerm]);

  const handleDelete = (docId: string) => {
      if (window.confirm("Permanently remove this artifact?")) {
          console.log("Deletion simulated.");
      }
  };

  const handleExportAllJSON = () => {
    const dataStr = JSON.stringify(repository, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `vault_backup_${new Date().toISOString().slice(0, 10)}.json`);
    linkElement.click();
  };

  const handleExportFormat = (doc: PolicyDocument, format: 'pdf' | 'csv' | 'json' | 'word') => {
      if (format === 'json') {
          const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${doc.controlId}.json`;
          link.click();
      } else if (format === 'csv') {
          const headers = ['ID', 'Control', 'Domain', 'Status', 'Date'];
          const row = [doc.id, doc.controlId, doc.domainName, doc.status, new Date(doc.createdAt).toLocaleDateString()];
          const csvContent = headers.join(',') + '\n' + row.join(',');
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${doc.controlId}.csv`;
          link.click();
      } else if (format === 'pdf') {
          setSelectedDoc(doc);
          alert("Artifact preview loading. Finalize PDF export via the action menu in the detail view.");
      } else if (format === 'word') {
          alert("Word export for this policy is being processed. Download will start shortly.");
      }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (onBatchImport) onBatchImport(Array.isArray(json) ? json : [json]);
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Artifact Vault</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Lifecycle management for security artifacts and policies.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <button 
                onClick={handleExportAllJSON}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-xs uppercase hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
            >
                <DownloadIcon className="w-4 h-4" />
                Backup Vault
            </button>
            <button 
                onClick={() => importFileInputRef.current?.click()}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-xs uppercase hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
            >
                <UploadIcon className="w-4 h-4" />
                Restore JSON
            </button>
            <input type="file" ref={importFileInputRef} onChange={handleImportJSON} className="hidden" accept=".json" />
            <button onClick={() => setIsUploadModalOpen(true)} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest">
                <UploadIcon className="w-4 h-4" />
                Upload New Artifact
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="relative max-w-md">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search vault for ID, name or description..." 
                    className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500 transition-shadow"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                    <tr>
                        <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Artifact / Control</th>
                        <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Status</th>
                        <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Workflow Insights</th>
                        <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredDocs.map(doc => {
                        const feedbackCount = doc.approvalHistory.filter(h => h.comments).length + (doc.agentSignatures?.filter(s => s.comments).length || 0);
                        return (
                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${doc.uploadedFile ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-teal-50 text-teal-600 dark:bg-teal-900/30'}`}>
                                        {doc.uploadedFile ? <PaperClipIcon className="w-5 h-5" /> : <DocumentTextIcon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-tighter">{doc.controlId}</p>
                                        <p className="text-[11px] text-gray-500 truncate w-72">{doc.controlDescription}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${getStatusColor(doc.status)}`}>{doc.status}</span>
                            </td>
                            <td className="px-8 py-5">
                                {feedbackCount > 0 ? (
                                    <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                                        <ClipboardListIcon className="w-4 h-4" />
                                        <span className="text-[10px] font-semibold uppercase">{feedbackCount} Agent Reviews</span>
                                    </div>
                                ) : (
                                    <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-widest">Draft Stage</span>
                                )}
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-1.5">
                                    <button onClick={() => setSelectedDoc(doc)} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-all" title="View/Edit Details"><PencilIcon className="w-4 h-4"/></button>
                                    
                                    <div className="h-8 w-px bg-gray-100 dark:bg-gray-800 mx-1"></div>

                                    {/* Format Specific Export Buttons */}
                                    <button onClick={() => handleExportFormat(doc, 'pdf')} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[9px] font-bold uppercase" title="Export PDF">PDF</button>
                                    <button onClick={() => handleExportFormat(doc, 'csv')} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-[9px] font-bold uppercase" title="Export CSV">CSV</button>
                                    <button onClick={() => handleExportFormat(doc, 'word')} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-[9px] font-bold uppercase" title="Export Word">DOC</button>
                                    
                                    <div className="h-8 w-px bg-gray-100 dark:bg-gray-800 mx-1"></div>
                                    
                                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Delete Artifact"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </td>
                        </tr>
                    )})}
                    {filteredDocs.length === 0 && (
                         <tr>
                            <td colSpan={4} className="px-8 py-24 text-center text-gray-500 dark:text-gray-400">
                                <DocumentTextIcon className="w-12 h-12 mx-auto opacity-20 mb-4" />
                                <p className="font-semibold text-gray-900 dark:text-white uppercase tracking-widest text-xs">The Vault is empty</p>
                                <p className="text-sm mt-1">Start generating security policies or upload external evidence to begin.</p>
                            </td>
                         </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {selectedDoc && <DocumentDetailModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} currentUser={currentUser} onApprovalAction={onApprovalAction} onUpdateContent={() => {}} permissions={permissions} company={company} />}
      {isUploadModalOpen && <UploadDocumentModal onClose={() => setIsUploadModalOpen(false)} onUpload={(c, s, d, f, u) => {
          onAddDocument(c, s, d, { policy: '', procedure: '', guideline: '' }, 'user', { name: f.name, dataUrl: u, type: f.type });
          setIsUploadModalOpen(false);
      }} />}
    </div>
  );
};
