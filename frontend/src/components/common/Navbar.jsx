import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { toast } from 'react-toastify';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { APP_NAME } from '../../utils/constants';
import { getInitials } from '../../utils/helpers';

const Navbar = () => {
  const { isAuthenticated, user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🎰</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/user/draws"
              className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
            >
              Draws
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                  <div className="w-8 h-8 bg-white text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {getInitials(user?.fullName || 'User')}
                  </div>
                  <span className="font-medium">{user?.fullName}</span>
                </button>

                {/* Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-indigo-100 text-indigo-600 text-xs font-medium rounded">
                        {user?.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>

                    <Link
                      to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-indigo-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiUser className="text-indigo-600" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to={user?.role === 'admin' ? '/admin/profile' : '/user/profile'}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-indigo-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiSettings className="text-indigo-600" />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden text-gray-700 hover:text-indigo-600 transition-colors"
          >
            {showMenu ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-slideIn">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/"
              className="block text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              onClick={() => setShowMenu(false)}
            >
              Home
            </Link>
            <Link
              to="/user/draws"
              className="block text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              onClick={() => setShowMenu(false)}
            >
              Draws
            </Link>

            {isAuthenticated ? (
              <>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      {getInitials(user?.fullName || 'User')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
                    className="block text-gray-700 hover:text-indigo-600 font-medium transition-colors mb-2"
                    onClick={() => setShowMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleLogout();
                    }}
                    className="block w-full text-left text-red-600 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium text-center hover:shadow-lg transition-all"
                  onClick={() => setShowMenu(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;