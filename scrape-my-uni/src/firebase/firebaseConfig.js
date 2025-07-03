const { initializeApp } = require("firebase/app");
const { getAnalytics } = require("firebase/analytics");

const firebaseConfig = {
  apiKey: "AIzaSyDNwuk5a6F3bDBhtiVXmVa3wnkMSU2oFLo",
  authDomain: "scrapemyuni.firebaseapp.com",
  projectId: "scrapemyuni",
  storageBucket: "scrapemyuni.firebasestorage.app",
  messagingSenderId: "1010320495217",
  appId: "1:1010320495217:web:e1a54f2d5ebac186f8c1d0",
  measurementId: "G-C0J5CQM9Q5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

module.exports = { app, analytics }; 