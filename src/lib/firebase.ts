
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "studio-9320720500-9b879",
  "appId": "1:54917476718:web:397aaa5dd1ab5d0a81517f",
  "apiKey": "AIzaSyBHuyHKlnPy4QMkicJqxwuZ023D3uBD1RQ",
  "authDomain": "studio-9320720500-9b879.firebaseapp.com",
  "messagingSenderId": "54917476718"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

