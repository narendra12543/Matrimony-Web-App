import { ThemeProvider } from "./contexts/ThemeContext";
import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/Chat/AuthContext";
import { SocketProvider } from "./contexts/Chat/SocketContext";
import {
  NotificationProvider,
  useNotifications,
} from "./contexts/Chat/NotificationContext";
import InPageNotificationContainer from "./components/Chat/InPageNotification";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";

import axios from "axios";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import Landing from "./components/User/Landing-Page/Landing";
import UserLayout from "./components/User/UserLayout";
import DashboardLayout from "./components/User/User_Dashboard/DashboardLayout";
import MainContent from "./components/User/User_Dashboard/MainContent";
import UserSettingsPage from "./pages/UserSettingsPage";
import Feed from "./components/User/User-Feed/Feed";
import Plans from "./components/User/User-Plan/Plans";

import Profile from "./components/User/Profile";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationsPage from "./pages/NotificationsPage";
import "./App.css";
import UserProfilePage from "./pages/UserProfilePage";
import AdminSignUp from "./components/Admin/Auth/AdminSignUp";
import AdminSignIn from "./components/Admin/Auth/AdminSignIn";
import AdminDashboard from "./components/Admin/Dashboard/AdminDashboard";
import AdminFeedbackPage from "./pages/AdminFeedbackPage";
import InactiveUser from "./components/Admin/InactiveUser/InactiveUser";
import CouponDashboard from "./components/Admin/CouponManagement/CouponDashboard";
import CreateCoupon from "./components/Admin/CouponManagement/CreateCoupon";
import CouponManager from "./components/Admin/CouponManagement/CouponManager";
import UsersPage from "./components/Admin/User/UserManagement";
import ReportsPage from "./components/Admin/Reports/ReportsPage";
import AdminSettingsPage from "./components/Admin/Settings/AdminSettingsPage";
import AdminProtectedRoute from "./components/Admin/AdminProtectedRoute";
import AdminApproval from "./components/Admin/UserManagement/AdminApproval";
import NewUserApproval from "./components/Admin/UserManagement/NewUserApproval";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminUserDetail from "./components/Admin/UserManagement/AdminUserDetail";
import UserVerificationSuite from "./components/User/Verification_Suite/UserVerificationSuite";
import PartnerPreferences from "./components/User/Partner_Preferences/PartnerPreferences";
import UserManagement from "./components/Admin/User/UserManagement";
// --- 1. Import the new component ---
import AdminEmailManagement from "./components/Admin/EmailManagement/AdminEmailManagement";
import AdminVerification from "./components/Admin/UserManagement/AdminVerification";
import EssentialProfileSetup from "./pages/EssentialProfileSetup";
import AdminSubscriptionManagementPage from "./components/Admin/SubscriptionManagement/AdminSubscriptionManagementPage";

function App() {
  const { user, isAuthenticated } = useAuth();
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setIsNewUser(user.isNewUser);
    }
  }, [user, isAuthenticated]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <InPageNotificationContainerWrapper />
              <Router>
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route
                    path="/essential-profile-setup"
                    element={<EssentialProfileSetup />}
                  />

                  {/* --- Add explicit admin signin/signup routes --- */}
                  <Route path="/admin/signin" element={<AdminSignIn />} />
                  <Route path="/admin/signup" element={<AdminSignUp />} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminProtectedRoute>
                        <AdminLayout />
                      </AdminProtectedRoute>
                    }
                  >
                    <Route
                      index
                      element={<Navigate to="/admin/dashboard" replace />}
                    />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route
                      path="users"
                      element={
                        <UserManagement
                          users={[]}
                          onUpdateUserStatus={() => {}}
                        />
                      }
                    />
                    {/* --- 2. Add the new route for the email page --- */}
                    <Route path="email" element={<AdminEmailManagement />} />

                    <Route path="users/:id" element={<AdminUserDetail />} />
                    <Route
                      path="reports"
                      element={
                        <ReportsPage reports={[]} onUpdateStatus={() => {}} />
                      }
                    />
                    <Route path="settings" element={<AdminSettingsPage />} />
                    <Route path="feedback" element={<AdminFeedbackPage />} />
                    <Route path="inactive-users" element={<InactiveUser />} />
                    <Route path="coupons" element={<CouponDashboard />} />
                    <Route path="coupons/create" element={<CreateCoupon />} />
                    <Route path="subscriptions" element={<AdminSubscriptionManagementPage />} />


                    <Route
                      path="users/edit/:id"
                      element={<AdminUserDetail />}
                    />
                    <Route
                      path="coupons/edit/:id"
                      element={<CouponManager />}
                    />
                    <Route
                      path="verifications"
                      element={<AdminVerification />}
                    />
                    <Route
                      path="new-user-approvals"
                      element={<NewUserApproval />}
                    />
                    <Route
                      path="profile-approvals"
                      element={<AdminApproval />}
                    />
                    <Route path="approvals" element={<AdminApproval />} />
                  </Route>

                  {/* User Layout Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <UserLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<DashboardLayout />}>
                      <Route index element={<MainContent />} />
                    </Route>
                    <Route path="profile" element={<Profile />} />
                    <Route
                      path="notifications"
                      element={<NotificationsPage />}
                    />
                    <Route path="feed" element={<Feed />} />
                    <Route path="plans" element={<Plans />} />
                    <Route
                      path="partner-preferences"
                      element={<PartnerPreferences />}
                    />
                    <Route path="settings" element={<UserSettingsPage />} />
                    <Route
                      path="verification-suite"
                      element={<UserVerificationSuite />}
                    />
                    <Route
                      path="chat"
                      element={
                        <ProtectedRoute>
                          <ChatWithProviders />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat/:userId"
                      element={
                        <ProtectedRoute>
                          <ChatWithProviders />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/:userId"
                      element={<UserProfilePage />}
                    />
                  </Route>
                </Routes>
                <Toaster position="top-right" />
              </Router>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
}

function InPageNotificationContainerWrapper() {
  const { inPageNotifications, removeInPageNotification } = useNotifications();
  return (
    <InPageNotificationContainer
      notifications={inPageNotifications}
      removeNotification={removeInPageNotification}
    />
  );
}

function ChatWithProviders() {
  return (
    <SocketProvider>
      <NotificationProvider>
        <Chat />
      </NotificationProvider>
    </SocketProvider>
  );
}

export default App;
