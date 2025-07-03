const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwbiOiy_1JOmlUKllf1tx2c2pBHr7chUs",
  authDomain: "scrapemyuni.firebaseapp.com",
  projectId: "scrapemyuni",
  storageBucket: "scrapemyuni.firebasestorage.app",
  messagingSenderId: "1010320495217",
  appId: "1:1010320495217:web:3bfdb1f74d48d922f8c1d0",
  measurementId: "G-0EVVSYTW79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Admin user to add
const adminUser = {
  email: 'admin@scrapemyuni.com',
  name: 'Admin User',
  createdAt: new Date().toISOString(),
  permissions: ['users.read', 'users.write', 'universities.read', 'universities.write']
};

// Function to add admin
async function addAdmin() {
  try {
    // You can either use addDoc to generate a random ID
    const docRef = await addDoc(collection(db, 'admins'), adminUser);
    console.log(`Admin added with ID: ${docRef.id}`);
    
    // Or use setDoc with a custom ID
    // await setDoc(doc(db, 'admins', 'admin1'), adminUser);
    // console.log('Admin added with ID: admin1');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding admin:', error);
    process.exit(1);
  }
}

addAdmin(); 