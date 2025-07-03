import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// To prevent duplicate initialization
let app;
let analytics = null;

// Validate environment variables
const validateEnvVars = () => {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    // In production build, this might be expected during build time
    if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
      console.warn('Environment variables missing during build - Firebase will not be initialized');
      return false;
    }
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please check your .env file.`);
  }
  return true;
};

// Validate before creating config
const envVarsValid = validateEnvVars();

// Firebase configuration - only if env vars are available
let firebaseConfig = null;
if (envVarsValid) {
  firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };
}

// Custom error handler for Firestore operations
const handleFirestoreError = (error) => {
  console.error('Firestore operation error:', error);

  if (error.code === 'failed-precondition') {
    console.error('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (error.code === 'unimplemented') {
    console.error('The current browser does not support persistence.');
  } else if (error.code === 'permission-denied') {
    console.error('Permission denied. Check Firestore security rules.');
  } else if (error.code === 'unavailable') {
    console.error('Firestore service is unavailable. Check network connection.');
  } else if (error.code === 'unauthenticated') {
    console.error('User is not authenticated for this operation.');
  } else if (error.code === 'resource-exhausted') {
    console.error('Quota exceeded or rate limiting in effect.');
  } else if (error.name === 'FirebaseError' && error.message.includes('400')) {
    console.error('Bad request (400). Check document format and types:', error.message);
  }

  return error;
};

// Initialize Firebase only once
function initializeFirebase() {
  // Only initialize once and if config is available
  if (!app && firebaseConfig) {
    try {
      // Initialize Firebase
      app = initializeApp(firebaseConfig);
      
      // Try to initialize Firestore with optimized settings
      let db;
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            cacheSizeBytes: CACHE_SIZE_UNLIMITED
          })
        });
      } catch (error) {
        // If already initialized, just get the existing instance
        if (error.code === 'failed-precondition' && error.message.includes('already been called')) {
          console.warn('Firestore already initialized, using existing instance');
          db = getFirestore(app);
        } else {
          throw error;
        }
      }
      
      // Set up online/offline handlers
      if (typeof window !== 'undefined') {
        // Lazy-load network handlers
        window.addEventListener('online', () => {
          enableNetwork(db).catch(err => console.error('Error enabling Firestore network:', err));
        });
        
        window.addEventListener('offline', () => {
          disableNetwork(db).catch(err => console.error('Error disabling Firestore network:', err));
        });
      }
      
      // Initialize authentication with session persistence (faster than local persistence)
      const auth = getAuth(app);
      
      // We'll set auth persistence asynchronously to not block initial rendering
      setTimeout(() => {
        setPersistence(auth, browserSessionPersistence)
          .catch((err) => {
            console.error('Error setting auth persistence:', err);
          });
      }, 2000);
      
      // Initialize storage
      const storage = getStorage(app);
      
      // Initialize analytics conditionally and asynchronously
      if (typeof window !== 'undefined') {
        // Delay analytics initialization to improve initial load
        setTimeout(async () => {
          try {
            // Check if analytics is supported in this environment
            if (await isSupported()) {
              analytics = getAnalytics(app);
            }
          } catch (error) {
            console.warn('Analytics initialization error:', error);
          }
        }, 3000);
      }
      
      return { app, db, auth, storage, analytics };
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }
  
  // Return existing instances or null if not initialized
  if (app) {
    return { 
      app, 
      db: getFirestore(app), 
      auth: getAuth(app), 
      storage: getStorage(app), 
      analytics 
    };
  }
  
  // Return null instances if Firebase couldn't be initialized
  return {
    app: null,
    db: null,
    auth: null,
    storage: null,
    analytics: null
  };
}

// Expose error handler for global use
export const firestoreErrorHandler = handleFirestoreError;

// Initialize Firebase on first import
const { app: appInstance, db, auth, storage } = initializeFirebase();

// Export Firebase services
export const firebaseApp = appInstance;
export { db, auth, storage, analytics };