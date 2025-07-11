import React from 'react';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
};

export default DashboardLayout; 