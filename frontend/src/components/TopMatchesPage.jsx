import React, { useState, useLayoutEffect } from "react";

/* --- Page Styling (same palette, plain CSS) --- */
const MatchesPageStyler = () => {
  useLayoutEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      body {
        margin: 0;
        background-color: #f0fdf4;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      }

      .matches-container {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
      }

      .matches-card {
        background: white;
        border-radius: 16px;
        padding: 2.5rem;
        max-width: 900px;
        width: 100%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        text-align: center;
      }

      .matches-title {
        font-size: 2rem;
        font-weight: 700;
        color: #14532d;
        margin-bottom: 2rem;
      }

      .images-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-bottom: 2.5rem;
      }

      .image-card {
        border: 3px solid transparent;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: #ecfdf5;
      }

      .image-card:hover {
        transform: translateY(-4px);
      }

      .image-card.selected {
        border-color: #22c55e;
        box-shadow: 0 8px 20px rgba(34,197,94,0.3);
      }

      .image-card img {
        width: 100%;
        height: 220px;
        object-fit: cover;
        display: block;
      }

      .action-buttons {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
      }

      .primary-btn {
        padding: 0.9rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        background-color: #22c55e;
        color: white;
        transition: background-color 0.2s ease;
      }

      .primary-btn:disabled {
        background-color: #a7f3d0;
        cursor: not-allowed;
      }

      .secondary-btn {
        padding: 0.9rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 10px;
        border: 2px solid #22c55e;
        background: white;
        color: #15803d;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .secondary-btn:hover {
        background-color: #f0fdf4;
      }

      /* ---------- Chatbox styles ---------- */

      .chatbox {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        height: 420px;
        background: white;
        border-radius: 14px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 1000;
      }

      .chatbox-header {
        background-color: #22c55e;
        color: white;
        padding: 0.8rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      .chatbox-header button {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
      }

      .chatbox-messages {
        flex: 1;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        overflow-y: auto;
        background-color: #f0fdf4;
      }

      .message {
        max-width: 75%;
        padding: 0.6rem 0.9rem;
        border-radius: 12px;
        font-size: 0.9rem;
        line-height: 1.3;
      }

      .message.sent {
        align-self: flex-end;
        background-color: #22c55e;
        color: white;
        border-bottom-right-radius: 4px;
      }

      .message.received {
        align-self: flex-start;
        background-color: #e5e7eb;
        color: #111827;
        border-bottom-left-radius: 4px;
      }

      .chatbox-input {
        display: flex;
        padding: 0.7rem;
        border-top: 1px solid #e5e7eb;
        gap: 0.5rem;
      }

      .chatbox-input input {
        flex: 1;
        padding: 0.5rem 0.7rem;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        outline: none;
      }

      .chatbox-input button {
        background-color: #22c55e;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 0.9rem;
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .images-grid {
          grid-template-columns: 1fr;
        }

        .chatbox {
          width: 90%;
          right: 5%;
        }
      }
    `;

    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return null;
};

/* --- ChatBox Component --- */
const ChatBox = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <span>Chat</span>
        <button onClick={onClose}>×</button>
      </div>

      <div className="chatbox-messages">
        <div className="message received">
          Hi, I think this item might be yours.
        </div>
        <div className="message sent">
          Yes, I lost it near the library.
        </div>
      </div>

      <div className="chatbox-input">
        <input type="text" placeholder="Type a message..." />
        <button>Send</button>
      </div>
    </div>
  );
};

/* --- Main Page --- */
const TopMatchesPage = () => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const images = [
    "https://via.placeholder.com/400x300?text=Match+1",
    "https://via.placeholder.com/400x300?text=Match+2",
    "https://via.placeholder.com/400x300?text=Match+3",
  ];

  const handleConfirm = () => {
    if (selectedIndex === null) return;
    console.log("Selected item index:", selectedIndex);
    setChatOpen(true);
  };

  const handleNone = () => {
    console.log("User says none of these items are theirs");
  };

  return (
    <>
      <MatchesPageStyler />

      <div className="matches-container">
        <div className="matches-card">
          <h1 className="matches-title">Top matches</h1>

          <div className="images-grid">
            {images.map((src, index) => (
              <div
                key={index}
                className={`image-card ${
                  selectedIndex === index ? "selected" : ""
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <img src={src} alt={`Match ${index + 1}`} />
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <button
              className="primary-btn"
              disabled={selectedIndex === null}
              onClick={handleConfirm}
            >
              This is my item
            </button>

            <button className="secondary-btn" onClick={handleNone}>
              None of these items is mine
            </button>
          </div>
        </div>
      </div>

      <ChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
};

export default TopMatchesPage;
