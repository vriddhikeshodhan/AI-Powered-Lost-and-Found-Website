/*import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const PageStyler = () => {
  useLayoutEffect(() => {
    // Create the <style> tag
    const styleElement = document.createElement('style');
    
    // Define all our plain CSS rules
    const cssRules = `
      /* --- Global Styles --- 
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #f0fdf4; 
      }

      * {
        box-sizing: border-box;
      }

      
      .landing-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        /* Added background image 
        background-image: url('https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');
        background-size: cover;
        background-position: center;
        position: relative;
        isolation: isolate; /* Create a new stacking context 
      }

      
      .landing-container::before {
        content: "";
        position: absolute;
        inset: 0;
        background-color: rgba(230, 249, 240, 0.85); 
        z-index: -1; 
      }


      
      .landing-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2.5rem;
        background-color: #ffffff;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid #dcfce7; 
      }

      .logo-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.5rem;
        font-weight: 700;
        color: #15803d; 
      }

      .logo-svg {
        width: 28px;
        height: 28px;
        stroke: #15803d; 
        stroke-width: 2.5;
      }

      .signin-btn {
        padding: 0.6rem 1.25rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #ffffff;
        background-color: #22c55e; 
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease-in-out, transform 0.1s ease;
      }

      .signin-btn:hover {
        background-color: #16a34a;
      }

      .signin-btn:active {
        transform: scale(0.98);
      }

      
      .landing-main {
        flex-grow: 1; 
        display: flex;
        flex-direction: column; 
        justify-content: center;
        align-items: center;
        gap: 2.5rem;
        padding: 2rem;
        text-align: center; 
      }

      
      .hero-text-container {
        margin-bottom: 1rem;
        max-width: 600px;
      }

      .hero-title {
        font-size: 2.75rem; 
        font-weight: 700;
        color: #14532d;
        margin-bottom: 0.75rem;
        line-height: 1.2;
      }

      .hero-subtitle {
        font-size: 1.15rem;
        color: #166534; /
        line-height: 1.5;
      }
      
      .action-buttons-container {
        display: flex;
        gap: 2.5rem;
      }
      

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

     
      .landing-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 1.5rem 2.5rem;
        background-color: rgba(255, 255, 255, 0.5); 
        backdrop-filter: blur(2px); 
      }

      .contact-info {
        font-size: 0.9rem;
        color: #3f621e; 
        font-weight: 500;
      }
      
      
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

    // Add the CSS rules to the <style> element
    styleElement.innerHTML = cssRules;
    
    // Append the <style> element to the document's <head>
    document.head.appendChild(styleElement);

    // Cleanup function to remove the style when the component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return null; // This component doesn't render any visible JSX
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
const LandingPage = ({ username }) => {
  const navigate = useNavigate();
  return (
    <div className="landing-container">
      
      <header className="landing-header">
        <div className="logo-container">
          <LogoIcon />
          <span>Lost & Found</span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontWeight: 600, color: "#14532d" }}>
            Hi, {username}
          </span>
          <button 
            className="signin-btn"
            onClick={() => navigate("/notifications")}
          >
            My Profile
          </button>
        </nav>
      </header>

      
      <main className="landing-main">
        <div className="hero-text-container">
          <h1 className="hero-title">Welcome to Lost & Found</h1>
          <p className="hero-subtitle">
            The first online meeting point between who's looking for a lost item and who's found it through AI.
          </p>
        </div>

        <div className="action-buttons-container">
          <a 
            className="action-btn lost-btn"
            onClick={() => navigate("/lost")}
            >
            Lost?
          </a>
          <a 
            className="action-btn found-btn"
            onClick={() => navigate("/found")}
            >
            Found?
          </a>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="contact-info">
          Contact us
        </div>
      </footer>
    </div>
  );
};

// --- Main App Component ---
// This is the default export that renders our page.
export default function App() {
  return (
    <>
      <PageStyler />
      <LandingPage />
    </>
  );
}
*/

import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PageStyler = () => {
    useLayoutEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; background-color:#f0fdf4; }
            * { box-sizing:border-box; }
            .landing-container { display:flex; flex-direction:column; min-height:100vh; background-image:url('https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'); background-size:cover; background-position:center; position:relative; isolation:isolate; }
            .landing-container::before { content:""; position:absolute; inset:0; background-color:rgba(230,249,240,0.85); z-index:-1; }
            .landing-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 2.5rem; background-color:#ffffff; box-shadow:0 2px 5px rgba(0,0,0,0.05); border-bottom:1px solid #dcfce7; }
            .logo-container { display:flex; align-items:center; gap:0.75rem; font-size:1.5rem; font-weight:700; color:#15803d; }
            .logo-svg { width:28px; height:28px; stroke:#15803d; stroke-width:2.5; }
            .nav-btn { padding:0.6rem 1.25rem; font-size:0.9rem; font-weight:600; color:#ffffff; background-color:#22c55e; border:none; border-radius:8px; cursor:pointer; transition:background-color 0.2s; }
            .nav-btn:hover { background-color:#16a34a; }
            .nav-btn.logout { background-color:#fff; color:#dc2626; border:1px solid #dc2626; }
            .nav-btn.logout:hover { background-color:#fef2f2; }
            .landing-main { flex-grow:1; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:2.5rem; padding:2rem; text-align:center; }
            .hero-text-container { margin-bottom:1rem; max-width:600px; }
            .hero-title { font-size:2.75rem; font-weight:700; color:#14532d; margin-bottom:0.75rem; line-height:1.2; }
            .hero-subtitle { font-size:1.15rem; color:#166534; line-height:1.5; }
            .action-buttons-container { display:flex; gap:2.5rem; }
            .action-btn { padding:2.5rem 5rem; font-size:2rem; font-weight:700; border-radius:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 5px 15px rgba(0,0,0,0.1); text-decoration:none; text-align:center; }
            .lost-btn { background-color:#ffffff; color:#15803d; border:2px solid #22c55e; }
            .lost-btn:hover { transform:translateY(-4px); box-shadow:0 8px 20px rgba(0,0,0,0.12); background-color:#fafffc; }
            .found-btn { background-color:#22c55e; color:white; border:2px solid #22c55e; }
            .found-btn:hover { transform:translateY(-4px); box-shadow:0 8px 20px rgba(34,197,94,0.3); background-color:#16a34a; border-color:#16a34a; }
            .landing-footer { display:flex; justify-content:flex-end; align-items:center; padding:1.5rem 2.5rem; background-color:rgba(255,255,255,0.5); }
            .contact-info { font-size:0.9rem; color:#3f621e; font-weight:500; }
            @media (max-width:768px) {
                .action-buttons-container { flex-direction:column; width:100%; gap:1.5rem; align-items:center; }
                .action-btn { padding:2rem 4rem; font-size:1.5rem; width:100%; max-width:350px; }
            }
        `;
        document.head.appendChild(styleElement);
        return () => document.head.removeChild(styleElement);
    }, []);
    return null;
};

const LogoIcon = () => (
    <svg className="logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export default function UserLandingPage() {
    const navigate   = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <>
            <PageStyler />
            <div className="landing-container">
                <header className="landing-header">
                    <div className="logo-container">
                        <LogoIcon />
                        <span>Lost & Found</span>
                    </div>
                    <nav style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontWeight: 600, color: "#14532d" }}>
                            Hi, {user?.name?.split(" ")[0] || "User"}
                        </span>
                        <button className="nav-btn" onClick={() => navigate("/notifications")}>
                            My Items
                        </button>
                        <button className="nav-btn logout" onClick={handleLogout}>
                            Sign Out
                        </button>
                    </nav>
                </header>

                <main className="landing-main">
                    <div className="hero-text-container">
                        <h1 className="hero-title">Welcome back, {user?.name?.split(" ")[0]}!</h1>
                        <p className="hero-subtitle">
                            Lost something or found an item? Let our AI match them together.
                        </p>
                    </div>
                    <div className="action-buttons-container">
                        <a className="action-btn lost-btn" onClick={() => navigate("/lost")}>
                            Lost?
                        </a>
                        <a className="action-btn found-btn" onClick={() => navigate("/found")}>
                            Found?
                        </a>
                    </div>
                </main>

                <footer className="landing-footer">
                    <div className="contact-info">Contact us</div>
                </footer>
            </div>
        </>
    );
}
