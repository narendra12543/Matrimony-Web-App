import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/Chat/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  // Check if user is authenticated based on user object
  const isAuthenticated = !!user;

  console.log('ProtectedRoute: Auth state', { 
    user: user ? `${user.firstName} ${user.lastName}` : null, 
    loading, 
    isAuthenticated,
    currentPath: location.pathname 
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('ProtectedRoute: User not authenticated, showing modal');
      setShowModal(true);
      const timer = setTimeout(() => {
        setShowModal(false);
      }, 2000); // Reduced time for faster redirect
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    console.log('ProtectedRoute: Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Redirecting to login');
    return (
      <>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Access Denied</h3>
              <p className="text-gray-600 text-center mb-4">Please login first to access this page.</p>
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Redirecting to login...</p>
              </div>
            </div>
          </div>
        )}
        <Navigate to="/login" replace state={{ from: location }} />
      </>
    );
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return children;
};

export default ProtectedRoute;
