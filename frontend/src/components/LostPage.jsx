// frontend/src/components/LostPage.jsx

import React, { useState } from 'react';
import './LostPage.css';
import AIMatchingModal from "./AIMatchingModal";
import { useNavigate } from "react-router-dom";

function LostPage() {   //defines functional component LostPage
  const [formData, setFormData] = useState({
    itemType: '',
    title: '',
    description: '',
    dateOfLoss: '',
    lastKnownLocation: '',
    photos: null,
  });

  const [aiStatus, setAiStatus] = useState(null);//stores the current AI matching state
  const navigate = useNavigate();

  // This function runs every time the user types or selects something.
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prevData => ({
      ...prevData,
      // Handle file input separately, otherwise use value
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();//Prevents page refresh   
    console.log('Lost Item Data Submitted:', formData);//print to console

    setAiStatus("loading");

    // Mock AI processing
    setTimeout(() => {//waits 3 seconds to simulate AI processing
      const matchFound = true;
      setAiStatus(matchFound ? "match-found" : "no-match");
    }, 3000);
  };
  
  // Handler for the Cancel button
  const handleCancel = () => {
    // Optionally clear form or redirect user
    setFormData({
      itemType: '',
      title: '',
      description: '',
      dateOfLoss: '',
      lastKnownLocation: '',
      photos: null,
    });
    console.log('Form cancelled/reset.');
  };

  return (
    <div className="lost-page-container">
      
      {/* --- HEADER (Green/White Dashboard Style) --- */}
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">🔗</span> Lost&Found
        </div>
        <nav className="nav-links">
          <a href="/" className="nav-link">Home</a>
          <a href="/dashboard" className="nav-link">My Items</a>
          <button className="profile-btn green-btn">Profile</button>
        </nav>
      </header>

      {/* --- MAIN CONTENT / FORM --- */}
      <main className="main-content">
        
        {/* FORM HEADER */}
        <div className="form-page-header">
          <h2>Report a Lost Item</h2>
          <p className="form-header-tagline">
            Tell us what you lost and where. We'll try to match it with people who reported similar found items.
          </p>
        </div>

        <form className="lost-form" onSubmit={handleSubmit}>
          
          {/* 1. Item Type */}
          <div className="form-group">
            <label htmlFor="itemType">Item Type:</label>
            <select id="itemType" name="itemType" value={formData.itemType} onChange={handleChange} required className="form-input">
              <option value="">Select Category</option>
              <option value="electronics">Electronics</option>
              <option value="keys">Keys</option>
              <option value="wallet">Wallet/Purse</option>
              <option value="luggage">Bags/Luggage</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* 2. Item Title */}
          <div className="form-group">
            <label htmlFor="title">Item Title:</label>
            <input type="text" id="title" name="title" placeholder="Example: Brown Leather Wallet" value={formData.title} onChange={handleChange} required className="form-input" />
          </div>

          {/* 3. Description (Color/Shape/Size/Specifics) with Tagline */}
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea id="description" name="description" rows="4" placeholder="Color, brand, stickers, scratches, special marks, etc." value={formData.description} onChange={handleChange} required className="form-input"></textarea>
            <p className="input-tagline">Add anything that makes this item easy to recognize.</p>
          </div>

          {/* 4. Date of Loss */}
          <div className="form-group">
            <label htmlFor="dateOfLoss">Date of Loss:</label>
            <input type="date" id="dateOfLoss" name="dateOfLoss" value={formData.dateOfLoss} onChange={handleChange} required className="form-input" />
          </div>

          {/* 5. Last Known Location */}
          <div className="form-group">
            <label htmlFor="lastKnownLocation">Last Known Location:</label>
            <input type="text" id="lastKnownLocation" name="lastKnownLocation" placeholder="Example: University Library, 3rd Floor" value={formData.lastKnownLocation} onChange={handleChange} required className="form-input" />
          </div>

          {/* 6. Photos (if any) with Tagline */}
          <div className="form-group">
            <label htmlFor="photos">Item photo:</label>
            <input type="file" id="photos" name="photos" accept="image/*" onChange={handleChange} className="form-input-file" />
            <p className="input-tagline">A clear photo increases matching accuracy.</p>
          </div>
            
          {/* Submission Disclaimer */}
          <p className="submission-disclaimer">
            By submitting, you confirm this is an honest report.
          </p>

          {/* Form Buttons (Aligned to the Right) */}
          <div className="form-buttons">
            <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="submit-btn green-btn">Submit Lost Report</button>
          </div>
        </form>
      </main>

      <AIMatchingModal
        status={aiStatus} //loading, match-found, no-match
        onClose={() => setAiStatus(null)} //reset status on close
        onViewMatches={() => navigate("/topmatches")}
      />
    </div>
  );
}

export default LostPage;//lost page component is made available for rest of website to use