
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { BugAntIcon, CheckCircleIcon, ExclamationTriangleIcon, CloseIcon } from './Icons';
import type { VaptFinding, AuditAction, Permission } from '../types';

interface VaptOrchestratorPageProps {
    permissions: Set<Permission>;
    addAuditLog: (action: AuditAction, details: string) => void;
}

// --- Mock Tools Implementation ---

const mockStartScan = async (params: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
        scan_id: `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, 
        status: 'running', 
        estimated_time: '45m',
        message: 'Scan initiated successfully on requested targets.'
    };
};

const mockGetScanStatus = async (params: { scan_id: string }) => {
    // Simulate random status updates or completion
    const statuses = ['running', 'analyzing', 'finalizing', 'completed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return { scan_id: params.scan_id, status: randomStatus, progress: Math.floor(Math.random() * 100) + '%' };
};

const mockGetFindings = async (params: { scan_id: string }) => {
    // Return the specific mock finding from the prompt plus a couple more
    return {
        scan_id: params.scan_id,
        tool: "tenable",
        summary: {
            assets_scanned: 54,
            critical: 3,
            high: 11,
            medium: 27,
            low: 19,
            info: 40
        },
        findings: [
            {
                id: "F-0001",
                severity: "critical",
                asset: "10.10.1.25",
                title: "Remote Code Execution Vulnerability",
                cve: ["CVE-2024-XXXX"],
                cwe: ["CWE-94"],
                cvss: 9.8,
                evidence: {
                    scanner_plugin: "PLUGIN-12345",
                    observed: "Service version indicates vulnerable build",
                    proof: "Banner / fingerprint / vuln check output"
                },
                impact: "Potential full compromise of host.",
                recommendation: "Patch to vendor-fixed version, restrict exposure, validate compensating controls.",
                references: ["vendor_advisory", "cve_link", "MITRE T1210"]
            },
            {
                id: "F-0002",
                severity: "high",
                asset: "web-prod-01",
                title: "SQL Injection",
                cve: ["CVE-2023-YYYY"],
                cwe: ["CWE-89"],
                cvss: 8.5,
                evidence: {
                    scanner_plugin: "PLUGIN-67890",
                    observed: "Input parameter 'id' vulnerable to boolean-based blind SQLi",
                    proof: "Payload: ' OR 1=1 --"
                },
                impact: "Unauthorized data access or modification.",
                recommendation: "Use parameterized queries and input validation.",
                references: ["owasp_sqli", "OWASP A03:2021"]
            },
            {
                id: "F-0003",
                severity: "high",
                asset: "db-internal-02",
                title: "Default Database Credentials",
                cve: [],
                cwe: ["CWE-798"],
                cvss: 7.5,
                evidence: {
                    scanner_plugin: "PLUGIN-3342",
                    observed: "Default 'postgres' account enabled with default password",
                    proof: "Authentication successful via standard port"
                },
                impact: "Unauthorized database access.",
                recommendation: "Change default passwords immediately.",
                references: ["OWASP A07:2021", "MITRE T1078"]
            }
        ]
    };
};

const mockStopScan = async (params: { scan_id: string }) => {
    return { scan_id: params.scan_id, status: 'stopped', message: 'Scan halted by user request.' };
};

const mockGenerateReport = async (params: { scan_id: string, report_type: string, format: string }) => {
    return { 
        report_url: `https://vapt-platform.internal/reports/${params.scan_id}_${params.report_type}.${params.format}`,
        message: 'Report generated successfully.'
    };
};

const mockCreateScanPlan = async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
        plan_id: `PLAN-${Date.now().toString().slice(-6)}`,
        parameters: params,
        status: "Approved",
        message: "Scan plan created and validated against policy. Ready for execution."
    };
};

// --- Tool Declarations ---

const tools: FunctionDeclaration[] = [
    {
      name: "vapt_create_scan_plan",
      description: "Create a formal scan plan based on scope, type, and window.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          scope: { type: Type.STRING },
          scan_type: { type: Type.STRING },
          framework: { type: Type.STRING },
          auth_scan: { type: Type.BOOLEAN },
          window_start: { type: Type.STRING },
          window_end: { type: Type.STRING }
        },
        required: ["scope", "scan_type", "window_start", "window_end"]
      }
    },
    {
      name: "vapt_start_scan",
      description: "Start an authorized VAPT scan using configured scanner integrations.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          scan_type: { type: Type.STRING, enum: ["infra_va", "web_dast", "cloud_va", "container_va", "attack_validation"] },
          targets: { type: Type.ARRAY, items: { type: Type.STRING } },
          auth_scan: { type: Type.BOOLEAN, description: "Authenticated scan requested" },
          credentials_ref: { type: Type.STRING, description: "Reference ID to stored credentials" },
          profile: { type: Type.STRING, description: "Scanner profile/policy name" },
          rate_limit: { type: Type.STRING, description: "e.g., low/medium/high" },
          window_start: { type: Type.STRING },
          window_end: { type: Type.STRING }
        },
        required: ["scan_type", "targets"]
      }
    },
    {
      name: "vapt_get_scan_status",
      description: "Get current status of a running scan.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          scan_id: { type: Type.STRING }
        },
        required: ["scan_id"]
      }
    },
    {
      name: "vapt_get_findings",
      description: "Fetch normalized findings for a completed scan.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          scan_id: { type: Type.STRING },
          min_severity: { type: Type.STRING, enum: ["info", "low", "medium", "high", "critical"] }
        },
        required: ["scan_id"]
      }
    },
    {
      name: "vapt_stop_scan",
      description: "Stop a running scan safely.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          scan_id: { type: Type.STRING }
        },
        required: ["scan_id"]
      }
    },
    {
      name: "vapt_generate_report",
      description: "Generate executive + technical VAPT report from findings.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          scan_id: { type: Type.STRING },
          report_type: { type: Type.STRING, enum: ["executive", "technical", "both", "jira_tickets"] },
          format: { type: Type.STRING, enum: ["json", "pdf", "docx", "html"] }
        },
        required: ["scan_id", "report_type", "format"]
      }
    }
];

export const VaptOrchestratorPage: React.FC<VaptOrchestratorPageProps> = ({ permissions, addAuditLog }) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [scanConfig, setScanConfig] = useState({
        scope: '',
        scanType: 'infra_va',
        framework: 'none',
        authScan: false,
        windowStart: new Date().toISOString().slice(0, 16),
        windowEnd: new Date(Date.now() + 3600 * 1000 * 4).toISOString().slice(0, 16),
    });
    
    // Agent State
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [scanData, setScanData] = useState<any>(null); // Store active scan info
    const [findings, setFindings] = useState<VaptFinding[]>([]);
    const [agentInput, setAgentInput] = useState('');

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(scrollToBottom, [messages]);

    const handleAuthorization = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsAuthorized(e.target.checked);
        if (e.target.checked) {
            addAuditLog('VAPT_SCAN_STARTED', 'User confirmed authorization for VAPT operations.');
        }
    };

    const handleStartSession = async () => {
        if (!isAuthorized) return;
        
        const initialPrompt = `
        I confirm I have written authorization to test the following assets: ${scanConfig.scope}.
        I want to run a ${scanConfig.scanType} scan. 
        Framework Mapping: ${scanConfig.framework !== 'none' ? scanConfig.framework : 'Standard VAPT'}.
        Authentication is ${scanConfig.authScan ? 'enabled' : 'disabled'}.
        Testing window is from ${scanConfig.windowStart} to ${scanConfig.windowEnd}.
        Please create a formal scan plan.
        `;

        setMessages([{ role: 'user', text: initialPrompt }]);
        await runAgentTurn(initialPrompt);
    };

    const runAgentTurn = async (userMessage: string) => {
        setIsThinking(true);
        try {
            // Fix: Create GoogleGenAI instance right before the API call to ensure latest API key is used
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const systemInstruction = `You are “VAPT Orchestrator”, an enterprise-grade Vulnerability Assessment & Penetration Testing agent.
            Your job is to run authorized security testing ONLY for assets the user owns or has written permission to test.

            SCOPE & SAFETY (MANDATORY)
            - Before any scan action, confirm: (1) written authorization = YES, (2) scope, (3) window, (4) environment, (5) scan type.
            - If authorization is NOT confirmed, refuse to proceed.
            - Never provide exploitation steps or payloads. Only remediation.

            CAPABILITIES
            1. Plan: Create scan plans based on scope using vapt_create_scan_plan.
            2. Execute: Use tools vapt_start_scan, vapt_get_scan_status, vapt_get_findings, vapt_stop_scan, vapt_generate_report.
            3. Report: Summarize findings.

            FRAMEWORK MAPPING:
            - If the user selects "OWASP Top 10", ensure findings are categorized by A01-A10 tags.
            - If the user selects "MITRE ATT&CK", ensure findings are mapped to T-Codes (Tactics/Techniques).

            WORKFLOW
            1. Intake (User just provided this).
            2. Build Scan Plan (Call vapt_create_scan_plan). Ask for confirmation to Execute.
            3. Execute (Call vapt_start_scan).
            4. Monitor (Call vapt_get_scan_status).
            5. Findings (Call vapt_get_findings when complete or requested). IMPORTANT: If a scan finishes successfully, AUTOMATICALLY call vapt_get_findings to show the user the results.
            6. Report (Call vapt_generate_report).

            Use the provided tools to perform actions. If a tool returns data, summarize it for the user.`;

            const chatHistory = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            
            const chat = ai.chats.create({
                model: 'gemini-3-pro-preview',
                config: {
                    systemInstruction,
                    tools: [{ functionDeclarations: tools }],
                    thinkingConfig: { thinkingBudget: 32768 }
                },
                history: chatHistory.slice(0, -1) 
            });

            const result = await chat.sendMessage({ message: userMessage });
            
            // Handle Tool Calls
            const call = result.functionCalls?.[0];
            if (call) {
                let toolResult;
                let toolResponseText = "";

                if (call.name === 'vapt_create_scan_plan') {
                    toolResult = await mockCreateScanPlan(call.args);
                    toolResponseText = `Plan Created (ID: ${toolResult.plan_id}). Ready to execute?`;
                } else if (call.name === 'vapt_start_scan') {
                    toolResult = await mockStartScan(call.args);
                    setScanData(toolResult);
                    toolResponseText = `Scan started. ID: ${toolResult.scan_id}. Status: ${toolResult.status}. Estimated time: ${toolResult.estimated_time}.`;
                } else if (call.name === 'vapt_get_scan_status') {
                    toolResult = await mockGetScanStatus(call.args as any);
                    toolResponseText = `Scan Status for ${toolResult.scan_id}: ${toolResult.status} (${toolResult.progress}).`;
                } else if (call.name === 'vapt_get_findings') {
                    toolResult = await mockGetFindings(call.args as any);
                    if (toolResult.findings) setFindings(toolResult.findings);
                    toolResponseText = `Findings Retrieved: ${toolResult.summary.critical} Critical, ${toolResult.summary.high} High. See dashboard for details.`;
                } else if (call.name === 'vapt_stop_scan') {
                    toolResult = await mockStopScan(call.args as any);
                    toolResponseText = `Scan stopped.`;
                } else if (call.name === 'vapt_generate_report') {
                    toolResult = await mockGenerateReport(call.args as any);
                    addAuditLog('VAPT_REPORT_GENERATED', `Report generated for scan ${call.args.scan_id}`);
                    toolResponseText = `Report generated: ${toolResult.report_url}`;
                }

                // Send tool result back to model to get final natural language response
                const nextResult = await chat.sendMessage({
                    message: JSON.stringify({
                        role: 'function',
                        parts: [{
                            functionResponse: {
                                name: call.name,
                                response: { result: toolResult }
                            }
                        }]
                    })
                });
                
                setMessages(prev => [...prev, { role: 'model', text: nextResult.text || "Action completed." }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: result.text || "I'm not sure how to proceed." }]);
            }

        } catch (error: any) {
            console.error("VAPT Agent Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "System Error: Unable to complete VAPT operation." }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentInput.trim()) return;
        const text = agentInput;
        setAgentInput('');
        setMessages(prev => [...prev, { role: 'user', text }]);
        await runAgentTurn(text);
    };

    if (!permissions.has('vapt:manage')) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">You do not have permission to access the VAPT Orchestrator.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <header className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <BugAntIcon className="w-8 h-8 text-teal-500" />
                    VAPT Orchestrator
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Enterprise Vulnerability Assessment & Penetration Testing Automation</p>
            </header>

            {!isAuthorized && messages.length === 0 ? (
                <div className="flex-grow flex items-center justify-center">
                    <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-red-200 dark:border-red-900 p-8">
                        <div className="flex items-start gap-4 mb-6">
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 flex-shrink-0" />
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Authorization Required</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                    You are about to engage an automated security testing agent. 
                                    Unauthorized scanning of networks, applications, or systems is illegal and a violation of platform policy.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Scope (IPs, Domains, URLs)</label>
                                <input 
                                    type="text" 
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                    placeholder="e.g., 192.168.1.0/24, example.com"
                                    value={scanConfig.scope}
                                    onChange={(e) => setScanConfig({...scanConfig, scope: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scan Type</label>
                                    <select 
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        value={scanConfig.scanType}
                                        onChange={(e) => setScanConfig({...scanConfig, scanType: e.target.value})}
                                    >
                                        <option value="infra_va">Infrastructure VA</option>
                                        <option value="web_dast">Web App DAST</option>
                                        <option value="cloud_va">Cloud Config Review</option>
                                        <option value="container_va">Container Security</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Framework Mapping</label>
                                    <select 
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        value={scanConfig.framework}
                                        onChange={(e) => setScanConfig({...scanConfig, framework: e.target.value})}
                                    >
                                        <option value="none">None</option>
                                        <option value="owasp_top_10">OWASP Top 10 (Web)</option>
                                        <option value="mitre_attack">MITRE ATT&CK (Adversary)</option>
                                        <option value="sans_25">SANS Top 25</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Authenticated Scan?</label>
                                    <select 
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        value={scanConfig.authScan ? "yes" : "no"}
                                        onChange={(e) => setScanConfig({...scanConfig, authScan: e.target.value === "yes"})}
                                    >
                                        <option value="no">No (Unauthenticated)</option>
                                        <option value="yes">Yes (Use Credentials)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Testing Window Start</label>
                                    <input 
                                        type="datetime-local" 
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        value={scanConfig.windowStart}
                                        onChange={(e) => setScanConfig({...scanConfig, windowStart: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/50">
                            <input 
                                type="checkbox" 
                                id="authConfirm"
                                checked={isAuthorized}
                                onChange={handleAuthorization}
                                className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label htmlFor="authConfirm" className="text-sm font-medium text-red-800 dark:text-red-200">
                                I confirm I have written authorization from the asset owner to perform these tests.
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleStartSession}
                                disabled={!isAuthorized || !scanConfig.scope}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Create Scan Plan
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    {/* Left: Chat / Orchestrator */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Orchestrator Console</h3>
                            {scanData && <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">{scanData.status.toUpperCase()}</span>}
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-900 font-mono text-sm" ref={chatContainerRef}>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-white dark:bg-gray-800 ml-8 border border-gray-200 dark:border-gray-700' : 'bg-black text-green-400 mr-8'}`}>
                                    <span className="font-bold block mb-1 opacity-50 text-xs uppercase">{msg.role === 'user' ? 'Operator' : 'VAPT Agent'}</span>
                                    {msg.text}
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex items-center text-gray-500 animate-pulse">
                                    <span className="mr-2">Orchestrator is planning...</span>
                                    <div className="h-2 w-2 bg-gray-500 rounded-full mr-1 animate-bounce"></div>
                                    <div className="h-2 w-2 bg-gray-500 rounded-full mr-1 animate-bounce delay-100"></div>
                                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
                            <input 
                                type="text" 
                                value={agentInput}
                                onChange={(e) => setAgentInput(e.target.value)}
                                placeholder="Command the orchestrator..." 
                                className="flex-grow rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                            />
                            <button type="submit" disabled={isThinking} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50">Send</button>
                        </form>
                    </div>

                    {/* Right: Findings / Dashboard */}
                    <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto">
                        {/* Findings Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex-grow">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Live Findings</h3>
                                <button className="text-xs text-teal-600 hover:underline" onClick={() => setFindings([])}>Clear</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Severity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asset</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vulnerability</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CVE</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {findings.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No findings yet. Start a scan to populate results.
                                                </td>
                                            </tr>
                                        ) : (
                                            findings.map((finding) => (
                                                <tr key={finding.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${finding.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                                              finding.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                                            {finding.severity.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {finding.asset}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                        <div className="font-medium">{finding.title}</div>
                                                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs" title={finding.evidence.proof}>{finding.evidence.proof}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {finding.cve.join(', ')}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
