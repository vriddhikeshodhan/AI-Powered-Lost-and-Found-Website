// ForgotPasswordPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    link.id = 'fp-fonts';
    document.head.appendChild(link);
    return () => { const el = document.getElementById('fp-fonts'); if (el) el.remove(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await axios.post("/auth/forgot-password", { email });
      setStatus("sent");
      setMessage(res.data.message || "If an account with that email exists, a reset link has been sent.");
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
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

        {status !== "sent" ? (
          <>
            <div style={styles.header}>
              <div style={styles.iconCircle}>
                <span style={styles.headerIcon}>🔒</span>
              </div>
              <h2 style={styles.title}>Forgot your password?</h2>
              <p style={styles.subtitle}>
                Enter the email address linked to your account and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label} htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={status === "loading"}
              />
              {status === "error" && <div style={styles.errorBox}>{message}</div>}
              <button
                type="submit"
                style={{ ...styles.primaryBtn, opacity: status === "loading" ? 0.7 : 1, cursor: status === "loading" ? "not-allowed" : "pointer" }}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div style={styles.successBody}>
            <div style={{ ...styles.iconCircle, background: "rgba(0,224,122,0.1)", border: "1px solid rgba(0,224,122,0.2)" }}>
              <span style={styles.headerIcon}>📧</span>
            </div>
            <h2 style={{ ...styles.title, color: "#00e07a" }}>Check your inbox!</h2>
            <p style={styles.subtitle}>{message}</p>
            <p style={styles.hint}>The link expires in <strong style={{color:"#dde4f0"}}>1 hour</strong>. Check spam if you don't see it.</p>
            <button style={styles.ghostBtn} onClick={() => { setStatus("idle"); setEmail(""); setMessage(""); }}>
              Try a different email
            </button>
          </div>
        )}

        <p style={styles.footer}>
          Remembered it?{" "}
          <Link to="/login" style={styles.link}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#07090f",
    backgroundImage: "radial-gradient(rgba(0,224,122,0.055) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    padding: "24px",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  card: {
    background: "#111826",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    padding: "2.5rem 2.25rem",
    maxWidth: "420px",
    width: "100%",
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
  header: { textAlign: "center", marginBottom: "1.75rem" },
  iconCircle: {
    width: "64px", height: "64px", borderRadius: "50%",
    background: "rgba(0,224,122,0.08)", border: "1px solid rgba(0,224,122,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 1rem",
  },
  headerIcon: { fontSize: "28px" },
  title: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: "1.45rem", fontWeight: 800, color: "#f0f4ff",
    margin: "0 0 0.5rem", letterSpacing: "-0.03em",
  },
  subtitle: { fontSize: "0.88rem", color: "#7a8499", lineHeight: "1.6", margin: 0 },
  hint: { fontSize: "0.82rem", color: "#4a5568", lineHeight: "1.6", margin: "4px 0 0" },
  form: { display: "flex", flexDirection: "column", gap: "0.85rem" },
  label: {
    fontSize: "0.72rem", fontWeight: 600, color: "#7a8499",
    textTransform: "uppercase", letterSpacing: "0.07em",
  },
  input: {
    padding: "0.65rem 0.95rem",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "9px", fontSize: "0.9rem", color: "#dde4f0",
    background: "#0c1018", outline: "none", width: "100%",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  errorBox: {
    background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.25)",
    borderRadius: "8px", padding: "9px 13px",
    fontSize: "0.83rem", color: "#ff4d6d",
  },
  primaryBtn: {
    marginTop: "4px", background: "#00e07a", color: "#030a04",
    border: "none", borderRadius: "9px", padding: "0.7rem",
    fontSize: "0.92rem", fontWeight: 700, cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    transition: "all 0.2s", letterSpacing: "0.01em",
  },
  ghostBtn: {
    marginTop: "8px", background: "transparent", color: "#00e07a",
    border: "1px solid rgba(0,224,122,0.25)", borderRadius: "9px",
    padding: "0.6rem 1.5rem", fontSize: "0.88rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    transition: "all 0.2s",
  },
  successBody: {
    display: "flex", flexDirection: "column", alignItems: "center",
    textAlign: "center", gap: "0.6rem", marginBottom: "1rem",
  },
  footer: { textAlign: "center", marginTop: "1.5rem", fontSize: "0.82rem", color: "#4a5568" },
  link: { color: "#00e07a", textDecoration: "none", fontWeight: 600 },
};

export default ForgotPasswordPage;