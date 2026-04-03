import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    link.id = 've-fonts';
    document.head.appendChild(link);

    const spinStyle = document.createElement('style');
    spinStyle.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
    spinStyle.id = 've-spin';
    document.head.appendChild(spinStyle);

    return () => {
      const f = document.getElementById('ve-fonts'); if (f) f.remove();
      const s = document.getElementById('ve-spin'); if (s) s.remove();
    };
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`/auth/verify/${token}`);
        setStatus("success");
        setMessage(res.data.message || "Your email has been verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "This verification link is invalid or has expired.");
      }
    };
    if (token) { verifyToken(); }
    else { setStatus("error"); setMessage("No verification token found."); }
  }, [token]);

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

        {status === "loading" && (
          <div style={styles.body}>
            <div style={styles.spinner} />
            <h2 style={styles.title}>Verifying your email…</h2>
            <p style={styles.subtitle}>Please wait a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div style={styles.body}>
            <div style={{ ...styles.iconCircle, background: "rgba(0,224,122,0.1)", border: "1px solid rgba(0,224,122,0.2)" }}>
              <span style={styles.icon}>✅</span>
            </div>
            <h2 style={{ ...styles.title, color: "#00e07a" }}>Email Verified!</h2>
            <p style={styles.subtitle}>{message}</p>
            <p style={styles.hint}>You can now log in and start using the platform.</p>
            <button style={styles.primaryBtn} onClick={() => navigate("/login")}>Go to Login</button>
          </div>
        )}

        {status === "error" && (
          <div style={styles.body}>
            <div style={{ ...styles.iconCircle, background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)" }}>
              <span style={styles.icon}>❌</span>
            </div>
            <h2 style={{ ...styles.title, color: "#ff4d6d" }}>Verification Failed</h2>
            <p style={styles.subtitle}>{message}</p>
            <p style={styles.hint}>The link may have expired (valid for 24 hours). Try registering again.</p>
            <div style={styles.btnRow}>
              <Link to="/signup" style={styles.secondaryBtn}>Register Again</Link>
              <Link to="/login" style={styles.primaryBtn}>Back to Login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#07090f",
    backgroundImage: "radial-gradient(rgba(0,224,122,0.055) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    padding: "24px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  card: {
    background: "#111826", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    padding: "2.5rem 2.25rem", maxWidth: "420px", width: "100%",
    color: "#dde4f0", textAlign: "center",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "2rem", justifyContent: "center" },
  logoName: {
    fontFamily: "'Syne', system-ui, sans-serif", fontSize: "1.05rem", fontWeight: 800,
    color: "#00e07a", letterSpacing: "-0.02em", lineHeight: 1, textAlign: "left",
  },
  logoSub: {
    fontSize: "0.57rem", fontWeight: 600, color: "rgba(255,255,255,0.28)",
    letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "3px", textAlign: "left",
  },
  body: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" },
  iconCircle: {
    width: "68px", height: "68px", borderRadius: "50%",
    background: "rgba(0,224,122,0.08)", border: "1px solid rgba(0,224,122,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.25rem",
  },
  icon: { fontSize: "30px" },
  title: {
    fontFamily: "'Syne', system-ui, sans-serif", fontSize: "1.45rem", fontWeight: 800,
    margin: 0, color: "#f0f4ff", letterSpacing: "-0.03em",
  },
  subtitle: { fontSize: "0.9rem", color: "#7a8499", margin: 0, lineHeight: "1.6" },
  hint: { fontSize: "0.82rem", color: "#4a5568", margin: 0, lineHeight: "1.6" },
  primaryBtn: {
    marginTop: "8px", display: "inline-block",
    background: "#00e07a", color: "#030a04", border: "none",
    borderRadius: "9px", padding: "0.65rem 1.75rem",
    fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
    textDecoration: "none", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    transition: "all 0.2s",
  },
  secondaryBtn: {
    marginTop: "8px", display: "inline-block",
    background: "rgba(255,255,255,0.05)", color: "#7a8499",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px",
    padding: "0.65rem 1.75rem", fontSize: "0.9rem", fontWeight: 600,
    cursor: "pointer", textDecoration: "none",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  },
  btnRow: { display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "8px" },
  spinner: {
    width: "44px", height: "44px",
    border: "4px solid rgba(255,255,255,0.07)",
    borderTop: "4px solid #00e07a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "8px",
    boxShadow: "0 0 16px rgba(0,224,122,0.2)",
  },
};

export default VerifyEmailPage;
