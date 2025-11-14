import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getFirestore } from "firebase/firestore"; // Firestore'u içe aktar

// Firebase yapılandırma bilgileri environment variables'dan okunuyor
// Bu bilgiler Firebase Console'dan alınabilir (Proje Ayarları -> Genel -> Uygulamalarınız)
// .env dosyasında veya hosting environment'ında tanımlanmalıdır
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "peakactivity-ack.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "peakactivity-ack",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "peakactivity-ack.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "162789755367",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:162789755367:web:7049c398fda1a1fb4d9542",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RKTXDC1MCF"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini al
const auth = getAuth(app);
const functions = getFunctions(app); // Varsa bölge belirtin: getFunctions(app, 'your-region')
const db = getFirestore(app); // Firestore veritabanı örneğini al

export { app, auth, functions, db }; 