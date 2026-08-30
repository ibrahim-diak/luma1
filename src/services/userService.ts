import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

// Récupérer tous les profils publics
export async function getPublicProfiles() {
  try {
    const querySnapshot = await getDocs(collection(db, "public_profiles"));
    const profiles: any[] = [];
    querySnapshot.forEach((doc) => {
      profiles.push({ id: doc.id, ...doc.data() });
    });
    return profiles;
  } catch (error) {
    console.error("Erreur getPublicProfiles :", error);
    return [];
  }
}

// Enregistrer la connexion d'un utilisateur
export async function handleUserLogin(user: any) {
  if (!user || !user.email) return;

  const userRef = doc(db, "utilisateurs", user.email);
  const userSnap = await getDoc(userRef);

  let loginCount = 1;
  if (userSnap.exists()) {
    loginCount = (userSnap.data().loginCount || 0) + 1;
  }

  const userData = {
    email: user.email,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    lastLogin: new Date().toISOString(),
    loginCount: loginCount,
  };

  await setDoc(userRef, userData, { merge: true });

  // Mise à jour du profil public
  const publicRef = doc(db, "public_profiles", user.email);
  await setDoc(publicRef, {
    email: user.email,
    nom: user.displayName || user.email.split("@")[0],
    photo: user.photoURL || "",
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// Récupérer le profil d'un utilisateur
export async function getUserProfile(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, "utilisateurs", userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Erreur getUserProfile :", error);
    return null;
  }
}

// Créer ou mettre à jour un profil utilisateur
export async function upsertUserProfile(user: any, additionalData: any = {}) {
  if (!user) return;
  const userRef = doc(db, "utilisateurs", user.uid || user.email);
  const data = {
    uid: user.uid || "",
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    updatedAt: new Date().toISOString(),
    ...additionalData,
  };

  await setDoc(userRef, data, { merge: true });

  const publicRef = doc(db, "public_profiles", user.email);
  await setDoc(publicRef, {
    email: user.email,
    nom: user.displayName || user.email.split("@")[0],
    photo: user.photoURL || "",
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// Rechercher des utilisateurs
export async function searchUsers(searchTerm: string) {
  try {
    const profiles = await getPublicProfiles();
    if (!searchTerm) return profiles;
    return profiles.filter((p: any) =>
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error("Erreur searchUsers :", error);
    return [];
  }
}
