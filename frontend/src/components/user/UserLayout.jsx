import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import { FiMenu } from 'react-icons/fi';

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-grow flex">
        {/* Sidebar */}
        <UserSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white shadow-sm px-4 py-3 sticky top-16 z-10">
            <button
              onClick={toggleSidebar}
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600"
            >
              <FiMenu size={24} />
              <span className="font-medium">Menu</span>
            </button>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <Footer />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default UserLayout;