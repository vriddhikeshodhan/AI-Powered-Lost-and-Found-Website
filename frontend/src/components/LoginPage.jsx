// src/components/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email:", email);
    console.log("Password:", password);
    navigate("/userlanding");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Hello! Sign in</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputBox}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.forgot}>
            <a href="#!" style={styles.link}>
              Forgot your password?
            </a>
          </div>

          <button type="submit" style={styles.loginBtn}>
            Sign In
          </button>
        </form>

        <p style={styles.signupText}>
          Don’t have an account?{" "}
          <a href="#!" style={styles.link}>
            Sign Up
          </a>
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
    background: "#f0fdf4",
  },
  card: {
    width: "350px",
    padding: "30px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#15803d",
  },
  inputBox: {
    textAlign: "left",
    marginBottom: "15px",
  },
  label: {
    fontSize: "14px",
    color: "#15803d",
    marginBottom: "5px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #22c55e",
    outline: "none",
  },
  forgot: {
    textAlign: "right",
    marginBottom: "15px",
  },
  link: {
    fontSize: "12px",
    color: "#16a34a",
    textDecoration: "none",
    cursor: "pointer",
  },
  loginBtn: {
    width: "100%",
    padding: "12px",
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
  },
  signupText: {
    fontSize: "12px",
    marginTop: "15px",
  },
};
