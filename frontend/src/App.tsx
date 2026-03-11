import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import AnnouncementBanner from "./components/AnnouncementBanner";
import GlobalPopup from "./components/GlobalPopup";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import AIHelper from "./components/AIHelper";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import FAQ from "./pages/FAQ";
import Marketplace from "./pages/Marketplace";
import Payment from "./pages/Payment";
import BrowseCourses from "./pages/student/BrowseCourses";
import Certificates from "./pages/student/Certificates";
import Resources from "./pages/student/Resources";
import CreateCourse from "./pages/instructor/CreateCourse";
import Students from "./pages/instructor/Students";
import Analytics from "./pages/instructor/Analytics";
import ManageUsers from "./pages/admin/ManageUsers";
import Approvals from "./pages/admin/Approvals";
import AdminCourses from "./pages/admin/AdminCourses";
import Categories from "./pages/admin/Categories";
import Settings from "./pages/admin/Settings";
import MyCourses from "./pages/instructor/MyCourses";
import { UserRole } from "./types";
import "./index.css";

const AppRoutes: React.FC = () => {
    const location = useLocation();
    const isAppContent = ['/dashboard', '/student', '/instructor', '/admin', '/payment'].some(path => location.pathname.startsWith(path));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 flex flex-col">
            {!isAppContent && <Navbar />}
            {!isAppContent && <AnnouncementBanner />}
            <GlobalPopup />
            <AIHelper />
            <main className="flex-grow">
                <Routes>
                    <Route path="/" element={<Landing />} />

                    {/* Unified Auth */}
                    <Route path="/auth" element={<Login />} />
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/login/student" element={<Navigate to="/auth?role=student" replace />} />
                    <Route path="/login/instructor" element={<Navigate to="/auth?role=instructor" replace />} />
                    <Route path="/login/admin" element={<Navigate to="/auth?role=admin" replace />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/marketplace" element={<Marketplace />} />

                    {/* Payment Route */}
                    <Route 
                        path="/payment" 
                        element={
                            <ProtectedRoute wrapLayout>
                                <Payment />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Shared Dashboard with RBAC */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute wrapLayout>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Student Routes */}
                    <Route
                        path="/student/browse"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.STUDENT]} wrapLayout>
                                <BrowseCourses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/certificates"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.STUDENT]} wrapLayout>
                                <Certificates />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/student/resources"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.STUDENT]} wrapLayout>
                                <Resources />
                            </ProtectedRoute>
                        }
                    />

                    {/* Instructor Routes */}
                    <Route
                        path="/instructor/create-course"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <CreateCourse />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/instructor/students"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <Students />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/instructor/analytics"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <Analytics />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/instructor/my-courses"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
                                <MyCourses />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Routes */}
                    <Route
                        path="/admin/users"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout>
                                <ManageUsers />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/approvals"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout>
                                <Approvals />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/categories"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout>
                                <Categories />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/courses"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout>
                                <AdminCourses />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/settings"
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
            {!isAppContent && <Footer />}
            <BackToTop />

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
        <Router>
            <LanguageProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </LanguageProvider>
        </Router>
    );
};

export default App;
