
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
import { UserProfilePage } from './components/UserProfilePage';
import { ChatWidget } from './components/ChatWidget';
import { LiveAssistantWidget } from './components/LiveAssistantWidget';
import { VoiceTourOrchestrator } from './components/VoiceTourOrchestrator';
import { DidEmbed } from './components/DidEmbed';
import { IntegrationsPage } from './components/IntegrationsPage';
import { VirtualDepartmentPage } from './components/VirtualDepartmentPage';
import { MissionControl } from './components/MissionControl';
import { SunIcon, MoonIcon, MicrophoneIcon, LogoutIcon, LogoIcon, MapIcon, SparklesIcon } from './components/Icons';
import { RoadmapModal } from './components/RoadmapModal';
import { virtualAgents } from './data/virtualAgents';

import { dbAPI } from './db';
import { eccData } from './data/controls';
import { iso27001AssessmentData } from './data/iso27001AssessmentData';
import { nistCsfAssessmentData } from './data/nistCsfAssessmentData';
import { isa62443AssessmentData } from './data/isa62443AssessmentData';

import type { 
  User, CompanyProfile, PolicyDocument, AuditLogEntry, 
  AssessmentItem, Risk, Task, AgentLogEntry, UserTrainingProgress, 
  View, Control, Subdomain, Domain, GeneratedContent, 
  PolicyTone, PolicyLength, Permission, License, ComplianceGap, ChatMessage, UserRole, AuditAction, VirtualAgent, SystemEvent
} from './types';
import { rolePermissions } from './types';

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
  const [isNeuralEnabled, setIsNeuralEnabled] = useState(false); 
  
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.theme === 'light' ? 'light' : 'dark');
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [activeVoiceAgent, setActiveVoiceAgent] = useState<VirtualAgent | null>(null); 
  const [isVoiceTourOpen, setIsVoiceTourOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<{id: number, message: string, type: 'success' | 'info' | 'error'}[]>([]);

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

  useEffect(() => {
    const init = async () => {
      try {
        let user = await dbAPI.loginUser(''); 
        if (!user && currentUser?.id === 'demo-user') user = DEMO_USER;

        if (user) {
          setCurrentUser(user);
          if (user.companyId) {
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
  }, []);

  const handleLogEvent = useCallback(async (event: SystemEvent) => {
      if (!companyProfile?.id) return;
      setEventHistory(prev => [event, ...prev]);
      await dbAPI.logEvent(companyProfile.id, event);
  }, [companyProfile]);

  /**
   * SENTIENT SUPREME CORE AUDIT LOGIC
   * Translated from requested Python/FastAPI backend snippet.
   */
  const handleRunAnalysis = useCallback((): ComplianceGap[] => {
      const findings: ComplianceGap[] = [];
      
      // report meta data
      const auditReport = {
          controls_tested: eccAssessment.length,
          evidence_checked: documents.filter(d => d.uploadedFile).length,
          findings: [] as any[],
          status: "PASS"
      };

      // Logic: Iterate through registry and check for evidence presence
      eccAssessment.forEach(item => {
          // In the Python snippet: if not task.get("evidence"): FAIL
          // We check both the assessment evidence and the document vault
          const hasEvidenceInAssessment = !!item.evidence;
          const hasEvidenceInVault = documents.some(d => d.controlId === item.controlCode);

          if (!hasEvidenceInAssessment && !hasEvidenceInVault) {
              findings.push({ 
                  controlCode: item.controlCode, 
                  controlName: item.controlName, 
                  framework: 'NCA ECC', 
                  assessedStatus: 'FAIL: Missing evidence' 
              });
              
              auditReport.findings.push({
                  control: item.controlCode,
                  issue: "Missing evidence"
              });
              auditReport.status = "FAIL";
          }
      });

      // Emitting EVENT_AUDIT_COMPLETED as per backend specification
      handleLogEvent({
          event_id: `EV-AUDIT-${Date.now()}`,
          event_type: 'EVENT_AUDIT_COMPLETED',
          actor_id: 'sentient-supreme',
          actor_name: 'Sentient Supreme Orchestrator',
          entity_type: 'audit',
          entity_id: 'global-run',
          event_payload: auditReport,
          created_at: Date.now()
      });

      return findings;
  }, [eccAssessment, documents, handleLogEvent]);

  const handleGenerateDocuments = async (gaps: ComplianceGap[]) => {
      addNotification(`Sentient Supreme initiating autonomous policy synthesis...`, 'info');
      
      handleLogEvent({
          event_id: `EV-POLICY-${Date.now()}`,
          event_type: 'EVENT_POLICY_CREATED',
          actor_id: 'sentient-supreme',
          actor_name: 'Sentient Supreme',
          entity_type: 'workflow',
          entity_id: 'batch-synthesis',
          event_payload: { count: gaps.length },
          created_at: Date.now()
      });

      addNotification(`Batch of ${gaps.length} artifacts added to Archive.`, 'success');
  };

  const handleAddDirectDocument = async (doc: PolicyDocument) => {
    if (!companyProfile?.id) return;
    setDocuments(prev => [doc, ...prev]);
    await dbAPI.saveDocument(companyProfile.id, doc);
    addNotification(`Artifact [${doc.controlId}] synchronized.`, 'success');
  };

  const handleUpdateRisk = async (updatedRisk: Risk) => {
    if (!companyProfile?.id) return;
    setRisks(prev => {
        const exists = prev.find(r => r.id === updatedRisk.id);
        if (exists) return prev.map(r => r.id === updatedRisk.id ? updatedRisk : r);
        return [updatedRisk, ...prev];
    });
    await dbAPI.saveRisk(companyProfile.id, updatedRisk);
  };

  const handleLogout = async () => {
      await dbAPI.logoutUser();
      setCurrentUser(null);
      setCompanyProfile(null);
      setCurrentView('dashboard');
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
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isNeuralEnabled ? 'bg-white animate-ping' : 'bg-gray-400'}`}></div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">{isNeuralEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3">
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
                <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500">
                    <LogoutIcon className="w-5 h-5" />
                </button>
            </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-grow">
            {currentView === 'hub' && <MissionControl onNavigate={setCurrentView} onTalkToAgent={(agent) => { setActiveVoiceAgent(agent); setIsLiveAssistantOpen(true); }} />}
            {currentView === 'dashboard' && <DashboardPage repository={documents} currentUser={currentUser} allControls={allControls} domains={eccData} onSetView={setCurrentView} eccAssessment={eccAssessment} pdplAssessment={pdplAssessment} samaCsfAssessment={samaCsfAssessment} risks={risks} />}
            {currentView === 'complianceAgent' && <ComplianceAgentPage onRunAnalysis={handleRunAnalysis} onGenerateDocuments={handleGenerateDocuments} agentLog={agentLog} permissions={currentPermissions} assessments={{ecc: eccAssessment, pdpl: pdplAssessment, sama: samaCsfAssessment, cma: cmaAssessment}} />}
            {currentView === 'documents' && <DocumentsPage repository={documents} currentUser={currentUser} onApprovalAction={() => {}} onAddDocument={() => {}} permissions={currentPermissions} company={companyProfile!} />}
            {currentView === 'assessment' && <AssessmentPage assessmentData={eccAssessment} onUpdateItem={() => {}} status={assessmentStatuses.ecc} onInitiate={() => {}} onComplete={() => {}} permissions={currentPermissions} onSetView={setCurrentView} onGenerateReport={() => {}} />}
            {currentView === 'pdplAssessment' && <PDPLAssessmentPage assessmentData={pdplAssessment} onUpdateItem={() => {}} status={assessmentStatuses.pdpl} onInitiate={() => {}} onComplete={() => {}} permissions={currentPermissions} onGenerateReport={() => {}} />}
            {currentView === 'riskAssessment' && <RiskAssessmentPage risks={risks} setRisks={setRisks} status="in-progress" onInitiate={() => {}} onComplete={() => {}} permissions={currentPermissions} onAddDocument={handleAddDirectDocument} />}
            {currentView === 'userManagement' && <UserManagementPage users={users} setUsers={setUsers} currentUser={currentUser} addNotification={addNotification} addAuditLog={() => {}} onUserCreate={async (u) => dbAPI.createUser(u, currentUser.companyId)} onUserUpdate={async (u) => dbAPI.updateUser(u)} onUserDelete={async (id) => dbAPI.deleteUser(id)} />}
            {currentView === 'companyProfile' && <CompanyProfilePage company={companyProfile} onSave={async (p) => { await dbAPI.updateCompanyProfile(p); setCompanyProfile(p); }} canEdit={true} addNotification={addNotification} currentUser={currentUser} onSetupCompany={() => {}} />}
            {currentView === 'virtualDepartment' && <VirtualDepartmentPage onDelegateTask={() => {}} onConsultAgent={(a) => { setActiveVoiceAgent(a); setIsLiveAssistantOpen(true); }} risks={risks} documents={documents} eccAssessment={eccAssessment} pdplAssessment={pdplAssessment} samaAssessment={samaCsfAssessment} cmaAssessment={cmaAssessment} onAddDocument={handleAddDirectDocument} onAddRisk={handleUpdateRisk} onLogEvent={handleLogEvent} eventHistory={eventHistory} />}
            {currentView === 'training' && <TrainingPage userProgress={trainingProgress} onUpdateProgress={() => {}} />}
            {currentView === 'help' && <HelpSupportPage onStartTour={() => setIsVoiceTourOpen(true)} />}
            {currentView === 'userProfile' && <UserProfilePage currentUser={currentUser} onChangePassword={async () => ({success: true, message: 'Updated'})} onEnableMfa={() => {}} onDisableMfa={async () => ({success: true, message: 'Disabled'})} />}
        </div>
      </main>

      <LiveAssistantWidget isOpen={isLiveAssistantOpen} isNeuralEnabled={isNeuralEnabled} onToggle={() => setIsLiveAssistantOpen(!isLiveAssistantOpen)} onNavigate={setCurrentView} currentUser={currentUser} activeAgent={activeVoiceAgent} risks={risks} eccAssessment={eccAssessment} pdplAssessment={pdplAssessment} samaCsfAssessment={samaCsfAssessment} cmaAssessment={[]} auditLog={auditLog} documents={documents} onAddDocument={handleAddDirectDocument} />
      <RoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
      <VoiceTourOrchestrator isOpen={isVoiceTourOpen} onClose={() => setIsVoiceTourOpen(false)} onNavigate={setCurrentView} />
    </div>
  );
};

export default App;
