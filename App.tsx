
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ref, onValue } from "firebase/database";
import { rtdb } from './firebase';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './components/Dashboard';
import { DocumentsPage } from './components/DocumentsPage';
import { ContentView } from './components/ContentView';
import { CompanyProfilePage } from './components/CompanyProfilePage';
import { AuditLogPage } from './components/AuditLogPage';
import { UserManagementPage } from './components/UserManagementPage';
import { LoginPage } from './components/LoginPage';
import { CompanySetupPage } from './components/CompanySetupPage';
import { AssessmentPage } from './components/AssessmentPage'; 
import { PDPLAssessmentPage } from './components/PDPLAssessmentPage';
import { SamaCsfAssessmentPage } from './components/SamaCsfAssessmentPage';
import { CMAAssessmentPage } from './components/CMAAssessmentPage';
import { GenericAssessmentPage } from './components/GenericAssessmentPage';
import { FrameworkAssessmentPage } from './components/FrameworkAssessmentPage'; 
import { RiskAssessmentPage } from './components/RiskAssessmentPage';
import { TrainingPage } from './components/TrainingPage';
import { HelpSupportPage } from './components/HelpSupportPage';
import { ComplianceAgentPage } from './components/ComplianceAgentPage';
import { SuperAdminPage } from './components/SuperAdminPage';
import { UserProfilePage } from './components/UserProfilePage';
import { MfaSetupPage } from './components/MfaSetupPage';
import { MfaVerifyPage } from './components/MfaVerifyPage';
import { ChatWidget } from './components/ChatWidget';
import { LiveAssistantWidget } from './components/LiveAssistantWidget';
import { RiskAssistant } from './components/RiskAssistant';
import { TourGuide } from './components/TourGuide';
import { VoiceTourOrchestrator } from './components/VoiceTourOrchestrator';
import { DidEmbed } from './components/DidEmbed';
import { IntegrationsPage } from './components/IntegrationsPage';
import { VaptOrchestratorPage } from './components/VaptOrchestratorPage';
import { VirtualDepartmentPage } from './components/VirtualDepartmentPage';
import { TaskManagementPage } from './components/TaskManagementPage'; 
import { MissionControl } from './components/MissionControl';
import { SunIcon, MoonIcon, MicrophoneIcon, QuestionMarkCircleIcon, LogoutIcon, BellIcon, CheckCircleIcon, LogoIcon, MapIcon, SparklesIcon } from './components/Icons';
import { RoadmapModal } from './components/RoadmapModal';
import { virtualAgents } from './data/virtualAgents';

import { dbAPI } from './db';
import { eccData } from './data/controls';
import { iso27001AssessmentData } from './data/iso27001AssessmentData';
import { nistCsfAssessmentData } from './data/nistCsfAssessmentData';
import { isa62443AssessmentData } from './data/isa62443AssessmentData';

import { trainingCourses } from './data/trainingData';
import type { 
  User, CompanyProfile, PolicyDocument, AuditLogEntry, 
  AssessmentItem, Risk, Task, AgentLogEntry, UserTrainingProgress, 
  View, Control, Subdomain, Domain, GeneratedContent, 
  PolicyTone, PolicyLength, DocumentVersion, Permission, License, ComplianceGap, ChatMessage, UserRole, AuditAction, VirtualAgent, SystemAlert, SystemEvent
} from './types';
import { rolePermissions } from './types';

// Constants
const DEMO_USER: User = {
  id: 'demo-user',
  name: 'Demo Administrator',
  email: 'admin@demo.com',
  role: 'Administrator',
  isVerified: true,
  companyId: 'demo-company'
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(DEMO_USER);
  const [currentView, setCurrentView] = useState<View>('hub');
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [eventHistory, setEventHistory] = useState<SystemEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<UserTrainingProgress>({});
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isNeuralEnabled, setIsNeuralEnabled] = useState(false); // Global Neural Toggle
  
  const [eccAssessment, setEccAssessment] = useState<AssessmentItem[]>([]);
  const [pdplAssessment, setPdplAssessment] = useState<AssessmentItem[]>([]);
  const [samaCsfAssessment, setSamaCsfAssessment] = useState<AssessmentItem[]>([]);
  const [cmaAssessment, setCmaAssessment] = useState<AssessmentItem[]>([]);
  const [iso27001Assessment, setIso27001Assessment] = useState<AssessmentItem[]>([]);
  const [nistCsfAssessment, setNistCsfAssessment] = useState<AssessmentItem[]>([]);
  const [isa62443Assessment, setIsa62443Assessment] = useState<AssessmentItem[]>([]);

  const [assessmentStatuses, setAssessmentStatuses] = useState<Record<string, 'idle' | 'in-progress' | 'completed' | 'implementation'>>({
      ecc: 'idle', pdpl: 'idle', sama: 'idle', cma: 'idle',
      iso27001: 'idle', nistCsf: 'idle', isa62443: 'idle'
  });

  const [selectedDomain, setSelectedDomain] = useState<Domain>(eccData[0]);
  const [activeControlId, setActiveControlId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.theme === 'light' ? 'light' : 'dark');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isRiskAssistantOpen, setIsRiskAssistantOpen] = useState(false);
  const [activeVoiceAgent, setActiveVoiceAgent] = useState<VirtualAgent | null>(null); 
  const [showTour, setShowTour] = useState(false);
  const [isVoiceTourOpen, setIsVoiceTourOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<{id: number, message: string, type: 'success' | 'info' | 'error'}[]>([]);

  // Connectivity Monitor
  useEffect(() => {
    const connectedRef = ref(rtdb, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      setIsFirebaseConnected(!!snap.val());
    });
    return () => unsubscribe();
  }, []);

  const allControls = useMemo(() => {
      return eccData.flatMap(d => d.subdomains.flatMap(s => s.controls.map(c => ({ control: c, subdomain: s, domain: d }))));
  }, []);

  const addNotification = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const checkAndSync = useCallback(async (companyId: string) => {
      const localVault = localStorage.getItem('metaworks_secure_vault');
      if (localVault && companyId !== 'demo-company') {
          try {
              const vaultData = JSON.parse(localVault);
              const hasData = (vaultData.documents?.length > 0) || (vaultData.risks?.length > 0) || (vaultData.events?.length > 0);
              
              if (hasData && window.confirm("Detected offline artifacts in your local vault. Sync to cloud?")) {
                  addNotification("Neural Sync in progress...", "info");
                  const count = await dbAPI.syncLocalVaultToCloud(companyId);
                  addNotification(`Cloud Sync Complete: ${count} artifacts migrated.`, "success");
              }
          } catch (e) {
              console.error("Sync error:", e);
          }
      }
  }, [addNotification]);

  useEffect(() => {
    const init = async () => {
      try {
        let user = await dbAPI.loginUser(''); 
        if (!user && currentUser?.id === 'demo-user') {
            user = DEMO_USER;
        }

        if (user) {
          setCurrentUser(user);
          if (user.companyId) {
            if (user.companyId !== 'demo-company') {
                await checkAndSync(user.companyId);
            }

            const data = await dbAPI.getCompanyData(user.companyId);
            if (data) {
                setCompanyProfile(data.companyProfile);
                setUsers(data.users);
                setDocuments(data.documents);
                setAuditLog(data.auditLog);
                setTasks(data.tasks);
                setAgentLog(data.agentLog);
                setEccAssessment(data.eccAssessment);
                setPdplAssessment(data.pdplAssessment);
                setSamaCsfAssessment(data.samaCsfAssessment);
                setCmaAssessment(data.cmaAssessment);
                setIso27001Assessment(data.iso27001Assessment);
                setNistCsfAssessment(data.nistCsfAssessment);
                setIsa62443Assessment(data.isa62443Assessment);
                if(data.assessmentStatuses) setAssessmentStatuses(data.assessmentStatuses);
                setRisks(data.riskAssessmentData);
                setTrainingProgress(data.trainingProgress);
                if(data.events) setEventHistory(data.events);
            }
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [checkAndSync]); 

  const handleUpdateAssessmentItem = async (type: string, controlCode: string, updatedItem: AssessmentItem) => {
        const updateState = (setter: React.Dispatch<React.SetStateAction<AssessmentItem[]>>, items: AssessmentItem[]) => {
             const newItems = items.map(item => item.controlCode === controlCode ? updatedItem : item);
             setter(newItems);
             dbAPI.saveAssessmentItems(companyProfile!.id, type, newItems);
             return newItems;
        };

        if (type === 'ecc') updateState(setEccAssessment, eccAssessment);
        if (type === 'pdpl') updateState(setPdplAssessment, pdplAssessment);
        if (type === 'sama') updateState(setSamaCsfAssessment, samaCsfAssessment);
        if (type === 'cma') updateState(setCmaAssessment, cmaAssessment);
        if (type === 'iso27001') updateState(setIso27001Assessment, iso27001Assessment);
        if (type === 'nistCsf') updateState(setNistCsfAssessment, nistCsfAssessment);
        if (type === 'isa62443') updateState(setIsa62443Assessment, isa62443Assessment);

        handleLogEvent({
            event_id: `EV-${Date.now()}`,
            event_type: 'EVENT_CONTROL_IMPLEMENTED',
            actor_id: currentUser!.id,
            actor_name: currentUser!.name,
            entity_type: 'control',
            entity_id: controlCode,
            event_payload: { status: updatedItem.controlStatus },
            created_at: Date.now()
        });
  };

  const handleLogEvent = useCallback(async (event: SystemEvent) => {
      if (!companyProfile?.id) return;
      setEventHistory(prev => [event, ...prev]);
      await dbAPI.logEvent(companyProfile.id, event);
  }, [companyProfile]);

  const handleAddDocument = async (control: Control, subdomain: Subdomain, domain: Domain, content: GeneratedContent, generatedBy: 'user' | 'AI Agent' = 'user', uploadedFile?: any) => {
    if (!companyProfile?.id) return;
    const newDoc: PolicyDocument = {
      id: `doc-${Date.now()}`,
      controlId: control.id,
      domainName: domain.name,
      subdomainTitle: subdomain.title,
      controlDescription: control.description,
      status: 'Pending CISO Approval',
      content: content,
      approvalHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      generatedBy: generatedBy,
      versionHistory: [],
      uploadedFile: uploadedFile
    };
    setDocuments(prev => {
        const filtered = prev.filter(d => d.controlId !== control.id);
        return [newDoc, ...filtered];
    });
    await dbAPI.saveDocument(companyProfile.id, newDoc);
    addNotification('Artifact synchronized.', 'success');
    addAuditLog('DOCUMENT_CREATED', `Created document for ${control.id}`, newDoc.id);

    handleLogEvent({
        event_id: `EV-${Date.now()}`,
        event_type: 'EVENT_POLICY_CREATED',
        actor_id: currentUser!.id,
        actor_name: currentUser!.name,
        entity_type: 'document',
        entity_id: newDoc.id,
        event_payload: { controlId: control.id },
        created_at: Date.now()
    });
  };

  const handleUpdateRisk = async (updatedRisk: Risk) => {
    if (!companyProfile?.id) return;
    setRisks(prev => {
        const exists = prev.find(r => r.id === updatedRisk.id);
        if (exists) return prev.map(r => r.id === updatedRisk.id ? updatedRisk : r);
        return [updatedRisk, ...prev];
    });
    await dbAPI.saveRisk(companyProfile.id, updatedRisk);
    
    handleLogEvent({
        event_id: `EV-${Date.now()}`,
        event_type: 'EVENT_RISK_UPDATED',
        actor_id: currentUser!.id,
        actor_name: currentUser!.name,
        entity_type: 'risk',
        entity_id: updatedRisk.id,
        event_payload: { score: updatedRisk.residualScore },
        created_at: Date.now()
    });
  };

  const handleGeneratePolicyWithAI = async (control: Control, subdomain: Subdomain, domain: Domain, tone: PolicyTone, length: PolicyLength) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Generate a security artifact for control: ${control.id} - ${control.description}. JSON format with policy, procedure, guideline sections.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        policy: { type: Type.STRING },
                        procedure: { type: Type.STRING },
                        guideline: { type: Type.STRING }
                    },
                    required: ['policy', 'procedure', 'guideline']
                }
            }
        });

        const generatedContent = JSON.parse(response.text || '{}') as GeneratedContent;
        await handleAddDocument(control, subdomain, domain, generatedContent, 'AI Agent');
    } catch (error) {
        console.error("AI Generation Error:", error);
        addNotification("Failed to generate with AI.", "error");
    }
  };

  const handleBatchGenerate = async (domain: Domain) => {
    addNotification(`Synthesizing for ${domain.name}...`, 'info');
    let generatedCount = 0;
    for (const subdomain of domain.subdomains) {
        for (const control of subdomain.controls) {
            const exists = documents.some(doc => doc.controlId === control.id);
            if (!exists) {
                await handleGeneratePolicyWithAI(control, subdomain, domain, 'Standard', 'Standard');
                generatedCount++;
            }
        }
    }
    addNotification(`Synthesized ${generatedCount} missing policies.`, 'success');
  };

  const handleAddDirectDocument = async (doc: PolicyDocument) => {
    if (!companyProfile?.id) return;
    setDocuments(prev => [doc, ...prev]);
    await dbAPI.saveDocument(companyProfile.id, doc);
    addNotification(`AI document [${doc.controlId}] saved.`, 'success');
    addAuditLog('DOCUMENT_GENERATED', `AI synthesized document for ${doc.controlId}`, doc.id);
    
    handleLogEvent({
        event_id: `EV-${Date.now()}`,
        event_type: 'EVENT_POLICY_CREATED',
        actor_id: 'agentic-brain',
        actor_name: 'AI Agent',
        entity_type: 'document',
        entity_id: doc.id,
        event_payload: { controlId: doc.controlId },
        created_at: Date.now()
    });
  };

  const handleBatchImport = async (importedDocs: PolicyDocument[]) => {
    if (!companyProfile?.id) return;
    const validDocs = importedDocs.map(doc => ({
        ...doc,
        id: doc.id.startsWith('imported-') ? doc.id : `imported-${doc.id}-${Date.now()}`
    }));
    setDocuments(prev => [...validDocs, ...prev]);
    for (const doc of validDocs) {
        await dbAPI.saveDocument(companyProfile.id, doc);
    }
    addNotification(`Imported ${validDocs.length} documents.`, 'success');
  };

  const handleAssessmentStatusChange = async (framework: string, status: 'in-progress' | 'completed' | 'idle' | 'implementation') => {
      const newStatuses = { ...assessmentStatuses, [framework]: status };
      setAssessmentStatuses(newStatuses);
      if(companyProfile) {
          await dbAPI.updateAssessmentStatus(companyProfile.id, newStatuses);
          handleLogEvent({
              event_id: `EV-${Date.now()}`,
              event_type: status === 'completed' ? 'EVENT_AUDIT_COMPLETED' : 'EVENT_AUDIT_STARTED',
              actor_id: currentUser!.id,
              actor_name: currentUser!.name,
              entity_type: 'assessment',
              entity_id: framework,
              event_payload: { status },
              created_at: Date.now()
          });
      }
  };

  const addAuditLog = async (action: AuditAction, details: string, targetId?: string) => {
    if (!companyProfile?.id || !currentUser) return;
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details,
      targetId
    };
    setAuditLog(prev => [entry, ...prev]);
    await dbAPI.addAuditLog(companyProfile.id, entry);
  };

  const handleLogout = async () => {
      await dbAPI.logoutUser();
      setCurrentUser(null);
      setCompanyProfile(null);
      setCurrentView('dashboard');
  };

  const handleInitialCompanySetup = async (profileData: any, adminData: any) => {
    try {
        const trialLicense: License = {
            key: `TRIAL-${Date.now()}`,
            status: 'active',
            tier: 'trial',
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
        };
        await dbAPI.createCompanySystem(profileData, adminData, trialLicense);
        addNotification("Company Account Created!", "success");
        setCurrentView('dashboard');
    } catch (error: any) {
        addNotification(`Error: ${error.message}`, "error");
    }
  };

  if (isLoading) return null;

  if (!currentUser) {
      return (
        <LoginPage 
            onLogin={async (e, p) => { 
                const res = await dbAPI.loginUser(e, p); 
                if (res) { setCurrentUser(res); return null; }
                return { error: 'Invalid Credentials' };
            }} 
            theme={theme} 
            toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} 
            onSetupCompany={() => setCurrentView('companySetup')} 
            onVerify={() => true} 
            onForgotPassword={async () => ({success: true, message: ''})} 
            onResetPassword={async () => ({success: true, message: ''})} 
        />
      );
  }

  const currentPermissions = new Set(rolePermissions[currentUser.role] || []);
  const headerButtonClass = "flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal-500/20 bg-teal-50/30 text-teal-700 hover:bg-teal-100/50 dark:bg-teal-900/10 dark:border-teal-800 dark:text-teal-400 transition-all duration-200";

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200`}>
      <Sidebar 
        domains={eccData} 
        selectedDomain={selectedDomain} 
        onSelectDomain={(d) => { setSelectedDomain(d); setCurrentView('navigator'); }}
        currentView={currentView}
        onSetView={setCurrentView}
        onTalkToAgent={(agent) => { setActiveVoiceAgent(agent); setIsLiveAssistantOpen(true); }}
        permissions={currentPermissions}
        trainingProgress={trainingProgress}
        companyId={currentUser.companyId}
        isFirebaseConnected={isFirebaseConnected}
      />
      
      <main className="flex-1 overflow-auto flex flex-col relative bg-white dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                 <LogoIcon className="h-6 w-6 text-teal-600" />
            </div>
            
            <div className="flex justify-center gap-2" id="header-center-nav">
                <button onClick={() => setCurrentView('hub')} className={`${headerButtonClass} ${currentView === 'hub' ? 'bg-teal-100/60 ring-1 ring-teal-500/30' : ''}`}>
                    <LogoIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[11px] font-medium uppercase tracking-wide">Mission Hub</span>
                </button>
                
                <button onClick={() => setIsRoadmapOpen(true)} className={headerButtonClass}>
                    <MapIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[11px] font-medium uppercase tracking-wide">Roadmap</span>
                </button>

                <div className="flex items-center bg-gray-100/50 dark:bg-gray-700/30 rounded-lg p-1 border border-gray-200/50 dark:border-gray-600/50">
                    <button
                        onClick={() => { setActiveVoiceAgent(null); setIsLiveAssistantOpen(!isLiveAssistantOpen); }}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${isLiveAssistantOpen ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700' : 'text-gray-500'}`}
                    >
                        <MicrophoneIcon className={`w-3.5 h-3.5 ${isLiveAssistantOpen ? 'animate-pulse' : ''}`} />
                        <span>Neural HUD</span>
                    </button>
                    
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-600 mx-1.5"></div>
                    
                    <button 
                        onClick={() => { setIsNeuralEnabled(!isNeuralEnabled); }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                            isNeuralEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                        title={isNeuralEnabled ? "Neural ACTIVE" : "Neural DORMANT"}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isNeuralEnabled ? 'bg-white animate-ping' : 'bg-gray-400'}`}></div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">{isNeuralEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                </div>

                <button onClick={() => setIsVoiceTourOpen(true)} className={`${headerButtonClass} border-teal-500/40`}>
                    <SparklesIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[11px] font-medium uppercase tracking-wide">Concierge</span>
                </button>
            </div>

            <div className="flex items-center justify-end gap-3">
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentView('userProfile')}>
                    <div className="text-right hidden sm:block">
                        <p className="text-[11px] font-medium text-gray-900 dark:text-gray-100 leading-none">{currentUser.name}</p>
                        <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-tight">{currentUser.role}</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        {currentUser.name.charAt(0)}
                    </div>
                </div>
                <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500">
                    <LogoutIcon className="w-5 h-5" />
                </button>
            </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-grow">
            {currentView === 'hub' && <MissionControl onNavigate={setCurrentView} onTalkToAgent={(agent) => { setActiveVoiceAgent(agent); setIsLiveAssistantOpen(true); }} />}
            {currentView === 'dashboard' && <DashboardPage repository={documents} currentUser={currentUser} allControls={allControls} domains={eccData} onSetView={setCurrentView} eccAssessment={eccAssessment} pdplAssessment={pdplAssessment} samaCsfAssessment={samaCsfAssessment} cmaAssessment={[]} tasks={tasks} setTasks={setTasks} risks={risks} />}
            {currentView === 'navigator' && <ContentView domains={eccData} activeControlId={activeControlId} setActiveControlId={setActiveControlId} onAddDocument={handleAddDocument} onGeneratePolicyWithAI={handleGeneratePolicyWithAI} onBatchGenerate={handleBatchGenerate} documentRepository={documents} permissions={currentPermissions} onSetView={setCurrentView} />}
            {currentView === 'documents' && <DocumentsPage repository={documents} currentUser={currentUser} onApprovalAction={(id, dec, com) => {}} onAddDocument={handleAddDocument} onBatchImport={handleBatchImport} permissions={currentPermissions} company={companyProfile!} />}
            {currentView === 'assessment' && <AssessmentPage assessmentData={eccAssessment} onUpdateItem={(c,i) => handleUpdateAssessmentItem('ecc',c,i)} status={assessmentStatuses.ecc} onInitiate={() => handleAssessmentStatusChange('ecc', 'in-progress')} onComplete={() => handleAssessmentStatusChange('ecc', 'completed')} permissions={currentPermissions} onSetView={setCurrentView} onGenerateReport={() => {}} />}
            {currentView === 'pdplAssessment' && <PDPLAssessmentPage assessmentData={pdplAssessment} onUpdateItem={(c,i) => handleUpdateAssessmentItem('pdpl',c,i)} status={assessmentStatuses.pdpl} onInitiate={() => handleAssessmentStatusChange('pdpl', 'in-progress')} onComplete={() => handleAssessmentStatusChange('pdpl', 'completed')} permissions={currentPermissions} onGenerateReport={() => {}} />}
            {currentView === 'samaCsfAssessment' && <SamaCsfAssessmentPage assessmentData={samaCsfAssessment} onUpdateItem={(c,i) => handleUpdateAssessmentItem('sama',c,i)} status={assessmentStatuses.sama} onInitiate={() => handleAssessmentStatusChange('sama', 'in-progress')} onComplete={() => handleAssessmentStatusChange('sama', 'completed')} permissions={currentPermissions} onGenerateReport={() => {}} />}
            {currentView === 'cmaAssessment' && <CMAAssessmentPage assessmentData={cmaAssessment} onUpdateItem={(c,i) => handleUpdateAssessmentItem('cma',c,i)} status={assessmentStatuses.cma} onInitiate={() => handleAssessmentStatusChange('cma', 'in-progress')} onComplete={() => handleAssessmentStatusChange('cma', 'completed')} permissions={currentPermissions} onGenerateReport={() => {}} />}
            {currentView === 'iso27001Assessment' && <GenericAssessmentPage title="ISO 27001" description="International Information Security Standard" assessmentData={iso27001Assessment} onUpdateItem={(c,i) => handleUpdateAssessmentItem('iso27001',c,i)} status={assessmentStatuses.iso27001} onInitiate={() => handleAssessmentStatusChange('iso27001', 'in-progress')} onComplete={() => handleAssessmentStatusChange('iso27001', 'completed')} permissions={currentPermissions} permissionName="assessment:update" onSetView={setCurrentView} />}
            {currentView === 'nistCsfAssessment' && <GenericAssessmentPage title="NIST CSF" description="National Framework" assessmentData={nistCsfAssessment} onUpdateItem={(c,i) => handleUpdateAssessmentItem('nistCsf',c,i)} status={assessmentStatuses.nistCsf} onInitiate={() => handleAssessmentStatusChange('nistCsf', 'in-progress')} onComplete={() => handleAssessmentStatusChange('nistCsf', 'completed')} permissions={currentPermissions} permissionName="assessment:update" onSetView={setCurrentView} />}
            {currentView === 'isa62443Assessment' && <GenericAssessmentPage title="ISA/IEC 62443" description="ICS Security Standard" assessmentData={isa62443Assessment} onUpdateItem={(c,i) => handleUpdateAssessmentItem('isa62443',c,i)} status={assessmentStatuses.isa62443} onInitiate={() => handleAssessmentStatusChange('isa62443', 'in-progress')} onComplete={() => handleAssessmentStatusChange('isa62443', 'completed')} permissions={currentPermissions} permissionName="assessment:update" onSetView={setCurrentView} />}
            {currentView === 'virtualDepartment' && <VirtualDepartmentPage onDelegateTask={() => {}} onConsultAgent={(a) => { setActiveVoiceAgent(a); setIsLiveAssistantOpen(true); }} risks={risks} documents={documents} eccAssessment={eccAssessment} pdplAssessment={pdplAssessment} samaAssessment={samaCsfAssessment} cmaAssessment={cmaAssessment} onAddDocument={handleAddDirectDocument} onAddRisk={handleUpdateRisk} onAddAuditLog={addAuditLog} onLogEvent={handleLogEvent} eventHistory={eventHistory} />}
            {currentView === 'riskAssessment' && <RiskAssessmentPage risks={risks} setRisks={setRisks} status="in-progress" onInitiate={() => {}} onComplete={() => {}} permissions={currentPermissions} onGenerateReport={() => {}} onAddDocument={handleAddDirectDocument} />}
            {currentView === 'userManagement' && <UserManagementPage users={users} setUsers={setUsers} currentUser={currentUser} addNotification={addNotification} addAuditLog={addAuditLog} onUserCreate={async (u) => dbAPI.createUser(u, currentUser.companyId)} onUserUpdate={async (u) => dbAPI.updateUser(u)} onUserDelete={async (id) => dbAPI.deleteUser(id)} />}
            {currentView === 'companyProfile' && <CompanyProfilePage company={companyProfile} onSave={async (p) => { await dbAPI.updateCompanyProfile(p); setCompanyProfile(p); }} canEdit={true} addNotification={addNotification} currentUser={currentUser} onSetupCompany={() => {}} />}
            {currentView === 'auditLog' && <AuditLogPage auditLog={auditLog} />}
            {currentView === 'training' && <TrainingPage userProgress={trainingProgress} onUpdateProgress={(c,l,s) => {}} />}
            {currentView === 'help' && <HelpSupportPage onStartTour={() => setIsVoiceTourOpen(true)} />}
            {currentView === 'userProfile' && <UserProfilePage currentUser={currentUser} onChangePassword={async () => ({success: true, message: 'Updated'})} onEnableMfa={() => {}} onDisableMfa={async () => ({success: true, message: 'Disabled'})} />}
            {currentView === 'sarahAgent' && <div className="h-full w-full flex flex-col items-center justify-center p-4"><div className="w-full max-w-4xl h-[600px] bg-black rounded-lg overflow-hidden shadow-2xl"><DidEmbed /></div></div>}
            {currentView === 'companySetup' && <CompanySetupPage onSetup={handleInitialCompanySetup} onCancel={() => setCurrentView('dashboard')} theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />}
            {currentView === 'integrations' && <IntegrationsPage onAddRisk={handleUpdateRisk} addNotification={addNotification} addAuditLog={addAuditLog} />}
        </div>
      </main>

      <ChatWidget isOpen={showChat} onToggle={() => setShowChat(!showChat)} messages={chatMessages} onSendMessage={(msg) => setChatMessages(p => [...p, {role: 'user', content: msg}])} isLoading={false} error={null} />
      <LiveAssistantWidget isOpen={isLiveAssistantOpen} isNeuralEnabled={isNeuralEnabled} onToggle={() => setIsLiveAssistantOpen(!isLiveAssistantOpen)} onNavigate={setCurrentView} currentUser={currentUser} activeAgent={activeVoiceAgent} risks={risks} eccAssessment={eccAssessment} pdplAssessment={pdplAssessment} samaCsfAssessment={samaCsfAssessment} cmaAssessment={[]} auditLog={auditLog} documents={documents} onAddDocument={handleAddDirectDocument} />
      <RoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
      <VoiceTourOrchestrator isOpen={isVoiceTourOpen} onClose={() => setIsVoiceTourOpen(false)} onNavigate={setCurrentView} />
      {notifications.map(n => (
          <div key={n.id} className={`fixed bottom-4 left-4 z-[500] px-4 py-2.5 rounded-lg shadow-lg border flex items-center gap-2.5 animate-slide-in ${n.type === 'success' ? 'bg-green-600 border-green-500 text-white' : n.type === 'error' ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-800 text-white'}`}>
            <span className="text-xs font-medium">{n.message}</span>
          </div>
      ))}
    </div>
  );
};

export default App;
