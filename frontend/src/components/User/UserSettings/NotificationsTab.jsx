import React, { useState } from "react";

const NotificationsTab = ({ userProfile, setUserProfile, handleSave }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  // Show loader while profile is not ready "optional"
  if (!userProfile) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const confirmAndSave = () => {
    setShowConfirm(false);
    handleSave("notifications");
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Notification Settings
        </h2>

        <div className="space-y-6">
          {/* Push Notifications */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Push Notifications
            </h3>
            <div className="space-y-4">
              {[
                {
                  id: "instantMessages",
                  label: "Instant Messages",
                  desc: "Get push notifications for new messages",
                },
                {
                  id: "newMatches",
                  label: "New Matches",
                  desc: "Get push notifications for new matches",
                },
                {
                  id: "reminders",
                  label: "Reminders",
                  desc: "Get reminders to check your account",
                },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-700 dark:text-white">
                      {item.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {item.desc}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={
                        userProfile?.notificationSettings?.push?.[item.id] || false
                      }
                      onChange={(e) =>
                        setUserProfile({
                          ...userProfile,
                          notificationSettings: {
                            ...userProfile.notificationSettings,
                            push: {
                              ...userProfile.notificationSettings?.push,
                              [item.id]: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:bg-gray-700 peer peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 dark:after:border-gray-600 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => setShowConfirm(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Custom Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Saved Changes!
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Notification settings saved!
            </p>
            <button
              onClick={confirmAndSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationsTab;
