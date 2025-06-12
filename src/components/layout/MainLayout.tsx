import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const MainLayout = () => {
  const location = useLocation();
  const showSidebar = location.pathname !== "/login";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showSidebar && <Sidebar />}
      <div className={`flex flex-col w-full ${showSidebar ? 'ml-64' : ''}`}>
        <Header />
        <main className="flex-1">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
