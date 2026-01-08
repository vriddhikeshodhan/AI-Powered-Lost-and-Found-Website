import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import LostPage from "./components/LostPage";
import FoundPage from "./components/FoundPage";
import NotificationPage from "./components/NotificationPage";
import UserLandingPage from "./components/UserLandingPage";
import TopMatchesPage from "./components/TopMatchesPage";
import SignUpPage from "./components/SignUpPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lost" element={<LostPage />} />
        <Route path="/found" element={<FoundPage />} />
        <Route path="/userlanding" element={<UserLandingPage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/topmatches" element={<TopMatchesPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
