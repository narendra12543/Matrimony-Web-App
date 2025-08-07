import React, { useState } from "react";
import RecentVisitors from "./RecentVisitors";
import DailyRecommendations from "./DailyRecommendations";
import RequestsSection from "./RequestsSection";
import ProfileCompletion from "./ProfileCompletion";
import LatestNotifications from "./LatestNotifications";


function MainContent({ disableInteractions }) {
  return (
    <main className="flex-1 h-full min-h-0 flex flex-col gap-3 w-full max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-md dark:shadow-lg">
      <div className="w-full mb-4">
        <LatestNotifications />
      </div>
  
      <div className="w-full ">
        <RecentVisitors />
      </div>

      <DailyRecommendations />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full">
        <div className="lg:col-span-2">
          <RequestsSection />
        </div>
        <div className="space-y-4">
          <ProfileCompletion />
        </div>
      </div>
    </main>
  );
}

function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}
      {/* Main content */}
      <div
        className={`flex-1 overflow-y-auto p-4 lg:p-6 bg-white dark:bg-gray-900 w-full lg:w-auto transition-all duration-300 custom-scrollbar
          ${sidebarOpen ? "filter blur-sm lg:blur-none" : ""}
        `}
      >
        <MainContent />
      </div>
    </div>
  );
}

export default UserDashboard;
