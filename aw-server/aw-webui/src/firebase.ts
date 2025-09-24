import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore'; // Firestore'u içe aktar

// Firebase yapılandırma bilgileriniz buraya gelecek
// Bu bilgiler Firebase Console'dan alınabilir (Proje Ayarları -> Genel -> Uygulamalarınız)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'peakactivity-ack.firebaseapp.com',
  projectId: 'peakactivity-ack',
  storageBucket: 'peakactivity-ack.firebasestorage.app',
  messagingSenderId: '162789755367',
  appId: '1:162789755367:web:7049c398fda1a1fb4d9542',
  measurementId: 'G-RKTXDC1MCF', // İsteğe bağlı
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini al
const auth = getAuth(app);
const functions = getFunctions(app); // Varsa bölge belirtin: getFunctions(app, 'your-region')
const db = getFirestore(app); // Firestore veritabanı örneğini al

export { app, auth, functions, db };
