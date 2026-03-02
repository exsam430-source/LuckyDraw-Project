import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import {
  FiUsers,
  FiGrid,
  FiCreditCard,
  FiDollarSign,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiClock
} from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await getAdminDashboard();
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const { users, draws, payments, tokens, revenue, referrals, recentPayments, recentUsers } = dashboardData || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-blue-600 text-xl" />
            </div>
            <span className="text-green-600 text-sm font-medium flex items-center">
              <FiArrowUp className="mr-1" />
              12%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{users?.total || 0}</div>
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="mt-2 text-xs text-gray-400">
            Active: {users?.active || 0}
          </div>
        </div>

        {/* Active Draws */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiGrid className="text-purple-600 text-xl" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              {draws?.completed || 0} completed
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{draws?.active || 0}</div>
          <div className="text-sm text-gray-500">Active Draws</div>
          <div className="mt-2 text-xs text-gray-400">
            Total: {draws?.total || 0}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiClock className="text-yellow-600 text-xl" />
            </div>
            {payments?.pending > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs font-medium rounded-full">
                Needs Action
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">{payments?.pending || 0}</div>
          <div className="text-sm text-gray-500">Pending Payments</div>
          <Link to="/admin/payments?status=pending" className="mt-2 text-xs text-indigo-600 hover:underline">
            View all →
          </Link>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-green-600 text-xl" />
            </div>
            <span className="text-green-600 text-sm font-medium flex items-center">
              <FiArrowUp className="mr-1" />
              8%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(revenue?.total || 0)}
          </div>
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="mt-2 text-xs text-gray-400">
            {revenue?.transactions || 0} transactions
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/admin/draws/create"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 hover:shadow-xl transition-all"
        >
          <FiGrid className="text-3xl mb-3" />
          <h3 className="font-bold mb-1">Create New Draw</h3>
          <p className="text-sm text-indigo-100">Start a new lucky draw</p>
        </Link>

        <Link
          to="/admin/payments?status=pending"
          className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl p-6 hover:shadow-xl transition-all"
        >
          <FiCreditCard className="text-3xl mb-3" />
          <h3 className="font-bold mb-1">Pending Approvals</h3>
          <p className="text-sm text-yellow-100">{payments?.pending || 0} waiting</p>
        </Link>

        <Link
          to="/admin/execute"
          className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl p-6 hover:shadow-xl transition-all"
        >
          <FiArrowRight className="text-3xl mb-3" />
          <h3 className="font-bold mb-1">Execute Draw</h3>
          <p className="text-sm text-green-100">Run draw selections</p>
        </Link>

        <Link
          to="/admin/reports"
          className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl p-6 hover:shadow-xl transition-all"
        >
          <FiArrowUp className="text-3xl mb-3" />
          <h3 className="font-bold mb-1">View Reports</h3>
          <p className="text-sm text-pink-100">Analytics & reports</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Payments</h2>
            <Link to="/admin/payments" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All →
            </Link>
          </div>

          {recentPayments && recentPayments.length > 0 ? (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {payment.user?.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.user?.fullName}</p>
                      <p className="text-sm text-gray-500">{payment.draw?.drawName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(payment.finalAmount)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === 'approved' ? 'bg-green-100 text-green-600' :
                      payment.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent payments</p>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All →
            </Link>
          </div>

          {recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(user.createdAt)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.isVerified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent users</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;