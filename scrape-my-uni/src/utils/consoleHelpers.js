import { db } from '../firebase.js';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

/**
 * Helper function to add an admin user from the console
 * Usage in browser console: window.addAdmin('admin@example.com', 'Admin Name')
 */
export const setupConsoleHelpers = () => {
  window.addAdmin = async (email, name = 'Admin User') => {
    if (!email) {
      console.error('Email is required');
      return null;
    }
    
    try {
      // Check if admin already exists
      const existingAdminQuery = query(
        collection(db, 'admins'),
        where('email', '==', email.toLowerCase())
      );
      
      const existingAdminSnapshot = await getDocs(existingAdminQuery);
      
      if (!existingAdminSnapshot.empty) {
        console.warn('Admin with this email already exists:', email);
        return { 
          success: false, 
          message: 'Admin already exists',
          id: existingAdminSnapshot.docs[0].id
        };
      }
      
      // Add the admin
      const adminData = {
        email: email.toLowerCase(),
        name,
        createdAt: new Date().toISOString(),
        permissions: ['users.read', 'users.write', 'universities.read', 'universities.write']
      };
      
      const docRef = await addDoc(collection(db, 'admins'), adminData);
      console.log('Admin added successfully with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding admin:', error);
      return { success: false, error };
    }
  };
  
  window.listAdmins = async () => {
    try {
      const adminsQuery = query(collection(db, 'admins'));
      const snapshot = await getDocs(adminsQuery);
      
      if (snapshot.empty) {
        console.log('No admins found');
        return [];
      }
      
      const admins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.table(admins);
      return admins;
    } catch (error) {
      console.error('Error listing admins:', error);
      return [];
    }
  };
  
  console.log('Admin console helpers loaded. Use window.addAdmin() or window.listAdmins()');
};

// For convenience, automatically setup the helpers
setupConsoleHelpers(); 