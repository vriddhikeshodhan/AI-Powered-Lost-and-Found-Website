import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

import LoginPage        from "./components/LoginPage";
import SignUpPage       from "./components/SignUpPage";
import UserLandingPage  from "./components/UserLandingPage";
import LostPage         from "./components/LostPage";
import FoundPage        from "./components/FoundPage";
import NotificationPage from "./components/NotificationPage";
import TopMatchesPage   from "./components/TopMatchesPage";

/* ── Route guards ───────────────────────────── */
const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const { token } = useAuth();
    return !token ? children : <Navigate to="/userlanding" replace />;
};

/* ── App ────────────────────────────────────── */
function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/"       element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />

            {/* Protected */}
            <Route path="/userlanding"       element={<ProtectedRoute><UserLandingPage /></ProtectedRoute>} />
            <Route path="/lost"              element={<ProtectedRoute><LostPage /></ProtectedRoute>} />
            <Route path="/found"             element={<ProtectedRoute><FoundPage /></ProtectedRoute>} />
            <Route path="/notifications"     element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
            <Route path="/topmatches/:itemId" element={<ProtectedRoute><TopMatchesPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                {/*
                    ChatProvider sits INSIDE AuthProvider (needs useAuth)
                    but OUTSIDE the routes — so the chatbox survives navigation
                */}
                <ChatProvider>
                    <AppRoutes />
                </ChatProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
