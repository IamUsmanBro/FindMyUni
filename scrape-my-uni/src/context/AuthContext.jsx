import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, query, collection, getDocs, addDoc } from 'firebase/firestore';
import { where } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email and password
  async function signup(email, password, name) {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile
      await updateProfile(result.user, {
        displayName: name
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      
      return result.user;
    } catch (error) {
      console.error("Signup error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Login with email and password
  async function login(email, password) {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time in Firestore
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreError) {
        console.error("Error updating last login:", firestoreError);
      }
      
      // Manually set current user to trigger state update
      setCurrentUser(result.user);
      
      return result;
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Login with Google
  async function loginWithGoogle() {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      
      // Add scopes to request profile data
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters to ensure we get a high-quality photo
      provider.setCustomParameters({
        prompt: 'select_account',
        // Request HD photo (remove size limitation)
        include_granted_scopes: 'true'
      });
      
      // Use popup instead of redirect for better compatibility
      const result = await signInWithPopup(auth, provider);
      
      // Get the Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
      
      // Get profile photo URL without size restriction
      // Google's default URL may have size restrictions like =s96-c
      let photoURL = user.photoURL;
      if (photoURL && photoURL.includes('=s96-c')) {
        // Remove the size limitation to get a larger image
        photoURL = photoURL.split('=s96-c')[0];
      }
      
      console.log("Original photoURL:", user.photoURL);
      console.log("Modified photoURL:", photoURL);
      
      // Also make sure user data is saved to Firestore
      if (result && result.user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', result.user.uid));
          
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: photoURL, // Use modified URL
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            });
          } else {
            // Update last login and photo URL
            await setDoc(doc(db, 'users', result.user.uid), {
              lastLogin: new Date().toISOString(),
              photoURL: photoURL // Update with modified URL
            }, { merge: true });
          }
        } catch (firestoreError) {
          console.error("Error saving user data:", firestoreError);
        }
      }
      
      return result;
    } catch (error) {
      console.error("Google login error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Logout
  async function logout() {
    try {
      setError(null);
      return await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      setError(null);
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Update user's profile
  async function updateUserProfile(displayName, photoURL) {
    try {
      setError(null);
      if (!currentUser) throw new Error("No user is signed in");
      return await updateProfile(currentUser, {
        displayName,
        photoURL
      });
    } catch (error) {
      console.error("Profile update error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Update user's email
  async function updateUserEmail(email) {
    try {
      setError(null);
      if (!currentUser) throw new Error("No user is signed in");
      return await updateEmail(currentUser, email);
    } catch (error) {
      console.error("Email update error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Update user's password
  async function updateUserPassword(password) {
    try {
      setError(null);
      if (!currentUser) throw new Error("No user is signed in");
      return await updatePassword(currentUser, password);
    } catch (error) {
      console.error("Password update error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Add this new function to verify admin status
  async function verifyAdminStatus() {
    try {
      setError(null);
      if (!currentUser) {
        throw new Error("No user is signed in");
      }
      
      console.log("Verifying admin status for", currentUser.email);
      
      // First check user document for admin role
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      // Check if user has admin role in users collection
      const isAdminInUserDoc = userDoc.exists() && userDoc.data().role === 'admin';
      
      // Also check admins collection
      const adminQuery = query(
        collection(db, 'admins'),
        where('email', '==', currentUser.email.toLowerCase())
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      const isInAdminsCollection = !adminSnapshot.empty;
      
      // Fix inconsistencies
      if (isAdminInUserDoc && !isInAdminsCollection) {
        // User has admin role but missing from admins collection
        console.log("Fixing admin status: Adding to admins collection");
        await addDoc(collection(db, 'admins'), {
          userId: currentUser.uid,
          email: currentUser.email.toLowerCase(),
          name: currentUser.displayName || userDoc.data().name || 'Admin User',
          createdAt: new Date().toISOString(),
          permissions: ['users.read', 'users.write', 'universities.read', 'universities.write']
        });
      } else if (!isAdminInUserDoc && isInAdminsCollection) {
        // User is in admins collection but not marked as admin in users document
        console.log("Fixing admin status: Updating user document");
        await setDoc(userDocRef, {
          role: 'admin',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      
      // Force token refresh to ensure authentication state reflects admin status
      await currentUser.getIdToken(true);
      
      // Return admin status
      return isAdminInUserDoc || isInAdminsCollection;
    } catch (error) {
      console.error("Admin verification error:", error);
      setError(error.message);
      throw error;
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "No user");
      setCurrentUser(user);
      
      // Update last login when user logs in
      if (user) {
        try {
          const userData = {
            lastLogin: new Date().toISOString()
          };
          
          // Better error handling for Firestore writes
          try {
            // Check if user document exists first to avoid permission errors
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
              // Create a new user document if it doesn't exist
              console.log(`Creating new user document for ${user.email}`);
              await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                createdAt: new Date().toISOString(),
                ...userData
              });
            } else {
              // Just update the lastLogin field
              await setDoc(userDocRef, userData, { merge: true });
            }
            
            console.log("Updated last login time for", user.email);
          } catch (firestoreError) {
            console.error('Firestore error updating last login:', firestoreError);
            
            // Check for specific firestore errors
            if (firestoreError.code === 'permission-denied') {
              console.error('Permission denied. Ensure the user has proper permissions.');
            } else if (firestoreError.name === 'FirebaseError' && firestoreError.message.includes('400')) {
              console.error('Invalid document format. Check data structure:', userData);
            }
          }
        } catch (error) {
          console.error('Error updating last login:', error);
        }
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    error,
    loading,
    isAuthenticated: !!currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    verifyAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
