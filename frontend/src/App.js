import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

import LandingPage      from "./components/LandingPage";
import LoginPage        from "./components/LoginPage";
import SignUpPage       from "./components/SignUpPage";
import UserLandingPage  from "./components/UserLandingPage";
import LostPage         from "./components/LostPage";
import FoundPage        from "./components/FoundPage";
import NotificationPage from "./components/NotificationPage";
import TopMatchesPage   from "./components/TopMatchesPage";
import VerifyEmailPage  from "./components/VerifyEmailPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage  from "./components/ResetPasswordPage";
import AdminDashboardPage from "./components/AdminDashboardPage";
import AdminLoginPage from "./components/AdminLoginPage";

/* ── Route guards ───────────────────────────── */
const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();
    
    // THE FIX: Wait for AuthContext to finish checking localStorage
    if (loading) return null; 

    return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const { token, loading } = useAuth();
    
    // THE FIX: Wait for AuthContext to finish checking localStorage
    if (loading) return null;

    return !token ? children : <Navigate to="/userlanding" replace />;
};

/* ── App ────────────────────────────────────── */
function AppRoutes() {
    return (
        <Routes>
            {/* Landing — always public, no guard needed */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth — redirect to userlanding if already logged in */}
            <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />

            {/* Email / password flows — no auth guard */}
            <Route path="/verify-email/:token"    element={<VerifyEmailPage />} />
            <Route path="/forgot-password"        element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token"  element={<ResetPasswordPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected */}
            <Route path="/userlanding"        element={<ProtectedRoute><UserLandingPage /></ProtectedRoute>} />
            <Route path="/lost"               element={<ProtectedRoute><LostPage /></ProtectedRoute>} />
            <Route path="/found"              element={<ProtectedRoute><FoundPage /></ProtectedRoute>} />
            <Route path="/notifications"      element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
            <Route path="/topmatches/:itemId" element={<ProtectedRoute><TopMatchesPage /></ProtectedRoute>} />
            <Route path="/admin"              element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />

            {/* Fallback → landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ChatProvider>
                    <AppRoutes />
                </ChatProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}