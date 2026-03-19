import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYHTZm3R2fblQnjSFsYZG5oyXX-2rDVc8",
  authDomain: "study-portal-9ab13.firebaseapp.com",
  projectId: "study-portal-9ab13",
  storageBucket: "study-portal-9ab13.firebasestorage.app",
  messagingSenderId: "955279804899",
  appId: "1:955279804899:web:3ff982b63f1c17c6ba78d6"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
