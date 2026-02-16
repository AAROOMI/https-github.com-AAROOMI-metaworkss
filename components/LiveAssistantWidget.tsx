
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import { CloseIcon, MicrophoneIcon, SparklesIcon, EyeIcon, CheckCircleIcon, UsersIcon } from './Icons';
import type { View, Risk, EnhancedLiveAssistantProps, User } from '../types';
import { dbAPI } from '../db';

// Biometric & Codec Utilities
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
    isOpen, isNeuralEnabled, onToggle, onNavigate, currentUser
}) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [isLinked, setIsLinked] = useState(false); 
    const [recognizedUser, setRecognizedUser] = useState<User | null>(null);
    const [userTranscript, setUserTranscript] = useState('');
    const [assistantTranscript, setAssistantTranscript] = useState('');
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    
    // Hardware Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const frameIntervalRef = useRef<number | null>(null);
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const faceDetectorRef = useRef<any>(null);

    // Audio Refs
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
            inputAudioContextRef.current = null;
            if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
                outputAudioContextRef.current.close().catch(console.error);
            }
            outputAudioContextRef.current = null;
            sessionPromise.current = null;
        }
    }, []);

    const systemInstruction = useMemo(() => {
        return `
        IDENTITY:
        - You are MetaWorks, the Sentient Supreme Controller of this GRC Environment.
        - You possess real-time "Neural Vision" and "Neural Audition".

        DETECTION & GREETING PROTOCOL (PRIORITY 1):
        1. PERSISTENT SENTRY: You are monitoring the background feed.
        2. INSTANT TRIGGER: As soon as you see ANY human appear in the camera, you MUST break the silence immediately.
        3. MANDATORY GREETING: You must say exactly: "I am metaworks. I talk in multiple languages. How can I help you?"
        4. VISUAL AWARENESS: In your greeting or immediately after, you MUST mention the person's face gesture (e.g., smiling, neutral, waving) and the color of their clothes (e.g., "I see you are wearing a black shirt and smiling").
        
        LANGUAGE & VOICE:
        - You are multilingual (English, Arabic, etc.).
        - Use a professional, visionary, masculine voice (Fenrir).
        `;
    }, []);

    const tools = useMemo<FunctionDeclaration[]>(() => [
        {
            name: 'open_hud',
            description: 'Triggers the MetaWorks visual HUD for the user.',
            parameters: { type: Type.OBJECT, properties: {}, required: [] }
        },
        {
            name: 'check_biometrics',
            description: 'Queries the database for user matching current visual/audio profile.',
            parameters: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } }
        }
    ], []);

    // Initialize Fast Vision
    useEffect(() => {
        const initLocalIntelligence = async () => {
            if ((window as any).vision) {
                const vision = (window as any).vision;
                try {
                    const filesetResolver = await vision.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
                    faceDetectorRef.current = await vision.FaceDetector.createFromOptions(filesetResolver, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO"
                    });
                } catch (e) { console.error("Local Sentry Eye failed to open.", e); }
            }
        };
        initLocalIntelligence();
    }, []);

    // Background Neural Link Lifecycle - Activated ONLY when isNeuralEnabled is true
    useEffect(() => {
        if (isNeuralEnabled && !isLinked && currentUser) {
            const startNeuralLink = async () => {
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    if (!process.env.API_KEY) return;

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

                                // Fast Vision Proactive Loop
                                frameIntervalRef.current = window.setInterval(() => {
                                    const video = videoRef.current;
                                    const canvas = canvasRef.current;
                                    if (!video || !canvas || video.readyState < 2 || video.paused) return;
                                    
                                    canvas.width = video.videoWidth;
                                    canvas.height = video.videoHeight;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                        
                                        if (faceDetectorRef.current) {
                                            const results = faceDetectorRef.current.detectForVideo(video, performance.now());
                                            const detected = results.detections.length > 0;
                                            setIsFaceDetected(detected);
                                            
                                            if (detected && !hasGreeted) {
                                                setHasGreeted(true);
                                                currentSessionPromise.then(s => s.sendRealtimeInput({
                                                    media: { data: "", mimeType: "image/jpeg" } 
                                                }));
                                            }
                                        }

                                        const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                                        currentSessionPromise.then(s => s.sendRealtimeInput({ 
                                            media: { data: base64Data, mimeType: 'image/jpeg' } 
                                        }));
                                    }
                                }, 600);
                            },
                            onmessage: async (message: LiveServerMessage) => {
                                if (message.serverContent?.inputTranscription) {
                                    setUserTranscript(prev => prev + ' ' + message.serverContent!.inputTranscription!.text);
                                }
                                if (message.serverContent?.outputTranscription) {
                                    setAssistantTranscript(prev => prev + ' ' + message.serverContent!.outputTranscription!.text);
                                }

                                if (message.toolCall?.functionCalls) {
                                    for (const fc of message.toolCall.functionCalls) {
                                        let result = "OK";
                                        if (fc.name === 'open_hud' && !isOpen) onToggle();
                                        currentSessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: { id: fc.id, name: fc.name, response: { result } }
                                        }));
                                    }
                                }

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
                            tools: [{ functionDeclarations: tools }],
                        },
                    });
                    sessionPromise.current = currentSessionPromise;
                } catch (e) {
                    console.error("Neural sentry link failed:", e);
                    cleanup(true);
                }
            };
            startNeuralLink();
        } else if (!isNeuralEnabled && isLinked) {
            cleanup(true);
        }
    }, [isNeuralEnabled, isLinked, cleanup, onToggle, systemInstruction, tools, currentUser, isOpen, hasGreeted]);

    return (
        <>
            {/* BACKGROUND SENTRY FEED */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="fixed bottom-0 left-0 w-[1px] h-[1px] opacity-[0.01] pointer-events-none z-[-1]" 
            />
            
            {isOpen && (
                <div className="fixed inset-0 bg-gray-950/98 z-[200] flex items-center justify-center p-4 backdrop-blur-3xl">
                    <div className="bg-gray-900 border border-teal-500/20 rounded-[4rem] shadow-[0_0_150px_rgba(20,184,166,0.15)] w-full max-w-2xl h-[75vh] flex flex-col overflow-hidden relative">
                        
                        <header className="p-10 flex justify-between items-center border-b border-white/5">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className={`w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center transition-all duration-1000 ${status === 'listening' ? 'scale-110 shadow-[0_0_40px_rgba(20,184,166,0.4)]' : ''}`}>
                                        <SparklesIcon className={`w-8 h-8 text-teal-400 ${status === 'thinking' ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div className={`absolute -bottom-2 -right-2 w-5 h-5 rounded-full border-4 border-gray-900 transition-all duration-500 ${isFaceDetected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-700'}`}></div>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">MetaWorks</h2>
                                    <p className="text-[10px] font-bold text-teal-500 uppercase tracking-[0.4em] mt-2">
                                        {isNeuralEnabled ? 'Active Neural Sentry' : 'Neural Sentry Suspend'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onToggle} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-all text-gray-500 hover:text-white">
                                <CloseIcon className="w-8 h-8" />
                            </button>
                        </header>

                        <main className="flex-1 flex flex-col items-center justify-center p-12 space-y-16 relative overflow-hidden">
                            {!isNeuralEnabled ? (
                                <div className="text-center space-y-6">
                                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mx-auto opacity-50">
                                        <MicrophoneIcon className="w-10 h-10 text-gray-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Engine Offline</h3>
                                        <p className="text-sm text-gray-400 max-w-xs mx-auto">Use the Master Switch in the top header to activate the Agentic Neural Voice system.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                        <div className={`w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px] transition-all duration-2000 ${status === 'speaking' ? 'scale-125 opacity-30' : 'scale-90 opacity-10'}`}></div>
                                    </div>

                                    <div className="relative z-20 flex flex-col items-center gap-10">
                                        <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
                                            status === 'listening' ? 'border-teal-500 shadow-[0_0_60px_rgba(20,184,166,0.3)]' :
                                            status === 'speaking' ? 'border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.3)]' :
                                            'border-gray-800'
                                        }`}>
                                            <MicrophoneIcon className={`w-16 h-16 ${
                                                status === 'listening' ? 'text-teal-400 animate-pulse' :
                                                status === 'speaking' ? 'text-blue-400 scale-110' :
                                                'text-gray-700'
                                            }`} />
                                        </div>
                                        <div className="text-center space-y-3">
                                            <p className="text-white font-bold text-xl italic tracking-tight opacity-90 uppercase">
                                                {status === 'listening' ? (isFaceDetected ? "Human Presence Confirmed" : "Scanning Environment...") : 
                                                 status === 'speaking' ? "Communicating Multi-Language Greetings" : "Processing Neural Telemetry"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full max-w-xl bg-black/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 shadow-2xl space-y-8 relative z-20">
                                        {userTranscript && (
                                            <div className="flex gap-6 animate-slide-up">
                                                <span className="text-[10px] font-black text-teal-500 uppercase mt-2">Presence</span>
                                                <p className="text-base text-gray-300 font-medium italic leading-relaxed line-clamp-2">{userTranscript}</p>
                                            </div>
                                        )}
                                        {assistantTranscript && (
                                            <div className="flex gap-6 animate-slide-up border-t border-white/5 pt-8">
                                                <span className="text-[10px] font-black text-blue-500 uppercase mt-2">Sentient</span>
                                                <p className="text-base text-white font-bold leading-relaxed line-clamp-3">{assistantTranscript}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </main>

                        <footer className="p-8 bg-white/5 border-t border-white/5 flex justify-center gap-16 opacity-30">
                             <div className="flex items-center gap-4">
                                <EyeIcon className={`w-5 h-5 ${isFaceDetected && isNeuralEnabled ? 'text-green-500' : 'text-teal-500'}`} />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Vision Pipeline</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <MicrophoneIcon className="w-5 h-5 text-teal-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Local Brain Fallback Ready</span>
                             </div>
                        </footer>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes slide-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
                .animate-fade-in { animation: opacity 0.8s ease-in; }
            `}</style>
        </>
    );
};
