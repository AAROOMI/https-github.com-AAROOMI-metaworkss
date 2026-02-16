import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import type { Risk, User } from '../types';
import { CloseIcon, MicrophoneIcon, ShieldCheckIcon, SparklesIcon } from './Icons';
import { dbAPI } from '../db';

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

interface RiskAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    risks: Risk[];
    currentUser: User | null;
}

export const RiskAssistant: React.FC<RiskAssistantProps> = ({ isOpen, onClose, risks, currentUser }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [conversation, setConversation] = useState<{ speaker: 'user' | 'assistant', text: string }[]>([]);
    
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const cleanup = useCallback(() => {
        setStatus('idle');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
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

    const riskLabTools = useMemo<FunctionDeclaration[]>(() => [
        {
            name: 'risk_lab_identify',
            description: 'Maps conversational data to a structured risk register entry using the Risk Lab Engine.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    likelihood: { type: Type.NUMBER },
                    impact: { type: Type.NUMBER },
                    mitigation: { type: Type.STRING },
                    severity: { type: Type.STRING }
                },
                required: ['title', 'likelihood', 'impact', 'category'],
            },
        },
        {
            name: 'archive_audit_report',
            description: 'Finalizes the current assessment cycle and saves the official report in Document Management.',
            parameters: { type: Type.OBJECT, properties: {}, required: [] }
        }
    ], []);

    useEffect(() => {
        if (isOpen) {
            const startSession = async () => {
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    if (!process.env.API_KEY) throw new Error("Specialist: API key unauthorized.");

                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    streamRef.current = stream;

                    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    inputAudioContextRef.current = inputAudioContext;
                    outputAudioContextRef.current = outputAudioContext;

                    const systemInstruction = `
                    ROLE: Rashid, Specialist Risk Assessment Lead.
                    MANDATE: Conduct the ISO 31000 Risk Lifecycle for Metaworks.
                    
                    PHASE 1: INTAKE & IDENTIFICATION
                    - Greet: "I am Rashid. Let us orchestrate the organizational risk landscape. Shall we load our existing register or identify new scenarios?"
                    
                    PHASE 2: ANALYSIS & AGENTIC SYNC
                    - As user speaks, map to register using 'risk_lab_identify'.
                    - Explain that Fahad AI (CTO) and Ahmed AI (CISO) will validate these controls in real-time.
                    
                    PHASE 3: TREATMENT & EFFECTIVENESS
                    - Assign implementation timeframes.
                    - State: "The Agentic Team is now following up on mitigation progress."
                    
                    PHASE 4: AUDIT & REPORTING
                    - Once complete, gather evidence and call 'archive_audit_report' to save the final report in Document Management.
                    `;

                    const currentSessionPromise = ai.live.connect({
                        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                        callbacks: {
                            onopen: () => {
                                setStatus('listening');
                                if (inputAudioContext.state !== 'closed') inputAudioContext.resume();
                                const source = inputAudioContext.createMediaStreamSource(stream);
                                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                                scriptProcessorRef.current = scriptProcessor;
                                scriptProcessor.onaudioprocess = (e) => {
                                    const inputData = e.inputBuffer.getChannelData(0);
                                    const pcmBlob: Blob = {
                                        data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                        mimeType: 'audio/pcm;rate=16000',
                                    };
                                    currentSessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                                };
                                source.connect(scriptProcessor);
                                scriptProcessor.connect(inputAudioContext.destination);
                            },
                            onmessage: async (message) => {
                                if (message.serverContent?.inputTranscription) {
                                    setConversation(prev => [...prev, { speaker: 'user', text: message.serverContent!.inputTranscription!.text }]);
                                }
                                if (message.serverContent?.outputTranscription) {
                                    setConversation(prev => [...prev, { speaker: 'assistant', text: message.serverContent!.outputTranscription!.text }]);
                                }

                                if (message.toolCall?.functionCalls) {
                                    setStatus('thinking');
                                    for (const fc of message.toolCall.functionCalls) {
                                        let result = "OK";
                                        if (fc.name === 'risk_lab_identify') {
                                            const args = fc.args as any;
                                            const newRisk: Risk = {
                                                id: `ai-risk-${Date.now()}`,
                                                title: args.title,
                                                description: args.description || 'Conversational Input',
                                                category: args.category,
                                                owner: currentUser?.name || 'Unassigned',
                                                inherentLikelihood: args.likelihood,
                                                inherentImpact: args.impact,
                                                inherentScore: args.likelihood * args.impact,
                                                existingControl: 'Under Investigation',
                                                controlEffectiveness: 'Needs Improvement',
                                                residualLikelihood: Math.max(1, args.likelihood - 1),
                                                residualImpact: args.impact,
                                                residualScore: (args.likelihood - 1) * args.impact,
                                                treatmentOption: 'Mitigate',
                                                mitigation: args.mitigation || 'Pending Review',
                                                responsibility: 'Security Operations',
                                                dueDate: '2025-12-31',
                                                acceptanceCriteria: 'Risk within appetite.',
                                                approvedBy: 'Rashid AI',
                                                remarks: 'Board-Level Sighted',
                                                progress: 0,
                                                lastAssessedAt: Date.now()
                                            };
                                            await dbAPI.saveRisk(currentUser?.companyId || 'demo-company', newRisk);
                                            result = "Success: Risk commit to Shared Memory. Agentic Team alerted for effectiveness follow-up.";
                                        } else if (fc.name === 'archive_audit_report') {
                                            result = "Triggering Official PDF Synthesis... Archive sequence initiated.";
                                        }

                                        currentSessionPromise.then(session => {
                                            session.sendToolResponse({
                                                functionResponses: { id: fc.id, name: fc.name, response: { result } }
                                            });
                                        });
                                    }
                                }

                                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                                if (base64Audio && outputAudioContext.state !== 'closed') {
                                    setStatus('speaking');
                                    nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                                    const sourceNode = outputAudioContext.createBufferSource();
                                    sourceNode.buffer = audioBuffer;
                                    sourceNode.connect(outputAudioContext.destination);
                                    sourceNode.addEventListener('ended', () => {
                                        // Fix: Access the ref's current property to use the Set's methods.
                                        sources.current.delete(sourceNode);
                                        // Fix: Access the ref's current property to check the Set's size.
                                        if (sources.current.size === 0) setStatus('listening');
                                    });
                                    sourceNode.start(nextStartTime);
                                    nextStartTime += audioBuffer.duration;
                                    // Fix: Access the ref's current property to add to the Set.
                                    sources.current.add(sourceNode);
                                }
                            }
                        },
                        config: {
                            responseModalities: [Modality.AUDIO],
                            inputAudioTranscription: {},
                            outputAudioTranscription: {},
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
                            systemInstruction,
                            tools: [{ functionDeclarations: riskLabTools }],
                        }
                    });
                    sessionPromise.current = currentSessionPromise;
                } catch (err) {
                    console.error("Rashid Hub Error:", err);
                    cleanup();
                }
            };
            startSession();
            return () => cleanup();
        }
    }, [isOpen, cleanup, risks.length, riskLabTools, currentUser]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-950/80 z-[210] flex items-center justify-center p-6 backdrop-blur-2xl">
            <div className="bg-gray-900 border border-teal-500/20 rounded-[4rem] shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden relative">
                <header className="p-10 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-teal-600 flex items-center justify-center border-2 border-teal-400 shadow-xl shadow-teal-500/20">
                            <ShieldCheckIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none uppercase">Rashid: Risk Lead</h2>
                            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-[0.4em] mt-2">ISO 31000 Autonomous Orchestrator</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-all transform hover:rotate-90">
                        <CloseIcon className="w-8 h-8 text-gray-500 hover:text-white" />
                    </button>
                </header>

                <main className="flex-1 flex flex-col overflow-hidden p-10">
                    <div className="flex-1 overflow-y-auto space-y-8 pr-4 scrollbar-hide">
                        {conversation.map((turn, idx) => (
                            <div key={idx} className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[85%] px-8 py-5 rounded-[2.5rem] text-sm font-medium leading-relaxed ${
                                    turn.speaker === 'user' 
                                    ? 'bg-teal-600 text-white rounded-br-none shadow-xl shadow-teal-500/10' 
                                    : 'bg-white/5 text-teal-50 border border-white/10 rounded-bl-none'
                                }`}>
                                    {turn.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-10 pt-10 border-t border-white/5 text-center flex flex-col items-center gap-8 relative z-10">
                        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${status === 'listening' ? 'border-teal-500 shadow-[0_0_60px_rgba(20,184,166,0.3)] animate-pulse' : status === 'speaking' ? 'border-blue-500' : 'border-gray-800'}`}>
                            <MicrophoneIcon className={`w-12 h-12 ${status === 'listening' ? 'text-teal-400' : status === 'speaking' ? 'text-blue-400' : 'text-gray-700'}`} />
                        </div>
                        <div className="space-y-2">
                             <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.6em]">
                                {status === 'listening' ? "Awaiting Risk Vector Input" : status === 'thinking' ? "Rashid AI Analyzing Shared Memory" : "Communicating Lifecycle Status"}
                             </p>
                             <div className="flex justify-center gap-2">
                                {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${status === 'listening' ? 'bg-teal-500 animate-bounce' : 'bg-gray-800'}`} style={{animationDelay: `${i*0.2}s`}}></div>)}
                             </div>
                        </div>
                    </div>
                </main>

                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className={`absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full bg-teal-500/5 blur-[120px] transition-all duration-2000 ${status === 'listening' ? 'scale-110 opacity-100' : 'scale-90 opacity-0'}`}></div>
                </div>
            </div>
        </div>
    );
};
