import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    link.id = 'rp-fonts';
    document.head.appendChild(link);
    return () => { const el = document.getElementById('rp-fonts'); if (el) el.remove(); };
  }, []);

  const passwordStrength = (pwd) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6) return { label: "Too short", color: "#ff4d6d", width: "20%" };
    if (pwd.length < 8) return { label: "Weak", color: "#ffb347", width: "40%" };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd))
      return { label: "Fair", color: "#ffd166", width: "65%" };
    return { label: "Strong", color: "#00e07a", width: "100%" };
  };

  const strength = passwordStrength(form.password);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setStatus("error"); setMessage("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { setStatus("error"); setMessage("Passwords do not match."); return; }
    setStatus("loading");
    setMessage("");
    try {
      const res = await axios.post("/auth/reset-password", { token, new_password: form.password });
      setStatus("success");
      setMessage(res.data.message || "Your password has been reset successfully!");
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "This reset link is invalid or has expired. Please request a new one.");
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

        {status === "success" ? (
          <div style={styles.centeredBody}>
            <div style={{ ...styles.iconCircle, background: "rgba(0,224,122,0.1)", border: "1px solid rgba(0,224,122,0.2)" }}>
              <span style={styles.headerIcon}>✅</span>
            </div>
            <h2 style={{ ...styles.title, color: "#00e07a" }}>Password Reset!</h2>
            <p style={styles.subtitle}>{message}</p>
            <p style={styles.hint}>You can now log in with your new password.</p>
            <button style={styles.primaryBtn} onClick={() => navigate("/login")}>Go to Login</button>
          </div>
        ) : (
          <>
            <div style={styles.header}>
              <div style={styles.iconCircle}>
                <span style={styles.headerIcon}>🔑</span>
              </div>
              <h2 style={styles.title}>Set a new password</h2>
              <p style={styles.subtitle}>Choose a strong password you haven't used before.</p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label style={styles.label} htmlFor="password">New Password</label>
                <div style={styles.inputWrap}>
                  <input
                    id="password" name="password"
                    type={showPassword ? "text" : "password"}
                    required placeholder="Min. 6 characters"
                    value={form.password} onChange={handleChange}
                    style={styles.input} disabled={status === "loading"}
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {strength && (
                  <div style={styles.strengthWrap}>
                    <div style={styles.strengthTrack}>
                      <div style={{ ...styles.strengthFill, width: strength.width, background: strength.color }} />
                    </div>
                    <span style={{ ...styles.strengthLabel, color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label style={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                <div style={styles.inputWrap}>
                  <input
                    id="confirmPassword" name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required placeholder="Re-enter your password"
                    value={form.confirmPassword} onChange={handleChange}
                    style={{
                      ...styles.input,
                      borderColor: form.confirmPassword && form.confirmPassword !== form.password
                        ? "rgba(255,77,109,0.5)"
                        : form.confirmPassword && form.confirmPassword === form.password
                        ? "rgba(0,224,122,0.5)"
                        : "rgba(255,255,255,0.1)",
                    }}
                    disabled={status === "loading"}
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p style={styles.matchError}>Passwords do not match</p>
                )}
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <p style={styles.matchSuccess}>Passwords match ✓</p>
                )}
              </div>

              {status === "error" && (
                <div style={styles.errorBox}>
                  {message}
                  {message.includes("expired") && (
                    <> <Link to="/forgot-password" style={styles.inlineLink}>Request a new link →</Link></>
                  )}
                </div>
              )}

              <button
                type="submit"
                style={{ ...styles.primaryBtn, marginTop: "4px", opacity: status === "loading" ? 0.7 : 1, cursor: status === "loading" ? "not-allowed" : "pointer" }}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Resetting…" : "Reset Password"}
              </button>
            </form>
          </>
        )}

        <p style={styles.footer}>
          <Link to="/login" style={styles.link}>← Back to Login</Link>
        </p>
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
    padding: "2.5rem 2.25rem", maxWidth: "420px", width: "100%", color: "#dde4f0",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.75rem" },
  logoName: {
    fontFamily: "'Syne', system-ui, sans-serif", fontSize: "1.05rem", fontWeight: 800,
    color: "#00e07a", letterSpacing: "-0.02em", lineHeight: 1,
  },
  logoSub: {
    fontSize: "0.57rem", fontWeight: 600, color: "rgba(255,255,255,0.28)",
    letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "3px",
  },
  header: { textAlign: "center", marginBottom: "1.75rem" },
  centeredBody: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.6rem", marginBottom: "1rem" },
  iconCircle: {
    width: "64px", height: "64px", borderRadius: "50%",
    background: "rgba(0,224,122,0.08)", border: "1px solid rgba(0,224,122,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
  },
  headerIcon: { fontSize: "28px" },
  title: {
    fontFamily: "'Syne', system-ui, sans-serif", fontSize: "1.45rem", fontWeight: 800,
    color: "#f0f4ff", margin: "0 0 0.5rem", letterSpacing: "-0.03em",
  },
  subtitle: { fontSize: "0.88rem", color: "#7a8499", lineHeight: "1.6", margin: 0 },
  hint: { fontSize: "0.82rem", color: "#4a5568", margin: "4px 0" },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  label: {
    display: "block", fontSize: "0.72rem", fontWeight: 600, color: "#7a8499",
    marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.07em",
  },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  input: {
    width: "100%", padding: "0.65rem 2.8rem 0.65rem 0.95rem",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px",
    fontSize: "0.9rem", color: "#dde4f0", background: "#0c1018",
    outline: "none", boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  eyeBtn: {
    position: "absolute", right: "12px", background: "none", border: "none",
    cursor: "pointer", fontSize: "15px", padding: 0, lineHeight: 1, color: "#7a8499",
  },
  strengthWrap: { display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" },
  strengthTrack: { flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" },
  strengthFill: { height: "100%", borderRadius: "4px", transition: "width 0.3s, background 0.3s" },
  strengthLabel: { fontSize: "0.72rem", fontWeight: 700, minWidth: "52px", textAlign: "right" },
  matchError: { fontSize: "0.75rem", color: "#ff4d6d", margin: "5px 0 0" },
  matchSuccess: { fontSize: "0.75rem", color: "#00e07a", margin: "5px 0 0" },
  errorBox: {
    background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.25)",
    borderRadius: "8px", padding: "9px 13px", fontSize: "0.83rem", color: "#ff4d6d",
  },
  inlineLink: { color: "#ff4d6d", fontWeight: 700, textDecoration: "underline" },
  primaryBtn: {
    background: "#00e07a", color: "#030a04", border: "none", borderRadius: "9px",
    padding: "0.7rem", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer",
    width: "100%", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    transition: "all 0.2s", letterSpacing: "0.01em",
  },
  footer: { textAlign: "center", marginTop: "1.5rem", fontSize: "0.82rem", color: "#4a5568" },
  link: { color: "#00e07a", textDecoration: "none", fontWeight: 600 },
};

export default ResetPasswordPage;
