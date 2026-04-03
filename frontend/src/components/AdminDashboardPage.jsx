import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
    <div style={{
        background: "#111826",
        border: "1px solid rgba(255,255,255,0.07)",
        borderTop: `3px solid ${color}`,
        borderRadius: "14px",
        padding: "20px",
        minWidth: 0,
        transition: "transform 0.2s, border-color 0.2s",
    }}>
        <div style={{ fontSize: "26px", marginBottom: "8px" }}>{icon}</div>
        <div style={{
            fontFamily: "'Syne', system-ui, sans-serif",
            fontSize: "2rem",
            fontWeight: 800,
            color: "#f0f4ff",
            letterSpacing: "-0.03em",
            lineHeight: 1,
        }}>{value ?? "—"}</div>
        <div style={{ fontSize: "0.75rem", color: "#7a8499", marginTop: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div style={{ display: "flex", gap: "5px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1} style={pgBtn(page === 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => onPageChange(p)} style={pgBtn(false, p === page)}>{p}</button>
            ))}
            <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} style={pgBtn(page === totalPages)}>Next →</button>
        </div>
    );
};

const pgBtn = (disabled, active = false) => ({
    padding: "6px 13px",
    borderRadius: "7px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: active ? "#00e07a" : disabled ? "rgba(255,255,255,0.03)" : "#111826",
    color: active ? "#030a04" : disabled ? "#3a4255" : "#7a8499",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "0.8rem",
    fontWeight: 700,
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    transition: "all 0.15s",
});

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000,
    }}>
        <div style={{
            background: "#111826",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "18px",
            padding: "2.25rem",
            maxWidth: "380px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
            <p style={{ fontSize: "0.92rem", color: "#b0b8c8", marginBottom: "1.75rem", lineHeight: 1.65 }}>{message}</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={onCancel} style={{
                    padding: "0.6rem 1.5rem", borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "transparent", color: "#7a8499",
                    cursor: "pointer", fontWeight: 600, fontSize: "0.88rem",
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}>Cancel</button>
                <button onClick={onConfirm} style={{
                    padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none",
                    background: "#ff4d6d", color: "#fff",
                    cursor: "pointer", fontWeight: 700, fontSize: "0.88rem",
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}>Confirm</button>
            </div>
        </div>
    </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const navigate         = useNavigate();
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        if (user && !isAdmin()) navigate("/userlanding", { replace: true });
    }, [user, isAdmin, navigate]);

    // Inject fonts
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
        link.id = 'admin-dash-fonts';
        document.head.appendChild(link);
        return () => { const el = document.getElementById('admin-dash-fonts'); if (el) el.remove(); };
    }, []);

    const [activeTab, setActiveTab]       = useState("overview");
    const [toast, setToast]               = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    const [stats, setStats]               = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [users, setUsers]               = useState([]);
    const [usersTotal, setUsersTotal]     = useState(0);
    const [usersPage, setUsersPage]       = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [userSearch, setUserSearch]     = useState("");
    const [usersLoading, setUsersLoading] = useState(false);

    const [items, setItems]               = useState([]);
    const [itemsTotal, setItemsTotal]     = useState(0);
    const [itemsPage, setItemsPage]       = useState(1);
    const [itemsTotalPages, setItemsTotalPages] = useState(1);
    const [itemSearch, setItemSearch]     = useState("");
    const [itemTypeFilter, setItemTypeFilter]   = useState("");
    const [itemStatusFilter, setItemStatusFilter] = useState("");
    const [itemsLoading, setItemsLoading] = useState(false);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        api.get("/admin/stats")
            .then(res => setStats(res.data.stats))
            .catch(() => showToast("Failed to load stats", "error"))
            .finally(() => setStatsLoading(false));
    }, []);

    const fetchUsers = useCallback(() => {
        setUsersLoading(true);
        api.get("/admin/users", { params: { page: usersPage, limit: 20, search: userSearch } })
            .then(res => {
                setUsers(res.data.users);
                setUsersTotal(res.data.total);
                setUsersTotalPages(res.data.total_pages);
            })
            .catch(() => showToast("Failed to load users", "error"))
            .finally(() => setUsersLoading(false));
    }, [usersPage, userSearch]);

    useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab, fetchUsers]);

    const fetchItems = useCallback(() => {
        setItemsLoading(true);
        api.get("/admin/items", {
            params: { page: itemsPage, limit: 20, search: itemSearch, type: itemTypeFilter, status: itemStatusFilter }
        })
            .then(res => {
                setItems(res.data.items);
                setItemsTotal(res.data.total);
                setItemsTotalPages(res.data.total_pages);
            })
            .catch(() => showToast("Failed to load items", "error"))
            .finally(() => setItemsLoading(false));
    }, [itemsPage, itemSearch, itemTypeFilter, itemStatusFilter]);

    useEffect(() => { if (activeTab === "items") fetchItems(); }, [activeTab, fetchItems]);

    const handleDeactivate = (u) => {
        setConfirmModal({
            message: `Deactivate "${u.name}"? They will no longer be able to log in.`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await api.patch(`/admin/users/${u.user_id}/deactivate`);
                    showToast(`"${u.name}" deactivated`);
                    fetchUsers();
                } catch (err) {
                    showToast(err.response?.data?.error || "Failed to deactivate", "error");
                }
            }
        });
    };

    const handleReactivate = async (u) => {
        try {
            await api.patch(`/admin/users/${u.user_id}/reactivate`);
            showToast(`"${u.name}" reactivated`);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to reactivate", "error");
        }
    };

    const handleRunRematch = async () => {
        try {
            await fetch("http://localhost:8000/ai/scheduler/run", { method: "POST" });
            showToast("Re-match job triggered! Check AI service logs.");
        } catch {
            showToast("Could not reach AI service", "error");
        }
    };

    const handleForceResolve = (item) => {
        setConfirmModal({
            message: `Mark "${item.title}" as resolved?`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await api.patch(`/admin/items/${item.item_id}/resolve`);
                    showToast(`"${item.title}" resolved`);
                    fetchItems();
                } catch (err) {
                    showToast(err.response?.data?.error || "Failed to resolve", "error");
                }
            }
        });
    };

    const handleDeleteItem = (item) => {
        setConfirmModal({
            message: `Permanently remove "${item.title}" from the platform? This cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await api.delete(`/admin/items/${item.item_id}`);
                    showToast(`"${item.title}" removed`);
                    fetchItems();
                } catch (err) {
                    showToast(err.response?.data?.error || "Failed to delete", "error");
                }
            }
        });
    };

    const handleRunExpiry = async () => {
        try {
            const res = await api.post("/admin/run-expiry");
            showToast(`Expiry job done — ${res.data.expired} item(s) expired`);
        } catch {
            showToast("Failed to run expiry job", "error");
        }
    };

    return (
        <div style={S.page}>
            {/* Dot grid */}
            <div style={S.dotGrid} />

            {/* Toast */}
            {toast && (
                <div style={{
                    ...S.toast,
                    background: toast.type === "error"
                        ? "rgba(255,77,109,0.15)"
                        : "rgba(0,224,122,0.12)",
                    border: `1px solid ${toast.type === "error" ? "rgba(255,77,109,0.3)" : "rgba(0,224,122,0.3)"}`,
                    color: toast.type === "error" ? "#ff4d6d" : "#00e07a",
                }}>
                    {toast.type === "error" ? "✗" : "✓"} {toast.msg}
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                />
            )}

            {/* Navbar */}
            <nav style={S.navbar}>
                <div style={S.navLeft}>
                    <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
                        <circle cx="15" cy="15" r="10.5" stroke="#00e07a" strokeWidth="2.4"/>
                        <circle cx="15" cy="15" r="2" fill="#00e07a"/>
                        <line x1="22.5" y1="22.5" x2="32" y2="32" stroke="#00e07a" strokeWidth="2.8" strokeLinecap="round"/>
                    </svg>
                    <div>
                        <div style={S.navBrand}>Lost & Found</div>
                        <div style={S.navSub}>Admin Dashboard</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#7a8499", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                        <span style={{ color: "#4f9cff", fontWeight: 600 }}>{user?.name}</span>
                    </span>
                    <button style={S.navBtn} onClick={() => navigate("/userlanding")}>
                        ← Back to App
                    </button>
                </div>
            </nav>

            <div style={S.body}>
                {/* Tabs */}
                <div style={S.tabs}>
                    {[
                        { key: "overview", label: "📊  Overview" },
                        { key: "users",    label: "👥  Users" },
                        { key: "items",    label: "📦  Items" },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            style={{ ...S.tab, ...(activeTab === tab.key ? S.tabActive : {}) }}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── OVERVIEW ── */}
                {activeTab === "overview" && (
                    <div>
                        <h2 style={S.sectionTitle}>Platform Overview</h2>
                        {statsLoading ? (
                            <p style={{ color: "#7a8499", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Loading stats…</p>
                        ) : stats ? (
                            <>
                                <div style={S.statsGrid}>
                                    <StatCard icon="👥" label="Total Users"       value={stats.total_users}       color="#6366f1" />
                                    <StatCard icon="✅" label="Verified Users"    value={stats.verified_users}    color="#00e07a" />
                                    <StatCard icon="📦" label="Active Items"      value={stats.total_items}       color="#ffb347" />
                                    <StatCard icon="🔍" label="Lost Items"        value={stats.total_lost}        color="#ff4d6d" />
                                    <StatCard icon="📬" label="Found Items"       value={stats.total_found}       color="#4f9cff" />
                                    <StatCard icon="🎯" label="Total Matches"     value={stats.total_matches}     color="#a78bfa" />
                                    <StatCard icon="🤝" label="Confirmed Matches" value={stats.confirmed_matches} color="#00e07a" />
                                    <StatCard icon="✔️" label="Resolved Items"   value={stats.total_resolved}    color="#0ea5e9" />
                                </div>

                                {/* Match rate bar */}
                                {parseInt(stats.total_matches) > 0 && (
                                    <div style={{
                                        background: "#111826",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        borderRadius: "14px",
                                        padding: "1.5rem",
                                        marginTop: "16px",
                                    }}>
                                        <div style={{ fontWeight: 700, color: "#dde4f0", marginBottom: "10px", fontFamily: "'Syne', system-ui, sans-serif", fontSize: "1rem" }}>
                                            Match Confirmation Rate
                                        </div>
                                        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "8px", height: "10px", overflow: "hidden" }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${Math.round((stats.confirmed_matches / stats.total_matches) * 100)}%`,
                                                background: "linear-gradient(90deg, #00e07a, #00ff8a)",
                                                borderRadius: "8px",
                                                transition: "width 0.8s ease",
                                                boxShadow: "0 0 12px rgba(0,224,122,0.4)",
                                            }} />
                                        </div>
                                        <div style={{ fontSize: "0.78rem", color: "#7a8499", marginTop: "8px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                                            {Math.round((stats.confirmed_matches / stats.total_matches) * 100)}% of matches confirmed by owners
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px", justifyContent: "center" }}>
                                    <button onClick={handleRunRematch} style={S.actionBtn("#6366f1")}>
                                        🔄 Run Re-match Now
                                    </button>
                                    <button onClick={handleRunExpiry} style={S.actionBtn("#ffb347")}>
                                        ⏰ Run Expiry Now
                                    </button>
                                </div>
                                <p style={{ fontSize: "0.75rem", color: "#4a5568", marginTop: "10px", textAlign: "center", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                                    Re-match runs automatically every 30 min. Click to trigger immediately.
                                </p>
                            </>
                        ) : (
                            <p style={{ color: "#ff4d6d", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Could not load stats.</p>
                        )}
                    </div>
                )}

                {/* ── USERS ── */}
                {activeTab === "users" && (
                    <div>
                        <div style={S.tableHeader}>
                            <h2 style={{ ...S.sectionTitle, margin: 0 }}>
                                Users
                                <span style={S.totalBadge}>{usersTotal}</span>
                            </h2>
                            <input
                                type="text"
                                placeholder="Search by name or email…"
                                value={userSearch}
                                onChange={e => { setUserSearch(e.target.value); setUsersPage(1); }}
                                style={S.searchInput}
                            />
                        </div>

                        {usersLoading ? (
                            <p style={{ color: "#7a8499", padding: "24px 0", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Loading users…</p>
                        ) : (
                            <div style={S.tableWrap}>
                                <table style={S.table}>
                                    <thead>
                                        <tr style={S.thead}>
                                            <th style={S.th}>Name</th>
                                            <th style={S.th}>Email</th>
                                            <th style={S.th}>Role</th>
                                            <th style={S.th}>Items</th>
                                            <th style={S.th}>Status</th>
                                            <th style={S.th}>Joined</th>
                                            <th style={S.th}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.user_id} style={S.tr}>
                                                <td style={S.td}><strong style={{ color: "#f0f4ff" }}>{u.name}</strong></td>
                                                <td style={{ ...S.td, color: "#7a8499", fontSize: "0.82rem" }}>{u.email}</td>
                                                <td style={S.td}>
                                                    <span style={{
                                                        ...S.badge,
                                                        background: u.role_name === "Admin" ? "rgba(99,102,241,0.15)" : "rgba(79,156,255,0.12)",
                                                        color:      u.role_name === "Admin" ? "#a78bfa" : "#4f9cff",
                                                        border: `1px solid ${u.role_name === "Admin" ? "rgba(99,102,241,0.25)" : "rgba(79,156,255,0.2)"}`,
                                                    }}>{u.role_name}</span>
                                                </td>
                                                <td style={{ ...S.td, textAlign: "center", color: "#b0b8c8" }}>{u.item_count}</td>
                                                <td style={S.td}>
                                                    <span style={{
                                                        ...S.badge,
                                                        background: u.is_verified ? "rgba(0,224,122,0.1)" : "rgba(255,77,109,0.1)",
                                                        color:      u.is_verified ? "#00e07a" : "#ff4d6d",
                                                        border: `1px solid ${u.is_verified ? "rgba(0,224,122,0.2)" : "rgba(255,77,109,0.2)"}`,
                                                    }}>
                                                        {u.is_verified ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td style={{ ...S.td, fontSize: "0.77rem", color: "#4a5568" }}>
                                                    {new Date(u.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={S.td}>
                                                    {u.role_name !== "Admin" && (
                                                        u.is_verified
                                                            ? <button style={S.dangerBtn} onClick={() => handleDeactivate(u)}>Deactivate</button>
                                                            : <button style={S.successBtn} onClick={() => handleReactivate(u)}>Reactivate</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#4a5568", padding: "2.5rem" }}>No users found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Pagination page={usersPage} totalPages={usersTotalPages} onPageChange={setUsersPage} />
                    </div>
                )}

                {/* ── ITEMS ── */}
                {activeTab === "items" && (
                    <div>
                        <div style={S.tableHeader}>
                            <h2 style={{ ...S.sectionTitle, margin: 0 }}>
                                Items
                                <span style={S.totalBadge}>{itemsTotal}</span>
                            </h2>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <input
                                    type="text"
                                    placeholder="Search title or description…"
                                    value={itemSearch}
                                    onChange={e => { setItemSearch(e.target.value); setItemsPage(1); }}
                                    style={S.searchInput}
                                />
                                <select
                                    value={itemTypeFilter}
                                    onChange={e => { setItemTypeFilter(e.target.value); setItemsPage(1); }}
                                    style={S.select}
                                >
                                    <option value="">All Types</option>
                                    <option value="Lost">Lost</option>
                                    <option value="Found">Found</option>
                                </select>
                                <select
                                    value={itemStatusFilter}
                                    onChange={e => { setItemStatusFilter(e.target.value); setItemsPage(1); }}
                                    style={S.select}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                        </div>

                        {itemsLoading ? (
                            <p style={{ color: "#7a8499", padding: "24px 0", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Loading items…</p>
                        ) : (
                            <div style={S.tableWrap}>
                                <table style={S.table}>
                                    <thead>
                                        <tr style={S.thead}>
                                            <th style={S.th}>Title</th>
                                            <th style={S.th}>Type</th>
                                            <th style={S.th}>Category</th>
                                            <th style={S.th}>Status</th>
                                            <th style={S.th}>Reported By</th>
                                            <th style={S.th}>Matches</th>
                                            <th style={S.th}>Date</th>
                                            <th style={S.th}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.item_id} style={S.tr}>
                                                <td style={S.td}>
                                                    <strong style={{ color: "#f0f4ff", fontSize: "0.9rem" }}>{item.title}</strong>
                                                    {item.location && <div style={{ fontSize: "0.73rem", color: "#4a5568", marginTop: "2px" }}>📍 {item.location}</div>}
                                                </td>
                                                <td style={S.td}>
                                                    <span style={{
                                                        ...S.badge,
                                                        background: item.type === "Lost" ? "rgba(255,77,109,0.12)" : "rgba(79,156,255,0.12)",
                                                        color:      item.type === "Lost" ? "#ff4d6d" : "#4f9cff",
                                                        border: `1px solid ${item.type === "Lost" ? "rgba(255,77,109,0.22)" : "rgba(79,156,255,0.22)"}`,
                                                    }}>{item.type}</span>
                                                </td>
                                                <td style={{ ...S.td, fontSize: "0.82rem", color: "#7a8499" }}>{item.category_name}</td>
                                                <td style={S.td}>
                                                    <span style={{
                                                        ...S.badge,
                                                        background: item.status === "active" ? "rgba(0,224,122,0.1)"
                                                            : item.status === "resolved" ? "rgba(79,156,255,0.12)"
                                                            : "rgba(255,179,71,0.1)",
                                                        color: item.status === "active" ? "#00e07a"
                                                            : item.status === "resolved" ? "#4f9cff"
                                                            : "#ffb347",
                                                        border: `1px solid ${item.status === "active" ? "rgba(0,224,122,0.2)"
                                                            : item.status === "resolved" ? "rgba(79,156,255,0.2)"
                                                            : "rgba(255,179,71,0.2)"}`,
                                                    }}>{item.status}</span>
                                                </td>
                                                <td style={{ ...S.td, fontSize: "0.82rem", color: "#b0b8c8" }}>
                                                    {item.reported_by}
                                                    <div style={{ fontSize: "0.72rem", color: "#4a5568" }}>{item.reported_by_email}</div>
                                                </td>
                                                <td style={{ ...S.td, textAlign: "center", color: "#b0b8c8" }}>{item.match_count}</td>
                                                <td style={{ ...S.td, fontSize: "0.75rem", color: "#4a5568" }}>
                                                    {new Date(item.date_reported).toLocaleDateString()}
                                                </td>
                                                <td style={S.td}>
                                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                                        {item.status === "active" && (
                                                            <button style={S.resolveBtn} onClick={() => handleForceResolve(item)}>Resolve</button>
                                                        )}
                                                        {item.is_active && (
                                                            <button style={S.dangerBtn} onClick={() => handleDeleteItem(item)}>Remove</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#4a5568", padding: "2.5rem" }}>No items found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <Pagination page={itemsPage} totalPages={itemsTotalPages} onPageChange={setItemsPage} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
    page: {
        minHeight: "100vh",
        background: "#07090f",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#dde4f0",
        position: "relative",
    },
    dotGrid: {
        position: "fixed",
        inset: 0,
        backgroundImage: "radial-gradient(rgba(79,156,255,0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        pointerEvents: "none",
        zIndex: 0,
    },
    navbar: {
        background: "rgba(7,9,15,0.92)",
        padding: "0 2rem",
        height: "62px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
    },
    navLeft: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    navBrand: {
        fontFamily: "'Syne', system-ui, sans-serif",
        color: "#00e07a",
        fontWeight: 800,
        fontSize: "1.05rem",
        letterSpacing: "-0.02em",
        lineHeight: 1,
    },
    navSub: {
        fontSize: "0.58rem",
        fontWeight: 600,
        color: "rgba(255,255,255,0.28)",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        marginTop: "2px",
    },
    navBtn: {
        background: "rgba(255,255,255,0.05)",
        color: "#7a8499",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "0.45rem 1rem",
        cursor: "pointer",
        fontSize: "0.82rem",
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: "all 0.2s",
    },
    body: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 1.5rem",
        position: "relative",
        zIndex: 1,
    },
    tabs: {
        display: "flex",
        gap: "2px",
        marginBottom: "2rem",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        paddingBottom: "0",
    },
    tab: {
        padding: "0.7rem 1.3rem",
        border: "none",
        background: "transparent",
        color: "#7a8499",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.87rem",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        borderRadius: "8px 8px 0 0",
        marginBottom: "-1px",
        borderBottom: "2px solid transparent",
        transition: "all 0.15s",
    },
    tabActive: {
        color: "#00e07a",
        borderBottom: "2px solid #00e07a",
        background: "rgba(0,224,122,0.05)",
    },
    sectionTitle: {
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: "1.35rem",
        fontWeight: 800,
        color: "#f0f4ff",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        letterSpacing: "-0.02em",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "14px",
    },
    actionBtn: (color) => ({
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}35`,
        borderRadius: "10px",
        padding: "0.65rem 1.5rem",
        fontSize: "0.9rem",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: "all 0.2s",
        letterSpacing: "0.01em",
    }),
    tableHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "1rem",
    },
    totalBadge: {
        background: "rgba(255,255,255,0.07)",
        color: "#7a8499",
        borderRadius: "20px",
        padding: "2px 10px",
        fontSize: "0.78rem",
        fontWeight: 700,
        border: "1px solid rgba(255,255,255,0.1)",
    },
    searchInput: {
        padding: "0.55rem 0.9rem",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        fontSize: "0.86rem",
        outline: "none",
        minWidth: "220px",
        background: "#0c1018",
        color: "#dde4f0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: "border-color 0.2s",
    },
    select: {
        padding: "0.55rem 0.9rem",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        fontSize: "0.86rem",
        outline: "none",
        background: "#0c1018",
        color: "#dde4f0",
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    },
    tableWrap: {
        overflowX: "auto",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#111826",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.875rem",
    },
    thead: {
        background: "rgba(255,255,255,0.03)",
    },
    th: {
        padding: "0.85rem 1rem",
        textAlign: "left",
        fontWeight: 700,
        color: "#4a5568",
        fontSize: "0.68rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        whiteSpace: "nowrap",
    },
    tr: {
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        transition: "background 0.1s",
    },
    td: {
        padding: "0.85rem 1rem",
        color: "#b0b8c8",
        verticalAlign: "middle",
        fontSize: "0.87rem",
    },
    badge: {
        display: "inline-block",
        padding: "2px 9px",
        borderRadius: "20px",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
    },
    dangerBtn: {
        background: "rgba(255,77,109,0.1)",
        color: "#ff4d6d",
        border: "1px solid rgba(255,77,109,0.2)",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "0.75rem",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: "all 0.15s",
    },
    successBtn: {
        background: "rgba(0,224,122,0.1)",
        color: "#00e07a",
        border: "1px solid rgba(0,224,122,0.2)",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "0.75rem",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: "all 0.15s",
    },
    resolveBtn: {
        background: "rgba(79,156,255,0.1)",
        color: "#4f9cff",
        border: "1px solid rgba(79,156,255,0.2)",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "0.75rem",
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: "all 0.15s",
    },
    toast: {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "12px 20px",
        borderRadius: "10px",
        fontWeight: 700,
        fontSize: "0.88rem",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        zIndex: 10001,
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        letterSpacing: "0.01em",
    },
};
