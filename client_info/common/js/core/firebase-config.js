import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-functions.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: 'AIzaSyA-N7FA3LyOs35W4-LQPnsJAo313mSG8XY',
  authDomain: 'client-insurance-42400.firebaseapp.com',
  projectId: 'client-insurance-42400',
  storageBucket: 'client-insurance-42400.firebasestorage.app',
  messagingSenderId: '1093798525474',
  appId: '1:1093798525474:web:05a799e12064fae4c9e87b',
  measurementId: 'G-R9WCBDJX1F'
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Firebase 앱 인스턴스도 export
export { app };