import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  getFirestore, 
  persistentMultipleTabManager 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1TQqaNzeNdEacY-DmCYz6RqzeNtfmnnI",
  authDomain: "pawsos-c7a97.firebaseapp.com",
  projectId: "pawsos-c7a97",
  storageBucket: "pawsos-c7a97.firebasestorage.app",
  messagingSenderId: "427370777644",
  appId: "1:427370777644:web:48a928bc25c2619c8ad589",
  measurementId: "G-ET4NB9D14F"
};

// 1. Initialize App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. FIRESTORE FIX: Correctly handle cache to avoid IndexedDB warnings
let db;
try {
  db = initializeFirestore(app, {
    // We add the MultipleTabManager which helps manage the cache across different instances
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalForceLongPolling: true,
  });
} catch (e) {
  // Fallback for cases where initializeFirestore fails (e.g., already initialized)
  db = getFirestore(app);
}

export const auth = getAuth(app);
export { db };