
export interface ControlVersion {
  version: string;
  date: string;
  changes: string[];
}

export interface Control {
  id: string;
  description: string;
  relevantTools?: string[];
  implementationGuidelines: string[];
  expectedDeliverables: string[];
  version: string;
  lastUpdated: string;
  history?: ControlVersion[];
}

export interface Subdomain {
  id: string;
  title: string;
  objective: string;
  controls: Control[];
}

export interface Domain {
  id: string;
  name: string;
  subdomains: Subdomain[];
}

export interface SearchResult {
  control: Control;
  subdomain: Subdomain;
  domain: Domain;
}

export interface GeneratedDocsState {
  [controlId: string]: number;
}

export type UserRole = 'Administrator' | 'CISO' | 'CTO' | 'CIO' | 'CEO' | 'Security Analyst' | 'Employee';

export type Permission = 
  | 'dashboard:read'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'documents:read'
  | 'documents:approve'
  | 'documents:generate'
  | 'templates:read'
  | 'templates:apply'
  | 'navigator:read'
  | 'company:read'
  | 'company:update'
  | 'audit:read'
  | 'assessment:read'
  | 'assessment:update'
  | 'pdplAssessment:read'
  | 'pdplAssessment:update'
  | 'samaCsfAssessment:read'
  | 'samaCsfAssessment:update'
  | 'cmaAssessment:read'
  | 'cmaAssessment:update'
  | 'riskAssessment:read'
  | 'riskAssessment:update'
  | 'complianceAgent:run'
  | 'integrations:manage'
  | 'vapt:manage'
  | 'virtualDept:manage'
  | 'userProfile:read'
  | 'userProfile:update'
  | 'help:read'
  | 'training:read';

export const rolePermissions: Record<UserRole, Permission[]> = {
  'Administrator': [
    'dashboard:read', 'users:read', 'users:create', 'users:update', 'users:delete',
    'documents:read', 'documents:approve', 'documents:generate', 'templates:read', 'templates:apply',
    'navigator:read', 'company:read', 'company:update', 'audit:read', 'assessment:read', 'assessment:update',
    'pdplAssessment:read', 'pdplAssessment:update', 'samaCsfAssessment:read', 'samaCsfAssessment:update',
    'cmaAssessment:read', 'cmaAssessment:update', 'riskAssessment:read', 'riskAssessment:update',
    'complianceAgent:run', 'integrations:manage', 'vapt:manage', 'virtualDept:manage', 'userProfile:read',
    'userProfile:update', 'help:read', 'training:read'
  ],
  'CISO': [
    'dashboard:read', 'documents:read', 'documents:approve', 'navigator:read', 'company:read', 'audit:read',
    'assessment:read', 'pdplAssessment:read', 'samaCsfAssessment:read', 'cmaAssessment:read',
    'riskAssessment:read', 'riskAssessment:update', 'complianceAgent:run', 'virtualDept:manage',
    'userProfile:read', 'userProfile:update', 'help:read', 'training:read'
  ],
  'CTO': [
    'dashboard:read', 'documents:read', 'documents:approve', 'navigator:read', 'vapt:manage',
    'assessment:read', 'riskAssessment:read', 'virtualDept:manage',
    'userProfile:read', 'userProfile:update', 'help:read', 'training:read'
  ],
  'CIO': [
    'dashboard:read', 'documents:read', 'documents:approve', 'navigator:read', 'company:read',
    'assessment:read', 'riskAssessment:read', 'virtualDept:manage',
    'userProfile:read', 'userProfile:update', 'help:read', 'training:read'
  ],
  'CEO': [
    'dashboard:read', 'documents:read', 'documents:approve', 'navigator:read', 'company:read',
    'assessment:read', 'riskAssessment:read', 'virtualDept:manage',
    'userProfile:read', 'userProfile:update', 'help:read', 'training:read'
  ],
  'Security Analyst': [
    'dashboard:read', 'documents:read', 'documents:generate', 'navigator:read', 'audit:read',
    'assessment:read', 'assessment:update', 'pdplAssessment:read', 'pdplAssessment:update',
    'samaCsfAssessment:read', 'samaCsfAssessment:update', 'cmaAssessment:read', 'cmaAssessment:update',
    'riskAssessment:read', 'riskAssessment:update', 'complianceAgent:run', 'vapt:manage',
    'userProfile:read', 'userProfile:update', 'help:read', 'training:read'
  ],
  'Employee': [
    'dashboard:read', 'userProfile:read', 'userProfile:update', 'help:read', 'training:read'
  ]
};

export interface InteractionLog {
  timestamp: number;
  type: 'voice' | 'face' | 'gesture' | 'text';
  summary: string;
  commands?: string[];
  language?: 'English' | 'Urdu' | 'Arabic';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  accessExpiresAt?: number;
  password?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  companyId: string;
  faceEncoding?: string;
  voiceSample?: string;
  preferences?: string[];
  interactionHistory?: InteractionLog[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  logo: string;
  ceoName: string;
  cioName: string;
  cisoName: string;
  ctoName: string;
  cybersecurityOfficerName?: string;
  dpoName?: string;
  complianceOfficerName?: string;
  license?: License;
}

export interface License {
  key: string;
  status: 'active' | 'inactive' | 'expired';
  tier: 'monthly' | 'quarterly' | 'semi-annually' | 'yearly' | 'trial';
  expiresAt: number;
}

export interface GeneratedContent {
  policy: string;
  procedure: string;
  guideline: string;
}

export type DocumentStatus = 
  | 'Approved' 
  | 'Rejected' 
  | 'Pending CISO Approval' 
  | 'Pending CTO Approval' 
  | 'Pending CIO Approval' 
  | 'Pending CEO Approval';

export interface ApprovalStep {
  role: UserRole;
  decision: 'Approved' | 'Rejected';
  timestamp: number;
  comments?: string;
}

export interface AgentSignature {
  agentRole: string;
  decision: 'Approved' | 'Needs Revision';
  timestamp: number;
  signatureHash: string;
  comments?: string;
}

export interface DocumentVersion {
  version: string;
  updatedAt: number;
  updatedBy: string;
  changes: string;
}

export interface PolicyDocument {
  id: string;
  controlId: string;
  domainName: string;
  subdomainTitle: string;
  controlDescription: string;
  status: DocumentStatus;
  content: GeneratedContent;
  approvalHistory: ApprovalStep[];
  agentSignatures?: AgentSignature[];
  createdAt: number;
  updatedAt: number;
  generatedBy: 'user' | 'AI Agent';
  versionHistory: DocumentVersion[];
  uploadedFile?: {
    name: string;
    dataUrl: string;
    type: string;
  };
}

export type AuditAction = 
  | 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'
  | 'DOCUMENT_CREATED' | 'DOCUMENT_UPDATED' | 'DOCUMENT_GENERATED' | 'DOCUMENT_APPROVED' | 'DOCUMENT_REJECTED'
  | 'ASSESSMENT_STARTED' | 'ASSESSMENT_UPDATED' | 'ASSESSMENT_COMPLETED'
  | 'RISK_CREATED' | 'RISK_UPDATED' | 'RISK_DELETED'
  | 'INTEGRATION_SYNC' | 'VAPT_SCAN_STARTED' | 'VAPT_REPORT_GENERATED'
  | 'AGENTIC_AUDIT_COMPLETED' | 'COMPANY_CREATED' | 'COMPANY_UPDATED';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: AuditAction;
  details: string;
  targetId?: string;
}

export type ControlStatus = 'Implemented' | 'Partially Implemented' | 'Not Implemented' | 'Not Applicable';

export interface AssessmentItem {
  domainCode: string;
  domainName: string;
  subDomainCode: string;
  subdomainName: string;
  controlCode: string;
  controlName: string;
  currentStatusDescription: string;
  controlStatus: ControlStatus;
  recommendation: string;
  managementResponse: string;
  targetDate: string;
  evidence?: {
    fileName: string;
    dataUrl: string;
  };
}

export type RiskTreatmentOption = 'Avoid' | 'Mitigate' | 'Transfer' | 'Accept';

export type ControlEffectiveness = 'Effective' | 'Needs Improvement' | 'Ineffective';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  owner: string;
  inherentLikelihood: number;
  inherentImpact: number;
  inherentScore: number;
  existingControl: string;
  controlEffectiveness: ControlEffectiveness;
  residualLikelihood: number;
  residualImpact: number;
  residualScore: number;
  likelihood?: number; 
  impact?: number; 
  treatmentOption: RiskTreatmentOption;
  mitigation: string;
  responsibility: string;
  dueDate: string;
  acceptanceCriteria: string;
  approvedBy: string;
  remarks: string;
  progress: number;
  lastAssessedAt?: number;
  interactionTimeline?: string[];
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  controlId?: string;
  ownerId?: string;
  dueDate?: number;
  createdAt: number;
}

export interface AgentLogEntry {
  id: string;
  timestamp: number;
  status: 'info' | 'working' | 'success' | 'error';
  message: string;
}

export interface UserTrainingProgress {
  [courseId: string]: {
    completedLessons: string[];
    quizScores: { [lessonId: string]: number };
    badgeEarned: boolean;
  };
}

export type View = 
  | 'hub' | 'dashboard' | 'navigator' | 'documents' | 'assessment' | 'pdplAssessment' 
  | 'samaCsfAssessment' | 'cmaAssessment' | 'iso27001Assessment' 
  | 'nistCsfAssessment' | 'isa62443Assessment' | 'virtualDepartment' 
  | 'riskAssessment' | 'userManagement' | 'companyProfile' | 'auditLog' 
  | 'training' | 'help' | 'userProfile' | 'sarahAgent' | 'companySetup' 
  | 'integrations' | 'vapt' | 'complianceAgent' | 'superAdmin';

export type PolicyTone = 'Standard' | 'Formal' | 'Strict';

export type PolicyLength = 'Standard' | 'Concise' | 'Comprehensive';

export interface ComplianceGap {
  controlCode: string;
  controlName: string;
  framework: string;
  assessedStatus: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VirtualAgent {
  id: string;
  name: string;
  role: string;
  title: string;
  description: string;
  fullBio: string;
  responsibilities: string[];
  jobAttributes: string[];
  reportingLine: string;
  voiceName: string;
  avatarUrl: string;
  capabilities: string[];
  status: 'Idle' | 'Active' | 'Analyzing';
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
}

export type SystemEventType = 
  | 'EVENT_POLICY_CREATED' | 'EVENT_POLICY_APPROVED' | 'EVENT_RISK_UPDATED' 
  | 'EVENT_CONTROL_IMPLEMENTED' | 'EVENT_AUDIT_STARTED' | 'EVENT_AUDIT_COMPLETED'
  | 'EVENT_TASK_ASSIGNED' | 'EVENT_BOARDROOM_CONVENED';

export interface SystemEvent {
  event_id: string;
  event_type: SystemEventType;
  actor_id: string;
  actor_name: string;
  entity_type: string;
  entity_id: string;
  event_payload: any;
  created_at: number;
}

export interface EvidenceValidation {
  isValid: boolean;
  confidence: number;
  reasoning: string;
  analyzedAt?: number;
}

export interface PrebuiltPolicyTemplate {
  id: string;
  title: string;
  description: string;
  content: GeneratedContent;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  standard: string;
  badgeId: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  quiz?: InteractiveQuiz;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface InteractiveQuiz {
  title: string;
  questions: QuizQuestion[];
}

export interface StoryChoice {
  text: string;
  nextSceneId: string;
  feedback?: string;
  isCorrect?: boolean;
}

export interface StoryScene {
  id: string;
  title: string;
  narrative: string;
  imageUrl?: string;
  choices: StoryChoice[];
}

export interface StoryScenario {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  initialSceneId: string;
  scenes: StoryScene[];
}

export interface VaptFinding {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  asset: string;
  title: string;
  cve: string[];
  cwe: string[];
  cvss: number;
  evidence: {
    scanner_plugin: string;
    observed: string;
    proof: string;
  };
  impact: string;
  recommendation: string;
  references: string[];
}

export interface SharedMemoryState {
  organization: any;
  activeFrameworks: string[];
  documents: PolicyDocument[];
  assessments: {
    ecc: AssessmentItem[];
    pdpl: AssessmentItem[];
    sama: AssessmentItem[];
    cma: AssessmentItem[];
  };
  risks: Risk[];
  tasks: Task[];
  eventHistory: SystemEvent[];
}

export interface LiveAssistantProps {
    isOpen: boolean;
    isNeuralEnabled: boolean; // Control background link
    onToggle: () => void;
    onNavigate: (view: View) => void;
    hidden?: boolean;
    currentUser: User | null;
    activeAgent: VirtualAgent | null;
    risks: Risk[];
    eccAssessment: AssessmentItem[];
    pdplAssessment: AssessmentItem[];
    samaCsfAssessment: AssessmentItem[];
    cmaAssessment: AssessmentItem[];
    auditLog: AuditLogEntry[];
    documents: PolicyDocument[];
    onAddDocument: (doc: PolicyDocument) => void;
}

export type EnhancedLiveAssistantProps = LiveAssistantProps;
