// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC0EJ1qu-bnh0PfL2gpA2cMPS5Jbs_jki8",
  authDomain: "cc-tracker-35290.firebaseapp.com",
  projectId: "cc-tracker-35290",
  storageBucket: "cc-tracker-35290.firebasestorage.app",
  messagingSenderId: "122379086491",
  appId: "1:122379086491:web:240fd33793a3a79168743e",
  measurementId: "G-FGBGTCZ500",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuth = new GoogleAuthProvider();
export const db = getFirestore(app);
const analytics = getAnalytics(app);
