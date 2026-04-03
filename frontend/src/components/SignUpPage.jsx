import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function SignupPage() {
    const navigate = useNavigate();

    const [firstName, setFirstName]             = useState("");
    const [lastName, setLastName]               = useState("");
    const [email, setEmail]                     = useState("");
    const [password, setPassword]               = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError]                     = useState("");
    const [loading, setLoading]                 = useState(false);
    const [success, setSuccess]                 = useState(false);

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
        link.id = 'signup-fonts';
        document.head.appendChild(link);
        return () => { const el = document.getElementById('signup-fonts'); if (el) el.remove(); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/register", {
                name: `${firstName} ${lastName}`.trim(),
                email,
                password
            });
            setSuccess(true);
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
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
                    <div style={{ fontSize: "3rem", marginBottom: "1rem", textAlign:"center" }}>📧</div>
                    <h2 style={{ ...styles.title, textAlign:"center", fontSize:"1.4rem" }}>Check your inbox</h2>
                    <p style={{ color: "#7a8499", fontSize: "0.88rem", lineHeight: "1.65", textAlign:"center", marginTop:"0.5rem", marginBottom:"1.5rem" }}>
                        We've sent a verification link to <strong style={{color:"#00e07a"}}>{email}</strong>.<br />
                        Click the link to activate your account.
                    </p>
                    <button
                        style={{ ...styles.loginBtn, marginTop: "0" }}
                        onClick={() => navigate("/login")}
                    >
                        Go to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
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

                <h2 style={styles.title}>Create account</h2>
                <p style={styles.subtitle}>Join thousands reuniting with their belongings</p>

                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.row}>
                        <div style={{ ...styles.inputBox, flex: 1 }}>
                            <label style={styles.label}>First Name</label>
                            <input
                                type="text"
                                placeholder="First"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                        <div style={{ ...styles.inputBox, flex: 1 }}>
                            <label style={styles.label}>Last Name</label>
                            <input
                                type="text"
                                placeholder="Last"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>

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
                        <input
                            type="password"
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputBox}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                ...styles.input,
                                borderColor: confirmPassword && confirmPassword !== password
                                    ? "rgba(255,77,109,0.5)"
                                    : confirmPassword && confirmPassword === password
                                    ? "rgba(0,224,122,0.5)"
                                    : "rgba(255,255,255,0.1)",
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                        disabled={loading}
                    >
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>

                <p style={styles.signupText}>
                    Already have an account?{" "}
                    <span style={styles.link} onClick={() => navigate("/login")}>
                        Sign In
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
        maxWidth: "420px",
        padding: "2.25rem 2rem",
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
        marginBottom: "1.75rem",
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
    title: {
        fontFamily: "'Syne', system-ui, sans-serif",
        fontSize: "1.6rem",
        fontWeight: 800,
        color: "#f0f4ff",
        marginBottom: "0.3rem",
        letterSpacing: "-0.03em",
    },
    subtitle: {
        fontSize: "0.85rem",
        color: "#7a8499",
        marginBottom: "1.5rem",
    },
    errorBox: {
        background: "rgba(255,77,109,0.1)",
        color: "#ff4d6d",
        border: "1px solid rgba(255,77,109,0.25)",
        borderRadius: "8px",
        padding: "9px 13px",
        marginBottom: "1.1rem",
        fontSize: "0.83rem",
        lineHeight: 1.5,
    },
    row: {
        display: "flex",
        gap: "0.75rem",
    },
    inputBox: {
        textAlign: "left",
        marginBottom: "1rem",
    },
    label: {
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "#7a8499",
        marginBottom: "5px",
        display: "block",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
    },
    input: {
        width: "100%",
        padding: "0.62rem 0.9rem",
        borderRadius: "9px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#0c1018",
        color: "#dde4f0",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: "0.88rem",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s, box-shadow 0.2s",
    },
    link: {
        fontSize: "0.83rem",
        color: "#00e07a",
        cursor: "pointer",
        fontWeight: 600,
    },
    loginBtn: {
        width: "100%",
        padding: "0.7rem",
        background: "#00e07a",
        color: "#030a04",
        border: "none",
        borderRadius: "9px",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: "0.92rem",
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: "0.01em",
        transition: "all 0.2s",
        marginTop: "0.25rem",
    },
    signupText: {
        fontSize: "0.82rem",
        marginTop: "1.1rem",
        color: "#7a8499",
        textAlign: "center",
    },
};