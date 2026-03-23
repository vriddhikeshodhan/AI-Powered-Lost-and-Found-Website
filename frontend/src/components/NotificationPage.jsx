import React, { useState, useEffect, useCallback } from "react";
import "./NotificationPage.css";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const NotificationPage = () => {
    const [activeTab, setActiveTab]         = useState("lost");
    const [items, setItems]                 = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [chats, setChats]                 = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState("");

    const navigate         = useNavigate();
    const { user, logout } = useAuth();
    const { openChat }     = useChat();   // ← global chat

    const fetchChats = useCallback(async () => {
        try {
            const res = await api.get("/chat/active");
            setChats(res.data.chats || []);
        } catch {}
    }, []);

    useEffect(() => {
        Promise.all([
            api.get("/items/my-items"),
            api.get("/notifications"),
            api.get("/chat/active")
        ])
            .then(([itemsRes, notifRes, chatsRes]) => {
                setItems(itemsRes.data.items || []);
                setNotifications(notifRes.data.notifications || []);
                setChats(chatsRes.data.chats || []);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load data. Please refresh.");
                setLoading(false);
            });
    }, []);

    const handleMarkRead = async (notifId) => {
        try {
            await api.patch(`/notifications/${notifId}/read`);
            setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, is_read: true } : n));
        } catch {}
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {}
    };

    const handleResolve = async (itemId) => {
        try {
            await api.patch(`/items/${itemId}/resolve`);
            setItems(prev => prev.map(i => i.item_id === itemId ? { ...i, status: "resolved" } : i));
        } catch {}
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm("Delete this item report?")) return;
        try {
            await api.delete(`/items/${itemId}`);
            setItems(prev => prev.filter(i => i.item_id !== itemId));
        } catch {}
    };

    // Open chat via global context — chatbox survives navigation
    const handleOpenChat = (chat) => {
        const isLostOwner  = chat.lost_user_id === user.user_id;
        const receiverId   = isLostOwner ? chat.found_user_id  : chat.lost_user_id;
        const receiverName = isLostOwner ? chat.found_user_name : chat.lost_user_name;
        openChat({ matchId: chat.match_id, receiverId, receiverName });
    };

    const lostItems     = items.filter(i => i.type === "Lost");
    const foundItems    = items.filter(i => i.type === "Found");
    const resolvedCount = items.filter(i => i.status === "resolved").length;
    const unreadCount   = notifications.filter(n => !n.is_read).length;
    const unreadChats   = chats.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    const displayItems  = activeTab === "lost" ? lostItems : foundItems;

    return (
        <div className="notification-page">

            {/* HEADER */}
            <header className="notification-header">
                <div className="notification-logo">Lost<span style={{ color:"#22c55e" }}>&Found</span></div>
                <div className="notification-nav">
                    <button onClick={() => navigate("/userlanding")}>Home</button>
                    <button onClick={() => { logout(); navigate("/"); }}>Sign Out</button>
                </div>
            </header>

            <div className="notification-container">

                <div className="title-row">
                    <h1>My Dashboard</h1>
                    <button className="report-btn" onClick={() => navigate("/lost")} style={{ marginRight:"8px" }}>+ Report Lost</button>
                    <button className="report-btn found-report-btn" onClick={() => navigate("/found")}>+ Report Found</button>
                </div>

                {error && (
                    <div style={{ background:"#fef2f2", color:"#dc2626", padding:"12px", borderRadius:"8px", marginBottom:"16px" }}>
                        {error}
                    </div>
                )}

                {/* STATS */}
                <div className="stats-grid">
                    <div className="stat-card stat-lost"><h3>Lost Items</h3><p>{lostItems.length}</p></div>
                    <div className="stat-card stat-found"><h3>Found Items</h3><p>{foundItems.length}</p></div>
                    <div className="stat-card stat-resolved"><h3>Resolved</h3><p>{resolvedCount}</p></div>
                </div>

                {/* NOTIFICATIONS */}
                {notifications.length > 0 && (
                    <div className="notif-panel">
                        <div className="notif-panel-header">
                            <h3>🔔 Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h3>
                            {unreadCount > 0 && <button className="mark-all-btn" onClick={handleMarkAllRead}>Mark all read</button>}
                        </div>
                        <div className="notif-list">
                            {notifications.slice(0, 5).map(n => (
                                <div
                                    key={n.notification_id}
                                    className={`notif-item ${!n.is_read ? "unread" : ""}`}
                                    onClick={() => { handleMarkRead(n.notification_id); if (n.item_id) navigate(`/topmatches/${n.item_id}`); }}
                                >
                                    <span className="notif-dot" />
                                    <div className="notif-content">
                                        <p>{n.content}</p>
                                        <small>{new Date(n.sent_at).toLocaleDateString()}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TABS */}
                <div className="tabs">
                    <div className={`tab ${activeTab === "lost"  ? "active" : ""}`} onClick={() => setActiveTab("lost")}>
                        My Lost Items ({lostItems.length})
                    </div>
                    <div className={`tab ${activeTab === "found" ? "active" : ""}`} onClick={() => setActiveTab("found")}>
                        My Found Items ({foundItems.length})
                    </div>
                    <div className={`tab ${activeTab === "chats" ? "active" : ""}`} onClick={() => { setActiveTab("chats"); fetchChats(); }}>
                        My Chats ({chats.length})
                        {unreadChats > 0 && <span className="unread-badge" style={{ marginLeft:"6px" }}>{unreadChats}</span>}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign:"center", padding:"2rem", color:"#166534" }}>Loading...</div>

                ) : activeTab === "chats" ? (
                    chats.length === 0 ? (
                        <div className="empty-box">
                            <h3>No Active Chats</h3>
                            <p>Chats appear here once a message has been exchanged with another user.</p>
                        </div>
                    ) : (
                        <div className="items-list">
                            {chats.map(chat => {
                                const isLostOwner  = chat.lost_user_id === user.user_id;
                                const otherName    = isLostOwner ? chat.found_user_name : chat.lost_user_name;
                                const itemTitle    = isLostOwner ? chat.lost_item_title  : chat.found_item_title;
                                const role         = isLostOwner ? "You lost this" : "You found this";

                                return (
                                    <div key={chat.match_id} className="item-card" style={{ cursor:"pointer" }} onClick={() => handleOpenChat(chat)}>
                                        <div className="item-card-img" style={{ fontSize:"2rem" }}>💬</div>
                                        <div className="item-card-body">
                                            <div className="item-card-top">
                                                <h4>{itemTitle}</h4>
                                                <span className="status-badge status-active">{role}</span>
                                            </div>
                                            <p className="item-desc">
                                                <strong>{otherName}</strong>: {chat.last_message || "No messages yet — start the conversation"}
                                            </p>
                                            <div className="item-meta">
                                                <span>🤝 {chat.match_status}</span>
                                                <span>{chat.confidence_score}% confidence</span>
                                                {chat.last_message_at && <span>{new Date(chat.last_message_at).toLocaleDateString()}</span>}
                                                {chat.unread_count > 0 && (
                                                    <span style={{ color:"#dc2626", fontWeight:600 }}>{chat.unread_count} unread</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="item-card-actions">
                                            <button className="action-btn view-matches">Open Chat</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )

                ) : (
                    displayItems.length === 0 ? (
                        <div className="empty-box">
                            <h3>No {activeTab === "lost" ? "Lost" : "Found"} Items Yet</h3>
                            <p>{activeTab === "lost"
                                ? "Report something you've lost and our AI will try to find a match."
                                : "Report something you've found and help reunite it with its owner."}
                            </p>
                            <button className="report-btn" style={{ marginTop:"12px" }} onClick={() => navigate(activeTab === "lost" ? "/lost" : "/found")}>
                                + Report {activeTab === "lost" ? "Lost" : "Found"} Item
                            </button>
                        </div>
                    ) : (
                        <div className="items-list">
                            {displayItems.map(item => (
                                <div key={item.item_id} className="item-card">
                                    <div className="item-card-img">
                                        {item.primary_image
                                            ? <img src={`http://localhost:5000/uploads/${item.primary_image}`} alt={item.title} />
                                            : <span>📦</span>
                                        }
                                    </div>
                                    <div className="item-card-body">
                                        <div className="item-card-top">
                                            <h4>{item.title}</h4>
                                            <span className={`status-badge status-${item.status}`}>{item.status}</span>
                                        </div>
                                        <p className="item-desc">{item.description}</p>
                                        <div className="item-meta">
                                            <span>📍 {item.location || "No location"}</span>
                                            <span>🏷 {item.category_name}</span>
                                            <span>📅 {new Date(item.date_reported).toLocaleDateString()}</span>
                                            {item.match_count > 0 && (
                                                <span style={{ color:"#16a34a", fontWeight:600 }}>✅ {item.match_count} match(es)</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="item-card-actions">
                                        {/* Lost item owner → navigate to top matches to select */}
                                        {item.match_count > 0 && item.status === "active" && item.type === "Lost" && (
                                            <button className="action-btn view-matches" onClick={() => navigate(`/topmatches/${item.item_id}`)}>
                                                View Matches
                                            </button>
                                        )}
                                        {/* Found item owner → jump to chats tab */}
                                        {item.match_count > 0 && item.status === "active" && item.type === "Found" && (
                                            <button className="action-btn view-matches" onClick={() => setActiveTab("chats")}>
                                                View Chats
                                            </button>
                                        )}
                                        {item.status === "active" && (
                                            <button className="action-btn resolve-btn" onClick={() => handleResolve(item.item_id)}>
                                                Mark Resolved
                                            </button>
                                        )}
                                        <button className="action-btn delete-btn" onClick={() => handleDelete(item.item_id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            <footer className="notification-footer">© 2025 Lost&Found. All rights reserved.</footer>
        </div>
    );
};

export default NotificationPage;
