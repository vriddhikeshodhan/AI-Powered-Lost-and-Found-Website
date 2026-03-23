import React, { useState, useEffect, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useChat } from "../context/ChatContext";

const MatchesPageStyler = () => {
    useLayoutEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
      body { margin:0; background-color:#f0fdf4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; }
      .matches-container { min-height:100vh; display:flex; flex-direction:column; }
      .matches-navbar { background:#fff; padding:1rem 2rem; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 5px rgba(0,0,0,0.06); border-bottom:1px solid #dcfce7; }
      .matches-navbar .logo { font-size:1.3rem; font-weight:700; color:#15803d; }
      .matches-navbar .back-btn { padding:0.5rem 1rem; background:#f0fdf4; color:#15803d; border:1px solid #22c55e; border-radius:8px; cursor:pointer; font-weight:600; }
      .matches-body { flex:1; display:flex; justify-content:center; padding:2rem; }
      .matches-card { background:white; border-radius:16px; padding:2.5rem; max-width:960px; width:100%; box-shadow:0 10px 30px rgba(0,0,0,0.08); }
      .matches-title { font-size:1.8rem; font-weight:700; color:#14532d; margin-bottom:0.5rem; text-align:center; }
      .matches-subtitle { text-align:center; color:#166534; margin-bottom:2rem; font-size:0.95rem; }
      .loading-box { text-align:center; padding:3rem; color:#166534; }
      .spinner { width:40px; height:40px; border:4px solid #dcfce7; border-top-color:#22c55e; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 1rem; }
      @keyframes spin { to { transform:rotate(360deg); } }
      .no-matches-box { text-align:center; padding:3rem; }
      .no-matches-box h3 { color:#15803d; margin-bottom:0.5rem; }
      .no-matches-box p { color:#166534; font-size:0.9rem; }
      .matches-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1.5rem; margin-bottom:2rem; }
      .match-card { border:2px solid #e5e7eb; border-radius:12px; overflow:hidden; transition:all 0.2s ease; background:#fafafa; }
      .match-card.clickable { cursor:pointer; }
      .match-card.clickable:hover { transform:translateY(-3px); box-shadow:0 6px 16px rgba(0,0,0,0.1); }
      .match-card.selected { border-color:#22c55e; box-shadow:0 6px 20px rgba(34,197,94,0.25); }
      .match-card-img { width:100%; height:180px; background:#f0fdf4; display:flex; align-items:center; justify-content:center; font-size:3rem; }
      .match-card-img img { width:100%; height:100%; object-fit:cover; }
      .match-card-body { padding:1rem; }
      .match-card-title { font-weight:600; color:#14532d; margin-bottom:0.25rem; font-size:0.95rem; }
      .match-card-desc { color:#4b5563; font-size:0.85rem; margin-bottom:0.5rem; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
      .match-card-location { font-size:0.8rem; color:#6b7280; }
      .confidence-badge { display:inline-block; background:#dcfce7; color:#15803d; font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:20px; margin-bottom:0.4rem; }
      .action-buttons { display:flex; justify-content:center; gap:1.5rem; flex-wrap:wrap; margin-top:1rem; }
      .primary-btn { padding:0.9rem 2rem; font-size:1rem; font-weight:600; border-radius:10px; border:none; cursor:pointer; background-color:#22c55e; color:white; transition:background-color 0.2s; }
      .primary-btn:hover { background-color:#16a34a; }
      .primary-btn:disabled { background-color:#a7f3d0; cursor:not-allowed; }
      .secondary-btn { padding:0.9rem 2rem; font-size:1rem; font-weight:600; border-radius:10px; border:2px solid #22c55e; background:white; color:#15803d; cursor:pointer; }
      .secondary-btn:hover { background-color:#f0fdf4; }
      .info-banner { background:#f0fdf4; border:1px solid #22c55e; border-radius:8px; padding:12px 16px; color:#15803d; font-size:0.9rem; margin-bottom:1.5rem; text-align:center; }
      @media (max-width:768px) { .matches-grid { grid-template-columns:1fr; } }
    `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);
    return null;
};

export default function TopMatchesPage() {
    const { itemId }   = useParams();
    const navigate     = useNavigate();
    const { openChat } = useChat();   // ← global chat context

    const [matches, setMatches]             = useState([]);
    const [itemType, setItemType]           = useState(null);
    const [loading, setLoading]             = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);

    useEffect(() => {
        if (!itemId) return;
        api.get(`/items/${itemId}/matches`)
            .then(res => {
                setMatches(res.data.matches || []);
                setItemType(res.data.item_type);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [itemId]);

    const handleConfirm = async () => {
        if (selectedIndex === null) return;
        const match = matches[selectedIndex];

        // Open the global chatbox — persists across navigation
        openChat({
            matchId:      match.match_id,
            receiverId:   match.finder_user_id,
            receiverName: match.finder_name
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
                    <div className="logo">🔗 Lost&Found</div>
                    <button className="back-btn" onClick={() => navigate("/notifications")}>← My Items</button>
                </nav>

                <div className="matches-body">
                    <div className="matches-card">
                        <h1 className="matches-title">
                            {isFoundOwner ? "Matched Lost Items" : "Top Matches"}
                        </h1>

                        {loading && <div className="loading-box"><div className="spinner" /><p>Loading matches...</p></div>}

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
                                                <div style={{ fontSize:"0.8rem", color:"#6b7280", marginTop:"4px" }}>
                                                    {isFoundOwner
                                                        ? `Lost by: ${match.owner_name}`
                                                        : `Found by: ${match.finder_name}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Lost item owner — can claim and open chat */}
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

                                {/* Found item owner — read-only, directed to chats */}
                                {isFoundOwner && (
                                    <div style={{ textAlign:"center", marginTop:"1.5rem" }}>
                                        <p style={{ color:"#166534", fontSize:"0.9rem", marginBottom:"1rem" }}>
                                            If the owner contacts you, the conversation will appear in your <strong>My Chats</strong> tab.
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
