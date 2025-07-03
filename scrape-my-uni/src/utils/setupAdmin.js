import { db } from '../firebase.js';
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Adds a new admin user to Firestore
 * 
 * @param {string} email - The email of the admin user
 * @param {string} name - The name of the admin user
 * @returns {Promise<string>} - The ID of the created admin document
 */
export const addAdmin = async (email, name = 'Admin User') => {
  try {
    // Check if admin already exists
    const adminsRef = collection(db, 'admins');
    const adminData = {
      email: email.toLowerCase(),
      name,
      createdAt: new Date().toISOString(),
      permissions: ['users.read', 'users.write', 'universities.read', 'universities.write']
    };
    
    // Add the admin document
    const docRef = await addDoc(adminsRef, adminData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding admin:', error);
    throw error;
  }
};

/**
 * Checks if a user is an admin
 * 
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} - Whether the user is an admin
 */
export const isAdmin = async (email) => {
  if (!email) return false;
  
  try {
    // Query admins collection where email matches
    const adminRef = doc(db, 'admins', email.toLowerCase());
    const adminDoc = await getDoc(adminRef);
    
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Use this for development purposes only
// This can be called from the browser console to add an admin
window.addAdminUser = async (email, name) => {
  const id = await addAdmin(email, name);
  console.log(`Added admin with ID: ${id}`);
  return id;
};

// Example usage in browser console:
// window.addAdminUser('admin@scrapemyuni.com', 'Admin User'); 