// Firebase 모듈 import 및 Firestore 연동 (ESM 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: window.currentConfig.firebaseApiKey,
  authDomain: window.currentConfig.firebaseAuthDomain,
  projectId: window.currentConfig.firebaseProjectId,
  storageBucket: window.currentConfig.firebaseStorageBucket,
  messagingSenderId: window.currentConfig.firebaseMessagingSenderId,
  appId: window.currentConfig.firebaseAppId,
  measurementId: window.currentConfig.firebaseMeasurementId
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, collection, addDoc, getDocs, query, where, analytics, updateDoc, doc };
 