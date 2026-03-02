import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { toast } from 'react-toastify';
import {
  FiHome,
  FiGrid,
  FiUsers,
  FiCreditCard,
  FiAward,
  FiTrendingUp,
  FiSettings,
  FiLogOut,
  FiX,
  FiPlay,
  FiBarChart2,
  FiDollarSign
} from 'react-icons/fi';

const AdminSidebar = ({ sidebarOpen, toggleSidebar }) => {
  const { clearAuth } = useAuth();
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
    { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/draws', icon: FiGrid, label: 'Manage Draws' },
    { path: '/admin/payments', icon: FiCreditCard, label: 'Payments' },
    { path: '/admin/payment-accounts', icon: FiDollarSign, label: 'Payment Accounts' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/prizes', icon: FiAward, label: 'Prizes' },
    { path: '/admin/execute', icon: FiPlay, label: 'Execute Draw' },
    { path: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
    { path: '/admin/referrals', icon: FiTrendingUp, label: 'Referrals' },
    { path: '/admin/settings', icon: FiSettings, label: 'Settings' }
  ];

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <span className="font-bold text-gray-900">Admin Menu</span>
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
          <FiX size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => toggleSidebar()}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
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
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiLogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;