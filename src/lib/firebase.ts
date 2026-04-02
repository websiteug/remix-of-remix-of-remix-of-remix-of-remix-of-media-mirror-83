import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBpkKhBusfzM45RsP464KpoABxw1-TBaB8",
  authDomain: "luo-ancient-movies-com.firebaseapp.com",
  databaseURL: "https://luo-ancient-movies-com-default-rtdb.firebaseio.com",
  projectId: "luo-ancient-movies-com",
  storageBucket: "luo-ancient-movies-com.firebasestorage.app",
  messagingSenderId: "86595039806",
  appId: "1:86595039806:web:c2c386f9fd1ea02c0ad76f",
  measurementId: "G-BEH73CPP70",
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);

export default app;
