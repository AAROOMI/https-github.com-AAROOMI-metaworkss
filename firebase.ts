
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

/**
 * METAWORKS SUPREME PROJECT CONFIGURATION
 * Realigned to project: metaworks-7cfc5
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBY2XUA9lh47JrdPLUJq-D3hkCioDC9SIs",
  authDomain: "metaworks-7cfc5.firebaseapp.com",
  databaseURL: "https://metaworks-7cfc5-default-rtdb.firebaseio.com/",
  projectId: "metaworks-7cfc5",
  storageBucket: "metaworks-7cfc5.firebasestorage.app",
  messagingSenderId: "442027961273",
  appId: "1:442027961273:web:22821c914b88e59bb96468",
  measurementId: "G-HHYHQKSJMX"
};

// Initialize Firebase App strictly once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Governance Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

/**
 * Analytics initialization is disabled to prevent "403 PERMISSION_DENIED" errors 
 * from the Firebase Installations service. Analytics depends on Installations, 
 * which may be restricted or disabled for this specific project in the GCP Console.
 */
export const analytics = null;

export default app;
