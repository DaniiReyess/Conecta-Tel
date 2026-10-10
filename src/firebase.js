import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyChYYdhz-RUz1KUfemV_j8TvL3xPwzj2Fw",
  authDomain: "conecta-tel.firebaseapp.com",
  projectId: "conecta-tel",
  storageBucket: "conecta-tel.firebasestorage.app",
  messagingSenderId: "246468598862",
  appId: "1:246468598862:web:f322b05fd42337a48ff71f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;