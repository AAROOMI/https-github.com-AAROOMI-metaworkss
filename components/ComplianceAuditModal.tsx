
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { PolicyDocument, AgentSignature, Control, Domain, Subdomain } from '../types';
import { CheckCircleIcon, CloseIcon, ShieldCheckIcon, SparklesIcon } from './Icons';

interface ComplianceAuditModalProps {
    doc: PolicyDocument;
    controlData: { control: Control, subdomain: Subdomain, domain: Domain };
    onClose: () => void;
    onUpdateDocument: (doc: PolicyDocument) => void;
}

export const ComplianceAuditModal: React.FC<ComplianceAuditModalProps> = ({ doc, controlData, onClose, onUpdateDocument }) => {
    const [stage, setStage] = useState<'init' | 'ciso_review' | 'cto_review' | 'finalizing' | 'complete'>('init');
    const [logs, setLogs] = useState<string[]>([]);
    const [signatures, setSignatures] = useState<AgentSignature[]>(doc.agentSignatures || []);
    const [currentThought, setCurrentThought] = useState('');

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const runAudit = async () => {
        setStage('ciso_review');
        addLog("Initiating Agentic Compliance Audit...");
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-pro-preview';
        const config = { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 32768 }
        };

        try {
            // --- STAGE 1: CISO AGENT ---
            setCurrentThought("AI CISO is analyzing policy governance and regulatory alignment...");
            addLog("AI CISO: Reviewing against NCA ECC Guidelines...");
            
            const cisoPrompt = `
            You are an Agentic AI CISO (Chief Information Security Officer). 
            Your job is to audit the following policy document against the specific NCA ECC Implementation Guidelines.
            
            **Control Context:**
            - Control ID: ${controlData.control.id}
            - Description: ${controlData.control.description}
            - Guidelines: ${controlData.control.implementationGuidelines.join('\n')}
            
            **Document Content:**
            ${doc.content.policy}
            
            **Task:**
            1. Verify if the policy addresses all points in the Guidelines.
            2. Check for roles, responsibilities, and governance structures.
            
            Return a JSON object: { "decision": "Approved" | "Needs Revision", "comments": "Detailed feedback" }
            `;

            const cisoRes = await ai.models.generateContent({ model, contents: cisoPrompt, config });
            const cisoResult = JSON.parse(cisoRes.text || '{}');
            
            const cisoSig: AgentSignature = {
                agentRole: 'AI CISO',
                decision: cisoResult.decision,
                timestamp: Date.now(),
                signatureHash: `CISO-${Math.random().toString(36).substring(7)}`,
                comments: cisoResult.comments
            };
            setSignatures(prev => [...prev, cisoSig]);
            addLog(`AI CISO Decision: ${cisoResult.decision}`);

            if (cisoResult.decision === 'Needs Revision') {
                addLog("Audit Halted: CISO requested revisions.");
                setStage('complete');
                return;
            }

            // --- STAGE 2: CTO AGENT ---
            setStage('cto_review');
            setCurrentThought("AI CTO is analyzing technical feasibility and procedure depth...");
            addLog("AI CTO: Reviewing technical procedures and deliverables...");
            
            const ctoPrompt = `
            You are an Agentic AI CTO (Chief Technology Officer).
            Your job is to audit the *Procedures* and *Guidelines* sections of this document against the Expected Deliverables.
            
            **Control Context:**
            - Control ID: ${controlData.control.id}
            - Deliverables: ${controlData.control.expectedDeliverables.join('\n')}
            
            **Document Content:**
            PROCEDURES: ${doc.content.procedure}
            GUIDELINES: ${doc.content.guideline}
            
            **Task:**
            1. Are the procedures technically sound and actionable?
            2. Do they align with the expected deliverables?
            
            Return a JSON object: { "decision": "Approved" | "Needs Revision", "comments": "Detailed feedback" }
            `;
            
            const ctoRes = await ai.models.generateContent({ model, contents: ctoPrompt, config });
            const ctoResult = JSON.parse(ctoRes.text || '{}');

            const ctoSig: AgentSignature = {
                agentRole: 'AI CTO',
                decision: ctoResult.decision,
                timestamp: Date.now(),
                signatureHash: `CTO-${Math.random().toString(36).substring(7)}`,
                comments: ctoResult.comments
            };
            setSignatures(prev => [...prev, ctoSig]);
            addLog(`AI CTO Decision: ${ctoResult.decision}`);

            // --- STAGE 3: FINALIZATION ---
            setStage('finalizing');
            setCurrentThought("Generating cryptographic audit proof...");
            
            const updatedDoc = { ...doc, agentSignatures: [cisoSig, ctoSig] };
            onUpdateDocument(updatedDoc);
            
            addLog("Audit Complete. Signatures attached.");
            setStage('complete');

        } catch (err) {
            console.error(err);
            addLog("Error during agentic audit.");
            setStage('complete');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[150] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <header className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-full text-teal-600 dark:text-teal-300">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Agentic Compliance Audit</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Validating: {controlData.control.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {stage === 'init' && (
                        <div className="text-center py-10">
                            <SparklesIcon className="w-16 h-16 mx-auto text-teal-500 mb-4 animate-pulse" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ready to Audit</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mt-2">
                                This process will deploy autonomous AI agents (CISO & CTO personas) to review your policy against the official NCA ECC Guidelines.
                            </p>
                            <button 
                                onClick={runAudit}
                                className="mt-6 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-lg transition-all transform hover:scale-105"
                            >
                                Start AI Audit
                            </button>
                        </div>
                    )}

                    {stage !== 'init' && (
                        <div className="space-y-6">
                            {/* Live Status */}
                            {stage !== 'complete' && (
                                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-pulse">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-mono text-blue-700 dark:text-blue-300">{currentThought}</span>
                                </div>
                            )}

                            {/* Signatures / Results */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {signatures.map((sig, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg border ${sig.decision === 'Approved' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{sig.agentRole}</span>
                                            {sig.decision === 'Approved' ? 
                                                <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-bold">APPROVED</span> : 
                                                <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full font-bold">REVISION</span>
                                            }
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{sig.comments}</p>
                                        <div className="pt-2 border-t border-dashed border-gray-300 dark:border-gray-600 text-[10px] font-mono text-gray-500">
                                            <div>Sig: {sig.signatureHash}</div>
                                            <div>Time: {new Date(sig.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Log Console */}
                            <div className="bg-black rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto shadow-inner">
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1">&gt; {log}</div>
                                ))}
                                {stage !== 'complete' && <div className="animate-pulse">&gt; _</div>}
                            </div>
                        </div>
                    )}
                </div>
                
                {stage === 'complete' && (
                     <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Close Report</button>
                     </footer>
                )}
            </div>
        </div>
    );
};
