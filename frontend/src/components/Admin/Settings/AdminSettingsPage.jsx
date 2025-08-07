import React, { useState } from "react";
import { Save, Shield, Users, Globe, Lock } from "lucide-react";

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("security");
  const [settings, setSettings] = useState({
    security: {
      twoFactorAuth: false,
      sessionTimeout: "30",
      passwordExpiry: "90",
    },
    platform: {
      autoModeration: true,
      reportThreshold: "3",
      suspensionDuration: "7",
    },
    general: {
      timezone: "UTC",
      language: "en",
      dateFormat: "MM/DD/YYYY",
    },
  });

  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // No backend integration yet
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    setShowChangePassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    alert("Password changed (frontend only)");
  };

  // Tab Button Component
  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full px-4 py-3 text-left rounded-lg transition-all duration-300 ${
        activeTab === id
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
          : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div
      className="min-h-screen py-8 bg-gradient-to-br from-blue-50 via-white to-blue-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Admin Settings
          </h1>
          <p className="text-gray-600">
            Configure your admin dashboard preferences
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8 border border-gray-100">
              <nav className="space-y-2">
                <TabButton
                  id="security"
                  label="Security"
                  icon={<Shield className="w-5 h-5" />}
                />
                <TabButton
                  id="change-password"
                  label="Change Password"
                  icon={<Lock className="w-5 h-5" />}
                />
                <TabButton
                  id="platform"
                  label="Platform"
                  icon={<Users className="w-5 h-5" />}
                />
                <TabButton
                  id="general"
                  label="General"
                  icon={<Globe className="w-5 h-5" />}
                />
              </nav>
            </div>
          </div>
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Security Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Two-Factor Authentication
                      </p>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactorAuth}
                      onChange={(e) =>
                        updateSetting("security", "twoFactorAuth", e.target.checked)
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <select
                      value={settings.security.sessionTimeout}
                      onChange={(e) =>
                        updateSetting("security", "sessionTimeout", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Password Expiry (days)
                    </label>
                    <select
                      value={settings.security.passwordExpiry}
                      onChange={(e) =>
                        updateSetting("security", "passwordExpiry", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      saved
                        ? "bg-green-600 text-white"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <Save className="h-5 w-5" />
                    <span>{saved ? "Saved!" : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === "change-password" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Change Password
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white"
                      required
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      })}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Platform Tab */}
            {activeTab === "platform" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Platform Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Auto Moderation
                      </p>
                      <p className="text-sm text-gray-500">
                        Automatically flag suspicious content
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.platform.autoModeration}
                      onChange={(e) =>
                        updateSetting("platform", "autoModeration", e.target.checked)
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Report Threshold
                    </label>
                    <select
                      value={settings.platform.reportThreshold}
                      onChange={(e) =>
                        updateSetting("platform", "reportThreshold", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="1">1 report</option>
                      <option value="3">3 reports</option>
                      <option value="5">5 reports</option>
                      <option value="10">10 reports</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Default Suspension Duration (days)
                    </label>
                    <select
                      value={settings.platform.suspensionDuration}
                      onChange={(e) =>
                        updateSetting("platform", "suspensionDuration", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      saved
                        ? "bg-green-600 text-white"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <Save className="h-5 w-5" />
                    <span>{saved ? "Saved!" : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === "general" && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 transition-colors duration-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  General Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) =>
                        updateSetting("general", "timezone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="GMT">Greenwich Mean Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Language
                    </label>
                    <select
                      value={settings.general.language}
                      onChange={(e) =>
                        updateSetting("general", "language", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings.general.dateFormat}
                      onChange={(e) =>
                        updateSetting("general", "dateFormat", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      saved
                        ? "bg-green-600 text-white"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <Save className="h-5 w-5" />
                    <span>{saved ? "Saved!" : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
