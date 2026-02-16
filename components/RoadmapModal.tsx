
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';
import { CloseIcon, SparklesIcon, CheckCircleIcon, MicrophoneIcon, ChatBotIcon, ShieldCheckIcon } from './Icons';

// Audio utility functions
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

let nextStartTime = 0;

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  const [activePhaseId, setActivePhaseId] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'thinking'>('idle');
  const [isLiveTour, setIsLiveTour] = useState(false);
  const phaseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  
  // Live Session Refs
  const sessionPromise = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const cleanup = useCallback(() => {
    setStatus('idle');
    setIsLiveTour(false);
    setActivePhaseId(null);
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

  const tourTools: FunctionDeclaration[] = useMemo(() => [
    {
      name: 'focus_roadmap_phase',
      description: 'Highlights a specific phase of the roadmap visually for the user and scrolls it into view.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          phaseId: { type: Type.NUMBER, description: 'The ID of the phase to highlight (1, 2, 3, or 4).' }
        },
        required: ['phaseId']
      }
    }
  ], []);

  const handleStartTour = async () => {
    if (isLiveTour) {
      cleanup();
      return;
    }

    setIsLiveTour(true);
    setStatus('thinking');

    try {
      // Fix: Initialize GoogleGenAI right before API calls
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputAudioContext;
      
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputAudioContext;

      const systemInstruction = `You are the Metaworks Strategic Orchestrator. 
      Your mission is to provide an immersive, automatic professional tour of the platform's Strategic Roadmap.
      
      CORE NARRATIVE:
      Begin immediately by explaining the vision: Metaworks is not just a tool; it's a dynamic Agentic Workflow ecosystem. 
      Traditional GRC is a manual burden; Metaworks utilizes specialized AI Agents (CISO, CTO, Auditor) that work autonomously to secure and validate your enterprise posture.
      
      PHASE GUIDANCE:
      1. Greet the executive user with a premium, visionary tone.
      2. Automatically call 'focus_roadmap_phase(1)' to start explaining our completed Foundation phase.
      3. Transition through Phase 2 (Agentic Intelligence), Phase 3 (Deep Vision), and Phase 4 (Advanced Defense).
      4. Highlight the "shining" effect on each phase as you discuss it.
      
      Voice: Premium, masculine, visionary, and professional. Use voice: Fenrir.`;

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
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'focus_roadmap_phase') {
                  const id = (fc.args as any).phaseId;
                  setActivePhaseId(id);
                  phaseRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  currentSessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: `Phase ${id} currently in focus with shine.` } }
                  }));
                }
              }
            }

            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && outputAudioContext && outputAudioContext.state !== 'closed') {
              setStatus('speaking');
              nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
              const buffer = await decodeAudioData(decode(audio), outputAudioContext, 24000, 1);
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
          },
          onclose: cleanup,
          onerror: cleanup
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
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
        const timer = setTimeout(() => {
            handleStartTour();
        }, 800);
        return () => clearTimeout(timer);
    } else {
        cleanup();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const phases = [
    {
      id: 1,
      title: 'Foundation & Governance Core',
      status: 'Completed',
      desc: 'Orchestrating the centralized framework intelligence. Unified PDPL, SAMA, and NCA data structures.',
      features: ['Framework Normalization', 'Zero-Trust RBAC', 'Baseline Automation']
    },
    {
      id: 2,
      title: 'Agentic Intelligence Activation',
      status: 'In Progress',
      desc: 'Deploying autonomous specialized AI agents that conduct audits, generate policies, and consult.',
      features: ['Voice-First Interactivity', 'Autonomous Policy Synthesis', 'Persona-Based Consultation']
    },
    {
      id: 3,
      title: 'Deep Vision Validation',
      status: 'Next 3 Months',
      desc: 'Activating Computer Vision (CNN) to validate visual evidence such as technical diagrams and architecture.',
      features: ['CNN Proof-of-Implementation', 'Enterprise Data Connectors', 'Verified Vault QR-Life']
    },
    {
      id: 4,
      title: 'Predictive Defense & Strategy',
      status: 'Long Term',
      desc: 'Visionary proactive defense using VAPT Orchestration and automated predictive board reporting.',
      features: ['VAPT Auto-Orchestration', 'Predictive Risk Models', 'Strategic Board Intelligence']
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-gray-950/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-[98%] max-w-6xl h-[95vh] rounded-[2rem] shadow-2xl border border-white/5 flex flex-col overflow-hidden transition-all duration-500" onClick={e => e.stopPropagation()}>
        <header className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50/30 dark:bg-gray-900/50">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-600 rounded-2xl shadow-lg shadow-teal-500/20">
                 <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white tracking-tight">
                Strategic Roadmap
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl font-normal leading-relaxed">
              MetaWorks transforms GRC into a dynamic <strong>Agentic Workflow</strong>. Moving from manual checklists to an autonomous department that secures your enterprise in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all duration-500 border ${
                isLiveTour 
                ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/30 dark:border-teal-800 dark:text-teal-300' 
                : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isLiveTour ? 'bg-teal-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-[11px] font-medium tracking-widest uppercase">{isLiveTour ? 'AI Narrative Active' : 'AI Offline'}</span>
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
              <CloseIcon className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-10 bg-white dark:bg-black/10">
          {!isLiveTour && (
             <div className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-gradient-to-br from-teal-50/50 to-white dark:from-gray-800/40 dark:to-gray-900 rounded-3xl border border-teal-100/50 dark:border-teal-900/20">
                    <h4 className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-[0.2em] mb-3">Visionary Objective</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-normal leading-relaxed">Automate complex compliance validation with multi-agent intelligence personae.</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50/50 to-white dark:from-gray-800/40 dark:to-gray-900 rounded-3xl border border-purple-100/50 dark:border-purple-900/20">
                    <h4 className="text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-3">Technological Core</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-normal leading-relaxed">Deployment of Gemini-powered agents for autonomous governance execution.</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-800/40 dark:to-gray-900 rounded-3xl border border-blue-100/50 dark:border-blue-900/20">
                    <h4 className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-3">Enterprise Trust</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-normal leading-relaxed">Immutable audit trails secured via visual CNN evidence protocols.</p>
                </div>
             </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-12">
            {phases.map((phase) => (
              <div 
                key={phase.id} 
                ref={el => phaseRefs.current[phase.id] = el}
                className={`group p-8 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden ${
                  activePhaseId === phase.id 
                    ? 'active-shine-card border-teal-500 bg-white dark:bg-gray-800 z-10 scale-[1.02] shadow-2xl shadow-teal-500/10' 
                    : 'border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/30 opacity-70'
                }`}
              >
                {activePhaseId === phase.id && <div className="absolute inset-0 pointer-events-none active-shine-overlay"></div>}
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-medium text-lg transition-all duration-500 ${
                    activePhaseId === phase.id ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                  }`}>
                    0{phase.id}
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[9px] font-medium uppercase tracking-[0.15em] border ${
                    phase.status === 'Completed' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800' : 
                    phase.status === 'In Progress' ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse dark:bg-blue-900/20 dark:border-blue-800' : 
                    'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                  }`}>
                    {phase.status}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 tracking-tight">{phase.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed font-normal">
                  {phase.desc}
                </p>
                <ul className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                  {phase.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs font-normal text-gray-700 dark:text-gray-300">
                      <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        phase.status === 'Completed' || activePhaseId === phase.id ? 'text-teal-500' : 'text-gray-200 dark:text-gray-700'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </main>
        <footer className="p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex justify-between items-center px-12">
          <div className="flex items-center gap-4 opacity-40">
             <ChatBotIcon className="w-5 h-5 text-teal-600" />
             <span className="text-[10px] font-medium uppercase tracking-[0.3em] dark:text-gray-400">Agentic Intelligence Suite</span>
          </div>
          <div className="h-px flex-grow mx-10 bg-gray-100 dark:bg-gray-800"></div>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-40 dark:text-gray-400">MetaWorks Strategy 2025</p>
        </footer>
      </div>
      <style>{`
        @keyframes roadmap-glow {
            0% { box-shadow: 0 0 5px rgba(20, 184, 166, 0.1); border-color: rgba(20, 184, 166, 0.2); }
            50% { box-shadow: 0 0 30px rgba(20, 184, 166, 0.4), 0 0 60px rgba(20, 184, 166, 0.1); border-color: rgba(20, 184, 166, 0.8); }
            100% { box-shadow: 0 0 5px rgba(20, 184, 166, 0.1); border-color: rgba(20, 184, 166, 0.2); }
        }
        .active-shine-card { animation: roadmap-glow 2.5s infinite ease-in-out; }
        @keyframes moving-roadmap-shine { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
        .active-shine-overlay { background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0) 100%); width: 100%; height: 100%; animation: moving-roadmap-shine 3s infinite; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};
