import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f2f6f5]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* This column owns its own scroll (overflow-y-auto below), independent
          of the sidebar - the sidebar never moves with the page. */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
