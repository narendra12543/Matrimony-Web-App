import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const mergePendingChanges = (user) => {
  if (!user) return user;
  if (user.pendingChanges && Object.keys(user.pendingChanges).length > 0) {
    return { ...user, ...user.pendingChanges, hasPendingChanges: true };
  }
  return user;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disabledModal, setDisabledModal] = useState({ open: false, message: "" });
  const [enabledModal, setEnabledModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  // Show "account enabled" modal if flag is set in localStorage
  useEffect(() => {
    if (localStorage.getItem("showAccountEnabledModal") === "true") {
      setEnabledModal(true);
      localStorage.removeItem("showAccountEnabledModal");
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(mergePendingChanges(response.data.user));
    } catch (error) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, userData = null, token = null) => {
    if (userData && token) {
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(mergePendingChanges(userData));
      // If userData has a property indicating recently enabled, show modal
      if (userData.accountStatus === "active" && localStorage.getItem("showAccountEnabledModal") === "true") {
        setEnabledModal(true);
        localStorage.removeItem("showAccountEnabledModal");
      }
      return { user: userData, token };
    }
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      const { token: responseToken, user: responseUserData } = response.data;
      localStorage.setItem("token", responseToken);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${responseToken}`;
      setUser(mergePendingChanges(responseUserData));
      // If just enabled, show modal (flag set by Login.jsx below)
      if (localStorage.getItem("showAccountEnabledModal") === "true") {
        setEnabledModal(true);
        localStorage.removeItem("showAccountEnabledModal");
      }
      return { user: responseUserData, token: responseToken };
    } catch (error) {
      // Show modal if account is disabled
      if (
        error.response &&
        (error.response.status === 403 || error.response.data?.accountDisabled)
      ) {
        setDisabledModal({
          open: true,
          message:
            error.response.data?.error ||
            "Your account has been disabled by admin. You cannot login. Please contact support.",
        });
        return;
      }
      // Handle or throw error as needed
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name,
      email,
      password,
    });

    const { token, user: userData } = response.data;
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // Ensure isNewUser is true for newly registered users
    setUser(mergePendingChanges({ ...userData, isNewUser: true }));

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    setUser, // Expose setUser for manual updates
    isAuthenticated: !!user,
    isVerified: user?.isVerified,
    approvalStatus: user?.approvalStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Disabled Modal */}
      {disabledModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-3">Account Disabled</h2>
            <p className="text-gray-700 mb-6">{disabledModal.message}</p>
            <button
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => setDisabledModal({ open: false, message: "" })}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Enabled Modal */}
      {enabledModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-8 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-3">Account Enabled</h2>
            <p className="text-gray-700 mb-6">
              Your account was enabled by admin.<br />
              You can now continue using our platform.
            </p>
            <button
              className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => setEnabledModal(false)}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
