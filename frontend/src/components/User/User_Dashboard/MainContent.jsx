import React, { useState } from 'react';
import RecentVisitors from './RecentVisitors';
import DailyRecommendations from './DailyRecommendations';
import RequestsSection from './RequestsSection';
import ProfileCompletion from './ProfileCompletion';

function MainContent() {
  return (
   <main className="flex flex-col gap-4 lg:gap-8 w-full max-w-7xl mx-auto">
     <RecentVisitors />
     <DailyRecommendations />
     <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8 w-full">
       <RequestsSection />
       <ProfileCompletion />
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
        className={`flex-1 overflow-y-auto p-4 lg:p-6 bg-white w-full lg:w-auto transition-all duration-300 custom-scrollbar
          ${sidebarOpen ? 'filter blur-sm lg:blur-none' : ''}
        `}
      >
        <MainContent />
      </div>
    </div>
  );
}

export default UserDashboard;
