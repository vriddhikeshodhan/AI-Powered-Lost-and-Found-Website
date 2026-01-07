import React from "react";
import './AIMatchingModal.css'
const AIMatchingModal = ({ status, onClose, onViewMatches }) => {
  if (!status) return null;

  return (
    <div className="ai-modal-overlay">
      <div className="ai-modal">
        {status === "loading" && (
          <>
            <div className="spinner"></div>
            <h2>AI matching in progress</h2>
            <p>Please wait while we find the best matches for your item.</p>
          </>
        )}

        {status === "no-match" && (
          <>
            <h2>No match found</h2>
            <p>
              Don’t worry — you will be notified as soon as a matching item is
              reported.
            </p>
            <button className="primary-btn" onClick={onClose}>
              Okay
            </button>
          </>
        )}

        {status === "match-found" && (
          <>
            <h2>Match found!</h2>
            <p>We found some items that might be yours.</p>
            <button className="primary-btn" onClick={onViewMatches}>
              View top matches
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AIMatchingModal;
