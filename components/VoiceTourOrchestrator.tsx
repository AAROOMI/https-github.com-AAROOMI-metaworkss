
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { View } from '../types';
import { CloseIcon, MicrophoneIcon } from './Icons';

interface VoiceTourOrchestratorProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View) => void;
}

// Audio helpers
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

export const VoiceTourOrchestrator: React.FC<VoiceTourOrchestratorProps> = ({ isOpen, onClose, onNavigate }) => {
    const [currentHighlight, setCurrentHighlight] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef(0);

    const cleanup = useCallback(() => {
        setIsConnecting(false);
        setCurrentHighlight(null);
        nextStartTimeRef.current = 0;
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        sessionPromise.current = null;
    }, []);

    const tourTools: FunctionDeclaration[] = useMemo(() => [
        {
            name: 'tour_navigate_and_highlight',
            description: 'Switches the application view and highlights a functional component.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    view: { type: Type.STRING, description: 'dashboard, virtualDepartment, documents, assessment, vapt, riskAssessment, integrations, training, companyProfile, userManagement, navigator.' },
                    highlight_description: { type: Type.STRING, description: 'Descriptive label for the current functional step.' }
                },
                required: ['view', 'highlight_description']
            }
        },
        {
            name: 'tour_end',
            description: 'Concludes the voice tour.',
            parameters: { type: Type.OBJECT, properties: {}, required: [] }
        }
    ], []);

    const startTourSession = async () => {
        setIsConnecting(true);
        nextStartTimeRef.current = 0;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = inputAudioContext;
            outputAudioContextRef.current = outputAudioContext;

            if (outputAudioContext.state !== 'closed') {
                await outputAudioContext.resume();
            }

            const systemInstruction = `
            Act as the "Metaworks Strategic Concierge". 
            Provide an immediate, immersive MALE VOICE TOUR that onboard the user through core processes.
            
            TONE: Executive, visionary, authoritative.
            VOICE: Puck (Professional Male).
            
            SEQUENCE (NO STEP NUMBERS):
            - Welcome the user to the autonomous GRC ecosystem.
            - Focus on Company Profile: Setting corporate identity.
            - Focus on User Management: Onboarding the security team.
            - Focus on Dashboard: Real-time telemetry.
            - Focus on Virtual Department: The AI Brain Trust.
            - Focus on NCA ECC: Regulatory execution.
            - Focus on Navigator: Autonomous policy synthesis.
            `;

            const currentSessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        if (inputAudioContext.state !== 'closed') {
                            inputAudioContext.resume();
                        }
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
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
                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'tour_navigate_and_highlight') {
                                    const { view, highlight_description } = fc.args as any;
                                    onNavigate(view as View);
                                    setCurrentHighlight(highlight_description);
                                    currentSessionPromise.then(s => s.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: `Success. User is now viewing ${view}.` } }
                                    }));
                                } else if (fc.name === 'tour_end') {
                                    onClose();
                                }
                            }
                        }

                        const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audio && outputAudioContext.state !== 'closed') {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const buffer = await decodeAudioData(decode(audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = buffer;
                            source.connect(outputAudioContext.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                        }
                    },
                    onclose: cleanup,
                    onerror: cleanup
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
                    systemInstruction,
                    tools: [{ functionDeclarations: tourTools }]
                }
            });
            sessionPromise.current = currentSessionPromise;

        } catch (e) {
            console.error(e);
            cleanup();
        }
    };

    useEffect(() => {
        if (isOpen) {
            startTourSession();
        } else {
            cleanup();
        }
        return () => cleanup();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed top-24 right-10 z-[300] pointer-events-none">
            <div className="animate-fade-in flex flex-col items-end gap-4">
                <div className="bg-gray-900/90 backdrop-blur-xl border border-teal-500/40 rounded-2xl p-4 shadow-2xl flex items-center gap-4 pointer-events-auto">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
                            {isConnecting ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <MicrophoneIcon className="w-6 h-6 text-white animate-pulse" />
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] leading-none mb-1">Concierge Agent</p>
                        <p className="text-white text-sm font-bold italic tracking-tight">{currentHighlight || "Awaiting Orders..."}</p>
                    </div>
                    <button onClick={onClose} className="ml-4 p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <CloseIcon className="w-5 h-5 text-white/40 hover:text-white" />
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};
