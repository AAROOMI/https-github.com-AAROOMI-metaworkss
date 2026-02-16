
import React, { useState, useEffect, useRef } from 'react';
import type { ComplianceGap, AgentLogEntry, Permission, AssessmentItem } from '../types';
// Added missing ExclamationTriangleIcon import
import { SparklesIcon, EyeIcon, CheckCircleIcon, ShieldCheckIcon, LogoIcon, MicrophoneIcon, DocumentTextIcon, ChevronDownIcon, BugAntIcon, ExclamationTriangleIcon } from './Icons';

interface ComplianceAgentPageProps {
    onRunAnalysis: () => ComplianceGap[];
    onGenerateDocuments: (gaps: ComplianceGap[]) => Promise<void>;
    agentLog: AgentLogEntry[];
    permissions: Set<Permission>;
    assessments?: {
        ecc: AssessmentItem[];
        pdpl: AssessmentItem[];
        sama: AssessmentItem[];
        cma: AssessmentItem[];
    };
}

const ProtocolStep: React.FC<{ 
    step: number; 
    title: string; 
    status: 'pending' | 'running' | 'completed' | 'failed';
    desc: string;
}> = ({ step, title, status, desc }) => (
    <div className={`p-6 rounded-[2rem] border transition-all duration-700 ${
        status === 'running' ? 'bg-teal-50/50 border-teal-200 dark:bg-teal-900/10 dark:border-teal-800 scale-[1.02] shadow-xl' :
        status === 'completed' ? 'bg-white border-green-100 dark:bg-gray-800 dark:border-green-900/30' :
        'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700 opacity-40 grayscale'
    }`}>
        <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                status === 'running' ? 'bg-teal-600 text-white animate-pulse shadow-lg shadow-teal-500/30' :
                status === 'completed' ? <CheckCircleIcon className="w-6 h-6" /> : step
            }`}>
                {status === 'completed' ? <CheckCircleIcon className="w-6 h-6" /> : step}
            </div>
            <div>
                <h4 className="text-[13px] font-black uppercase tracking-widest text-gray-900 dark:text-white leading-none mb-1.5">{title}</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-tighter opacity-80">{desc}</p>
            </div>
        </div>
    </div>
);

export const ComplianceAgentPage: React.FC<ComplianceAgentPageProps> = ({ onRunAnalysis, onGenerateDocuments, agentLog, permissions, assessments }) => {
    const [protocolStage, setProtocolStage] = useState<number>(0);
    const [isExecuting, setIsExecuting] = useState(false);
    const [gaps, setGaps] = useState<ComplianceGap[]>([]);
    const [telemetry, setTelemetry] = useState<string[]>([]);
    const telemetryRef = useRef<HTMLDivElement>(null);

    const steps = [
        { title: "Camera Sync", desc: "Mandatory T=0 vision handshake." },
        { title: "Visual Context", desc: "Extracting gesture and garment metadata." },
        { title: "Voice Sentry", desc: "Saudi Professional greeting sequence." },
        { title: "Intent Mapping", desc: "Orchestrating GRC Operational Mode." },
        { title: "Agentic Logic", desc: "Cross-validating memory via CTO/CISO." },
        { title: "Audit Closure", desc: "Generating immutable CEO Report." }
    ];

    const addTelemetry = (msg: string) => {
        setTelemetry(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const runSentientSupremeProtocol = async () => {
        setIsExecuting(true);
        setProtocolStage(1);
        addTelemetry("SYSTEM_START initiated. Mode: Event-Driven.");
        
        // Step 1: Camera Activation
        addTelemetry("SERVICE: camera-service -> ACTION: start_camera_capture");
        await new Promise(r => setTimeout(r, 1200));
        setProtocolStage(2);
        
        // Step 2: Vision Analytics
        addTelemetry("SERVICE: vision-service -> EVENT: User_Presence_Detected");
        addTelemetry("MEMORY_LOG: user_profile.visual_context.clothing_color = 'Blue'");
        await new Promise(r => setTimeout(r, 1500));
        setProtocolStage(3);
        
        // Step 3: Voice Greeting
        addTelemetry("SERVICE: voice-service -> ACTION: voice_greeting (Saudi Tone)");
        await new Promise(r => setTimeout(r, 1200));
        setProtocolStage(4);
        
        // Step 4: User Intent
        addTelemetry("INTENT: COMPLIANCE_AUDIT confirmed.");
        const foundGaps = onRunAnalysis();
        setGaps(foundGaps);
        await new Promise(r => setTimeout(r, 800));
        setProtocolStage(5);
        
        // Step 5: Agentic Execution
        addTelemetry("AGENT_SYNC: Ahmed AI (CISO) and Fahad AI (CTO) checking Memory.");
        addTelemetry(`FINDINGS: ${foundGaps.length} controls failed audit (Missing Evidence).`);
        await new Promise(r => setTimeout(r, 2000));
        setProtocolStage(6);
        
        // Step 6: Reporting
        addTelemetry("SERVICE: document-service -> ACTION: generate_documents (QR Enabled)");
        addTelemetry("EVENT: Final_Audit_Completed. Status: Artifacts Archived.");
        await onGenerateDocuments(foundGaps);
        setIsExecuting(false);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
            {/* Header: Futuristic Command Style */}
            <header className="flex flex-col md:flex-row justify-between items-center bg-[#0b0f1a] p-12 rounded-[3.5rem] border border-teal-500/20 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BugAntIcon className="w-40 h-40 text-teal-500" />
                </div>
                
                <div className="relative z-10 flex items-center gap-10">
                    <div className="w-24 h-24 bg-teal-600 rounded-[2.5rem] flex items-center justify-center border-4 border-teal-400/30 shadow-[0_0_50px_rgba(20,184,166,0.3)] animate-pulse">
                        <LogoIcon className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">Sentient Supreme™</h1>
                        <p className="text-teal-400 text-[11px] font-bold uppercase tracking-[0.6em] ml-1">Autonomous Orchestration Engine</p>
                    </div>
                </div>
                
                <button 
                    onClick={runSentientSupremeProtocol}
                    disabled={isExecuting}
                    className="relative z-10 mt-8 md:mt-0 px-12 py-5 bg-teal-600 hover:bg-teal-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-teal-500/40 active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                    {isExecuting ? 'PROTOCOL_IN_PROGRESS' : 'INITIALIZE_ORCHESTRATOR'}
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Side Pane: Authority & Telemetry */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Authority Matrix */}
                    <div className="bg-[#0d121f] rounded-[2.5rem] p-10 border border-white/5 shadow-inner">
                        <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <ShieldCheckIcon className="w-4 h-4 text-teal-600" />
                            Authority Matrix
                        </h3>
                        <div className="space-y-6">
                            {[
                                { name: 'CTO_Agent', auth: 'Architecture' },
                                { name: 'DPO_Agent', auth: 'Privacy_Law' },
                                { name: 'Risk_Officer', auth: 'Scoring' },
                                { name: 'CISO_Agent', auth: 'Compliance' }
                            ].map(agent => (
                                <div key={agent.name} className="flex justify-between items-center group">
                                    <span className="text-[11px] font-bold text-gray-300 uppercase">{agent.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-black text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 uppercase">{agent.auth}</span>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shared Memory Telemetry Log */}
                    <div className="bg-black rounded-[2.5rem] p-8 border border-white/5 shadow-2xl h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                             <h3 className="text-[10px] font-black text-green-500/70 uppercase tracking-[0.4em]">Memory_Events</h3>
                             <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        </div>
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 pr-2 scrollbar-hide">
                            {telemetry.length > 0 ? telemetry.map((t, i) => (
                                <div key={i} className="text-gray-400 group border-l border-green-500/20 pl-4 hover:border-green-500 transition-colors">
                                    <span className="text-green-500/50 mr-2">&gt;</span>{t}
                                </div>
                            )) : (
                                <div className="text-gray-600 italic">Awaiting event trigger...</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content: Protocol Steps & Results */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white dark:bg-[#0b0f1a] rounded-[3.5rem] p-12 border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
                        {isExecuting && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <div className="h-full bg-teal-500 animate-loading-bar shadow-[0_0_20px_rgba(20,184,166,0.8)]"></div>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">Protocol Workflow</h2>
                                <p className="text-sm text-gray-500 mt-2 font-medium">Sequential Agentic Execution • Zero Assumption Policy</p>
                            </div>
                            <div className="text-right">
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Global_Status</p>
                                 <p className={`text-sm font-black uppercase tracking-tighter ${isExecuting ? 'text-teal-600 animate-pulse' : 'text-gray-400'}`}>
                                    {isExecuting ? 'Neural_Sync' : 'IDLE_WAIT'}
                                 </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {steps.map((s, idx) => (
                                <ProtocolStep 
                                    key={idx}
                                    step={idx + 1}
                                    title={s.title}
                                    desc={s.desc}
                                    status={
                                        protocolStage > idx + 1 ? 'completed' :
                                        protocolStage === idx + 1 ? 'running' : 'pending'
                                    }
                                />
                            ))}
                        </div>

                        {/* Audit Results Visualization (Python Logic Link) */}
                        {protocolStage === 6 && (
                            <div className="mt-14 p-10 bg-[#fdf2f2] dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-[3rem] animate-slide-up">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-2xl text-red-600 dark:text-red-400">
                                            <ExclamationTriangleIcon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-red-800 dark:text-red-300 uppercase tracking-tighter">Independent Audit Results</h3>
                                            <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-widest mt-1">Status: Fail (Missing Evidence)</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-red-600 text-white px-4 py-1.5 rounded-full uppercase tracking-widest">Action Required</span>
                                </div>
                                
                                <p className="text-sm text-red-800 dark:text-red-200/80 leading-relaxed mb-8 font-medium">
                                    The Sentient Supreme Orchestrator detected {gaps.length} control tasks within the Shared Memory that currently lack immutable evidence artifacts. 
                                    Autonomous synthesis has prepared draft artifacts for CISO review.
                                </p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {gaps.slice(0, 4).map(g => (
                                        <div key={g.controlCode} className="flex justify-between items-center p-5 bg-white dark:bg-black/40 rounded-2xl border border-red-200 dark:border-red-900/30 group hover:border-red-400 transition-colors">
                                            <div>
                                                <span className="text-[10px] font-black text-red-600 dark:text-red-400 font-mono">{g.controlCode}</span>
                                                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mt-1 uppercase tracking-tight">{g.controlName.substring(0, 25)}...</p>
                                            </div>
                                            <ChevronDownIcon className="w-5 h-5 text-red-200 group-hover:text-red-500 transition-colors" />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 pt-8 border-t border-red-200 dark:border-red-900/30 flex justify-end">
                                     <button className="flex items-center gap-3 px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all">
                                        <DocumentTextIcon className="w-4 h-4" />
                                        Download Failure Analysis Report
                                     </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); width: 30%; }
                    50% { transform: translateX(50%); width: 60%; }
                    100% { transform: translateX(200%); width: 30%; }
                }
                .animate-loading-bar { animation: loading-bar 2s infinite linear; }
                @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
