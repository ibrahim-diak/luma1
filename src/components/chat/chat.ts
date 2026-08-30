/* ==========================================
   FICHIER JAVASCRIPT - LOGIQUE CHAT & FIREBASE
   ========================================== */

import { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { getPublicProfiles } from "../../services/userService";
import { getOrCreateChat, sendMessage, subscribeToMessages, Message } from "../../services/chatService";
import { onAuthStateChanged, User } from "firebase/auth";

export function useChatLogic() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  // Écouter l'authentification Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Charger la liste des utilisateurs
  useEffect(() => {
    async function loadProfiles() {
      try {
        const data = await getPublicProfiles();
        const filtered = data.filter((p: any) => p.email !== currentUser?.email);
        setProfiles(filtered);
      } catch (error) {
        console.error("Erreur lors du chargement des profils :", error);
      }
    }
    if (currentUser) {
      loadProfiles();
    }
  }, [currentUser]);

  // Écouter les messages en temps réel
  useEffect(() => {
    let unsubscribeMessages: (() => void) | undefined;

    async function initChat() {
      if (!currentUser?.email || !selectedTarget?.email) return;

      try {
        const chatId = await getOrCreateChat(currentUser.email, selectedTarget.email);
        setCurrentChatId(chatId);

        unsubscribeMessages = subscribeToMessages(chatId, (msgs) => {
          setMessages(msgs);
        });
      } catch (error) {
        console.error("Erreur d'initialisation du chat :", error);
      }
    }

    initChat();

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [currentUser, selectedTarget]);

  // Envoyer un message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChatId || !currentUser?.email || !inputText.trim()) return;

    try {
      const textToSend = inputText;
      setInputText("");
      await sendMessage(currentChatId, currentUser.email, textToSend);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    }
  };

  return {
    currentUser,
    profiles,
    selectedTarget,
    setSelectedTarget,
    messages,
    inputText,
    setInputText,
    handleSend
  };
}