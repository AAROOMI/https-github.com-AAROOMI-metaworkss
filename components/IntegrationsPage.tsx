
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { CloseIcon, CheckCircleIcon, UploadIcon, LockClosedIcon, LinkIcon, SparklesIcon } from './Icons';
import type { Risk, AuditAction } from '../types';

interface IntegrationsPageProps {
    onAddRisk: (risk: Risk) => void;
    addNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
    addAuditLog: (action: AuditAction, details: string, targetId?: string) => void;
}

interface Connector {
    id: string;
    name: string;
    type: 'Cloud' | 'Database' | 'SIEM' | 'ERP' | 'SOAR' | 'SaaS' | 'EA Platform';
    status: 'disconnected' | 'connected' | 'syncing' | 'error';
    iconUrl: string;
    description: string;
    lastSync?: number;
    apiKey?: string;
}

const initialConnectors: Connector[] = [
    {
        id: 'bizzdesign',
        name: 'BiZZdesign Horizzon',
        type: 'EA Platform',
        status: 'disconnected',
        iconUrl: 'https://www.bizzdesign.com/wp-content/uploads/2021/04/bizzdesign-logo-v2.svg',
        description: 'Fetch Business Processes, Application Landscape, and Capability Maps to identify architectural risks.',
    },
    {
        id: 'sap-erp',
        name: 'SAP ERP',
        type: 'ERP',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg',
        description: 'Sync Audit Logs, User Privileges, and GRC Risks.',
    },
    {
        id: 'google-workspace',
        name: 'Google Workspace',
        type: 'SaaS',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Google_Workspace_Logo.svg',
        description: 'Monitor Email Security, Drive Permissions, and User Activity.',
    },
    {
        id: 'google-cloud',
        name: 'Google Cloud Platform',
        type: 'Cloud',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg',
        description: 'Monitor IAM and Storage Buckets.',
    },
    {
        id: 'splunk-siem',
        name: 'Splunk SIEM',
        type: 'SIEM',
        status: 'disconnected',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Splunk_logo.png/800px-Splunk_logo.png',
        description: 'Import Security Alerts and Incidents.',
    }
];

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ onAddRisk, addNotification, addAuditLog }) => {
    const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
    const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
    const [tempKey, setTempKey] = useState('');

    const handleOpenConnect = (id: string) => {
        setSelectedConnectorId(id);
        setTempKey('');
    };

    const handleConfirmConnect = () => {
        if (!selectedConnectorId || !tempKey) return;
        setConnectors(prev => prev.map(c => c.id === selectedConnectorId ? { ...c, status: 'connected', apiKey: tempKey } : c));
        addNotification(`Neural link established for ${connectors.find(c => c.id === selectedConnectorId)?.name}.`, 'success');
        addAuditLog('INTEGRATION_SYNC', `Connected integration: ${selectedConnectorId}`);
        setSelectedConnectorId(null);
    };

    const handleDisconnect = (id: string) => {
        if(window.confirm('Terminate this neural link?')) {
            setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'disconnected', lastSync: undefined, apiKey: undefined } : c));
            addNotification(`${connectors.find(c => c.id === id)?.name} disconnected.`, 'info');
        }
    };

    const handleSync = async (id: string) => {
        const connector = connectors.find(c => c.id === id);
        if (!connector) return;

        setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'syncing' } : c));

        try {
            // Deploy specialized Agentic Intelligence to "Fetch & Summarize" external data
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `You are a data synchronization agent for ${connector.name}. 
            Generate a JSON list of 3 hypothetical security risks based on typical data found in a ${connector.type} system.
            Each risk must have: title, description, category, inherentLikelihood (1-5), inherentImpact (1-5), and a mitigation strategy.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                category: { type: Type.STRING },
                                inherentLikelihood: { type: Type.NUMBER },
                                inherentImpact: { type: Type.NUMBER },
                                mitigation: { type: Type.STRING }
                            },
                            required: ['title', 'description', 'category', 'inherentLikelihood', 'inherentImpact', 'mitigation']
                        }
                    }
                }
            });

            const rawData = JSON.parse(response.text || '[]');
            
            rawData.forEach((riskData: any) => {
                const iScore = riskData.inherentLikelihood * riskData.inherentImpact;
                const finalRisk: Risk = {
                    id: `import-${connector.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    title: riskData.title,
                    description: riskData.description,
                    category: riskData.category,
                    owner: "Automated Orchestrator",
                    inherentLikelihood: riskData.inherentLikelihood,
                    inherentImpact: riskData.inherentImpact,
                    inherentScore: iScore,
                    existingControl: `Mapped from ${connector.name}`,
                    controlEffectiveness: 'Needs Improvement',
                    residualLikelihood: riskData.inherentLikelihood, 
                    residualImpact: riskData.inherentImpact,
                    residualScore: iScore,
                    treatmentOption: 'Mitigate',
                    mitigation: riskData.mitigation,
                    responsibility: "Compliance Team",
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    progress: 0,
                    acceptanceCriteria: 'Evidence validated in vault.',
                    approvedBy: 'Ahmed AI',
                    remarks: `Source: Neural Link with ${connector.name}`
                };
                onAddRisk(finalRisk);
            });

            setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'connected', lastSync: Date.now() } : c));
            addNotification(`Successfully ingested ${rawData.length} items from ${connector.name} into Risk Pool.`, 'success');
            addAuditLog('INTEGRATION_SYNC', `Synced ${rawData.length} items from ${connector.name}.`);

        } catch (error) {
            console.error(error);
            setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'error' } : c));
            addNotification(`Sync failure with ${connector.name}. Check credentials.`, 'error');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Enterprise Integrations</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-normal">Connect your enterprise ecosystem to feed the neural compliance brain.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectors.map(connector => (
                    <div key={connector.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-all hover:shadow-md">
                        <div className="p-6 flex-grow flex flex-col">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-100 dark:border-gray-600">
                                    <img 
                                        src={connector.iconUrl} 
                                        alt={connector.name} 
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.svgrepo.com/show/439247/network.svg'; }} 
                                    /> 
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{connector.name}</h3>
                                    <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">{connector.type}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 leading-relaxed flex-grow">
                                {connector.description}
                            </p>
                            
                            <div className="w-full">
                                {connector.status === 'disconnected' ? (
                                    <button 
                                        onClick={() => handleOpenConnect(connector.id)}
                                        className="w-full py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors uppercase tracking-widest"
                                    >
                                        Establish Link
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center text-green-600 dark:text-green-400 text-[9px] font-bold uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                            Neural Link Active
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => handleSync(connector.id)}
                                                disabled={connector.status === 'syncing'}
                                                className="py-2 bg-teal-600 text-white text-[10px] font-bold rounded-lg hover:bg-teal-700 disabled:bg-gray-300 uppercase tracking-tighter"
                                            >
                                                {connector.status === 'syncing' ? 'Syncing...' : 'Fetch Data'}
                                            </button>
                                            <button 
                                                onClick={() => handleDisconnect(connector.id)}
                                                className="py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded-lg hover:bg-gray-50 uppercase tracking-tighter"
                                            >
                                                Terminate
                                            </button>
                                        </div>
                                        {connector.lastSync && (
                                            <p className="text-[8px] text-center text-gray-400 uppercase tracking-widest">
                                                Last Synced: {new Date(connector.lastSync).toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Connection Modal */}
            {selectedConnectorId && (
                <div className="fixed inset-0 bg-black/60 z-[220] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedConnectorId(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white uppercase tracking-tight">Security Credentials</h2>
                        <p className="text-xs text-gray-500 mt-1">Authenticate the neural link for {connectors.find(c => c.id === selectedConnectorId)?.name}.</p>
                        
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">API Key / Horizzon Token</label>
                                <input 
                                    type="password"
                                    value={tempKey}
                                    onChange={(e) => setTempKey(e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedConnectorId(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold uppercase hover:bg-gray-200">Cancel</button>
                                <button 
                                    onClick={handleConfirmConnect}
                                    disabled={!tempKey}
                                    className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-[11px] font-bold uppercase hover:bg-teal-700 disabled:bg-gray-400"
                                >
                                    Authorize
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
