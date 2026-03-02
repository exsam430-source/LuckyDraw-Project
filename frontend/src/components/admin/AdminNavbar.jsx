import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { toast } from 'react-toastify';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { APP_NAME } from '../../utils/constants';

const AdminNavbar = ({ toggleSidebar }) => {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50 h-16">
      <div className="px-4 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left Side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-700 hover:text-indigo-600"
            >
              <FiMenu size={24} />
            </button>

            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎰</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-gray-900">{APP_NAME}</span>
                <span className="text-xs text-indigo-600 block">Admin Panel</span>
              </div>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative text-gray-600 hover:text-indigo-600">
              <FiBell size={22} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg px-3 py-2"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.fullName}
                </span>
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-20 animate-fadeIn overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-medium rounded">
                        Admin
                      </span>
                    </div>

                    <Link
                      to="/admin/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50"
                    >
                      <FiSettings size={16} />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-3 text-red-600 hover:bg-red-50"
                    >
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;