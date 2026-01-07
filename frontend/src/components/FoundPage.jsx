import React, { useState } from "react";
import "./FoundPage.css";

export default function FoundPage() {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true); // Remove when connecting backend
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page-wrapper">
      <div className="page-inner">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Report a Found Item</h1>
          <p className="page-subtitle">
            Tell us what you found and where. We’ll try to match it with people who
            reported similar lost items.
          </p>
        </div>

        {/* Card Section */}
        <section className="card">
          <div className="card-header">
            <h2 className="card-title">Found Item Details</h2>
            <span className="card-badge">Step 1 of 1</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Item Type */}
              <div className="form-group">
                <label>Item type</label>
                <select required>
                  <option value="">Select type</option>
                  <option>Electronics</option>
                  <option>Wallet / ID</option>
                  <option>Clothing / Accessories</option>
                  <option>Books / Documents</option>
                  <option>Keys</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Title */}
              <div className="form-group">
                <label>Item title</label>
                <input
                  type="text"
                  placeholder="Example: Black Lenovo laptop"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Color, brand, stickers, scratches, special marks, etc."
                  required
                ></textarea>
                <p className="hint">
                  Add anything that makes this item easy to recognize.
                </p>
              </div>

              {/* Date Found */}
              <div className="form-group">
                <label>Date found</label>
                <input type="date" required />
              </div>

              {/* Location */}
              <div className="form-group">
                <label>Where did you find it?</label>
                <input
                  type="text"
                  placeholder="Example: Library, 2nd floor, near window table"
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label>Item photo</label>
                <label className="file-input-wrapper">
                  <input type="file" accept="image/*" />
                  <span>
                    <strong>Click to upload</strong> or drag a photo (recommended)
                  </span>
                </label>
                <p className="hint">A clear photo increases matching accuracy.</p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="card-footer">
              <div className="card-footer-left">
                By submitting, you confirm this is an honest report.
              </div>

              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary">
                  Submit Found Item
                </button>
              </div>
            </div>

            {/* Success Banner */}
            <div className={`success-banner ${success ? "show" : ""}`}>
              ✅ Found item submitted! (Mock message — connect backend later)
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

