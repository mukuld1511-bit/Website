import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyCW8weSCRl-_g6f1nrgEockzMao415x1JU",
  authDomain: "zenith-platform-50b72.firebaseapp.com",
  projectId: "zenith-platform-50b72",
  storageBucket: "zenith-platform-50b72.firebasestorage.app",
  messagingSenderId: "804971694716",
  appId: "1:804971694716:web:589eb9adaf1ad4093117f9"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
// Initialize Firebase
export default app;