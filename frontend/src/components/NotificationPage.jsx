import React, { useState, useEffect, useCallback } from "react";
import "./NotificationPage.css";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const ITEMS_PER_PAGE = 5;

// ─── Pagination Controls Component ───────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: "6px", marginTop: "20px", flexWrap: "wrap",
        }}>
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                style={pgStyle(false, page === 1)}
            >
                ← Prev
            </button>

            {pages.map(p => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    style={pgStyle(p === page, false)}
                >
                    {p}
                </button>
            ))}

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                style={pgStyle(false, page === totalPages)}
            >
                Next →
            </button>
        </div>
    );
};

const pgStyle = (active, disabled) => ({
    padding: "6px 14px",
    borderRadius: "6px",
    border: "1px solid #dcfce7",
    background: active ? "#22c55e" : disabled ? "#f9fafb" : "#fff",
    color: active ? "#fff" : disabled ? "#9ca3af" : "#166534",
    fontWeight: 600,
    fontSize: "13px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
});

// ─── Main Component ───────────────────────────────────────────────────────────
const NotificationPage = () => {
    const [activeTab, setActiveTab] = useState("lost");

    // ── Lost items state ──────────────────────────────────────────────────────
    const [lostItems, setLostItems]           = useState([]);
    const [lostPage, setLostPage]             = useState(1);
    const [lostTotalPages, setLostTotalPages] = useState(1);
    const [lostTotal, setLostTotal]           = useState(0);
    const [lostLoading, setLostLoading]       = useState(false);

    // ── Found items state ─────────────────────────────────────────────────────
    const [foundItems, setFoundItems]           = useState([]);
    const [foundPage, setFoundPage]             = useState(1);
    const [foundTotalPages, setFoundTotalPages] = useState(1);
    const [foundTotal, setFoundTotal]           = useState(0);
    const [foundLoading, setFoundLoading]       = useState(false);

    // ── Other state ───────────────────────────────────────────────────────────
    const [resolvedCount, setResolvedCount]     = useState(0);
    const [notifications, setNotifications]     = useState([]);
    const [chats, setChats]                     = useState([]);
    const [initialLoading, setInitialLoading]   = useState(true);
    const [error, setError]                     = useState("");

    const navigate         = useNavigate();
    const { user, logout } = useAuth();
    const { openChat }     = useChat();

    // ── Fetch lost items (called on mount and page change) ────────────────────
    const fetchLostItems = useCallback(async (page = 1) => {
        setLostLoading(true);
        try {
            const res = await api.get("/items/my-items", {
                params: { type: "Lost", page, limit: ITEMS_PER_PAGE }
            });
            setLostItems(res.data.items || []);
            setLostTotal(res.data.total || 0);
            setLostTotalPages(res.data.total_pages || 1);
        } catch {
            setError("Failed to load lost items.");
        } finally {
            setLostLoading(false);
        }
    }, []);

    // ── Fetch found items ─────────────────────────────────────────────────────
    const fetchFoundItems = useCallback(async (page = 1) => {
        setFoundLoading(true);
        try {
            const res = await api.get("/items/my-items", {
                params: { type: "Found", page, limit: ITEMS_PER_PAGE }
            });
            setFoundItems(res.data.items || []);
            setFoundTotal(res.data.total || 0);
            setFoundTotalPages(res.data.total_pages || 1);
        } catch {
            setError("Failed to load found items.");
        } finally {
            setFoundLoading(false);
        }
    }, []);

    // ── Fetch resolved count (one-time, no pagination needed) ─────────────────
    const fetchResolvedCount = useCallback(async () => {
        try {
            const res = await api.get("/items/my-items", {
                params: { status: "resolved", limit: 1, page: 1 }
            });
            setResolvedCount(res.data.total || 0);
        } catch {}
    }, []);

    // ── Fetch chats ───────────────────────────────────────────────────────────
    const fetchChats = useCallback(async () => {
        try {
            const res = await api.get("/chat/active");
            setChats(res.data.chats || []);
        } catch {}
    }, []);

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            fetchLostItems(1),
            fetchFoundItems(1),
            fetchResolvedCount(),
            api.get("/notifications"),
            api.get("/chat/active"),
        ])
            .then(([, , , notifRes, chatsRes]) => {
                setNotifications(notifRes.data.notifications || []);
                setChats(chatsRes.data.chats || []);
            })
            .catch(() => setError("Failed to load data. Please refresh."))
            .finally(() => setInitialLoading(false));
    }, [fetchLostItems, fetchFoundItems, fetchResolvedCount]);

    // ── Page change handlers ──────────────────────────────────────────────────
    const handleLostPageChange = (newPage) => {
        setLostPage(newPage);
        fetchLostItems(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleFoundPageChange = (newPage) => {
        setFoundPage(newPage);
        fetchFoundItems(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── Notification handlers ─────────────────────────────────────────────────
    const handleMarkRead = async (notifId) => {
        try {
            await api.patch(`/notifications/${notifId}/read`);
            setNotifications(prev =>
                prev.map(n => n.notification_id === notifId ? { ...n, is_read: true } : n)
            );
        } catch {}
    };

    const handleMarkAllRead = async () => {
        try {
            await api.patch("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {}
    };

    // ── Item action handlers ──────────────────────────────────────────────────
    const handleResolve = async (itemId, type) => {
        try {
            await api.patch(`/items/${itemId}/resolve`);
            if (type === "Lost") {
                setLostItems(prev => prev.map(i => i.item_id === itemId ? { ...i, status: "resolved" } : i));
            } else {
                setFoundItems(prev => prev.map(i => i.item_id === itemId ? { ...i, status: "resolved" } : i));
            }
            setResolvedCount(prev => prev + 1);
        } catch {}
    };

    const handleDelete = async (itemId, type) => {
        if (!window.confirm("Delete this item report?")) return;
        try {
            await api.delete(`/items/${itemId}`);
            if (type === "Lost") {
                setLostItems(prev => prev.filter(i => i.item_id !== itemId));
                setLostTotal(prev => prev - 1);
            } else {
                setFoundItems(prev => prev.filter(i => i.item_id !== itemId));
                setFoundTotal(prev => prev - 1);
            }
        } catch {}
    };

    // ── Chat handler ──────────────────────────────────────────────────────────
    const handleOpenChat = (chat) => {
        const isLostOwner  = chat.lost_user_id === user.user_id;
        const receiverId   = isLostOwner ? chat.found_user_id   : chat.lost_user_id;
        const receiverName = isLostOwner ? chat.found_user_name  : chat.lost_user_name;
        openChat({ matchId: chat.match_id, receiverId, receiverName });
    };

    // ── Derived values ────────────────────────────────────────────────────────
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const unreadChats = chats.reduce((sum, c) => sum + parseInt(c.unread_count || 0), 0);
    
    const getDaysRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        const diff = new Date(expiresAt) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // ── Expiry chip — shown on item cards ────────────────────────────────────────
    const ExpiryChip = ({ expiresAt, status }) => {
        if (status === "expired") {
            return (
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    background: "#fef2f2", color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "20px", padding: "2px 10px",
                    fontSize: "11px", fontWeight: 700,
                }}>
                    ⛔ Expired
                </span>
            );
        }

        const days = getDaysRemaining(expiresAt);
        if (days === null) return null;

        // Only show chip when ≤ 7 days remain — no noise for healthy items
        if (days > 7) return null;

        const isUrgent = days <= 2;
        return (
            <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                background: isUrgent ? "#fef2f2" : "#fefce8",
                color:      isUrgent ? "#dc2626"  : "#92400e",
                border:     `1px solid ${isUrgent ? "#fecaca" : "#fde68a"}`,
                borderRadius: "20px", padding: "2px 10px",
                fontSize: "11px", fontWeight: 700,
            }}>
                {isUrgent ? "🔴" : "⚠️"} {days <= 0 ? "Expires today" : `${days}d left`}
            </span>
        );
    };

    // ── Item card renderer (shared for lost + found) ──────────────────────────
    const renderItemCard = (item) => {
        const days = getDaysRemaining(item.expires_at);
        const isExpiringSoon = days !== null && days <= 7 && item.status === "active";

        return (
            <div
                key={item.item_id}
                className="item-card"
                style={isExpiringSoon ? { borderLeft: "3px solid #f59e0b" } : undefined}
            >
                <div className="item-card-img">
                    {item.primary_image
                        ? <img src={`http://localhost:5000/uploads/${item.primary_image}`} alt={item.title} />
                        : <span>📦</span>
                    }
                </div>

                <div className="item-card-body">
                    <div className="item-card-top">
                        <h4>{item.title}</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span className={`status-badge status-${item.status}`}>{item.status}</span>
                            <ExpiryChip expiresAt={item.expires_at} status={item.status} />
                        </div>
                    </div>

                    <p className="item-desc">{item.description}</p>

                    <div className="item-meta">
                        <span>📍 {item.location || "No location"}</span>
                        <span>🏷 {item.category_name}</span>
                        <span>📅 {new Date(item.date_reported).toLocaleDateString()}</span>
                        {item.expires_at && item.status === "active" && (
                            <span style={{ color: days <= 3 ? "#dc2626" : "#6b7280" }}>
                                🗓 Expires {new Date(item.expires_at).toLocaleDateString()}
                            </span>
                        )}
                        {item.match_count > 0 && (
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                ✅ {item.match_count} match(es)
                            </span>
                        )}
                    </div>

                    {/* Expiry warning banner — only shown in final 3 days */}
                    {item.status === "active" && days !== null && days <= 3 && days > 0 && (
                        <div style={{
                            background: "#fefce8", border: "1px solid #fde68a",
                            borderRadius: "6px", padding: "6px 10px",
                            fontSize: "12px", color: "#92400e", marginTop: "8px",
                        }}>
                            ⚠️ This report expires in <strong>{days} day{days !== 1 ? "s" : ""}</strong>.
                            After expiry it will no longer appear in AI matching.
                        </div>
                    )}

                    {item.status === "expired" && (
                        <div style={{
                            background: "#fef2f2", border: "1px solid #fecaca",
                            borderRadius: "6px", padding: "6px 10px",
                            fontSize: "12px", color: "#b91c1c", marginTop: "8px",
                        }}>
                            ⛔ This report has expired and is no longer active.
                            Delete it and re-report if the item is still missing.
                        </div>
                    )}
                </div>

                <div className="item-card-actions">
                    {item.match_count > 0 && item.status === "active" && item.type === "Lost" && (
                        <button
                            className="action-btn view-matches"
                            onClick={() => navigate(`/topmatches/${item.item_id}`)}
                        >
                            View Matches
                        </button>
                    )}
                    {item.match_count > 0 && item.status === "active" && item.type === "Found" && (
                        <button
                            className="action-btn view-matches"
                            onClick={() => setActiveTab("chats")}
                        >
                            View Chats
                        </button>
                    )}
                    {item.status === "active" && (
                        <button
                            className="action-btn resolve-btn"
                            onClick={() => handleResolve(item.item_id, item.type)}
                        >
                            Mark Resolved
                        </button>
                    )}
                    <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(item.item_id, item.type)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="notification-page">

            {/* HEADER */}
            <header className="notification-header">
                <div className="notification-logo">Lost<span style={{ color: "#22c55e" }}>&Found</span></div>
                <div className="notification-nav">
                    <button onClick={() => navigate("/userlanding")}>Home</button>
                    <button onClick={() => { logout(); navigate("/"); }}>Sign Out</button>
                </div>
            </header>

            <div className="notification-container">

                <div className="title-row">
                    <h1>My Dashboard</h1>
                    <button className="report-btn" onClick={() => navigate("/lost")} style={{ marginRight: "8px" }}>
                        + Report Lost
                    </button>
                    <button className="report-btn found-report-btn" onClick={() => navigate("/found")}>
                        + Report Found
                    </button>
                </div>

                {error && (
                    <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error}
                    </div>
                )}

                {/* STATS — now use API totals, not array lengths */}
                <div className="stats-grid">
                    <div className="stat-card stat-lost">
                        <h3>Lost Items</h3>
                        <p>{lostTotal}</p>
                    </div>
                    <div className="stat-card stat-found">
                        <h3>Found Items</h3>
                        <p>{foundTotal}</p>
                    </div>
                    <div className="stat-card stat-resolved">
                        <h3>Resolved</h3>
                        <p>{resolvedCount}</p>
                    </div>
                </div>

                {/* NOTIFICATIONS */}
                {notifications.length > 0 && (
                    <div className="notif-panel">
                        <div className="notif-panel-header">
                            <h3>
                                🔔 Notifications{" "}
                                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                            </h3>
                            {unreadCount > 0 && (
                                <button className="mark-all-btn" onClick={handleMarkAllRead}>
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="notif-list">
                            {notifications.slice(0, 5).map(n => (
                                <div
                                    key={n.notification_id}
                                    className={`notif-item ${!n.is_read ? "unread" : ""}`}
                                    onClick={() => {
                                        handleMarkRead(n.notification_id);
                                        if (n.item_id) navigate(`/topmatches/${n.item_id}`);
                                    }}
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
                    <div
                        className={`tab ${activeTab === "lost" ? "active" : ""}`}
                        onClick={() => setActiveTab("lost")}
                    >
                        My Lost Items ({lostTotal})
                    </div>
                    <div
                        className={`tab ${activeTab === "found" ? "active" : ""}`}
                        onClick={() => setActiveTab("found")}
                    >
                        My Found Items ({foundTotal})
                    </div>
                    <div
                        className={`tab ${activeTab === "chats" ? "active" : ""}`}
                        onClick={() => { setActiveTab("chats"); fetchChats(); }}
                    >
                        My Chats ({chats.length})
                        {unreadChats > 0 && (
                            <span className="unread-badge" style={{ marginLeft: "6px" }}>{unreadChats}</span>
                        )}
                    </div>
                </div>

                {/* ── LOST TAB ── */}
                {activeTab === "lost" && (
                    initialLoading || lostLoading ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#166534" }}>Loading...</div>
                    ) : lostItems.length === 0 ? (
                        <div className="empty-box">
                            <h3>No Lost Items Yet</h3>
                            <p>Report something you've lost and our AI will try to find a match.</p>
                            <button className="report-btn" style={{ marginTop: "12px" }} onClick={() => navigate("/lost")}>
                                + Report Lost Item
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="items-list">
                                {lostItems.map(renderItemCard)}
                            </div>
                            <Pagination
                                page={lostPage}
                                totalPages={lostTotalPages}
                                onPageChange={handleLostPageChange}
                            />
                            <div style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>
                                Showing {lostItems.length} of {lostTotal} lost items
                            </div>
                        </>
                    )
                )}

                {/* ── FOUND TAB ── */}
                {activeTab === "found" && (
                    initialLoading || foundLoading ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#166534" }}>Loading...</div>
                    ) : foundItems.length === 0 ? (
                        <div className="empty-box">
                            <h3>No Found Items Yet</h3>
                            <p>Report something you've found and help reunite it with its owner.</p>
                            <button className="report-btn" style={{ marginTop: "12px" }} onClick={() => navigate("/found")}>
                                + Report Found Item
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="items-list">
                                {foundItems.map(renderItemCard)}
                            </div>
                            <Pagination
                                page={foundPage}
                                totalPages={foundTotalPages}
                                onPageChange={handleFoundPageChange}
                            />
                            <div style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>
                                Showing {foundItems.length} of {foundTotal} found items
                            </div>
                        </>
                    )
                )}

                {/* ── CHATS TAB ── */}
                {activeTab === "chats" && (
                    chats.length === 0 ? (
                        <div className="empty-box">
                            <h3>No Active Chats</h3>
                            <p>Chats appear here once a message has been exchanged with another user.</p>
                        </div>
                    ) : (
                        <div className="items-list">
                            {chats.map(chat => {
                                const isLostOwner = chat.lost_user_id === user.user_id;
                                const otherName   = isLostOwner ? chat.found_user_name : chat.lost_user_name;
                                const itemTitle   = isLostOwner ? chat.lost_item_title  : chat.found_item_title;
                                const role        = isLostOwner ? "You lost this" : "You found this";

                                return (
                                    <div
                                        key={chat.match_id}
                                        className="item-card"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleOpenChat(chat)}
                                    >
                                        <div className="item-card-img" style={{ fontSize: "2rem" }}>💬</div>
                                        <div className="item-card-body">
                                            <div className="item-card-top">
                                                <h4>{itemTitle}</h4>
                                                <span className="status-badge status-active">{role}</span>
                                            </div>
                                            <p className="item-desc">
                                                <strong>{otherName}</strong>:{" "}
                                                {chat.last_message || "No messages yet — start the conversation"}
                                            </p>
                                            <div className="item-meta">
                                                <span>🤝 {chat.match_status}</span>
                                                <span>{chat.confidence_score}% confidence</span>
                                                {chat.last_message_at && (
                                                    <span>{new Date(chat.last_message_at).toLocaleDateString()}</span>
                                                )}
                                                {chat.unread_count > 0 && (
                                                    <span style={{ color: "#dc2626", fontWeight: 600 }}>
                                                        {chat.unread_count} unread
                                                    </span>
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
                )}

            </div>

            <footer className="notification-footer">© 2025 Lost&Found. All rights reserved.</footer>
        </div>
    );
};

export default NotificationPage;
