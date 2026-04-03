import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginPage() {
    const { login } = useAuth();

    const [form, setForm]         = useState({ email: "", password: "" });
    const [showPwd, setShowPwd]   = useState(false);
    const [status, setStatus]     = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
        link.id = 'admin-login-fonts';
        document.head.appendChild(link);
        return () => { const el = document.getElementById('admin-login-fonts'); if (el) el.remove(); };
    }, []);

    const handleChange = (e) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMsg("");

        try {
            const res = await api.post("/auth/login", form);
            const { token, user: loggedInUser } = res.data;

            if (loggedInUser.role_id !== 2) {
                setStatus("error");
                setErrorMsg("This account does not have admin privileges.");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(loggedInUser));
            window.location.href = "/admin";

        } catch (err) {
            setStatus("error");
            setErrorMsg(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Invalid email or password."
            );
        }
    };

    return (
        <div style={S.page}>
            <div style={S.card}>
                {/* Logo */}
                <div style={S.logoWrap}>
                    <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                        <circle cx="15" cy="15" r="10.5" stroke="#00e07a" strokeWidth="2.4"/>
                        <circle cx="15" cy="15" r="4" fill="#00e07a" opacity="0.2"/>
                        <circle cx="15" cy="15" r="2" fill="#00e07a"/>
                        <line x1="22.5" y1="22.5" x2="32" y2="32" stroke="#00e07a" strokeWidth="2.8" strokeLinecap="round"/>
                    </svg>
                    <div>
                        <div style={S.logoName}>Lost & Found</div>
                        <div style={S.logoSub}>AI Platform</div>
                    </div>
                </div>

                <div style={S.adminBadge}>🛡️ Admin Portal</div>

                <div style={S.divider} />

                <h2 style={S.title}>Restricted Access</h2>
                <p style={S.subtitle}>
                    This portal is restricted to platform administrators only.
                </p>

                <form onSubmit={handleSubmit} style={S.form}>
                    <div>
                        <label style={S.label} htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="admin@campus.edu"
                            value={form.email}
                            onChange={handleChange}
                            style={S.input}
                            disabled={status === "loading"}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label style={S.label} htmlFor="password">Password</label>
                        <div style={S.inputWrap}>
                            <input
                                id="password"
                                name="password"
                                type={showPwd ? "text" : "password"}
                                required
                                placeholder="Your password"
                                value={form.password}
                                onChange={handleChange}
                                style={{ ...S.input, paddingRight: "44px" }}
                                disabled={status === "loading"}
                            />
                            <button
                                type="button"
                                style={S.eyeBtn}
                                onClick={() => setShowPwd(v => !v)}
                                tabIndex={-1}
                            >
                                {showPwd ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {status === "error" && (
                        <div style={S.errorBox}>
                            🚫 {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{
                            ...S.submitBtn,
                            opacity: status === "loading" ? 0.7 : 1,
                            cursor: status === "loading" ? "not-allowed" : "pointer",
                        }}
                        disabled={status === "loading"}
                    >
                        {status === "loading" ? "Verifying…" : "Sign In to Admin Portal"}
                    </button>
                </form>

                <div style={S.footer}>
                    <Link to="/" style={S.backLink}>← Back to main site</Link>
                </div>
            </div>

            <div style={S.warning}>
                ⚠️ Unauthorised access to this portal is prohibited and may be logged.
            </div>
        </div>
    );
}

const S = {
    page: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#07090f",
        backgroundImage: "radial-gradient(rgba(79,156,255,0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        padding: "24px",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        gap: "16px",
    },
    card: {
        background: "#111826",
        border: "1px solid rgba(255,255,255,0.08)",
        borderTop: "2px solid rgba(79,156,255,0.35)",
        borderRadius: "18px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
        padding: "2.5rem 2.25rem",
        maxWidth: "420px",
        width: "100%",
        color: "#dde4f0",
    },
    logoWrap: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "1.5rem",
    },
    logoName: {
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: "1.05rem",
        fontWeight: 800,
        color: "#00e07a",
        letterSpacing: "-0.02em",
        lineHeight: 1,
    },
    logoSub: {
        fontSize: "0.57rem",
        fontWeight: 600,
        color: "rgba(255,255,255,0.28)",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        marginTop: "3px",
    },
    adminBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(79,156,255,0.1)",
        border: "1px solid rgba(79,156,255,0.22)",
        color: "#4f9cff",
        fontSize: "0.76rem",
        fontWeight: 700,
        padding: "0.28rem 0.85rem",
        borderRadius: "999px",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
    },
    divider: {
        height: "1px",
        background: "rgba(255,255,255,0.07)",
        margin: "1.25rem 0",
    },
    title: {
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: "1.45rem",
        fontWeight: 800,
        color: "#f0f4ff",
        margin: "0 0 0.35rem",
        letterSpacing: "-0.03em",
    },
    subtitle: {
        fontSize: "0.84rem",
        color: "#7a8499",
        margin: "0 0 1.5rem",
        lineHeight: 1.55,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    label: {
        display: "block",
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "#7a8499",
        marginBottom: "6px",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
    },
    inputWrap: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    input: {
        width: "100%",
        padding: "0.65rem 0.95rem",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "9px",
        fontSize: "0.9rem",
        color: "#dde4f0",
        background: "#0c1018",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: "border-color 0.2s, box-shadow 0.2s",
    },
    eyeBtn: {
        position: "absolute",
        right: "12px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "15px",
        padding: 0,
        lineHeight: 1,
        color: "#7a8499",
    },
    errorBox: {
        background: "rgba(255,77,109,0.1)",
        border: "1px solid rgba(255,77,109,0.25)",
        borderRadius: "8px",
        padding: "10px 13px",
        fontSize: "0.83rem",
        color: "#ff4d6d",
        lineHeight: 1.5,
    },
    submitBtn: {
        marginTop: "4px",
        background: "#4f9cff",
        color: "#fff",
        border: "none",
        borderRadius: "9px",
        padding: "0.72rem",
        fontSize: "0.92rem",
        fontWeight: 700,
        width: "100%",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        letterSpacing: "0.01em",
        transition: "all 0.2s",
        cursor: "pointer",
    },
    footer: {
        textAlign: "center",
        marginTop: "1.5rem",
    },
    backLink: {
        fontSize: "0.82rem",
        color: "#4a5568",
        textDecoration: "none",
        fontWeight: 500,
        transition: "color 0.2s",
    },
    warning: {
        fontSize: "0.72rem",
        color: "#3a4255",
        textAlign: "center",
        maxWidth: "380px",
    },
};