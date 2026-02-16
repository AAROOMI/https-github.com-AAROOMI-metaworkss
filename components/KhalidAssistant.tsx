
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import type { Risk } from '../types';
import { CloseIcon, MicrophoneIcon } from './Icons';

// Audio utilities
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

interface KhalidAssistantProps {
    onClose: () => void;
    onUpdateField: (field: keyof Risk, value: any) => void;
    onFocusField: (field: keyof Risk | null) => void;
    onSaveRisk: () => void;
    onGenerateReport: () => void;
    currentRiskData: Partial<Risk>;
}

export const KhalidAssistant: React.FC<KhalidAssistantProps> = ({ onClose, onUpdateField, onFocusField, onSaveRisk, onGenerateReport, currentRiskData }) => {
    const [status, setStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');
    const [transcript, setTranscript] = useState('');
    
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const cleanup = useCallback(() => {
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
        
        onFocusField(null);
        sessionPromise.current = null;
    }, [onFocusField]);

    const tools: FunctionDeclaration[] = useMemo(() => [
        {
            name: 'focus_field',
            description: 'Highlights a specific field in the risk assessment form to guide the user visual attention.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    fieldName: { 
                        type: Type.STRING, 
                        description: "Field name to highlight. Options: 'title', 'category', 'description', 'owner', 'inherentLikelihood', 'inherentImpact', 'existingControl', 'controlEffectiveness', 'treatmentOption', 'mitigation', 'responsibility', 'dueDate'." 
                    }
                },
                required: ['fieldName']
            }
        },
        {
            name: 'update_field',
            description: 'Updates a specific field in the risk assessment form with the user\'s input.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    fieldName: { type: Type.STRING },
                    value: { type: Type.STRING }
                },
                required: ['fieldName', 'value']
            }
        },
        {
            name: 'save_risk',
            description: 'Completes the assessment for the current risk and saves it to the register.',
            parameters: { type: Type.OBJECT, properties: {}, required: [] }
        },
        {
            name: 'finish_assessment_session',
            description: 'Ends the entire assessment session, generates the final report, and sends it for C-Level approval.',
            parameters: { type: Type.OBJECT, properties: {}, required: [] }
        }
    ], []);

    useEffect(() => {
        const startSession = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                inputAudioContextRef.current = inputAudioContext;
                outputAudioContextRef.current = outputAudioContext;

                const systemInstruction = `
                You are Khalid, an expert Enterprise Risk Assessor using ISO 31000 methodology.
                
                **Your Mission:** Guide the user through a Risk Assessment, FIELD BY FIELD.
                
                **Operational Protocol:**
                1.  **Introduce:** "Hello, I am Khalid. Let's assess the risks. What is the first risk scenario?"
                2.  **Field-by-Field Guidance Loop:**
                    - **STEP 1 (VISUAL):** Call \`focus_field(fieldName)\` to make the field GLOW on the user's screen.
                    - **STEP 2 (VERBAL):** Ask the user for the information (e.g., "What is the title?", "How likely is this?").
                    - **STEP 3 (LISTEN):** Wait for response.
                    - **STEP 4 (ACTION):** Call \`update_field(fieldName, value)\` to fill the form.
                    - **STEP 5 (CONFIRM):** Briefly confirm and move to the next field.
                
                **Field Order:**
                1. Title & Category
                2. Description
                3. Owner
                4. Inherent Risk (Likelihood & Impact)
                5. Existing Controls
                6. Mitigation Plan
                
                **Completion:**
                - Once a risk is fully defined, ask: "Shall I save this risk?" -> Call \`save_risk()\`.
                - Then ask: "Do you have another risk, or should we generate the final report for the CEO?"
                - If they say generate report/finish -> Call \`finish_assessment_session()\`.
                
                **Tone:** Professional, precise, helpful.
                **Current Form State:** ${JSON.stringify(currentRiskData)}
                `;

                const currentSessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                    callbacks: {
                        onopen: () => {
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
                                currentSessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputAudioContext.destination);
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                            if (msg.serverContent?.inputTranscription) {
                                setTranscript(msg.serverContent.inputTranscription.text);
                            }
                            
                            if (msg.toolCall?.functionCalls) {
                                setStatus('thinking');
                                for (const fc of msg.toolCall.functionCalls) {
                                    let result = "OK";
                                    if (fc.name === 'focus_field') {
                                        onFocusField(fc.args.fieldName as any);
                                        result = `Field ${fc.args.fieldName} highlighted.`;
                                    } else if (fc.name === 'update_field') {
                                        const { fieldName, value } = fc.args as any;
                                        let finalVal = value;
                                        if (['inherentLikelihood', 'inherentImpact', 'residualLikelihood', 'residualImpact'].includes(fieldName)) {
                                            finalVal = parseInt(value) || 1;
                                        }
                                        onUpdateField(fieldName, finalVal);
                                        result = "Field updated.";
                                    } else if (fc.name === 'save_risk') {
                                        onSaveRisk();
                                        result = "Risk saved to register.";
                                    } else if (fc.name === 'finish_assessment_session') {
                                        onGenerateReport();
                                        result = "Report generated and sent to C-Level.";
                                    }
                                    
                                    currentSessionPromise.then(s => s.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result } }
                                    }));
                                }
                            }

                            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (audioData && outputAudioContext.state !== 'closed') {
                                setStatus('speaking');
                                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                                const buffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                                const source = outputAudioContext.createBufferSource();
                                source.buffer = buffer;
                                source.connect(outputAudioContext.destination);
                                source.addEventListener('ended', () => {
                                    sources.current.delete(source);
                                    if (sources.current.size === 0) setStatus('listening');
                                });
                                source.start(nextStartTime);
                                nextStartTime += buffer.duration;
                                sources.current.add(source);
                            }
                        }
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
                        systemInstruction,
                        tools: [{ functionDeclarations: tools }]
                    }
                });
                sessionPromise.current = currentSessionPromise;
            } catch (e) {
                console.error("Khalid connection error", e);
                onClose();
            }
        };
        startSession();
        return () => cleanup();
    }, [currentRiskData, onFocusField, onSaveRisk, onUpdateField, onGenerateReport, onClose, tools, cleanup]);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-full shadow-2xl border border-teal-500 animate-fade-in">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-bold text-white border-2 border-teal-400">
                    K
                </div>
                <div className={`absolute -inset-1 rounded-full border-2 ${status === 'listening' ? 'border-red-500 animate-pulse' : 'border-transparent'}`}></div>
            </div>
            <div>
                <p className="text-xs font-bold text-teal-300">Khalid AI</p>
                <p className="text-xs text-gray-300">
                    {status === 'listening' ? "Listening..." : status === 'thinking' ? "Analyzing..." : "Speaking..."}
                </p>
            </div>
            <button onClick={() => { cleanup(); onClose(); }} className="ml-2 text-gray-400 hover:text-white"><CloseIcon className="w-4 h-4"/></button>
        </div>
    );
};
