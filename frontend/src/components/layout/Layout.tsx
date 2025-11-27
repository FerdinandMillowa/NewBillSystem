import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        isOpen={isSidebarOpen}
        isDesktopOpen={isDesktopSidebarOpen}
        onClose={closeMobileSidebar}
        onDesktopToggle={toggleDesktopSidebar}
      />
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
          isDesktopSidebarOpen ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        <Navbar
          onMenuClick={toggleSidebar}
          onDesktopMenuClick={toggleDesktopSidebar}
          isSidebarOpen={isDesktopSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
