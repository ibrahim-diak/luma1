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

  // Mettre aussi à jour le profil public pour la recherche du chat
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
