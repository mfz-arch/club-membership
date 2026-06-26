import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// Your web app's Firebase configuration
// For the hackathon, replace these with your actual Firebase Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBsPj7wHiB4wLbswNlatKoF96riU7QzWcE",
  authDomain: "club-membership-cae5d.firebaseapp.com",
  projectId: "club-membership-cae5d",
  storageBucket: "club-membership-cae5d.firebasestorage.app",
  messagingSenderId: "868248081949",
  appId: "1:868248081949:web:bd4067a1f975768b6f58f4",
  measurementId: "G-8PTZ94JNLM"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, query, orderBy, limit };
