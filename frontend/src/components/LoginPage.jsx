import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [error, setError]       = useState("");
    const [loading, setLoading]   = useState(false);
    const [showPwd, setShowPwd]   = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
        link.id = 'login-fonts';
        document.head.appendChild(link);
        return () => { const el = document.getElementById('login-fonts'); if (el) el.remove(); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("/auth/login", { email, password });
            login(res.data.user, res.data.token);
            navigate("/userlanding");
        } catch (err) {
            const msg = err.response?.data?.message || "Login failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.logoWrap}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="15" cy="15" r="10.5" stroke="#00e07a" strokeWidth="2.4"/>
                        <circle cx="15" cy="15" r="4" fill="#00e07a" opacity="0.2"/>
                        <circle cx="15" cy="15" r="2" fill="#00e07a"/>
                        <line x1="22.5" y1="22.5" x2="32" y2="32" stroke="#00e07a" strokeWidth="2.8" strokeLinecap="round"/>
                    </svg>
                    <div>
                        <div style={styles.logoName}>Lost & Found</div>
                        <div style={styles.logoSub}>AI Platform</div>
                    </div>
                </div>

                <h2 style={styles.title}>Welcome back</h2>
                <p style={styles.subtitle}>Sign in to access your account</p>

                {error && (
                    <div style={styles.errorBox}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={styles.inputBox}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputBox}>
                        <label style={styles.label}>Password</label>
                        <div style={styles.inputWrap}>
                            <input
                                type={showPwd ? "text" : "password"}
                                placeholder="Your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ ...styles.input, paddingRight: "42px" }}
                                required
                            />
                            <button
                                type="button"
                                style={styles.eyeBtn}
                                onClick={() => setShowPwd(v => !v)}
                                tabIndex={-1}
                            >
                                {showPwd ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    <div style={styles.forgot}>
                        <span style={styles.link} onClick={() => navigate("/forgot-password")}>
                            Forgot your password?
                        </span>
                    </div>

                    <button
                        type="submit"
                        style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                        disabled={loading}
                    >
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>

                <p style={styles.signupText}>
                    Don't have an account?{" "}
                    <span style={styles.link} onClick={() => navigate("/signup")}>
                        Sign Up
                    </span>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#07090f",
        padding: "24px",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        backgroundImage: "radial-gradient(rgba(0,224,122,0.055) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
    },
    card: {
        width: "100%",
        maxWidth: "400px",
        padding: "2.5rem 2.25rem",
        borderRadius: "18px",
        background: "#111826",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        color: "#dde4f0",
    },
    logoWrap: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "2rem",
    },
    logoName: {
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: "1.1rem",
        fontWeight: 800,
        color: "#00e07a",
        letterSpacing: "-0.02em",
        lineHeight: 1,
    },
    logoSub: {
        fontSize: "0.58rem",
        fontWeight: 600,
        color: "rgba(255,255,255,0.28)",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        marginTop: "3px",
    },
    title: {
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: "1.65rem",
        fontWeight: 800,
        color: "#f0f4ff",
        marginBottom: "0.35rem",
        letterSpacing: "-0.03em",
    },
    subtitle: {
        fontSize: "0.87rem",
        color: "#7a8499",
        marginBottom: "1.75rem",
    },
    errorBox: {
        background: "rgba(255,77,109,0.1)",
        color: "#ff4d6d",
        border: "1px solid rgba(255,77,109,0.25)",
        borderRadius: "8px",
        padding: "10px 14px",
        marginBottom: "1.25rem",
        fontSize: "0.84rem",
        lineHeight: 1.5,
    },
    inputBox: {
        textAlign: "left",
        marginBottom: "1.1rem",
    },
    label: {
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#7a8499",
        marginBottom: "6px",
        display: "block",
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
        borderRadius: "9px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#0c1018",
        color: "#dde4f0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: "0.9rem",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s, box-shadow 0.2s",
    },
    eyeBtn: {
        position: "absolute",
        right: "10px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "15px",
        padding: 0,
        lineHeight: 1,
        color: "#7a8499",
    },
    forgot: {
        textAlign: "right",
        marginBottom: "1.25rem",
    },
    link: {
        fontSize: "0.82rem",
        color: "#00e07a",
        textDecoration: "none",
        cursor: "pointer",
        fontWeight: 600,
        transition: "opacity 0.2s",
    },
    loginBtn: {
        width: "100%",
        padding: "0.72rem",
        background: "#00e07a",
        color: "#030a04",
        border: "none",
        borderRadius: "9px",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: "0.95rem",
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: "0.01em",
        transition: "all 0.2s",
    },
    signupText: {
        fontSize: "0.83rem",
        marginTop: "1.25rem",
        color: "#7a8499",
        textAlign: "center",
    },
};
