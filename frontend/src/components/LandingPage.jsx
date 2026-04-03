import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PageStyler = () => {
  useLayoutEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        background: #07090f;
        color: #dde4f0;
        -webkit-font-smoothing: antialiased;
      }

      /* ── Scrollbar ── */
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #07090f; }
      ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 6px; }

      /* ── Root container ── */
      .landing-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: #07090f;
        position: relative;
        overflow-x: hidden;
      }

      /* Dot-grid background */
      .landing-container::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image: radial-gradient(rgba(0,224,122,0.07) 1px, transparent 1px);
        background-size: 32px 32px;
        pointer-events: none;
        z-index: 0;
      }

      /* Glow orbs */
      .landing-container::after {
        content: '';
        position: fixed;
        top: -30%;
        left: -10%;
        width: 700px;
        height: 700px;
        background: radial-gradient(circle, rgba(0,224,122,0.06) 0%, transparent 65%);
        pointer-events: none;
        z-index: 0;
      }

      /* ── Header ── */
      .landing-header {
        position: relative;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2.5rem;
        background: rgba(7,9,15,0.85);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .logo-container {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
        cursor: default;
      }

      .logo-mark {
        position: relative;
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }

      .logo-text-wrap {
        display: flex;
        flex-direction: column;
        line-height: 1;
      }

      .logo-primary {
        font-family: 'Syne', system-ui, sans-serif;
        font-size: 1.15rem;
        font-weight: 800;
        color: #00e07a;
        letter-spacing: -0.03em;
      }

      .logo-sub {
        font-size: 0.58rem;
        font-weight: 600;
        color: rgba(255,255,255,0.28);
        letter-spacing: 0.18em;
        text-transform: uppercase;
        margin-top: 2px;
      }

      .signin-btn {
        padding: 0.55rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 700;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #030a04;
        background: #00e07a;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        letter-spacing: 0.01em;
      }

      .signin-btn:hover {
        background: #00ff8a;
        box-shadow: 0 0 24px rgba(0,224,122,0.35);
        transform: translateY(-1px);
      }

      /* ── Hero ── */
      .landing-main {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 2.5rem;
        padding: 5rem 2rem 4rem;
        text-align: center;
        position: relative;
        z-index: 1;
      }

      .hero-text-container {
        max-width: 680px;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(0,224,122,0.1);
        border: 1px solid rgba(0,224,122,0.2);
        color: #00e07a;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.3rem 0.9rem;
        border-radius: 999px;
        margin-bottom: 1.5rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .hero-title {
        font-family: 'Syne', system-ui, sans-serif;
        font-size: clamp(2.4rem, 6vw, 3.8rem);
        font-weight: 800;
        color: #f0f4ff;
        margin-bottom: 1rem;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }

      .hero-title span {
        color: #00e07a;
      }

      .hero-subtitle {
        font-size: 1.05rem;
        color: #7a8499;
        line-height: 1.65;
        max-width: 520px;
        margin: 0 auto;
      }

      .action-buttons-container {
        display: flex;
        gap: 1.25rem;
        margin-top: 0.5rem;
      }

      .action-btn {
        padding: 1.4rem 3.5rem;
        font-family: 'Syne', system-ui, sans-serif;
        font-size: 1.4rem;
        font-weight: 800;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        text-decoration: none;
        text-align: center;
        letter-spacing: -0.02em;
      }

      .lost-btn {
        background: transparent;
        color: #dde4f0;
        border: 1.5px solid rgba(255,255,255,0.14);
      }

      .lost-btn:hover {
        transform: translateY(-4px);
        background: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.28);
        box-shadow: 0 12px 32px rgba(0,0,0,0.4);
      }

      .found-btn {
        background: #00e07a;
        color: #030a04;
        border: 1.5px solid #00e07a;
      }

      .found-btn:hover {
        transform: translateY(-4px);
        background: #00ff8a;
        border-color: #00ff8a;
        box-shadow: 0 12px 40px rgba(0,224,122,0.4);
      }

      /* ── Stats strip ── */
      .stats-strip {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: center;
        gap: 0;
        padding: 0 2rem 2rem;
      }

      .stat-item {
        padding: 1.2rem 2.5rem;
        text-align: center;
        border-right: 1px solid rgba(255,255,255,0.07);
      }

      .stat-item:last-child { border-right: none; }

      .stat-number {
        font-family: 'Syne', system-ui, sans-serif;
        font-size: 1.9rem;
        font-weight: 800;
        color: #00e07a;
        letter-spacing: -0.03em;
        display: block;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #7a8499;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
        margin-top: 3px;
        display: block;
      }

      /* ── How it works ── */
      .section {
        position: relative;
        z-index: 1;
        padding: 5rem 2rem;
        max-width: 1100px;
        margin: 0 auto;
        width: 100%;
      }

      .section-label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #00e07a;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
      }

      .section-title {
        font-family: 'Syne', system-ui, sans-serif;
        font-size: clamp(1.6rem, 4vw, 2.4rem);
        font-weight: 800;
        color: #f0f4ff;
        letter-spacing: -0.03em;
        margin-bottom: 0.75rem;
        line-height: 1.15;
      }

      .section-subtitle {
        font-size: 0.95rem;
        color: #7a8499;
        max-width: 480px;
        line-height: 1.65;
        margin-bottom: 3rem;
      }

      .steps-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
      }

      .step-card {
        background: #111826;
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px;
        padding: 2rem 1.75rem;
        transition: border-color 0.2s, transform 0.2s;
        position: relative;
        overflow: hidden;
      }

      .step-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #00e07a, transparent);
        opacity: 0;
        transition: opacity 0.2s;
      }

      .step-card:hover {
        border-color: rgba(0,224,122,0.2);
        transform: translateY(-3px);
      }

      .step-card:hover::before { opacity: 1; }

      .step-number {
        font-family: 'Syne', system-ui, sans-serif;
        font-size: 0.7rem;
        font-weight: 800;
        color: rgba(0,224,122,0.5);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 1rem;
      }

      .step-icon {
        font-size: 2.2rem;
        margin-bottom: 1rem;
        display: block;
      }

      .step-title {
        font-family: 'Syne', system-ui, sans-serif;
        font-size: 1.05rem;
        font-weight: 700;
        color: #f0f4ff;
        margin-bottom: 0.6rem;
        letter-spacing: -0.01em;
      }

      .step-desc {
        font-size: 0.85rem;
        color: #7a8499;
        line-height: 1.6;
      }

      /* ── Features ── */
      .features-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }

      .feature-card {
        background: #111826;
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px;
        padding: 1.75rem;
        display: flex;
        gap: 1.2rem;
        align-items: flex-start;
        transition: border-color 0.2s, transform 0.2s;
      }

      .feature-card:hover {
        border-color: rgba(0,224,122,0.18);
        transform: translateY(-2px);
      }

      .feature-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(0,224,122,0.1);
        border: 1px solid rgba(0,224,122,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        flex-shrink: 0;
      }

      .feature-content h3 {
        font-family: 'Syne', system-ui, sans-serif;
        font-size: 0.97rem;
        font-weight: 700;
        color: #f0f4ff;
        margin-bottom: 0.4rem;
        letter-spacing: -0.01em;
      }

      .feature-content p {
        font-size: 0.83rem;
        color: #7a8499;
        line-height: 1.6;
      }

      /* ── CTA Section ── */
      .cta-section {
        position: relative;
        z-index: 1;
        padding: 4rem 2rem 5rem;
        text-align: center;
      }

      .cta-box {
        max-width: 620px;
        margin: 0 auto;
        background: linear-gradient(135deg, rgba(0,224,122,0.08) 0%, rgba(0,224,122,0.03) 100%);
        border: 1px solid rgba(0,224,122,0.18);
        border-radius: 24px;
        padding: 3.5rem 2.5rem;
      }

      .cta-title {
        font-family: 'Syne', system-ui, sans-serif;
        font-size: 1.9rem;
        font-weight: 800;
        color: #f0f4ff;
        letter-spacing: -0.03em;
        margin-bottom: 0.75rem;
      }

      .cta-sub {
        font-size: 0.93rem;
        color: #7a8499;
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      .cta-btn {
        display: inline-block;
        padding: 0.85rem 2.5rem;
        background: #00e07a;
        color: #030a04;
        border: none;
        border-radius: 10px;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        letter-spacing: 0.01em;
      }

      .cta-btn:hover {
        background: #00ff8a;
        box-shadow: 0 0 32px rgba(0,224,122,0.4);
        transform: translateY(-2px);
      }

      /* ── Divider ── */
      .section-divider {
        width: 100%;
        height: 1px;
        background: rgba(255,255,255,0.06);
        position: relative;
        z-index: 1;
      }

      /* ── Footer ── */
      .landing-footer {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.4rem 2.5rem;
        background: rgba(7,9,15,0.9);
        border-top: 1px solid rgba(255,255,255,0.06);
        backdrop-filter: blur(10px);
      }

      .contact-info {
        font-size: 0.82rem;
        color: #4a5568;
        font-weight: 500;
        cursor: pointer;
        transition: color 0.2s;
      }

      .contact-info:hover { color: #7a8499; }

      .admin-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.9rem;
        font-size: 0.76rem;
        font-weight: 700;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #4a5568;
        background: transparent;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        letter-spacing: 0.02em;
      }

      .admin-btn:hover {
        background: rgba(255,255,255,0.06);
        color: #7a8499;
        border-color: rgba(255,255,255,0.15);
      }

      .admin-btn-icon { font-size: 0.85rem; }

      /* ── Responsive ── */
      @media (max-width: 900px) {
        .steps-grid { grid-template-columns: 1fr; }
        .features-grid { grid-template-columns: 1fr; }
      }

      @media (max-width: 768px) {
        .landing-header { padding: 0.9rem 1.25rem; }
        .landing-main { padding: 3.5rem 1.5rem 3rem; }
        .action-buttons-container { flex-direction: column; width: 100%; gap: 0.9rem; align-items: center; }
        .action-btn { padding: 1.2rem 3rem; font-size: 1.2rem; width: 100%; max-width: 320px; }
        .stats-strip { flex-direction: column; gap: 0; }
        .stat-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .stat-item:last-child { border-bottom: none; }
        .section { padding: 3.5rem 1.5rem; }
        .landing-footer { padding: 1.2rem 1.25rem; }
        .logo-primary { font-size: 1rem; }
      }
    `;
    styleElement.id = 'landing-styles';
    document.head.appendChild(styleElement);
    return () => {
      const el = document.getElementById('landing-styles');
      if (el) document.head.removeChild(el);
    };
  }, []);
  return null;
};

const LogoIcon = () => (
  <svg className="logo-mark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="15" r="10.5" stroke="#00e07a" strokeWidth="2.4"/>
    <circle cx="15" cy="15" r="4" fill="#00e07a" opacity="0.2"/>
    <circle cx="15" cy="15" r="2" fill="#00e07a"/>
    <line x1="22.5" y1="22.5" x2="32" y2="32" stroke="#00e07a" strokeWidth="2.8" strokeLinecap="round"/>
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo-container">
          <LogoIcon />
          <div className="logo-text-wrap">
            <span className="logo-primary">Lost & Found</span>
            <span className="logo-sub">AI Platform</span>
          </div>
        </div>
        <nav>
          <button className="signin-btn" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <div className="hero-text-container">
          <div className="hero-badge">✦ AI-Powered Matching</div>
          <h1 className="hero-title">
            Find what's lost,<br />
            <span>return what's found</span>
          </h1>
          <p className="hero-subtitle">
            The intelligent platform that connects people who've lost items with those who've found them — using AI semantic matching.
          </p>
        </div>

        <div className="action-buttons-container">
          <a className="action-btn lost-btn" onClick={() => navigate("/login")}>
            🔍 Lost?
          </a>
          <a className="action-btn found-btn" onClick={() => navigate("/login")}>
            📦 Found?
          </a>
        </div>
      </main>

      {/* Stats */}
      <div className="stats-strip">
        <div className="stat-item">
          <span className="stat-number">1,200+</span>
          <span className="stat-label">Items Reported</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">940+</span>
          <span className="stat-label">Items Reunited</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">96%</span>
          <span className="stat-label">Match Accuracy</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">&lt; 2 hrs</span>
          <span className="stat-label">Avg. Match Time</span>
        </div>
      </div>

      <div className="section-divider" />

      {/* How It Works */}
      <div className="section">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">Three simple steps<br />to reunion</h2>
        <p className="section-subtitle">Our AI does the heavy lifting — you just report and we match.</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">Step 01</div>
            <span className="step-icon">📝</span>
            <div className="step-title">Report Your Item</div>
            <p className="step-desc">Describe what you lost or found with a photo and location. Our guided form makes it quick and accurate.</p>
          </div>
          <div className="step-card">
            <div className="step-number">Step 02</div>
            <span className="step-icon">🤖</span>
            <div className="step-title">AI Finds Matches</div>
            <p className="step-desc">Our SBERT + CLIP models analyze text and images to find the closest matches from all reported items.</p>
          </div>
          <div className="step-card">
            <div className="step-number">Step 03</div>
            <span className="step-icon">💬</span>
            <div className="step-title">Connect & Reunite</div>
            <p className="step-desc">Claim your match, chat securely with the finder, and arrange a safe handover to get your item back.</p>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      {/* Features */}
      <div className="section">
        <div className="section-label">Features</div>
        <h2 className="section-title">Built for speed<br />and accuracy</h2>
        <p className="section-subtitle">Every feature is designed to make the recovery process as smooth as possible.</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrap">🧠</div>
            <div className="feature-content">
              <h3>Semantic AI Matching</h3>
              <p>Uses SBERT and CLIP to understand the meaning and appearance of items, not just keywords.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">📸</div>
            <div className="feature-content">
              <h3>Image Recognition</h3>
              <p>Upload a photo and our vision model will find visually similar items in the database instantly.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">🔔</div>
            <div className="feature-content">
              <h3>Smart Notifications</h3>
              <p>Get alerted the moment a matching item is reported. Never miss a potential match.</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">💬</div>
            <div className="feature-content">
              <h3>Secure In-App Chat</h3>
              <p>Contact finders directly through our secure messaging system — no personal info shared.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-box">
          <div className="section-label" style={{marginBottom:'0.75rem'}}>Get Started</div>
          <div className="cta-title">Lost something?<br />Let's find it.</div>
          <p className="cta-sub">Join thousands of users who've reunited with their lost belongings using our AI platform.</p>
          <button className="cta-btn" onClick={() => navigate("/login")}>
            Create Free Account →
          </button>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="contact-info">Contact us</div>
        <button
          className="admin-btn"
          onClick={() => navigate("/admin/login")}
          title="Admin Portal"
        >
          <span className="admin-btn-icon">🛡️</span>
          Admin Portal
        </button>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <>
      <PageStyler />
      <LandingPage />
    </>
  );
}