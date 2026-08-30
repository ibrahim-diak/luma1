import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { handleUserLogin } from "./services/userService";
import ChatInterface from "./components/chat/chat";

function App() {
  useEffect(() => {
    // Écoute de l'état de connexion de l'utilisateur
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Enregistre la géolocalisation et synchronise le profil public
        await handleUserLogin(user);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="App">
      <header style={{ padding: "20px", textAlign: "center", backgroundColor: "#1e293b", color: "white" }}>
        <h1>Plateforme LUMA</h1>
      </header>

      <main>
        {/* Affichage du composant de messagerie */}
        <ChatInterface />
      </main>
    </div>
  );
}

export default App;
