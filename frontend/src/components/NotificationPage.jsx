import React, { useState } from "react";
import "./NotificationPage.css";

const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState("lost");

  const lostItems = [];
  const foundItems = [];

  const totalLost = lostItems.length;
  const totalFound = foundItems.length;
  const resolvedCount = 0;

  return (
    <div className="notification-page">
      {/* ===== HEADER ===== */}
      <header className="notification-header">
        <div className="notification-logo">
          Lost<span style={{ color: "#22c55e" }}>&Found</span>
        </div>

        <div className="notification-nav">
          <span>Home</span>
          <span>Report New Item</span>
          <span className="active">Profile</span>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="notification-container">
        {/* TITLE ROW */}
        <div className="title-row">
          <h1>My Items</h1>
          <button className="report-btn">+ Report New Item</button>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card stat-lost">
            <h3>Total Lost Items</h3>
            <p>{totalLost}</p>
          </div>

          <div className="stat-card stat-found">
            <h3>Total Found Items</h3>
            <p>{totalFound}</p>
          </div>

          <div className="stat-card stat-resolved">
            <h3>Items Resolved (All Time)</h3>
            <p>{resolvedCount}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <div
            className={`tab ${activeTab === "lost" ? "active" : ""}`}
            onClick={() => setActiveTab("lost")}
          >
            My Lost Items ({totalLost})
          </div>

          <div
            className={`tab ${activeTab === "found" ? "active" : ""}`}
            onClick={() => setActiveTab("found")}
          >
            My Found Items ({totalFound})
          </div>
        </div>

        {/* EMPTY STATE */}
        <div className="empty-box">
          <h3>No Items Reported Yet</h3>
          <p>Get started by reporting an item you've lost or found.</p>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="notification-footer">
        © 2025 Lost&Found. All rights reserved.
      </footer>
    </div>
  );
};

export default NotificationPage;
