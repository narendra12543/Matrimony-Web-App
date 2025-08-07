import React from "react";

const ProfileTab = ({ userProfile, setUserProfile }) => {
  if (!userProfile) {
    return (
      <div className="py-8 text-center text-gray-500">Loading profile...</div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Profile Settings
      </h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={`${userProfile.firstName} ${userProfile.lastName}`}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-100 dark:bg-gray-700 dark:text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={userProfile.email}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-100 dark:bg-gray-700 dark:text-white"
              readOnly
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={userProfile.phone}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-100 dark:bg-gray-700 dark:text-white"
            readOnly
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Visibility
            </label>
            <select
              value={userProfile.privacy?.profileVisibility || "public"}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-700 dark:text-white"
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
              <option value="public">Public</option>
              <option value="premium-only">Premium Members Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Visibility
            </label>
            <select
              value={userProfile.privacy?.contactVisibility || "premium-only"}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-700 dark:text-white"
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
              <option value="all">All Members</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end"></div>
      </div>
    </div>
  );
};

export default ProfileTab;
