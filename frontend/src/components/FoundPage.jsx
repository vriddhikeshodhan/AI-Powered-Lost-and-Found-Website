import React, { useState, useEffect } from "react";
import "./FoundPage.css";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import MapPicker from "./MapPicker";

export default function FoundPage() {
    const [categories, setCategories] = useState([]);
    const [success, setSuccess]       = useState(false);
    const [error, setError]           = useState("");
    const [loading, setLoading]       = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category_id: "",
        location: "",
        colour: "",      // NEW
        photo: null,
    });

    const [mapCoords, setMapCoords] = useState({ latitude: null, longitude: null });
    useEffect(() => {
        api.get("/items/categories")
            .then(res => setCategories(res.data.categories))
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        api.get("/items/categories")
            .then(res => {
                // 1. A list of core keywords to hunt for
                const hiddenKeywords = [
                    "charger", "cable", 
                    "clothing", 
                    "document", 
                    "id card", "college", 
                    "jewellery", "accessories", 
                    "other", 
                    "sport",
                    "book"
                ];

                // 2. Filter out any category that contains ANY of those keywords
                const filteredCategories = res.data.categories.filter(cat => {
                    const catName = (cat.category_name || "").toLowerCase().trim();
                    
                    // Check if this category name includes any of our forbidden keywords
                    const shouldHide = hiddenKeywords.some(keyword => catName.includes(keyword));
                    
                    // Keep it ONLY if shouldHide is false
                    return !shouldHide;
                });

                setCategories(filteredCategories);
            })
            .catch(() => setCategories([]));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "file" ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = new FormData();
            data.append("title",       formData.title);
            data.append("description", formData.description);
            data.append("category_id", formData.category_id);
            data.append("location",    formData.location);
            data.append("colour",      formData.colour);   // NEW

            // NEW — include GPS if browser provided it
            if (mapCoords.latitude  !== null) data.append("latitude",  mapCoords.latitude);
            if (mapCoords.longitude !== null) data.append("longitude", mapCoords.longitude);
            if (formData.photo) data.append("image", formData.photo);

            await api.post("/items/found", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setSuccess(true);
            window.scrollTo({ top: 0, behavior: "smooth" });

        } catch (err) {
            const msg = err.response?.data?.error || "Failed to submit. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="page-inner">
                <div className="page-header">
                    <h1 className="page-title">Report a Found Item</h1>
                    <p className="page-subtitle">
                        Tell us what you found and where. We'll try to match it with people who reported similar lost items.
                    </p>
                </div>

                <section className="card">
                    <div className="card-header">
                        <h2 className="card-title">Found Item Details</h2>
                    </div>

                    {/* Success Banner */}
                    {success && (
                        <div style={{ background:"#f0fdf4", border:"1px solid #22c55e", borderRadius:"8px", padding:"16px", marginBottom:"20px", textAlign:"center" }}>
                            <p style={{ color:"#15803d", fontWeight:"600", marginBottom:"8px" }}>✅ Found item submitted successfully!</p>
                            <p style={{ color:"#166534", fontSize:"14px", marginBottom:"12px" }}>
                                Our AI is searching for matching lost items in the background. The owner will be notified if a match is found.
                            </p>
                            <button className="btn btn-primary" onClick={() => navigate("/userlanding")}>
                                Back to Home
                            </button>
                        </div>
                    )}

                    {error && (
                        <div style={{ background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca", borderRadius:"6px", padding:"10px", marginBottom:"16px", fontSize:"14px" }}>
                            {error}
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">

                                {/* Category */}
                                <div className="form-group">
                                    <label>Item category</label>
                                    <select name="category_id" value={formData.category_id} onChange={handleChange} required>
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Title */}
                                <div className="form-group">
                                    <label>Item title</label>
                                    <input type="text" name="title" placeholder="Example: Black Lenovo laptop" value={formData.title} onChange={handleChange} required />
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea name="description" placeholder="Brand, stickers, scratches, special marks, etc." value={formData.description} onChange={handleChange} required />
                                    <p className="hint">Add anything that makes this item easy to recognize.</p>
                                </div>

                                {/* NEW — Colour field */}
                                <div className="form-group">
                                    <label>
                                        Colour <span style={{color:"#16a34a", fontSize:"12px"}}>(important for matching accuracy)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="colour"
                                        placeholder="Example: red, silver, dark blue, black and white"
                                        value={formData.colour}
                                        onChange={handleChange}
                                    />
                                    <p className="hint">Exact colour match gives a +10% confidence bonus.</p>
                                </div>

                                {/* Location */}
                                <div className="form-group">
                                    <label>Where did you find it?</label>
                                    <input type="text" name="location" placeholder="Example: Library, 2nd floor, near window table" value={formData.location} onChange={handleChange} required />
                                </div>

                                {/* NEW MAP PICKER */}
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>Pinpoint exactly where you found it <span style={{color:"#16a34a", fontSize:"12px"}}>(Click on the map)</span></label>
                                    <MapPicker position={mapCoords} setPosition={setMapCoords} />
                                    {mapCoords.latitude ? (
                                        <p style={{ fontSize:"12px", color:"#16a34a", marginTop:"6px", fontWeight: "600" }}>
                                            📍 Pin dropped successfully!
                                        </p>
                                    ) : (
                                        <p style={{ fontSize:"12px", color:"#dc2626", marginTop:"6px" }}>
                                            * Please tap on the map to drop a location pin.
                                        </p>
                                    )}
                                </div>

                                {/* Photo */}
                                <div className="form-group">
                                    <label>Item photo (required for found items)</label>
                                    <label className="file-input-wrapper">
                                        <input type="file" name="photo" accept="image/*" onChange={handleChange} required />
                                        <span><strong>Click to upload</strong> or drag a photo</span>
                                    </label>
                                    <p className="hint">A clear photo significantly increases matching accuracy.</p>
                                </div>
                            </div>

                            <div className="card-footer">
                                <div className="card-footer-left">By submitting, you confirm this is an honest report.</div>
                                <div className="btn-row">
                                    <button type="button" className="btn btn-ghost" onClick={() => navigate("/userlanding")}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? "Submitting..." : "Submit Found Item"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        </div>
    );
}
