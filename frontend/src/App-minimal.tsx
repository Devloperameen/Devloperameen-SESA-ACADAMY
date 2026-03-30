import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import "./index.css";
import "./styles/accessibility.css";

const AppRoutes: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 transition-colors duration-300 flex flex-col">
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Login />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>

            {/* Toast Notifications */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <LanguageProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </LanguageProvider>
        </AuthProvider>
    );
};

export default App;