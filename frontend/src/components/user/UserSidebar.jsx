import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { toast } from 'react-toastify';
import {
  FiHome,
  FiGrid,
  FiCreditCard,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiUser,
  FiLogOut,
  FiX
} from 'react-icons/fi';

const UserSidebar = ({ sidebarOpen, toggleSidebar }) => {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();

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

  const menuItems = [
    { path: '/user/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/user/draws', icon: FiGrid, label: 'Available Draws' },
    { path: '/user/tokens', icon: FiAward, label: 'My Tokens' },
    { path: '/user/payments', icon: FiCreditCard, label: 'My Payments' },
    { path: '/user/referrals', icon: FiUsers, label: 'Referrals' },
    { path: '/user/results', icon: FiTrendingUp, label: 'Results' },
    { path: '/user/profile', icon: FiUser, label: 'Profile' }
  ];

  return (
    <>
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">User Panel</h2>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => toggleSidebar()}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default UserSidebar;