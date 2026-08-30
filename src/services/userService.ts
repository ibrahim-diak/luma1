import { db } from "../lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { User } from "firebase/auth";

export interface UserLocation {
  pays: string;
  ville: string;
  region: string;
  ip: string;
}

export interface UserProfileData {
  prenom?: string;
  nom?: string;
  email: string;
  photo?: string;
  sexe?: string;
  numero?: string;
  localisation?: UserLocation;
}

// Récupération de la localisation de l'utilisateur
export async function getUserLocation(): Promise<UserLocation> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return {
      pays: data.country_name || "Inconnu",
      ville: data.city || "Inconnue",
      region: data.region || "Inconnue",
      ip: data.ip || "Inconnue"
    };
  } catch (error) {
    console.error("Erreur localisation :", error);
    return { pays: "Inconnu", ville: "Inconnue", region: "Inconnue", ip: "Inconnu" };
  }
}

// Synchronisation du profil public pour la recherche de contacts
export async function synchroniserProfilPublic(user: User, profileData: Partial<UserProfileData>) {
  if (!user || !user.email) return;

  const publicProfileRef = doc(db, "public_profiles", user.email);
  const displayName = user.displayName || "";
  const partiesNom = displayName.trim().split(/\s+/);
  const prenom = partiesNom[0] || "";
  const nom = partiesNom.slice(1).join(" ");

  await setDoc(
    publicProfileRef,
    {
      prenom: prenom,
      nom: nom,
      sexe: profileData.sexe || "",
      ville: profileData.localisation?.ville || "",
      region: profileData.localisation?.region || "",
      pays: profileData.localisation?.pays || "",
      photo: user.photoURL || profileData.photo || "",
      telephone: profileData.numero || "",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

// Enregistrement et mise à jour lors de la connexion
export async function handleUserLogin(user: User) {
  if (!user.email) return;

  const loc = await getUserLocation();
  const userRef = doc(db, "utilisateurs", user.email);
  const snap = await getDoc(userRef);

  let nombreConnexions = 1;
  let badge = "Nouveau";
  let numero = "";
  let sexe = "";

  if (snap.exists()) {
    const d = snap.data();
    nombreConnexions = (d.nombreConnexions || 0) + 1;
    numero = d.numero || "";
    sexe = d.sexe || "";

    if (nombreConnexions >= 50) badge = "Contributeur";
    else if (nombreConnexions >= 10) badge = "Fidèle";
    else badge = d.badge || "Nouveau";
  }

  await setDoc(
    userRef,
    {
      nom: user.displayName || "",
      email: user.email,
      photo: user.photoURL || "",
      derniereConnexion: serverTimestamp(),
      localisation: loc,
      nombreConnexions,
      badge,
      numero,
      sexe
    },
    { merge: true }
  );

  if (numero && sexe) {
    await synchroniserProfilPublic(user, { numero, sexe, localisation: loc });
  }

  return { isComplete: Boolean(numero && sexe), numero, sexe };
}

// Récupérer la liste des profils publics (contacts disponibles pour tchatter)
export async function getPublicProfiles() {
  const q = query(collection(db, "public_profiles"), orderBy("updatedAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    email: doc.id,
    ...doc.data()
  }));
}
