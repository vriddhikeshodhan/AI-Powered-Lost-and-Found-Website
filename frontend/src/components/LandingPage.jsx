import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const PageStyler = () => {
  useLayoutEffect(() => {
    const styleElement = document.createElement('style');
    
    const cssRules = `
      /* --- Global Styles --- */
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #f0fdf4; /* Light green background */
      }

      * {
        box-sizing: border-box;
      }

      /* --- App Container --- */
      .landing-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        /* Added background image */
        background-image: url('https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');
        background-size: cover;
        background-position: center;
        position: relative;
        isolation: isolate; /* Create a new stacking context */
      }

      /* Added background overlay */
      .landing-container::before {
        content: "";
        position: absolute;
        inset: 0;
        background-color: rgba(230, 249, 240, 0.85); /* Green overlay */
        z-index: -1; /* Place it behind the content */
      }


      /* --- Header --- */
      .landing-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2.5rem;
        background-color: #ffffff;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid #dcfce7; /* Light green border */
      }

      .logo-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.5rem;
        font-weight: 700;
        color: #15803d; /* Dark green */
      }

      .logo-svg {
        width: 28px;
        height: 28px;
        stroke: #15803d; /* Dark green */
        stroke-width: 2.5;
      }

      .signin-btn {
        padding: 0.6rem 1.25rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #ffffff;
        background-color: #22c55e; /* Bright green */
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease-in-out, transform 0.1s ease;
      }

      .signin-btn:hover {
        background-color: #16a34a; /* Darker green on hover */
      }

      .signin-btn:active {
        transform: scale(0.98);
      }

      /* --- Main Content --- */
      .landing-main {
        flex-grow: 1; /* Pushes footer down */
        display: flex;
        flex-direction: column; /* Changed to column for hero text */
        justify-content: center;
        align-items: center;
        gap: 2.5rem;
        padding: 2rem;
        text-align: center; /* Center the new hero text */
      }

      /* --- New Hero Text Styles --- */
      .hero-text-container {
        margin-bottom: 1rem;
        max-width: 600px;
      }

      .hero-title {
        font-size: 2.75rem; /* Larger title */
        font-weight: 700;
        color: #14532d; /* Darker green */
        margin-bottom: 0.75rem;
        line-height: 1.2;
      }

      .hero-subtitle {
        font-size: 1.15rem;
        color: #166534; /* Medium green */
        line-height: 1.5;
      }
      
      .action-buttons-container {
        display: flex;
        gap: 2.5rem;
      }
      /* --- End New Hero Text Styles --- */

      .action-btn {
        padding: 2.5rem 5rem;
        font-size: 2rem;
        font-weight: 700;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        text-decoration: none;
        text-align: center;
      }

      .lost-btn {
        background-color: #ffffff;
        color: #15803d;
        border: 2px solid #22c55e;
      }

      .lost-btn:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        background-color: #fafffc;
      }

      .found-btn {
        background-color: #22c55e;
        color: white;
        border: 2px solid #22c55e;
      }

      .found-btn:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
        background-color: #16a34a;
        border-color: #16a34a;
      }

      /* --- Footer --- */
      .landing-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 1.5rem 2.5rem;
        background-color: rgba(255, 255, 255, 0.5); /* Slight white background */
        backdrop-filter: blur(2px); /* Blur effect for footer */
      }

      .contact-info {
        font-size: 0.9rem;
        color: #3f621e; /* Olive green */
        font-weight: 500;
      }
      
      /* --- Responsive --- */
      @media (max-width: 768px) {
        .landing-header {
          padding: 1rem 1.5rem;
        }

        .logo-container {
          font-size: 1.25rem;
        }

        .landing-main {
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
        }

        /* --- New Responsive Hero Text --- */
        .hero-title {
          font-size: 2.25rem;
        }
        .hero-subtitle {
          font-size: 1rem;
        }
        .action-buttons-container {
          flex-direction: column;
          width: 100%;
          gap: 1.5rem;
          align-items: center;
        }
        /* --- End New Responsive Hero Text --- */

        .action-btn {
          padding: 2rem 4rem;
          font-size: 1.5rem;
          width: 100%;
          max-width: 350px;
        }

        .landing-footer {
          justify-content: center;
          padding: 1.5rem;
        }
      }
    `;

    styleElement.innerHTML = cssRules;
    
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return null;
};

// --- Logo SVG Component ---
const LogoIcon = () => (
  <svg
    className="logo-svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10a.01.01 0 01.01-.01H10a.01.01 0 010 .02v-.01z"
    />
  </svg>
);

// --- Main Landing Page Component ---
const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="landing-container">
      {/* --- Header Section --- */}
      <header className="landing-header">
        <div className="logo-container">
          <LogoIcon />
          <span>Lost & Found</span>
        </div>
        <nav>
          <button 
            className="signin-btn"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* --- Main Content Section --- */}
      <main className="landing-main">
        {/* --- Added Hero Text --- */}
        <div className="hero-text-container">
          <h1 className="hero-title">Welcome to Lost & Found</h1>
          <p className="hero-subtitle">
            The first online meeting point between who's looking for a lost item and who's found it through AI.
          </p>
        </div>
        
        {/* --- Action Buttons --- */}
        <div className="action-buttons-container">
          <a 
            className="action-btn lost-btn"
            onClick={() => navigate("/login")}
          >
            Lost?
          </a>
          <a 
            className="action-btn found-btn"
            onClick={() => navigate("/login")}
          >
            Found?
          </a>
        </div>
      </main>

      {/* --- Footer Section --- */}
      <footer className="landing-footer">
        <div className="contact-info">
          Contact us
        </div>
      </footer>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  return (
    <>
      <PageStyler />
      <LandingPage />
    </>
  );
}