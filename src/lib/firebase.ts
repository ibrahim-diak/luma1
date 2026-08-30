import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAClwRQe3g4Cg9CAsn28l_sAihwlMQtGUI",
  authDomain: "lumina-analytics.firebaseapp.com",
  projectId: "lumina-analytics",
  storageBucket: "lumina-analytics.appspot.com",
  messagingSenderId: "239329398532",
  appId: "1:239329398532:web:2f68b196df0c4e6400ca51",
  measurementId: "G-J7LLPRXLJH"
};

// Initialisation unique
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (optionnel, selon le support du navigateur)
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;