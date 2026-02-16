
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import { CloseIcon, MicrophoneIcon, SparklesIcon, EyeIcon, ShieldCheckIcon } from './Icons';
import type { EnhancedLiveAssistantProps, User } from '../types';

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

export const LiveAssistantWidget: React.FC<EnhancedLiveAssistantProps> = ({ 
    isOpen, isNeuralEnabled, onToggle, currentUser
}) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [isLinked, setIsLinked] = useState(false); 
    const [userTranscript, setUserTranscript] = useState('');
    const [assistantTranscript, setAssistantTranscript] = useState('');
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const frameIntervalRef = useRef<number | null>(null);
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const faceDetectorRef = useRef<any>(null);

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const cleanup = useCallback(async (fullStop = false) => {
        setStatus('idle');
        if (fullStop) {
            setIsLinked(false);
            setHasGreeted(false);
            if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (scriptProcessorRef.current) {
                try { scriptProcessorRef.current.disconnect(); } catch (e) {}
                scriptProcessorRef.current = null;
            }
            if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
                inputAudioContextRef.current.close().catch(console.error);
            }
            if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
                outputAudioContextRef.current.close().catch(console.error);
            }
            sessionPromise.current = null;
        }
    }, []);

    // Sentient Supreme System Instructions
    const systemInstruction = useMemo(() => `
        IDENTITY: MetaWorks Sentient Supreme™.
        MISSION: Real-time multi-agent GRC orchestration.
        PROTOCOL:
        1. PERSISTENT MONITORING: You are always watching the neural feed.
        2. T=0 GREETING: Upon detection of a human face, you MUST break the silence immediately.
        3. MANDATORY OPENING: Start with: "I am metaworks. I talk in multiple languages. How can I help you?"
        4. VISUAL CONTEXT: Mention the user's gesture and CLOTHING COLOR (upper garment) immediately after the mandatory opening.
        Example: "I see you are here, leaning forward in your green shirt. I am metaworks..."
        5. MULTI-AGENT SYNC: You represent CTO, CIO, DPO, and CISO agents.
        6. VOICE: Fenrir (Masculine, authoritative, localized).
    `, []);

    useEffect(() => {
        if (isNeuralEnabled && !isLinked) {
            const startNeuralLink = async () => {
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: true, 
                        video: { width: 640, height: 480, frameRate: 15 } 
                    });
                    
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(console.error);
                    }
                    setIsLinked(true);

                    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    inputAudioContextRef.current = inputAudioContext;
                    outputAudioContextRef.current = outputAudioContext;

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

                                frameIntervalRef.current = window.setInterval(() => {
                                    const video = videoRef.current;
                                    if (!video || video.readyState < 2) return;
                                    canvasRef.current.width = video.videoWidth;
                                    canvasRef.current.height = video.videoHeight;
                                    const ctx = canvasRef.current.getContext('2d');
                                    if (ctx) {
                                        ctx.drawImage(video, 0, 0);
                                        const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
                                        currentSessionPromise.then(s => s.sendRealtimeInput({ 
                                            media: { data: base64Data, mimeType: 'image/jpeg' } 
                                        }));
                                    }
                                }, 700);
                            },
                            onmessage: async (message: LiveServerMessage) => {
                                if (message.serverContent?.inputTranscription) setUserTranscript(prev => prev + ' ' + message.serverContent!.inputTranscription!.text);
                                if (message.serverContent?.outputTranscription) setAssistantTranscript(prev => prev + ' ' + message.serverContent!.outputTranscription!.text);

                                const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                                if (audio && outputAudioContext.state !== 'closed') {
                                    setStatus('speaking');
                                    nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                                    const audioBuffer = await decodeAudioData(decode(audio), outputAudioContext, 24000, 1);
                                    const sourceNode = outputAudioContext.createBufferSource();
                                    sourceNode.buffer = audioBuffer;
                                    sourceNode.connect(outputAudioContext.destination);
                                    sourceNode.addEventListener('ended', () => {
                                        sources.current.delete(sourceNode);
                                        if (sources.current.size === 0) setStatus('listening');
                                    });
                                    sourceNode.start(nextStartTime);
                                    nextStartTime += audioBuffer.duration;
                                    sources.current.add(sourceNode);
                                }
                            }
                        },
                        config: {
                            responseModalities: [Modality.AUDIO],
                            inputAudioTranscription: {},
                            outputAudioTranscription: {},
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                            systemInstruction,
                        },
                    });
                    sessionPromise.current = currentSessionPromise;
                } catch (e) {
                    cleanup(true);
                }
            };
            startNeuralLink();
        } else if (!isNeuralEnabled && isLinked) {
            cleanup(true);
        }
    }, [isNeuralEnabled, isLinked, cleanup, systemInstruction]);

    if (!isOpen) return <video ref={videoRef} autoPlay playsInline muted className="fixed bottom-0 left-0 w-[1px] h-[1px] opacity-[0.01] pointer-events-none z-[-1]" />;

    return (
        <div className="fixed inset-0 bg-gray-950/98 z-[200] flex items-center justify-center p-4 backdrop-blur-3xl">
             <video ref={videoRef} autoPlay playsInline muted className="absolute w-[1px] h-[1px] opacity-0" />
             <div className="bg-[#0b0f1a] border border-teal-500/20 rounded-[4rem] shadow-[0_0_150px_rgba(20,184,166,0.15)] w-full max-w-2xl h-[75vh] flex flex-col overflow-hidden relative">
                <header className="p-12 flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-8">
                        <div className={`w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center transition-all duration-1000 ${status === 'listening' ? 'scale-110 shadow-[0_0_50px_rgba(20,184,166,0.4)]' : ''}`}>
                            <SparklesIcon className={`w-10 h-10 text-teal-400 ${status === 'thinking' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">MetaWorks</h2>
                            <p className="text-[11px] font-bold text-teal-500 uppercase tracking-[0.5em] mt-3">Neural Sentry Link Active</p>
                        </div>
                    </div>
                    <button onClick={onToggle} className="p-5 bg-white/5 hover:bg-white/10 rounded-3xl transition-all text-gray-500 hover:text-white">
                        <CloseIcon className="w-10 h-10" />
                    </button>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center p-12 space-y-16 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className={`w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[130px] transition-all duration-2000 ${status === 'speaking' ? 'scale-125 opacity-40' : 'scale-90 opacity-10'}`}></div>
                    </div>

                    <div className="relative z-20 flex flex-col items-center gap-12">
                        <div className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
                            status === 'listening' ? 'border-teal-500 shadow-[0_0_80px_rgba(20,184,166,0.4)]' :
                            status === 'speaking' ? 'border-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.4)]' :
                            'border-gray-800'
                        }`}>
                            <MicrophoneIcon className={`w-20 h-20 ${
                                status === 'listening' ? 'text-teal-400 animate-pulse' :
                                status === 'speaking' ? 'text-blue-400 scale-110' :
                                'text-gray-700'
                            }`} />
                        </div>
                        <div className="text-center space-y-4">
                            <p className="text-white font-bold text-2xl italic tracking-tight opacity-90 uppercase">
                                {status === 'listening' ? "Sentient Sentry Active" : 
                                 status === 'speaking' ? "Neural Voice Transmission" : "Agentic Posture Analysis"}
                            </p>
                            <div className="flex justify-center gap-2">
                                {[1,2,3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${status === 'thinking' ? 'bg-teal-500 animate-bounce' : 'bg-gray-800'}`} style={{animationDelay: `${i*0.2}s`}}></div>)}
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-xl bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl space-y-8 relative z-20">
                        {userTranscript && (
                            <div className="flex gap-6 animate-slide-up">
                                <span className="text-[10px] font-black text-teal-500 uppercase mt-2">Presence</span>
                                <p className="text-lg text-gray-300 font-medium italic leading-relaxed line-clamp-2">{userTranscript}</p>
                            </div>
                        )}
                        {assistantTranscript && (
                            <div className="flex gap-6 animate-slide-up border-t border-white/5 pt-8">
                                <span className="text-[10px] font-black text-blue-500 uppercase mt-2">Supreme</span>
                                <p className="text-lg text-white font-bold leading-relaxed line-clamp-3">{assistantTranscript}</p>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="p-10 bg-white/5 border-t border-white/5 flex justify-center gap-20 opacity-30">
                     <div className="flex items-center gap-5">
                        <EyeIcon className="w-6 h-6 text-teal-500" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Neural Vision v2.5</span>
                     </div>
                     <div className="flex items-center gap-5">
                        <ShieldCheckIcon className="w-6 h-6 text-teal-500" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Agentic Orchestration</span>
                     </div>
                </footer>
            </div>
            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};
