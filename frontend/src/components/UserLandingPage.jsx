import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: #07090f; }
            ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 6px; }

            .landing-container {
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                background: #07090f;
                position: relative;
                overflow-x: hidden;
            }

            .landing-container::before {
                content: '';
                position: fixed;
                inset: 0;
                background-image: radial-gradient(rgba(0,224,122,0.06) 1px, transparent 1px);
                background-size: 32px 32px;
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
                background: rgba(7,9,15,0.9);
                backdrop-filter: blur(16px);
                border-bottom: 1px solid rgba(255,255,255,0.06);
            }

            .logo-container {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: default;
            }

            .logo-mark { position: relative; width: 36px; height: 36px; flex-shrink: 0; }

            .logo-text-wrap { display: flex; flex-direction: column; line-height: 1; }

            .logo-primary {
                font-family: 'Syne', system-ui, sans-serif;
                font-size: 1.1rem;
                font-weight: 800;
                color: #00e07a;
                letter-spacing: -0.03em;
            }

            .logo-sub {
                font-size: 0.56rem;
                font-weight: 600;
                color: rgba(255,255,255,0.28);
                letter-spacing: 0.18em;
                text-transform: uppercase;
                margin-top: 2px;
            }

            .nav-btn {
                padding: 0.48rem 1.05rem;
                font-size: 0.84rem;
                font-weight: 700;
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                letter-spacing: 0.01em;
                border: 1px solid rgba(255,255,255,0.1);
                background: transparent;
                color: #7a8499;
            }

            .nav-btn:hover {
                background: rgba(255,255,255,0.06);
                color: #dde4f0;
                border-color: rgba(255,255,255,0.18);
            }

            .nav-btn.primary {
                background: #00e07a;
                color: #030a04;
                border-color: #00e07a;
            }

            .nav-btn.primary:hover {
                background: #00ff8a;
                box-shadow: 0 0 20px rgba(0,224,122,0.3);
                transform: translateY(-1px);
            }

            .nav-btn.logout {
                color: #ff4d6d;
                border-color: rgba(255,77,109,0.25);
            }

            .nav-btn.logout:hover {
                background: rgba(255,77,109,0.1);
                border-color: rgba(255,77,109,0.4);
                color: #ff4d6d;
            }

            .nav-btn.admin {
                background: rgba(79,156,255,0.1);
                color: #4f9cff;
                border-color: rgba(79,156,255,0.25);
            }

            .nav-btn.admin:hover {
                background: rgba(79,156,255,0.18);
                box-shadow: 0 0 16px rgba(79,156,255,0.2);
            }

            .nav-greeting {
                font-weight: 600;
                color: #dde4f0;
                font-size: 0.88rem;
            }

            /* ── Hero ── */
            .landing-main {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 2.25rem;
                padding: 5rem 2rem 3.5rem;
                text-align: center;
                position: relative;
                z-index: 1;
            }

            .hero-text-container { max-width: 640px; }

            .hero-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(0,224,122,0.08);
                border: 1px solid rgba(0,224,122,0.18);
                color: #00e07a;
                font-size: 0.72rem;
                font-weight: 700;
                padding: 0.28rem 0.85rem;
                border-radius: 999px;
                margin-bottom: 1.25rem;
                letter-spacing: 0.07em;
                text-transform: uppercase;
            }

            .hero-title {
                font-family: 'Syne', system-ui, sans-serif;
                font-size: clamp(2rem, 5vw, 3.2rem);
                font-weight: 800;
                color: #f0f4ff;
                margin-bottom: 0.85rem;
                line-height: 1.12;
                letter-spacing: -0.04em;
            }

            .hero-title .accent { color: #00e07a; }

            .hero-subtitle {
                font-size: 1rem;
                color: #7a8499;
                line-height: 1.65;
                max-width: 460px;
                margin: 0 auto;
            }

            .action-buttons-container { display: flex; gap: 1.2rem; margin-top: 0.5rem; }

            .action-btn {
                padding: 1.3rem 3rem;
                font-family: 'Syne', system-ui, sans-serif;
                font-size: 1.3rem;
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
                border-color: rgba(255,255,255,0.26);
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

            /* ── Quick Cards ── */
            .quick-section {
                position: relative;
                z-index: 1;
                padding: 0 2rem 4rem;
                max-width: 1000px;
                margin: 0 auto;
                width: 100%;
            }

            .quick-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
            }

            .quick-card {
                background: #111826;
                border: 1px solid rgba(255,255,255,0.07);
                border-radius: 14px;
                padding: 1.5rem;
                text-align: center;
                transition: border-color 0.2s, transform 0.2s;
                cursor: pointer;
            }

            .quick-card:hover {
                border-color: rgba(0,224,122,0.2);
                transform: translateY(-3px);
            }

            .quick-icon { font-size: 2rem; margin-bottom: 0.7rem; display: block; }

            .quick-title {
                font-family: 'Syne', system-ui, sans-serif;
                font-size: 0.95rem;
                font-weight: 700;
                color: #f0f4ff;
                margin-bottom: 0.4rem;
            }

            .quick-desc { font-size: 0.8rem; color: #7a8499; line-height: 1.55; }

            /* ── Tips section ── */
            .tips-section {
                position: relative;
                z-index: 1;
                background: rgba(0,224,122,0.04);
                border-top: 1px solid rgba(0,224,122,0.1);
                border-bottom: 1px solid rgba(0,224,122,0.1);
                padding: 3rem 2rem;
            }

            .tips-inner {
                max-width: 900px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2.5rem;
                align-items: center;
            }

            .tips-label {
                font-size: 0.7rem;
                font-weight: 700;
                color: #00e07a;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                margin-bottom: 0.6rem;
            }

            .tips-title {
                font-family: 'Syne', system-ui, sans-serif;
                font-size: 1.6rem;
                font-weight: 800;
                color: #f0f4ff;
                letter-spacing: -0.03em;
                margin-bottom: 0.75rem;
                line-height: 1.2;
            }

            .tips-sub { font-size: 0.88rem; color: #7a8499; line-height: 1.65; }

            .tips-list {
                display: flex;
                flex-direction: column;
                gap: 0.7rem;
            }

            .tip-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 0.87rem;
                color: #b0b8c8;
            }

            .tip-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #00e07a;
                flex-shrink: 0;
                box-shadow: 0 0 8px rgba(0,224,122,0.5);
            }

            /* ── Footer ── */
            .landing-footer {
                position: relative;
                z-index: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.25rem 2.5rem;
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
                padding: 0.38rem 0.85rem;
                font-size: 0.74rem;
                font-weight: 700;
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                color: #4a5568;
                background: transparent;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .admin-btn:hover {
                background: rgba(255,255,255,0.05);
                color: #7a8499;
                border-color: rgba(255,255,255,0.14);
            }

            @media (max-width: 768px) {
                .landing-header { padding: 0.85rem 1.25rem; }
                .landing-main { padding: 3.5rem 1.5rem 2.5rem; }
                .action-buttons-container { flex-direction: column; width: 100%; gap: 0.9rem; align-items: center; }
                .action-btn { padding: 1.15rem 2.8rem; font-size: 1.1rem; width: 100%; max-width: 300px; }
                .quick-grid { grid-template-columns: 1fr; }
                .tips-inner { grid-template-columns: 1fr; }
                .landing-footer { padding: 1.1rem 1.25rem; }
            }
        `;
        styleElement.id = 'user-landing-styles';
        document.head.appendChild(styleElement);
        return () => {
            const el = document.getElementById('user-landing-styles');
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

export default function UserLandingPage() {
    const navigate             = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <>
            <PageStyler />
            <div className="landing-container">
                <header className="landing-header">
                    <div className="logo-container">
                        <LogoIcon />
                        <div className="logo-text-wrap">
                            <span className="logo-primary">Lost & Found</span>
                            <span className="logo-sub">AI Platform</span>
                        </div>
                    </div>
                    <nav style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                        <span className="nav-greeting">
                            Hi, {user?.name?.split(" ")[0] || "User"} 👋
                        </span>
                        {isAdmin() && (
                            <button className="nav-btn admin" onClick={() => navigate("/admin")}>
                                🛡️ Admin
                            </button>
                        )}
                        <button className="nav-btn primary" onClick={() => navigate("/notifications")}>
                            My Items
                        </button>
                        <button className="nav-btn logout" onClick={handleLogout}>
                            Sign Out
                        </button>
                    </nav>
                </header>

                <main className="landing-main">
                    <div className="hero-text-container">
                        <div className="hero-badge">✦ Welcome back</div>
                        <h1 className="hero-title">
                            Hey, <span className="accent">{user?.name?.split(" ")[0]}!</span><br />
                            What can we find?
                        </h1>
                        <p className="hero-subtitle">
                            Lost something or found an item? Let our AI match them together in minutes.
                        </p>
                    </div>
                    <div className="action-buttons-container">
                        <a className="action-btn lost-btn" onClick={() => navigate("/lost")}>
                            🔍 Lost?
                        </a>
                        <a className="action-btn found-btn" onClick={() => navigate("/found")}>
                            📦 Found?
                        </a>
                    </div>
                </main>

                {/* Quick actions */}
                <div className="quick-section">
                    <div className="quick-grid">
                        <div className="quick-card" onClick={() => navigate("/lost")}>
                            <span className="quick-icon">🔍</span>
                            <div className="quick-title">Report Lost Item</div>
                            <p className="quick-desc">Describe your lost item and our AI will search for matches in real time.</p>
                        </div>
                        <div className="quick-card" onClick={() => navigate("/found")}>
                            <span className="quick-icon">📦</span>
                            <div className="quick-title">Report Found Item</div>
                            <p className="quick-desc">Found something? Help reunite it with its owner by logging it here.</p>
                        </div>
                        <div className="quick-card" onClick={() => navigate("/notifications")}>
                            <span className="quick-icon">🔔</span>
                            <div className="quick-title">My Dashboard</div>
                            <p className="quick-desc">View your active reports, matches, and chat with finders or owners.</p>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="tips-section">
                    <div className="tips-inner">
                        <div>
                            <div className="tips-label">Pro Tips</div>
                            <div className="tips-title">Better reports<br />mean faster matches</div>
                            <p className="tips-sub">The more detail you provide, the more accurate our AI matching becomes.</p>
                        </div>
                        <div className="tips-list">
                            <div className="tip-item">
                                <span className="tip-dot" />
                                Add a clear photo — visual matching can identify items in seconds
                            </div>
                            <div className="tip-item">
                                <span className="tip-dot" />
                                Include brand, color, and any unique markings in your description
                            </div>
                            <div className="tip-item">
                                <span className="tip-dot" />
                                Set an accurate location to narrow down local matches
                            </div>
                            <div className="tip-item">
                                <span className="tip-dot" />
                                Check your notifications regularly — matches can appear anytime
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="landing-footer">
                    <div className="contact-info">Contact us</div>
                    {isAdmin() && (
                        <button className="admin-btn" onClick={() => navigate("/admin")} title="Admin Dashboard">
                            🛡️ Admin Dashboard
                        </button>
                    )}
                </footer>
            </div>
        </>
    );
}