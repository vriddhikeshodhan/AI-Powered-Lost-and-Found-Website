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
                background: radial-gradient(circle at top right, rgba(14, 23, 38, 0.8), transparent 40%),
                            radial-gradient(circle at bottom left, rgba(14, 23, 38, 0.8), transparent 40%);
            }

            .matches-navbar {
                background: rgba(11, 15, 23, 0.8);
                backdrop-filter: blur(12px);
                padding: 1rem 2.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                position: sticky;
                top: 0;
                z-index: 100;
            }

            .matches-navbar .logo {
                font-family: 'Syne', sans-serif;
                font-size: 1.4rem;
                font-weight: 800;
                color: #fff;
                letter-spacing: -0.5px;
            }

            .matches-navbar .logo span { color: #60a5fa; }

            .matches-navbar .back-btn {
                padding: 0.5rem 1.2rem;
                background: rgba(255, 255, 255, 0.05);
                color: #94a3b8;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .matches-navbar .back-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                transform: translateY(-1px);
            }

            .matches-body {
                flex: 1;
                display: flex;
                justify-content: center;
                padding: 3rem 2rem;
            }

            .matches-card {
                background: rgba(15, 21, 31, 0.6);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 24px;
                padding: 3rem;
                max-width: 1040px;
                width: 100%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }

            .matches-title {
                font-family: 'Syne', sans-serif;
                font-size: 2.2rem;
                font-weight: 700;
                color: #fff;
                margin: 0 0 0.5rem 0;
                text-align: center;
                letter-spacing: -1px;
            }

            .matches-subtitle {
                text-align: center;
                color: #94a3b8;
                margin-bottom: 3rem;
                font-size: 1rem;
            }

            .loading-box { text-align: center; padding: 4rem 2rem; color: #94a3b8; }
            
            .spinner {
                width: 40px; height: 40px;
                border: 3px solid rgba(96, 165, 250, 0.1);
                border-top-color: #60a5fa;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 1.5rem;
            }
            @keyframes spin { to { transform: rotate(360deg); } }

            .no-matches-box {
                text-align: center;
                padding: 4rem 2rem;
                background: rgba(14, 23, 38, 0.4);
                border-radius: 16px;
                border: 1px dashed rgba(255, 255, 255, 0.1);
            }

            .no-matches-box h3 {
                color: #fff;
                margin: 0 0 0.5rem 0;
                font-family: 'Syne', sans-serif;
                font-size: 1.4rem;
            }
            .no-matches-box p { color: #94a3b8; font-size: 0.95rem; margin: 0; }

            .info-banner {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-left: 4px solid #3b82f6;
                border-radius: 10px;
                padding: 14px 20px;
                color: #bfdbfe;
                font-size: 0.95rem;
                margin-bottom: 2rem;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .matches-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1.5rem;
                margin-bottom: 3rem;
            }

            .match-card {
                background: rgba(15, 21, 31, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }

            .match-card.clickable { cursor: pointer; }
            
            .match-card.clickable:hover {
                transform: translateY(-4px);
                border-color: rgba(96, 165, 250, 0.4);
                box-shadow: 0 12px 24px rgba(0,0,0,0.3), 0 0 20px rgba(96, 165, 250, 0.1);
            }

            .match-card.selected {
                border-color: #3b82f6;
                background: rgba(29, 78, 216, 0.05);
                box-shadow: 0 0 0 1px #3b82f6, 0 12px 24px rgba(0,0,0,0.3);
            }

            .match-card.selected::before {
                content: '✓';
                position: absolute;
                top: 12px;
                right: 12px;
                background: #3b82f6;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: bold;
                z-index: 10;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
            }

            .match-card-img {
                width: 100%;
                height: 190px;
                background: #0f1521;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3rem;
                position: relative;
            }

            .match-card-img img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                font-size: 1rem;
                transition: transform 0.3s ease;
            }
            
            /* ADDED: Hover effect to indicate the image is clickable */
            .match-card-img img:hover {
                transform: scale(1.05);
            }

            .match-card-body { padding: 1.25rem; }

            .confidence-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: rgba(34, 197, 94, 0.1);
                color: #4ade80;
                border: 1px solid rgba(34, 197, 94, 0.2);
                font-size: 0.75rem;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 20px;
                margin-bottom: 0.75rem;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }

            .match-card-title {
                font-family: 'Syne', sans-serif;
                font-weight: 700;
                color: #fff;
                margin-bottom: 0.4rem;
                font-size: 1.1rem;
                line-height: 1.3;
            }

            .match-card-desc {
                color: #94a3b8;
                font-size: 0.85rem;
                line-height: 1.5;
                margin-bottom: 1rem;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .match-card-meta {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding-top: 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.8rem;
                color: #64748b;
            }

            .action-buttons {
                display: flex;
                justify-content: center;
                gap: 1rem;
                flex-wrap: wrap;
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid rgba(255, 255, 255, 0.06);
            }

            .primary-btn {
                padding: 0.9rem 2rem;
                font-size: 1rem;
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-weight: 600;
                border-radius: 12px;
                border: none;
                cursor: pointer;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                transition: all 0.2s ease;
            }

            .primary-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
            }

            .primary-btn:disabled {
                background: #1e293b;
                color: #64748b;
                cursor: not-allowed;
                box-shadow: none;
            }

            .secondary-btn {
                padding: 0.9rem 2rem;
                font-size: 1rem;
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-weight: 600;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.05);
                color: #cbd5e1;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .secondary-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            /* ADDED: Styles for the Full-Screen Image Modal */
            .image-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(6px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                padding: 2rem;
            }

            .image-modal-content {
                position: relative;
                max-width: 90vw;
                max-height: 90vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .image-modal-content img {
                max-width: 100%;
                max-height: 90vh;
                border-radius: 8px;
                object-fit: contain;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }

            .image-modal-close {
                position: absolute;
                top: -40px;
                right: 0;
                background: none;
                border: none;
                color: #fff;
                font-size: 2.5rem;
                cursor: pointer;
                line-height: 1;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .image-modal-close:hover {
                opacity: 1;
            }

            @media (max-width: 768px) {
                .matches-body { padding: 1.5rem 1rem; }
                .matches-card { padding: 2rem 1.5rem; }
                .matches-title { font-size: 1.8rem; }
                .matches-grid { grid-template-columns: 1fr; }
                .action-buttons { flex-direction: column; }
                .primary-btn, .secondary-btn { width: 100%; }
            }
        `;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById("matches-styles");
            if (el) el.remove();
        };
    }, []);
    return null;
};

export default function TopMatchesPage() {
    const { itemId }   = useParams();
    const navigate     = useNavigate();
    const { openChat } = useChat();

    const [matches, setMatches]             = useState([]);
    const [itemType, setItemType]           = useState(null);
    const [loading, setLoading]             = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [hiddenDetails, setHiddenDetails] = useState(null);
    
    // ADDED: State to track the currently expanded image URL
    const [expandedImage, setExpandedImage] = useState(null);

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
                    <div className="logo">Lost<span>&</span>Found</div>
                    <button className="back-btn" onClick={() => navigate("/notifications")}>
                        ← Back to Dashboard
                    </button>
                </nav>

                <div className="matches-body">
                    <div className="matches-card">
                        <h1 className="matches-title">
                            {isFoundOwner ? "Matched Lost Items" : "Top Matches Found"}
                        </h1>
                        <p className="matches-subtitle">
                            {isFoundOwner 
                                ? "Our AI found these lost reports that look remarkably similar to the item you found."
                                : "Our AI analyzed your report and found these potential matches in our database."}
                        </p>

                        {loading && (
                            <div className="loading-box">
                                <div className="spinner" />
                                <p>Analyzing visual and semantic data...</p>
                            </div>
                        )}

                        {!loading && matches.length === 0 && (
                            <div className="no-matches-box">
                                <h3>No matches found yet</h3>
                                <p>Our AI is constantly scanning. You'll be notified the moment a matching item enters the system.</p>
                                <button className="secondary-btn" style={{ marginTop:"1.5rem" }} onClick={() => navigate("/notifications")}>
                                    Return to Dashboard
                                </button>
                            </div>
                        )}

                        {!loading && matches.length > 0 && (
                            <>
                                <div className="info-banner">
                                    <span style={{fontSize:"1.2rem"}}>💡</span>
                                    {isFoundOwner
                                        ? "The owners of these items have been notified. If they verify it's theirs, they will initiate a chat with you."
                                        : "Select the item that looks exactly like yours to open a secure chat with the finder."}
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
                                                    ? <img 
                                                        src={`http://localhost:5000/uploads/${match.found_image}`} 
                                                        alt={match.found_title} 
                                                        // ADDED: Click handler to expand the image
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevents the card selection from triggering
                                                            setExpandedImage(`http://localhost:5000/uploads/${match.found_image}`);
                                                        }}
                                                        style={{ cursor: "zoom-in" }}
                                                      />
                                                    : "📦"}
                                            </div>
                                            <div className="match-card-body">
                                                <div className="confidence-badge">
                                                    <span>⚡</span> {match.confidence_score}% AI Match
                                                </div>
                                                <div className="match-card-title">
                                                    {isFoundOwner ? match.lost_title : match.found_title}
                                                </div>
                                                <div className="match-card-desc">
                                                    {isFoundOwner ? match.lost_description : match.found_description}
                                                </div>
                                                
                                                <div className="match-card-meta">
                                                    <div className="meta-item">
                                                        <span>📍</span> {(isFoundOwner ? match.lost_location : match.found_location) || "Location not specified"}
                                                    </div>
                                                    <div className="meta-item">
                                                        <span>👤</span> {isFoundOwner ? `Lost by: ${match.owner_name}` : `Found by: ${match.finder_name}`}
                                                    </div>
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

            {/* ADDED: Full-Screen Image Modal */}
            {expandedImage && (
                <div className="image-modal-overlay" onClick={() => setExpandedImage(null)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="image-modal-close" onClick={() => setExpandedImage(null)}>
                            &times;
                        </button>
                        <img src={expandedImage} alt="Expanded view" />
                    </div>
                </div>
            )}
        </>
    );
}