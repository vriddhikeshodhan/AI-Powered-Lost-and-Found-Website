import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendOtp = () => {
    console.log("OTP sent to:", email);
    setOtpSent(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    console.log({
      email,
      otp,
      firstName,
      lastName,
      password,
    });

    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>

        <form onSubmit={handleSubmit}>
          {/* Email */}
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

          {/* Send OTP */}
          {!otpSent && (
            <button
              type="button"
              style={{ ...styles.loginBtn, marginBottom: "15px" }}
              onClick={handleSendOtp}
            >
              Send OTP
            </button>
          )}

          {/* OTP */}
          {otpSent && (
            <div style={styles.inputBox}>
              <label style={styles.label}>Verify OTP</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          )}

          {/* First Name */}
          <div style={styles.inputBox}>
            <label style={styles.label}>First Name</label>
            <input
              type="text"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* Last Name */}
          <div style={styles.inputBox}>
            <label style={styles.label}>Last Name</label>
            <input
              type="text"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* Password */}
          <div style={styles.inputBox}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* Confirm Password */}
          <div style={styles.inputBox}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button 
            onClick={() => navigate("/login")}
            type="submit" style={styles.loginBtn}>
            Sign Up
          </button>
        </form>

        <p style={styles.signupText}>
          Already have an account?{" "}
          <span
            style={styles.link}
            onClick={() => navigate("/login")}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

/* 🔁 EXACT SAME STYLES AS LOGIN PAGE */
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
