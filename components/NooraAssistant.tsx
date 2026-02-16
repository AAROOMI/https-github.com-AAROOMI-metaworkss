
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import type { AssessmentItem, ControlStatus } from '../types';
import { CloseIcon, MicrophoneIcon } from './Icons';

const nasserAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230d9488'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

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

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
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

const createUpdateFunctionDeclaration = (assessmentType: string): FunctionDeclaration => ({
  name: 'update_assessment_control',
  description: `Updates a single control in the ${assessmentType} assessment.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      controlCode: { type: Type.STRING },
      currentStatusDescription: { type: Type.STRING },
      controlStatus: { type: Type.STRING, enum: ['Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'] },
      recommendation: { type: Type.STRING },
      managementResponse: { type: Type.STRING },
      targetDate: { type: Type.STRING },
    },
    required: ['controlCode', 'controlStatus'],
  },
});

const initiateNewAssessmentDeclaration: FunctionDeclaration = {
  name: 'initiate_new_assessment',
  description: 'Initiates a new assessment.',
  parameters: { type: Type.OBJECT, properties: {}, required: [] },
};

const requestEvidenceUploadDeclaration: FunctionDeclaration = {
    name: 'request_evidence_upload',
    description: 'Prompts evidence upload.',
    parameters: {
        type: Type.OBJECT,
        properties: { controlCode: { type: Type.STRING } },
        required: ['controlCode']
    }
};

const focusOnFieldDeclaration: FunctionDeclaration = {
    name: 'focus_on_field',
    description: 'Highlights field.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            controlCode: { type: Type.STRING },
            fieldName: { type: Type.STRING }
        },
        required: ['controlCode', 'fieldName']
    }
};

const submitAssessmentReportDeclaration: FunctionDeclaration = {
    name: 'submit_assessment_report',
    description: 'Submits report.',
    parameters: {
        type: Type.OBJECT,
        properties: { summary: { type: Type.STRING } },
        required: ['summary']
    }
};

interface NooraAssistantProps {
    isAssessing: boolean;
    onClose: () => void;
    assessmentData: AssessmentItem[];
    onUpdateItem: (controlCode: string, updatedItem: AssessmentItem) => void;
    currentControlIndex: number;
    onNextControl: () => void;
    assessmentType: string;
    onInitiate: () => void;
    onActiveFieldChange: (controlCode: string | null, field: keyof AssessmentItem | null) => void;
    onRequestEvidenceUpload: (controlCode: string) => void;
    onGenerateReport: (summary: string) => void;
    hidden?: boolean;
    layout?: 'default' | 'floating';
}

let nextStartTime = 0;

export const NooraAssistant: React.FC<NooraAssistantProps> = ({ isAssessing, onClose, assessmentData, onUpdateItem, currentControlIndex, onNextControl, assessmentType, onInitiate, onActiveFieldChange, onRequestEvidenceUpload, onGenerateReport, hidden = false, layout = 'default' }) => {
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [conversation, setConversation] = useState<{ speaker: 'user' | 'assistant', text: string, id: string }[]>([]);
    const conversationRef = useRef(conversation);
    const currentTurnId = useRef<string | null>(null);

    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    const updateFunctionDeclaration = useMemo(() => createUpdateFunctionDeclaration(assessmentType), [assessmentType]);

    const cleanup = useCallback(() => {
        setStatus('idle');
        onActiveFieldChange(null, null);
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
    }, [onActiveFieldChange]);

    useEffect(() => {
        if (isAssessing) {
            const startSession = async () => {
                try {
                    if (!process.env.API_KEY) throw new Error("API key not configured.");
                    
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    streamRef.current = stream;

                    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    inputAudioContextRef.current = inputAudioContext;
                    
                    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    outputAudioContextRef.current = outputAudioContext;

                    const currentControl = assessmentData[currentControlIndex];
                    const systemInstruction = `You are an expert male AI Compliance Assistant for Metaworks. Help the user with ${assessmentType} assessment. Current control: ${currentControl.controlCode}. Use a professional masculine tone.`;

                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const currentSessionPromise = ai.live.connect({
                        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                        callbacks: {
                            onopen: () => {
                                setStatus('listening');
                                if (inputAudioContext.state !== 'closed') {
                                    inputAudioContext.resume();
                                }
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
                            onmessage: async (message) => {
                                 if (message.serverContent?.inputTranscription) {
                                    const text = message.serverContent.inputTranscription.text;
                                    if (!currentTurnId.current || !currentTurnId.current.endsWith('user')) {
                                        currentTurnId.current = `turn-${Date.now()}-user`;
                                        conversationRef.current = [...conversationRef.current, { speaker: 'user', text, id: currentTurnId.current }];
                                    } else {
                                        conversationRef.current = conversationRef.current.map(turn => 
                                            turn.id === currentTurnId.current ? { ...turn, text: turn.text + text } : turn
                                        );
                                    }
                                    setConversation([...conversationRef.current]);
                                }

                                if (message.serverContent?.outputTranscription) {
                                    const text = message.serverContent.outputTranscription.text;
                                    if (!currentTurnId.current || !currentTurnId.current.endsWith('assistant')) {
                                        currentTurnId.current = `turn-${Date.now()}-assistant`;
                                        conversationRef.current = [...conversationRef.current, { speaker: 'assistant', text, id: currentTurnId.current }];
                                    } else {
                                        conversationRef.current = conversationRef.current.map(turn => 
                                            turn.id === currentTurnId.current ? { ...turn, text: turn.text + text } : turn
                                        );
                                    }
                                    setConversation([...conversationRef.current]);
                                }
                                
                                if (message.serverContent?.turnComplete) currentTurnId.current = null;

                                if (message.toolCall?.functionCalls) {
                                    setStatus('thinking');
                                    for (const fc of message.toolCall.functionCalls) {
                                        let res = "OK";
                                        if (fc.name === 'focus_on_field') {
                                            onActiveFieldChange(fc.args.controlCode as any, fc.args.fieldName as any);
                                        } else if (fc.name === 'update_assessment_control') {
                                            const args = fc.args as any;
                                            onUpdateItem(args.controlCode, args);
                                        } else if (fc.name === 'initiate_new_assessment') {
                                            onInitiate();
                                        } else if (fc.name === 'request_evidence_upload') {
                                            onRequestEvidenceUpload(fc.args.controlCode as any);
                                        } else if (fc.name === 'submit_assessment_report') {
                                            onGenerateReport(fc.args.summary as any);
                                        }
                                        currentSessionPromise.then(s => s.sendToolResponse({
                                            functionResponses: { id: fc.id, name: fc.name, response: { result: res } }
                                        }));
                                    }
                                }

                                const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                                if (audio && outputAudioContext && outputAudioContext.state !== 'closed') {
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
                            },
                            onerror: (e) => { console.error(e); setError('Error.'); cleanup(); },
                            onclose: () => cleanup(),
                        },
                        config: {
                            responseModalities: [Modality.AUDIO],
                            inputAudioTranscription: {},
                            outputAudioTranscription: {},
                            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                            systemInstruction,
                            tools: [{ functionDeclarations: [updateFunctionDeclaration, initiateNewAssessmentDeclaration, requestEvidenceUploadDeclaration, focusOnFieldDeclaration, submitAssessmentReportDeclaration] }],
                        },
                    });
                    sessionPromise.current = currentSessionPromise;
                } catch (err: any) {
                    setError(err.message || 'Error.');
                    cleanup();
                }
            };
            startSession();
            return () => cleanup();
        }
    }, [isAssessing, currentControlIndex, cleanup, assessmentType, assessmentData, onActiveFieldChange, updateFunctionDeclaration, onRequestEvidenceUpload, onGenerateReport, onUpdateItem, onInitiate]);

    const handleClose = () => {
        sessionPromise.current?.then(s => s.close());
        cleanup();
        onClose();
    };
    
    if (hidden || !isAssessing) return null;

    const currentControl = assessmentData[currentControlIndex];

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-70 z-[110] flex items-center justify-center p-4 ${layout === 'floating' ? 'bg-transparent pointer-events-none' : ''}`}>
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col pointer-events-auto overflow-hidden`} style={{height: layout === 'floating' ? '400px' : '85vh', maxHeight: '800px'}}>
                 <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-teal-600">
                     <div className="flex items-center">
                        <div className="bg-white rounded-full p-1 mr-3">
                           <img src={nasserAvatar} alt="Nasser" className="w-8 h-8 rounded-full" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white">AI Voice Assessment</h2>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/20 text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Current Control:</p>
                    <p className="font-mono text-teal-600 dark:text-teal-400">{currentControl?.controlCode}</p>
                </div>
                 <main className="flex-1 flex flex-col p-4 overflow-y-auto">
                    <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                        {conversation.map((turn) => (
                             <div key={turn.id} className={`flex items-start gap-2.5 ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {turn.speaker === 'assistant' && <div className="bg-teal-50 dark:bg-teal-900/30 rounded-full p-1"><img src={nasserAvatar} alt="Assistant" className="w-6 h-6 rounded-full" /></div>}
                                <div className={`max-w-prose rounded-2xl px-4 py-2 text-sm ${turn.speaker === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                    {turn.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                        <div className="relative inline-block mb-2">
                             <div className={`w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-inner`}>
                                <MicrophoneIcon className={`w-8 h-8 transition-colors ${status === 'listening' ? 'text-blue-500' : status === 'speaking' ? 'text-teal-500' : 'text-gray-400'}`} />
                            </div>
                            <div className={`absolute -inset-1 rounded-full border-2 animate-pulse ${status === 'listening' ? 'border-blue-400' : status === 'speaking' ? 'border-teal-400' : ''}`}></div>
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 capitalize">{status}</p>
                        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                    </div>
                </main>
                 <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button 
                        onClick={onNextControl}
                        disabled={currentControlIndex >= assessmentData.length - 1}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400"
                    >
                        Next Control &rarr;
                    </button>
                </footer>
            </div>
        </div>
    );
};
