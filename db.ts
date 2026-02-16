
import { db, auth, firebaseConfig } from './firebase';
import { initializeApp, deleteApp, FirebaseApp } from 'firebase/app';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
    writeBatch,
    Firestore,
    orderBy,
    limit
} from 'firebase/firestore';
import { 
    onAuthStateChanged, 
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    getAuth,
    signOut
} from 'firebase/auth';
import type { 
    User, 
    CompanyProfile, 
    PolicyDocument, 
    AuditLogEntry, 
    AssessmentItem, 
    Risk, 
    Task, 
    AgentLogEntry, 
    UserTrainingProgress,
    License,
    SystemEvent,
    InteractionLog
} from './types';
import { assessmentData as initialEccData } from './data/assessmentData';
import { initialPdplAssessmentData } from './data/pdplAssessmentData';
import { samaCsfAssessmentData as initialSamaData } from './data/samaCsfAssessmentData';
import { cmaAssessmentData as initialCmaData } from './data/cmaAssessmentData';
import { initialRiskData } from './data/riskAssessmentData';
// Fix: Added missing imports for assessment framework initial data
import { iso27001AssessmentData as initialIsoData } from './data/iso27001AssessmentData';
import { nistCsfAssessmentData as initialNistData } from './data/nistCsfAssessmentData';
import { isa62443AssessmentData as initialIsaData } from './data/isa62443AssessmentData';

const DEMO_ID = 'demo-company';
const LOCAL_VAULT_KEY = 'metaworks_secure_vault';

/**
 * METAWORKS SECURE VAULT
 * Handles local persistence during neural link interruptions.
 */
const getLocalVault = () => {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_VAULT_KEY) || '{"documents": [], "auditLog": [], "tasks": [], "risks": [], "events": []}');
    } catch {
        return { documents: [], auditLog: [], tasks: [], risks: [], events: [] };
    }
};

const saveToLocalVault = (key: string, data: any) => {
    const vault = getLocalVault();
    if (key === 'documents') {
        const index = vault.documents.findIndex((d: any) => d.id === data.id);
        if (index > -1) vault.documents[index] = data;
        else vault.documents.unshift(data);
    } else if (key === 'events') {
        vault.events.unshift(data);
    } else if (key === 'risks') {
        const index = vault.risks.findIndex((r: any) => r.id === data.id);
        if (index > -1) vault.risks[index] = data;
        else vault.risks.unshift(data);
    } else {
        vault[key] = data;
    }
    localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(vault));
};

const getSubCollectionData = async <T>(path: string): Promise<T[]> => {
    if (path.startsWith('companies/demo-company')) return [];
    try {
        const snapshot = await getDocs(collection(db, path));
        return snapshot.docs.map(doc => doc.data() as T);
    } catch (error: any) {
        return [];
    }
};

const cleanObject = (obj: any) => {
    if (obj === undefined || obj === null) return null;
    return JSON.parse(JSON.stringify(obj));
};

let authInitPromise: Promise<FirebaseUser | null> | null = null;

const ensureAuth = async () => {
    if (auth.currentUser) return auth.currentUser;
    if (!authInitPromise) {
        authInitPromise = new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe();
                resolve(user || null);
            });
        });
    }
    const user = await authInitPromise;
    return user || ({ uid: 'demo-user' } as FirebaseUser);
};

export const dbAPI = {
    // --- AUTHENTICATION ---
    async loginUser(email: string, password?: string): Promise<User | null> {
        if (email === 'admin@demo.com') return null;
        let uid: string | undefined;
        if (password) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                uid = userCredential.user.uid;
            } catch (authError: any) {
                return null;
            }
        } else {
            const currentUser = auth.currentUser;
            if (currentUser && (!email || currentUser.email === email)) uid = currentUser.uid;
        }
        return uid ? await this.getUser(uid) : null;
    },

    async logoutUser(): Promise<void> {
        await signOut(auth);
    },

    async getUser(uid: string): Promise<User | null> {
        if (uid === 'demo-user') return null;
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            return userDoc.exists() ? userDoc.data() as User : null;
        } catch {
            return null;
        }
    },

    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
            const snap = await getDocs(q);
            if (snap.empty) return null;
            return snap.docs[0].data() as User;
        } catch {
            return null;
        }
    },

    // --- NEURAL SYNC ENGINE ---
    async syncLocalVaultToCloud(companyId: string): Promise<number> {
        const localVault = getLocalVault();
        const batch = writeBatch(db);
        let count = 0;

        localVault.documents.forEach((docData: PolicyDocument) => {
            const dRef = doc(db, `companies/${companyId}/documents`, docData.id);
            batch.set(dRef, cleanObject(docData));
            count++;
        });

        localVault.risks.forEach((riskData: Risk) => {
            const rRef = doc(db, `companies/${companyId}/risks`, riskData.id);
            batch.set(rRef, cleanObject(riskData));
            count++;
        });

        localVault.events.forEach((eventData: SystemEvent) => {
            const eRef = doc(db, `companies/${companyId}/events`, eventData.event_id);
            batch.set(eRef, cleanObject(eventData));
            count++;
        });

        if (count > 0) {
            await batch.commit();
            localStorage.removeItem(LOCAL_VAULT_KEY);
        }
        return count;
    },

    // --- CORE DATA RETRIEVAL ---
    async getCompanyData(companyId: string) {
        const localVault = getLocalVault();

        if (companyId === DEMO_ID) {
             return {
                companyProfile: {
                    id: DEMO_ID,
                    name: 'Metaworks Demo',
                    logo: '',
                    ceoName: 'John Doe',
                    cioName: 'Jane Doe',
                    cisoName: 'Demo Admin',
                    ctoName: 'Tech Lead',
                    license: { key: 'demo', status: 'active', tier: 'yearly', expiresAt: Date.now() + 31536000000 }
                },
                users: [{ id: 'demo-user', name: 'Demo Administrator', email: 'admin@demo.com', role: 'Administrator', isVerified: true, companyId: DEMO_ID }],
                documents: localVault.documents,
                auditLog: localVault.auditLog,
                tasks: localVault.tasks,
                agentLog: [],
                eccAssessment: initialEccData,
                pdplAssessment: initialPdplAssessmentData,
                samaCsfAssessment: initialSamaData,
                cmaAssessment: initialCmaData,
                // Fix: Include missing assessment data in demo return to satisfy App.tsx expectations
                iso27001Assessment: initialIsoData,
                nistCsfAssessment: initialNistData,
                isa62443Assessment: initialIsaData,
                riskAssessmentData: localVault.risks.length > 0 ? localVault.risks : initialRiskData,
                trainingProgress: {},
                assessmentStatuses: { ecc: 'idle', pdpl: 'idle', sama: 'idle', cma: 'idle', iso27001: 'idle', nistCsf: 'idle', isa62443: 'idle', riskAssessment: 'idle' },
                events: localVault.events || []
            };
        }

        await ensureAuth();
        try {
            const companySnap = await getDoc(doc(db, 'companies', companyId));
            let companyProfile = companySnap.exists() ? companySnap.data() as CompanyProfile : {
                id: companyId,
                name: 'Environment Setup Pending',
                logo: '',
                ceoName: '', cioName: '', cisoName: '', ctoName: '',
                license: { key: 'trial', status: 'active', tier: 'trial', expiresAt: Date.now() + 604800000 }
            };

            const [
                users, documents, auditLog, tasks, agentLog, risks,
                eccSnap, pdplSnap, samaSnap, cmaSnap,
                // Fix: Fetch additional snapshots for extra assessment frameworks
                isoSnap, nistSnap, isaSnap,
                trainingSnap, statusSnap, eventSnap
            ] = await Promise.all([
                getDocs(query(collection(db, 'users'), where('companyId', '==', companyId))),
                getSubCollectionData<PolicyDocument>(`companies/${companyId}/documents`),
                getSubCollectionData<AuditLogEntry>(`companies/${companyId}/auditLog`),
                getSubCollectionData<Task>(`companies/${companyId}/tasks`),
                getSubCollectionData<AgentLogEntry>(`companies/${companyId}/agentLog`),
                getSubCollectionData<Risk>(`companies/${companyId}/risks`),
                getDoc(doc(db, `companies/${companyId}/assessments/ecc`)),
                getDoc(doc(db, `companies/${companyId}/assessments/pdpl`)),
                getDoc(doc(db, `companies/${companyId}/assessments/sama`)),
                getDoc(doc(db, `companies/${companyId}/assessments/cma`)),
                getDoc(doc(db, `companies/${companyId}/assessments/iso27001`)),
                getDoc(doc(db, `companies/${companyId}/assessments/nistCsf`)),
                getDoc(doc(db, `companies/${companyId}/assessments/isa62443`)),
                getDoc(doc(db, `companies/${companyId}/data/training`)),
                getDoc(doc(db, `companies/${companyId}/data/statuses`)),
                getDocs(query(collection(db, `companies/${companyId}/events`), orderBy('created_at', 'desc'), limit(100))),
            ]);

            const events = eventSnap.docs.map(d => d.data() as SystemEvent);

            return {
                companyProfile,
                users: users.docs.map(d => d.data() as User),
                documents,
                auditLog: auditLog.sort((a, b) => b.timestamp - a.timestamp),
                tasks,
                agentLog: agentLog.sort((a, b) => b.timestamp - a.timestamp),
                eccAssessment: eccSnap.exists() ? eccSnap.data().items : initialEccData,
                pdplAssessment: pdplSnap.exists() ? pdplSnap.data().items : initialPdplAssessmentData,
                samaCsfAssessment: samaSnap.exists() ? samaSnap.data().items : initialSamaData,
                cmaAssessment: cmaSnap.exists() ? cmaSnap.data().items : initialCmaData,
                // Fix: Include missing assessment results in return object
                iso27001Assessment: isoSnap.exists() ? isoSnap.data().items : initialIsoData,
                nistCsfAssessment: nistSnap.exists() ? nistSnap.data().items : initialNistData,
                isa62443Assessment: isaSnap.exists() ? isaSnap.data().items : initialIsaData,
                riskAssessmentData: risks.length > 0 ? risks : initialRiskData,
                trainingProgress: trainingSnap.exists() ? trainingSnap.data() : {},
                assessmentStatuses: statusSnap.exists() ? statusSnap.data() : { ecc: 'idle', pdpl: 'idle', sama: 'idle', cma: 'idle', iso27001: 'idle', nistCsf: 'idle', isa62443: 'idle', riskAssessment: 'idle' },
                events: events
            };
        } catch (e) {
            throw e;
        }
    },

    // --- PERSISTENCE PROTOCOLS ---
    async saveDocument(companyId: string, document: PolicyDocument): Promise<void> {
        if (companyId === DEMO_ID) {
            saveToLocalVault('documents', document);
            return;
        }
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/documents`, document.id), cleanObject(document));
    },

    async updateDocument(companyId: string, document: PolicyDocument): Promise<void> {
        if (companyId === DEMO_ID) {
            saveToLocalVault('documents', document);
            return;
        }
        await ensureAuth();
        await updateDoc(doc(db, `companies/${companyId}/documents`, document.id), cleanObject(document));
    },

    async addAuditLog(companyId: string, entry: AuditLogEntry): Promise<void> {
        if (companyId === DEMO_ID) {
            const vault = getLocalVault();
            vault.auditLog.unshift(entry);
            saveToLocalVault('auditLog', vault.auditLog);
            return;
        }
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/auditLog`, entry.id), cleanObject(entry));
    },

    async logEvent(companyId: string, event: SystemEvent): Promise<void> {
        if (companyId === DEMO_ID) {
            saveToLocalVault('events', event);
            return;
        }
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/events`, event.event_id), cleanObject(event));
    },

    async saveRisk(companyId: string, risk: Risk): Promise<void> {
        if (companyId === DEMO_ID) {
            saveToLocalVault('risks', risk);
            return;
        }
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/risks`, risk.id), cleanObject(risk));
    },

    async updateAssessmentStatus(companyId: string, statuses: any): Promise<void> {
        if (companyId === DEMO_ID) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/data`, 'statuses'), cleanObject(statuses));
    },

    async saveAssessmentItems(companyId: string, framework: string, items: AssessmentItem[]): Promise<void> {
        if (companyId === DEMO_ID) return;
        await ensureAuth();
        await setDoc(doc(db, `companies/${companyId}/assessments`, framework), { items: cleanObject(items) });
    },

    async createUser(user: User, companyId: string): Promise<void> {
        if (companyId === DEMO_ID) return;
        await ensureAuth();
        await setDoc(doc(db, 'users', user.id), { ...cleanObject(user), companyId });
    },

    async updateUser(user: User): Promise<void> {
        if (user.companyId === DEMO_ID) return;
        await ensureAuth();
        await updateDoc(doc(db, 'users', user.id), cleanObject(user));
    },

    async deleteUser(userId: string): Promise<void> {
        if (userId === 'demo-user') return;
        await ensureAuth();
        await deleteDoc(doc(db, 'users', userId));
    },

    async updateCompanyProfile(profile: CompanyProfile): Promise<void> {
        if (profile.id === DEMO_ID) return;
        await ensureAuth();
        await updateDoc(doc(db, 'companies', profile.id), cleanObject(profile));
    },

    async createCompanySystem(companyData: any, adminData: any, licenseData: License): Promise<void> {
        let adminId = `user-${Date.now()}`;
        if (adminData.password) {
            try {
                const cred = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
                adminId = cred.user.uid;
            } catch (authError: any) {
                console.error("Auth creation failed:", authError);
                throw authError;
            }
        }

        const companyId = `company-${Date.now()}`;
        const companyProfile: CompanyProfile = { ...companyData, id: companyId, license: licenseData };
        const user: User = { id: adminId, name: adminData.name, email: adminData.email, role: 'Administrator', isVerified: true, companyId: companyId };

        const batch = writeBatch(db);
        batch.set(doc(db, 'companies', companyId), cleanObject(companyProfile));
        batch.set(doc(db, 'users', adminId), cleanObject(user));
        batch.set(doc(db, `companies/${companyId}/assessments`, 'ecc'), { items: cleanObject(initialEccData) });
        batch.set(doc(db, `companies/${companyId}/assessments`, 'pdpl'), { items: cleanObject(initialPdplAssessmentData) });
        batch.set(doc(db, `companies/${companyId}/assessments`, 'sama'), { items: cleanObject(initialSamaData) });
        batch.set(doc(db, `companies/${companyId}/assessments`, 'cma'), { items: cleanObject(initialCmaData) });
        // Fix: Initializing additional assessment collection slots in Firestore
        batch.set(doc(db, `companies/${companyId}/assessments`, 'iso27001'), { items: cleanObject(initialIsoData) });
        batch.set(doc(db, `companies/${companyId}/assessments`, 'nistCsf'), { items: cleanObject(initialNistData) });
        batch.set(doc(db, `companies/${companyId}/assessments`, 'isa62443'), { items: cleanObject(initialIsaData) });
        
        await batch.commit();
        await signOut(auth);
    }
};
