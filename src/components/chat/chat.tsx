/* ==========================================
   FICHIER STRUCTURE HTML (JSX)
   ========================================== */

import React from "react";
import { useChatLogic } from "./chat.js";
import "./chat.css";

export default function ChatInterface() {
  const {
    currentUser,
    profiles,
    selectedTarget,
    setSelectedTarget,
    messages,
    inputText,
    setInputText,
    handleSend
  } = useChatLogic();

  if (!currentUser) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Veuillez vous connecter pour accéder à la messagerie.</h2>
      </div>
    );
  }

  return (
    <div className="chat-container">
      
      {/* Sidebar Contacts */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          Contacts disponibles
        </div>
        {profiles.map((profile) => (
          <div
            key={profile.email}
            onClick={() => setSelectedTarget(profile)}
            className={`contact-item ${selectedTarget?.email === profile.email ? "active" : ""}`}
          >
            {profile.photo ? (
              <img src={profile.photo} alt="avatar" className="avatar" />
            ) : (
              <div className="avatar-placeholder">
                {profile.prenom?.[0] || "?"}
              </div>
            )}
            <div>
              <div className="contact-name">{profile.prenom} {profile.nom}</div>
              <div className="contact-info">{profile.ville || profile.pays || profile.email}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone Principale de Discussion */}
      <div className="chat-main">
        {selectedTarget ? (
          <>
            <div className="chat-header">
              Discussion avec {selectedTarget.prenom} {selectedTarget.nom}
            </div>

            <div className="messages-list">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.email;
                return (
                  <div
                    key={msg.id || Math.random().toString()}
                    className={`message-bubble ${isMe ? "me" : "other"}`}
                  >
                    {msg.text}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="chat-input-form">
              <input
                type="text"
                className="chat-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrivez votre message..."
              />
              <button type="submit" className="chat-send-btn">
                Envoyer
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            Sélectionnez un contact dans la liste de gauche pour commencer à discuter.
          </div>
        )}
      </div>

    </div>
  );
}