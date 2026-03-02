import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserDashboard } from '../../services/userService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import {
  FiGrid,
  FiAward,
  FiCreditCard,
  FiUsers,
  FiArrowRight,
  FiClock
} from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await getUserDashboard();
      setDashboardData(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const stats = dashboardData?.stats || {};
  const recentTokens = dashboardData?.recentTokens || [];
  const recentPayments = dashboardData?.recentPayments || [];
  const upcomingDraws = dashboardData?.upcomingDraws || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your lucky draw overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Draws */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiGrid className="text-3xl opacity-80" />
            <span className="text-sm opacity-80">Active</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.activeDraws || 0}</div>
          <div className="text-sm opacity-90">Active Draws</div>
        </div>

        {/* My Tokens */}
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiAward className="text-3xl opacity-80" />
            <span className="text-sm opacity-80">Total</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.myTokens || 0}</div>
          <div className="text-sm opacity-90">My Tokens</div>
        </div>

        {/* Pending Payments */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiClock className="text-3xl opacity-80" />
            <span className="text-sm opacity-80">Pending</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.pendingPayments || 0}</div>
          <div className="text-sm opacity-90">Pending Payments</div>
        </div>

        {/* Referral Points */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FiUsers className="text-3xl opacity-80" />
            <span className="text-sm opacity-80">Points</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.referralPoints || 0}</div>
          <div className="text-sm opacity-90">Referral Points</div>
        </div>
      </div>

      {/* Upcoming Draws */}
      {upcomingDraws.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Draws</h2>
            <Link
              to="/user/draws"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingDraws.map((draw) => (
              <Link
                key={draw._id}
                to={`/user/draws`}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-600 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      draw.status === 'active'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {draw.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {draw.remainingTokens || 0} left
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-2">{draw.drawName}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {draw.grandPrize?.title}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Token Price:</span>
                  <span className="font-bold text-indigo-600">
                    {formatCurrency(draw.tokenPrice)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tokens */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Tokens</h2>
            <Link
              to="/user/tokens"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </div>

          {recentTokens.length > 0 ? (
            <div className="space-y-3">
              {recentTokens.map((token) => (
                <div
                  key={token._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      #{token.tokenNumber}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {token.draw?.drawName || 'Unknown Draw'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(token.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      token.status === 'won'
                        ? 'bg-green-100 text-green-600'
                        : token.status === 'lost'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {token.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FiAward className="mx-auto text-4xl mb-2 opacity-50" />
              <p>No tokens yet</p>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Payments</h2>
            <Link
              to="/user/payments"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </div>

          {recentPayments.length > 0 ? (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {payment.draw?.drawName || 'Unknown Draw'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.numberOfTokens} tokens •{' '}
                      {formatCurrency(payment.totalAmount)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'approved'
                        ? 'bg-green-100 text-green-600'
                        : payment.status === 'rejected'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FiCreditCard className="mx-auto text-4xl mb-2 opacity-50" />
              <p>No payments yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Join a Draw?
          </h2>
          <p className="text-indigo-100 mb-6">
            Check out our active draws and get your lucky tokens now!
          </p>
          <Link
            to="/user/draws"
            className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
          >
            <span>Browse Draws</span>
            <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;