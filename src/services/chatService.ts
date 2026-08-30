import { db } from "../lib/firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export interface Message {
  id?: string;
  senderId: string; // L'email de l'expéditeur
  text: string;
  createdAt: Timestamp | null;
}

export interface Chat {
  id: string;
  participants: string[]; // Liste des 2 emails [email1, email2]
  lastMessage?: string;
  updatedAt?: Timestamp | null;
}

// 1. Obtenir l'ID unique d'un chat entre deux utilisateurs (tri alphabétique pour cohérence)
export function getChatId(email1: string, email2: string): string {
  const sorted = [email1.toLowerCase(), email2.toLowerCase()].sort();
  return `${sorted[0]}_${sorted[1]}`;
}

// 2. Créer ou récupérer une conversation entre deux utilisateurs
export async function getOrCreateChat(currentEmail: string, targetEmail: string): Promise<string> {
  const chatId = getChatId(currentEmail, targetEmail);
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [currentEmail, targetEmail],
      lastMessage: "",
      updatedAt: serverTimestamp()
    });
  }

  return chatId;
}

// 3. Envoyer un message dans un chat
export async function sendMessage(chatId: string, senderEmail: string, text: string) {
  if (!text.trim()) return;

  const messagesRef = collection(db, "chats", chatId, "messages");
  
  // Ajouter le message dans la sous-collection messages
  await addDoc(messagesRef, {
    senderId: senderEmail,
    text: text.trim(),
    createdAt: serverTimestamp()
  });

  // Mettre à jour le dernier message dans le document chat parent
  const chatRef = doc(db, "chats", chatId);
  await setDoc(chatRef, {
    lastMessage: text.trim(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// 4. Écouter les messages d'un chat en temps réel
export function subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Message, "id">)
    }));
    callback(messages);
  });
}

// 5. Récupérer toutes les conversations actives d'un utilisateur
export async function getUserChats(userEmail: string): Promise<Chat[]> {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", userEmail)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Chat, "id">)
  }));
}