import React, { useState, useEffect, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useChat } from "../context/ChatContext";

const MatchesPageStyler = () => {
    useLayoutEffect(() => {
        const style = document.createElement("style");
        style.id = "matches-styles";
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

            *, *::before, *::after { box-sizing: border-box; }
            body {
                margin: 0;
                background: #07090f;
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                color: #dde4f0;
                -webkit-font-smoothing: antialiased;
            }

            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: #07090f; }
            ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 6px; }

            .matches-container {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                background: #07090f;
                background-image: radial-gradient(rgba(0,224,122,0.045) 1px, transparent 1px);
                background-size: 32px 32px;
            }

            .matches-navbar {
                background: rgba(7,9,15,0.9);
                padding: 0.9rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255,255,255,0.06);
                backdrop-filter: blur(16px);
                position: sticky;
                top: 0;
                z-index: 10;
            }

            .matches-navbar .logo {
                font-family: 'Syne', system-ui, sans-serif;
                font-size: 1.15rem;
                font-weight: 800;
                color: #00e07a;
                letter-spacing: -0.03em;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .matches-navbar .logo-icon-svg { width: 30px; height: 30px; }

            .matches-navbar .back-btn {
                padding: 0.45rem 1rem;
                background: transparent;
                color: #7a8499;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.84rem;
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                transition: all 0.2s;
            }

            .matches-navbar .back-btn:hover {
                background: rgba(255,255,255,0.06);
                color: #dde4f0;
                border-color: rgba(255,255,255,0.18);
            }

            .matches-body {
                flex: 1;
                display: flex;
                justify-content: center;
                padding: 2.5rem 1.5rem;
            }

            .matches-card {
                background: #111826;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 20px;
                padding: 2.5rem;
                max-width: 960px;
                width: 100%;
                box-shadow: 0 16px 60px rgba(0,0,0,0.5);
            }

            .matches-title {
                font-family: 'Syne', system-ui, sans-serif;
                font-size: 1.7rem;
                font-weight: 800;
                color: #f0f4ff;
                margin-bottom: 0.4rem;
                text-align: center;
                letter-spacing: -0.03em;
            }

            .matches-subtitle {
                text-align: center;
                color: #7a8499;
                margin-bottom: 2rem;
                font-size: 0.9rem;
            }

            .loading-box {
                text-align: center;
                padding: 3.5rem;
                color: #7a8499;
            }

            .spinner {
                width: 44px; height: 44px;
                border: 4px solid rgba(0,224,122,0.1);
                border-top-color: #00e07a;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 1.25rem;
                box-shadow: 0 0 16px rgba(0,224,122,0.15);
            }

            @keyframes spin { to { transform: rotate(360deg); } }

            .no-matches-box {
                text-align: center;
                padding: 3.5rem;
            }

            .no-matches-box h3 {
                font-family: 'Syne', system-ui, sans-serif;
                color: #f0f4ff;
                font-weight: 700;
                margin-bottom: 0.5rem;
                font-size: 1.2rem;
                letter-spacing: -0.02em;
            }

            .no-matches-box p { color: #7a8499; font-size: 0.88rem; }

            .matches-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                gap: 1.25rem;
                margin-bottom: 2rem;
            }

            .match-card {
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 14px;
                overflow: hidden;
                transition: all 0.2s;
                background: #0c1018;
            }

            .match-card.clickable { cursor: pointer; }

            .match-card.clickable:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                border-color: rgba(255,255,255,0.15);
            }

            .match-card.selected {
                border-color: #00e07a;
                box-shadow: 0 0 0 2px rgba(0,224,122,0.2), 0 8px 24px rgba(0,224,122,0.15);
            }

            .match-card-img {
                width: 100%;
                height: 180px;
                background: #0c1018;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3rem;
                border-bottom: 1px solid rgba(255,255,255,0.07);
            }

            .match-card-img img { width: 100%; height: 100%; object-fit: cover; }

            .match-card-body { padding: 1rem; }

            .match-card-title {
                font-weight: 700;
                color: #f0f4ff;
                margin-bottom: 0.25rem;
                font-size: 0.94rem;
            }

            .match-card-desc {
                color: #7a8499;
                font-size: 0.83rem;
                margin-bottom: 0.5rem;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                line-height: 1.4;
            }

            .match-card-location { font-size: 0.78rem; color: #4a5568; }

            .confidence-badge {
                display: inline-block;
                background: rgba(0,224,122,0.12);
                color: #00e07a;
                border: 1px solid rgba(0,224,122,0.2);
                font-size: 0.72rem;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 20px;
                margin-bottom: 0.5rem;
                letter-spacing: 0.03em;
            }

            .action-buttons {
                display: flex;
                justify-content: center;
                gap: 1.25rem;
                flex-wrap: wrap;
                margin-top: 1rem;
            }

            .primary-btn {
                padding: 0.82rem 2rem;
                font-size: 0.92rem;
                font-weight: 700;
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                border-radius: 10px;
                border: none;
                cursor: pointer;
                background: #00e07a;
                color: #030a04;
                transition: all 0.2s;
                letter-spacing: 0.01em;
            }

            .primary-btn:hover {
                background: #00ff8a;
                box-shadow: 0 0 24px rgba(0,224,122,0.35);
                transform: translateY(-1px);
            }

            .primary-btn:disabled {
                background: rgba(0,224,122,0.25);
                color: rgba(0,224,122,0.5);
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .secondary-btn {
                padding: 0.82rem 2rem;
                font-size: 0.92rem;
                font-weight: 700;
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.12);
                background: transparent;
                color: #7a8499;
                cursor: pointer;
                transition: all 0.2s;
            }

            .secondary-btn:hover {
                background: rgba(255,255,255,0.05);
                color: #dde4f0;
                border-color: rgba(255,255,255,0.2);
            }

            .info-banner {
                background: rgba(0,224,122,0.06);
                border: 1px solid rgba(0,224,122,0.14);
                border-radius: 10px;
                padding: 12px 16px;
                color: #00e07a;
                font-size: 0.86rem;
                margin-bottom: 1.5rem;
                text-align: center;
                line-height: 1.5;
            }

            @media (max-width: 768px) {
                .matches-grid { grid-template-columns: 1fr; }
                .matches-card { padding: 1.5rem; }
                .matches-body { padding: 1.5rem 1rem; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById("matches-styles");
            if (el) document.head.removeChild(el);
        };
    }, []);
    return null;
};

const NavLogo = () => (
    <div className="logo">
        <svg className="logo-icon-svg" viewBox="0 0 36 36" fill="none">
            <circle cx="15" cy="15" r="10.5" stroke="#00e07a" strokeWidth="2.4"/>
            <circle cx="15" cy="15" r="2" fill="#00e07a"/>
            <line x1="22.5" y1="22.5" x2="32" y2="32" stroke="#00e07a" strokeWidth="2.8" strokeLinecap="round"/>
        </svg>
        Lost&Found
    </div>
);

export default function TopMatchesPage() {
    const { itemId }   = useParams();
    const navigate     = useNavigate();
    const { openChat } = useChat();

    const [matches, setMatches]             = useState([]);
    const [itemType, setItemType]           = useState(null);
    const [loading, setLoading]             = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [hiddenDetails, setHiddenDetails] = useState(null);

    useEffect(() => {
        if (!itemId) return;
        api.get(`/items/${itemId}/matches`)
            .then(res => {
                setMatches(res.data.matches || []);
                setItemType(res.data.item_type);
                setHiddenDetails(res.data.hidden_details || null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [itemId]);

    const handleConfirm = async () => {
        if (selectedIndex === null) return;
        const match = matches[selectedIndex];
        openChat({
            matchId:      match.match_id,
            receiverId:   match.finder_user_id,
            receiverName: match.finder_name,
            hiddenDetails: hiddenDetails,
        });
        try {
            await api.patch(`/items/${itemId}/match/${match.match_id}/feedback`, { feedback: "correct" });
        } catch {}
    };

    const handleNone = async () => {
        for (const match of matches) {
            try {
                await api.patch(`/items/${itemId}/match/${match.match_id}/feedback`, { feedback: "incorrect" });
            } catch {}
        }
        navigate("/notifications");
    };

    const isFoundOwner = itemType === "Found";

    return (
        <>
            <MatchesPageStyler />
            <div className="matches-container">
                <nav className="matches-navbar">
                    <NavLogo />
                    <button className="back-btn" onClick={() => navigate("/notifications")}>← My Items</button>
                </nav>

                <div className="matches-body">
                    <div className="matches-card">
                        <h1 className="matches-title">
                            {isFoundOwner ? "Matched Lost Items" : "Top Matches"}
                        </h1>

                        {loading && (
                            <div className="loading-box">
                                <div className="spinner" />
                                <p>Searching for matches…</p>
                            </div>
                        )}

                        {!loading && matches.length === 0 && (
                            <div className="no-matches-box">
                                <h3>No matches found yet</h3>
                                <p>You'll be notified as soon as a matching item is reported.</p>
                                <button className="primary-btn" style={{ marginTop:"1.5rem" }} onClick={() => navigate("/notifications")}>
                                    Back to My Items
                                </button>
                            </div>
                        )}

                        {!loading && matches.length > 0 && (
                            <>
                                <div className="info-banner">
                                    {isFoundOwner
                                        ? "These are lost items that match what you found. The owner has been notified and may contact you."
                                        : "These found items most closely match your lost item report. Select one if it looks like yours."}
                                </div>

                                <div className="matches-grid">
                                    {matches.map((match, index) => (
                                        <div
                                            key={match.match_id}
                                            className={`match-card ${!isFoundOwner ? "clickable" : ""} ${selectedIndex === index ? "selected" : ""}`}
                                            onClick={() => !isFoundOwner && setSelectedIndex(index)}
                                        >
                                            <div className="match-card-img">
                                                {match.found_image
                                                    ? <img src={`http://localhost:5000/uploads/${match.found_image}`} alt={match.found_title} />
                                                    : "📦"}
                                            </div>
                                            <div className="match-card-body">
                                                <div className="confidence-badge">{match.confidence_score}% match</div>
                                                <div className="match-card-title">
                                                    {isFoundOwner ? match.lost_title : match.found_title}
                                                </div>
                                                <div className="match-card-desc">
                                                    {isFoundOwner ? match.lost_description : match.found_description}
                                                </div>
                                                <div className="match-card-location">
                                                    📍 {(isFoundOwner ? match.lost_location : match.found_location) || "No location"}
                                                </div>
                                                <div style={{ fontSize:"0.78rem", color:"#4a5568", marginTop:"4px" }}>
                                                    {isFoundOwner ? `Lost by: ${match.owner_name}` : `Found by: ${match.finder_name}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!isFoundOwner && (
                                    <div className="action-buttons">
                                        <button className="primary-btn" disabled={selectedIndex === null} onClick={handleConfirm}>
                                            This is my item — Chat with Finder
                                        </button>
                                        <button className="secondary-btn" onClick={handleNone}>
                                            None of these are mine
                                        </button>
                                    </div>
                                )}

                                {isFoundOwner && (
                                    <div style={{ textAlign:"center", marginTop:"1.5rem" }}>
                                        <p style={{ color:"#7a8499", fontSize:"0.88rem", marginBottom:"1rem", lineHeight:1.6 }}>
                                            If the owner contacts you, the conversation will appear in your <strong style={{color:"#dde4f0"}}>My Chats</strong> tab.
                                        </p>
                                        <button className="secondary-btn" onClick={() => navigate("/notifications")}>
                                            Go to My Dashboard
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
