import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export const useChat = () => useContext(ChatContext);

/* ── Global ChatBox UI ──────────────────────── */
const GlobalChatBox = ({ chat, onClose }) => {
    const { user }                  = useAuth();
    const [messages, setMessages]   = useState([]);
    const [inputText, setInputText] = useState("");
    const [typing, setTyping]       = useState(false);
    const socketRef                 = useRef(null);
    const messagesEndRef            = useRef(null);

    const { matchId, receiverId, receiverName } = chat;

    // Connect socket + load history whenever a chat is opened
    useEffect(() => {
        // Load history
        api.get(`/chat/${matchId}`)
            .then(res => setMessages(res.data.messages || []))
            .catch(() => {});

        // Connect and join room
        const sock = io("http://localhost:5000");
        socketRef.current = sock;
        sock.emit("join_match", matchId);

        sock.on("receive_message", (msg) => {
            setMessages(prev => {
                if (msg.sender_id === user.user_id) {
                    // Replace optimistic temp entry with confirmed DB record
                    const tempIdx = prev.findIndex(
                        m => String(m.message_id).startsWith("temp_") && m.content === msg.content
                    );
                    if (tempIdx !== -1) {
                        const updated = [...prev];
                        updated[tempIdx] = msg;
                        return updated;
                    }
                }
                return [...prev, msg];
            });
        });

        sock.on("user_typing",      () => setTyping(true));
        sock.on("user_stop_typing", () => setTyping(false));

        return () => {
            sock.disconnect();
            socketRef.current = null;
        };
    }, [matchId]);  // re-runs only when a different chat is opened

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim() || !socketRef.current) return;
        const content = inputText.trim();

        // Optimistic update
        setMessages(prev => [...prev, {
            message_id: `temp_${Date.now()}`,
            content,
            sender_id:   user.user_id,
            receiver_id: receiverId,
            sent_at:     new Date().toISOString()
        }]);
        setInputText("");

        socketRef.current.emit("send_message", {
            matchId,
            senderId:   user.user_id,
            receiverId,
            content
        });
        socketRef.current.emit("stop_typing", { matchId, userId: user.user_id });
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSend();
        else socketRef.current?.emit("typing", { matchId, userId: user.user_id });
    };

    return (
        <div style={{
            position: "fixed", bottom: "20px", right: "20px",
            width: "340px", height: "440px",
            background: "white", borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column",
            overflow: "hidden", zIndex: 9999
        }}>
            {/* Header */}
            <div style={{
                background: "#22c55e", color: "white",
                padding: "0.8rem 1rem",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontWeight: 600, fontFamily: "inherit"
            }}>
                <span>💬 Chat with {receiverName || "User"}</span>
                <button
                    onClick={onClose}
                    style={{ background: "none", border: "none", color: "white", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1 }}
                >×</button>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, padding: "1rem",
                display: "flex", flexDirection: "column", gap: "0.6rem",
                overflowY: "auto", background: "#f0fdf4"
            }}>
                {messages.length === 0 && (
                    <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.85rem", marginTop: "1rem" }}>
                        No messages yet. Say hello!
                    </p>
                )}
                {messages.map((msg) => (
                    <div key={msg.message_id} style={{
                        maxWidth: "75%",
                        padding: "0.6rem 0.9rem",
                        borderRadius: "12px",
                        fontSize: "0.9rem",
                        lineHeight: 1.3,
                        wordBreak: "break-word",
                        alignSelf: msg.sender_id === user.user_id ? "flex-end" : "flex-start",
                        background: msg.sender_id === user.user_id ? "#22c55e" : "#e5e7eb",
                        color:      msg.sender_id === user.user_id ? "white"   : "#111827",
                        borderBottomRightRadius: msg.sender_id === user.user_id ? "4px" : "12px",
                        borderBottomLeftRadius:  msg.sender_id === user.user_id ? "12px" : "4px",
                    }}>
                        {msg.content}
                        <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "2px" }}>
                            {new Date(msg.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {typing && (
                <div style={{ fontSize: "0.8rem", color: "#6b7280", padding: "0 1rem 0.4rem", fontStyle: "italic" }}>
                    {receiverName} is typing...
                </div>
            )}

            {/* Input */}
            <div style={{ display: "flex", padding: "0.7rem", borderTop: "1px solid #e5e7eb", gap: "0.5rem" }}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    style={{
                        flex: 1, padding: "0.5rem 0.7rem",
                        borderRadius: "8px", border: "1px solid #d1d5db",
                        outline: "none", fontFamily: "inherit", fontSize: "0.9rem"
                    }}
                />
                <button
                    onClick={handleSend}
                    style={{
                        background: "#22c55e", color: "white",
                        border: "none", borderRadius: "8px",
                        padding: "0.5rem 0.9rem", cursor: "pointer",
                        fontWeight: 600, fontFamily: "inherit"
                    }}
                >Send</button>
            </div>
        </div>
    );
};

/* ── Provider ───────────────────────────────── */
export const ChatProvider = ({ children }) => {
    const [activeChat, setActiveChat] = useState(null); // { matchId, receiverId, receiverName }

    const openChat = ({ matchId, receiverId, receiverName }) => {
        setActiveChat({ matchId, receiverId, receiverName });
    };

    const closeChat = () => {
        setActiveChat(null);
    };

    return (
        <ChatContext.Provider value={{ openChat, closeChat, activeChat }}>
            {children}
            {/* ChatBox renders here — outside all routes, persists on navigation */}
            {activeChat && (
                <GlobalChatBox
                    chat={activeChat}
                    onClose={closeChat}
                />
            )}
        </ChatContext.Provider>
    );
};
