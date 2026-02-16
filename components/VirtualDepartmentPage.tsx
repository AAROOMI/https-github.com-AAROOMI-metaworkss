
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import { virtualAgents } from '../data/virtualAgents';
import type { VirtualAgent, Risk, PolicyDocument, AssessmentItem, AuditAction, SystemEvent, SystemEventType, SharedMemoryState } from '../types';
import { UserGroupIcon, ShieldCheckIcon, SparklesIcon, MicrophoneIcon, ChatBotIcon, UploadIcon, DocumentTextIcon, CloseIcon } from './Icons';

// Audio Encoding/Decoding Helpers
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

let nextStartTime = 0;

interface VirtualDepartmentPageProps {
    onDelegateTask: (agentName: string, task: string) => void;
    onConsultAgent: (agent: VirtualAgent) => void;
    risks?: Risk[];
    documents?: PolicyDocument[];
    eccAssessment?: AssessmentItem[];
    pdplAssessment?: AssessmentItem[];
    samaAssessment?: AssessmentItem[];
    cmaAssessment?: AssessmentItem[];
    onAddDocument?: (doc: PolicyDocument) => void;
    onAddRisk?: (risk: Risk) => void;
    onAddAuditLog?: (action: AuditAction, details: string) => void;
    onLogEvent?: (event: SystemEvent) => void;
    eventHistory?: SystemEvent[];
}

export const VirtualDepartmentPage: React.FC<VirtualDepartmentPageProps> = ({ 
    onDelegateTask, onConsultAgent, risks = [], documents = [], eccAssessment = [], pdplAssessment = [], samaAssessment = [], cmaAssessment = [], onAddDocument, onAddRisk, onAddAuditLog, onLogEvent, eventHistory = []
}) => {
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
    const [meetingTranscript, setMeetingTranscript] = useState<{agent: string, text: string}[]>([]);
    
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const cleanup = useCallback(() => {
        setStatus('idle');
        setActiveAgentId(null);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            try { scriptProcessorRef.current.disconnect(); } catch (e) {}
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
        }
        inputAudioContextRef.current = null;
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
        outputAudioContextRef.current = null;
        sessionPromise.current = null;
    }, []);

    const boardroomTools: FunctionDeclaration[] = useMemo(() => [
        {
            name: 'trigger_system_event',
            description: 'Creates a new system event in the Shared Memory based on an agent action.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    event_type: { type: Type.STRING, description: 'EVENT_POLICY_APPROVED, EVENT_TASK_ASSIGNED, etc.' },
                    entity_type: { type: Type.STRING, enum: ['document', 'control', 'task', 'risk', 'assessment'] },
                    entity_id: { type: Type.STRING },
                    payload: { type: Type.STRING, description: 'JSON string of relevant data' }
                },
                required: ['event_type', 'entity_type', 'entity_id', 'payload']
            }
        },
        {
            name: 'generate_internal_meeting_mom',
            description: 'Synthesizes internal Minutes of Meeting (MoM) and archives it to the vault.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING },
                    participants: { type: Type.ARRAY, items: { type: Type.STRING } },
                    decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    full_report_markdown: { type: Type.STRING }
                },
                required: ['subject', 'participants', 'decisions', 'full_report_markdown']
            }
        }
    ], []);

    const handleStartLive = async () => {
        setIsLiveMode(true);
        setStatus('thinking');
        setMeetingTranscript([]);
        
        const startEvent: SystemEvent = {
            event_id: `EV-${Date.now()}`,
            event_type: 'EVENT_BOARDROOM_CONVENED',
            actor_id: 'metaworks-orchestrator',
            actor_name: 'Boardroom Orchestrator',
            entity_type: 'session',
            entity_id: 'live-boardroom',
            event_payload: { timestamp: Date.now() },
            created_at: Date.now()
        };
        onLogEvent?.(startEvent);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = inputAudioContext;
            outputAudioContextRef.current = outputAudioContext;

            const sharedMemory: SharedMemoryState = {
                organization: null,
                activeFrameworks: ['NCA ECC', 'PDPL', 'SAMA CSF', 'CMA'],
                documents: documents,
                assessments: { ecc: eccAssessment, pdpl: pdplAssessment, sama: samaAssessment, cma: cmaAssessment },
                risks: risks,
                tasks: [],
                eventHistory: eventHistory
            };

            const systemInstruction = `
            SYSTEM ROLE:
            You are an Agentic GRC & Cybersecurity Compliance Platform.
            You operate as a MULTI-AGENT SYSTEM (CISO Ahmed AI, CTO Fahad AI, CIO Mohammed AI, Risk Rashid AI, Compliance Asaad AI, DPO Ibrahim AI).

            BOARDROOM PROTOCOL:
            1. MULTI-PERSONA MODE: You must simulate the interaction between these 6 agents.
            2. AGENT IDENTIFICATION: Every time an agent speaks, you MUST start their transcription with their name in brackets. Example: "[Ahmed AI]: ..." or "[Fahad AI]: ...".
            3. INTERACTIVE COLLABORATION: Agents should debate and collaborate.
            4. VOICE: Use a professional masculine tone (Fenrir).

            SHARED MEMORY:
            ${JSON.stringify(sharedMemory)}

            INITIAL ACTION:
            Immediately convene the meeting. 
            Ahmed AI (CISO) should open the floor and call on Rashid (Risk) and Ibrahim (DPO) for a posture update.
            `;

            const currentSessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        inputAudioContext.resume();
                        
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            currentSessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Transcriptions to update Active Agent visuals
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            // Regex to find "[Agent Name AI]:"
                            const agentMatch = text.match(/\[(.*?)\sAI\]/);
                            if (agentMatch) {
                                const agentName = agentMatch[1];
                                const found = virtualAgents.find(a => a.name.toLowerCase().includes(agentName.toLowerCase()));
                                if (found) setActiveAgentId(found.id);
                            }
                        }

                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'trigger_system_event') {
                                    const args = fc.args as any;
                                    const newEvent: SystemEvent = {
                                        event_id: `EV-${Date.now()}`,
                                        event_type: args.event_type as SystemEventType,
                                        actor_id: 'agentic-department',
                                        actor_name: 'Agentic Department',
                                        entity_type: args.entity_type,
                                        entity_id: args.entity_id,
                                        event_payload: JSON.parse(args.payload),
                                        created_at: Date.now()
                                    };
                                    onLogEvent?.(newEvent);
                                    currentSessionPromise.then(s => s.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: "Event logged to Shared Memory." } }
                                    }));
                                } else if (fc.name === 'generate_internal_meeting_mom') {
                                    const args = fc.args as any;
                                    const momDoc: PolicyDocument = {
                                        id: `MOM-${Date.now()}`,
                                        controlId: 'BOARD-DECISION',
                                        domainName: 'Governance',
                                        subdomainTitle: 'Executive Boardroom',
                                        controlDescription: args.subject,
                                        status: 'Approved',
                                        content: {
                                            policy: args.full_report_markdown,
                                            procedure: "Orchestrated via Event-Driven Multi-Agent Session.",
                                            guideline: "Shared Memory Record."
                                        },
                                        approvalHistory: [],
                                        agentSignatures: [{ agentRole: 'Agentic Department', decision: 'Approved', timestamp: Date.now(), signatureHash: 'EVENT-SYNCED', comments: 'Minutes validated against Shared Memory.' }],
                                        createdAt: Date.now(),
                                        updatedAt: Date.now(),
                                        generatedBy: 'AI Agent',
                                        versionHistory: []
                                    };
                                    onAddDocument?.(momDoc);
                                    onAddAuditLog?.('AGENTIC_AUDIT_COMPLETED', `Meeting Minutes Recorded: ${args.subject}`);
                                    currentSessionPromise.then(s => s.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: "Artifact saved to Vault." } }
                                    }));
                                }
                            }
                        }

                        const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audio && outputAudioContext.state !== 'closed') {
                            setStatus('speaking');
                            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                            const buffer = await decodeAudioData(decode(audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = buffer;
                            source.connect(outputAudioContext.destination);
                            source.addEventListener('ended', () => {
                                sources.current.delete(source);
                                if (sources.current.size === 0) {
                                    setStatus('listening');
                                    setActiveAgentId(null);
                                }
                            });
                            source.start(nextStartTime);
                            nextStartTime += buffer.duration;
                            sources.current.add(source);
                        }
                    },
                    onclose: cleanup,
                    onerror: cleanup
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
                    systemInstruction,
                    tools: [{ functionDeclarations: boardroomTools }],
                    outputAudioTranscription: {}
                }
            });
            sessionPromise.current = currentSessionPromise;
        } catch (err) {
            console.error(err);
            cleanup();
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <UserGroupIcon className="w-8 h-8 text-teal-600" />
                        Agentic GRC Department
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium italic">Shared Memory Architecture • Event-Driven Multi-Agent Logic</p>
                </div>
                <button
                    onClick={isLiveMode ? cleanup : handleStartLive}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
                        isLiveMode ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-teal-600 text-white shadow-teal-500/20'
                    }`}
                >
                    {isLiveMode ? <CloseIcon className="w-5 h-5" /> : <ChatBotIcon className="w-5 h-5" />}
                    {isLiveMode ? 'End Meeting' : 'Convene Boardroom'}
                </button>
            </header>

            {isLiveMode ? (
                <div className="flex flex-col gap-8">
                    {/* MEETING ROOM VISUALIZER */}
                    <div className="bg-gray-950 rounded-[3rem] p-12 border border-gray-900 shadow-2xl relative overflow-hidden h-[500px] flex items-center justify-center">
                        <div className="absolute inset-0 opacity-20">
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-[120px] animate-pulse"></div>
                        </div>

                        {/* AGENT BOARDROOM GRID */}
                        <div className="relative z-10 grid grid-cols-3 md:grid-cols-6 gap-6 w-full max-w-5xl">
                            {virtualAgents.map((agent) => {
                                const isActive = activeAgentId === agent.id;
                                return (
                                    <div key={agent.id} className="flex flex-col items-center gap-4 group">
                                        <div className={`relative transition-all duration-700 ${isActive ? 'scale-110' : 'scale-100 opacity-60'}`}>
                                            <div className={`w-24 h-24 rounded-full overflow-hidden border-2 transition-all duration-700 ${
                                                isActive ? 'border-teal-400 shadow-[0_0_40px_rgba(20,184,166,0.6)]' : 'border-gray-800'
                                            }`}>
                                                <img src={agent.avatarUrl} className="w-full h-full object-cover grayscale-0" alt={agent.name} />
                                            </div>
                                            {isActive && (
                                                <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white p-1 rounded-full animate-bounce shadow-lg">
                                                    <MicrophoneIcon className="w-4 h-4" />
                                                </div>
                                            )}
                                            {isActive && (
                                                <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-ping"></div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-teal-400' : 'text-gray-500'}`}>
                                                {agent.name}
                                            </p>
                                            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">{agent.role}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* CENTER HUD */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                             <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                                 status === 'listening' ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' :
                                 status === 'speaking' ? 'border-teal-500' : 'border-gray-800'
                             }`}>
                                <MicrophoneIcon className={`w-6 h-6 ${status === 'listening' ? 'text-blue-400' : 'text-teal-400'}`} />
                             </div>
                             <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                                {status === 'listening' ? "Awaiting Input" : status === 'speaking' ? "Agents Discussing" : "Synchronizing Shared Memory"}
                             </p>
                        </div>
                    </div>

                    {/* EVENT FEED */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4 text-teal-600" />
                                Shared Memory Event Stream
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400">LIVE TELEMETRY</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                           {eventHistory.length > 0 ? eventHistory.slice(0, 8).map(ev => (
                               <div key={ev.event_id} className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-xl min-w-[200px]">
                                   <div className="flex justify-between items-start mb-1">
                                       <span className="text-[9px] font-black text-teal-600 uppercase">{ev.event_type.replace('EVENT_', '').replace('_', ' ')}</span>
                                       <span className="text-[8px] font-mono text-gray-400">{new Date(ev.created_at).toLocaleTimeString()}</span>
                                   </div>
                                   <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{ev.actor_name}</p>
                                   <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-tighter">Target: {ev.entity_type} {ev.entity_id}</p>
                               </div>
                           )) : (
                               <div className="w-full text-center py-4 text-gray-400 text-xs italic">Awaiting event signals from boardroom debate...</div>
                           )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {virtualAgents.map(agent => (
                        <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={agent.avatarUrl} className="w-14 h-14 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" alt={agent.name} />
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-tighter">{agent.name}</h3>
                                    <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">{agent.role}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6 h-12 line-clamp-2">{agent.description}</p>
                            <button onClick={() => onConsultAgent(agent)} className="w-full py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-colors">Shared Memory Consultation</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
