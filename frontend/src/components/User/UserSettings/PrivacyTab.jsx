import React from "react";
import { updatePrivacySettings } from "../../../services/userService";
const PrivacyTab = ({
  userProfile,
  setUserProfile,
  handleSave,
  handleDeleteAccount,
}) => {
  // Don't render if userProfile is not loaded yet
  if (!userProfile) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Privacy Settings
      </h2>
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Profile Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">
                  Show Profile to
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control who can see your profile
                </p>
              </div>
              <select
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                value={userProfile?.privacy?.profileVisibility || "public"}
                onChange={(e) =>
                  setUserProfile({
                    ...userProfile,
                    privacy: {
                      ...userProfile.privacy,
                      profileVisibility: e.target.value,
                    },
                  })
                }
              >
                <option value="public">Everyone</option>
                <option value="premium-only">Premium Members Only</option>
                <option value="verified-only">Verified Members Only</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">
                  Show Contact Info
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control who can see your contact details
                </p>
              </div>
              <select
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                value={
                  userProfile?.privacy?.contactVisibility || "premium-only"
                }
                onChange={(e) =>
                  setUserProfile({
                    ...userProfile,
                    privacy: {
                      ...userProfile.privacy,
                      contactVisibility: e.target.value,
                    },
                  })
                }
              >
                <option value="premium-only">Premium Members Only</option>
                <option value="verified-only">Verified Members Only</option>
                <option value="all">After Connection</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Data Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">
                  Data Usage
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allow us to use your data for better matches
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={userProfile?.privacy?.dataUsage || false}
                  onChange={(e) =>
                    setUserProfile({
                      ...userProfile,
                      privacy: {
                        ...userProfile.privacy,
                        dataUsage: e.target.checked,
                      },
                    })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300">
                  Marketing Communications
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive promotional emails and offers
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={
                    userProfile?.privacy?.marketingCommunications || false
                  }
                  onChange={(e) =>
                    setUserProfile({
                      ...userProfile,
                      privacy: {
                        ...userProfile.privacy,
                        marketingCommunications: e.target.checked,
                      },
                    })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={() => handleSave("privacy")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Save Changes
          </button>
        </div>
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-4">
          Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-700 dark:text-red-300">
                Delete Account
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400">
                Permanently delete your account and all data
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-all duration-300"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PrivacyTab;
