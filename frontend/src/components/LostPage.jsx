// frontend/src/components/LostPage.jsx
/*
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

      
      <main className="main-content">
        
        
        <div className="form-page-header">
          <h2>Report a Lost Item</h2>
          <p className="form-header-tagline">
            Tell us what you lost and where. We'll try to match it with people who reported similar found items.
          </p>
        </div>

        <form className="lost-form" onSubmit={handleSubmit}>
          
          
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
          
          
          <div className="form-group">
            <label htmlFor="title">Item Title:</label>
            <input type="text" id="title" name="title" placeholder="Example: Brown Leather Wallet" value={formData.title} onChange={handleChange} required className="form-input" />
          </div>

          
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea id="description" name="description" rows="4" placeholder="Color, brand, stickers, scratches, special marks, etc." value={formData.description} onChange={handleChange} required className="form-input"></textarea>
            <p className="input-tagline">Add anything that makes this item easy to recognize.</p>
          </div>

          
          <div className="form-group">
            <label htmlFor="dateOfLoss">Date of Loss:</label>
            <input type="date" id="dateOfLoss" name="dateOfLoss" value={formData.dateOfLoss} onChange={handleChange} required className="form-input" />
          </div>

          
          <div className="form-group">
            <label htmlFor="lastKnownLocation">Last Known Location:</label>
            <input type="text" id="lastKnownLocation" name="lastKnownLocation" placeholder="Example: University Library, 3rd Floor" value={formData.lastKnownLocation} onChange={handleChange} required className="form-input" />
          </div>

          
          <div className="form-group">
            <label htmlFor="photos">Item photo:</label>
            <input type="file" id="photos" name="photos" accept="image/*" onChange={handleChange} className="form-input-file" />
            <p className="input-tagline">A clear photo increases matching accuracy.</p>
          </div>
            
          
          <p className="submission-disclaimer">
            By submitting, you confirm this is an honest report.
          </p>

          
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

*/

import React, { useState, useEffect } from 'react';
import './LostPage.css';
import AIMatchingModal from "./AIMatchingModal";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function LostPage() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        location: '',
        hidden_details: '',
        photo: null,
    });

    const [categories, setCategories]   = useState([]);
    const [aiStatus, setAiStatus]       = useState(null);
    const [submittedItemId, setSubmittedItemId] = useState(null);
    const [error, setError]             = useState("");
    const navigate = useNavigate();

    // Load categories from backend on mount
    useEffect(() => {
        api.get("/items/categories")
            .then(res => setCategories(res.data.categories))
            .catch(() => setCategories([]));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setAiStatus("loading");

        try {
            // Use FormData for multipart (text + image)
            const data = new FormData();
            data.append("title",          formData.title);
            data.append("description",    formData.description);
            data.append("category_id",    formData.category_id);
            data.append("location",       formData.location);
            data.append("hidden_details", formData.hidden_details);
            if (formData.photo) data.append("image", formData.photo);

            const res = await api.post("/items/lost", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setSubmittedItemId(res.data.item_id);

            // Wait 4 seconds to let AI pipeline run in background, then check for matches
            let attempts = 0;
            const maxAttempts = 5;

            const pollForMatches = async (id) => {
                attempts++;
                try {
                    const matchRes = await api.get(`/items/${id}/matches`);
                    const matches  = matchRes.data.matches || [];

                    if (matches.length > 0) {
                        // Matches found — show result
                        setAiStatus("match-found");
                    } else if (attempts < maxAttempts) {
                        // No match yet — wait 3 seconds and try again
                        setTimeout(() => pollForMatches(id), 3000);
                    } else {
                        // Gave up after max attempts
                        setAiStatus("no-match");
                    }
                } catch {
                    setAiStatus("no-match");
                }
            };

            // Start polling after 3 seconds
            setTimeout(() => pollForMatches(res.data.item_id), 3000);
            
        } catch (err) {
            setAiStatus(null);
            const msg = err.response?.data?.error || "Failed to submit. Please try again.";
            setError(msg);
        }
    };

    const handleCancel = () => {
        setFormData({ title:'', description:'', category_id:'', location:'', hidden_details:'', photo: null });
        navigate("/userlanding");
    };

    return (
        <div className="lost-page-container">
            <header className="navbar">
                <div className="logo">🔗 Lost&Found</div>
                <nav className="nav-links">
                    <a onClick={() => navigate("/userlanding")} className="nav-link" style={{cursor:"pointer"}}>Home</a>
                    <a onClick={() => navigate("/notifications")} className="nav-link" style={{cursor:"pointer"}}>My Items</a>
                </nav>
            </header>

            <main className="main-content">
                <div className="form-page-header">
                    <h2>Report a Lost Item</h2>
                    <p className="form-header-tagline">
                        Tell us what you lost and where. We'll try to match it with found items using AI.
                    </p>
                </div>

                {error && (
                    <div style={{ background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", borderRadius:"6px", padding:"10px", marginBottom:"16px", fontSize:"14px" }}>
                        {error}
                    </div>
                )}

                <form className="lost-form" onSubmit={handleSubmit}>

                    {/* Category */}
                    <div className="form-group">
                        <label htmlFor="category_id">Item Category:</label>
                        <select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange} required className="form-input">
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat.category_id} value={cat.category_id}>
                                    {cat.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label htmlFor="title">Item Title:</label>
                        <input type="text" id="title" name="title" placeholder="Example: Brown Leather Wallet" value={formData.title} onChange={handleChange} required className="form-input" />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea id="description" name="description" rows="4" placeholder="Color, brand, stickers, scratches, special marks, etc." value={formData.description} onChange={handleChange} required className="form-input" />
                        <p className="input-tagline">Add anything that makes this item easy to recognize.</p>
                    </div>

                    {/* Location */}
                    <div className="form-group">
                        <label htmlFor="location">Last Known Location:</label>
                        <input type="text" id="location" name="location" placeholder="Example: University Library, 3rd Floor" value={formData.location} onChange={handleChange} required className="form-input" />
                    </div>

                    {/* Hidden details for ownership verification */}
                    <div className="form-group">
                        <label htmlFor="hidden_details">Secret Identifying Detail: <span style={{color:"#16a34a", fontSize:"12px"}}>(private — used to verify ownership)</span></label>
                        <input type="text" id="hidden_details" name="hidden_details" placeholder="Example: Has a scratch on the back, sticker inside, name written on tag" value={formData.hidden_details} onChange={handleChange} className="form-input" />
                        <p className="input-tagline">This will NOT be shown to finders. You'll use it to prove the item is yours.</p>
                    </div>

                    {/* Photo */}
                    <div className="form-group">
                        <label htmlFor="photo">Item Photo (optional):</label>
                        <input type="file" id="photo" name="photo" accept="image/*" onChange={handleChange} className="form-input-file" />
                        <p className="input-tagline">A clear photo increases matching accuracy.</p>
                    </div>

                    <p className="submission-disclaimer">By submitting, you confirm this is an honest report.</p>

                    <div className="form-buttons">
                        <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="submit-btn green-btn">Submit Lost Report</button>
                    </div>
                </form>
            </main>

            <AIMatchingModal
                status={aiStatus}
                onClose={() => { setAiStatus(null); navigate("/notifications"); }}
                onViewMatches={() => navigate(`/topmatches/${submittedItemId}`)}
            />
        </div>
    );
}

export default LostPage;
