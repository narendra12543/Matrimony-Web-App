import React from "react";
import { Navigate } from "react-router-dom";
import { Shield, AlertCircle, LogIn } from "lucide-react";

const AdminProtectedRoute = ({ children }) => {
  // For now, allow access without login - remove authentication check
  const adminToken = localStorage.getItem("adminToken");

  // Temporarily disabled authentication check
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-full">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Admin Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be signed in as an admin to access this page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => (window.location.href = "/admin/signin")}
                className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-600 hover:via-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In to Admin Panel</span>
              </button>
              <button
                onClick={() => (window.location.href = "/admin/signup")}
                className="w-full bg-white text-indigo-600 py-3 px-6 rounded-xl font-semibold border border-indigo-200 hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Shield className="w-5 h-5" />
                <span>Create Admin Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Allow access for now (authentication disabled)
  return children;
};

export default AdminProtectedRoute;
