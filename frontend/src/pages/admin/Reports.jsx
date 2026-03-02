import { useState, useEffect } from 'react';
import { getRevenueReport, getUserActivityReport } from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import { FiDollarSign, FiUsers, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [revenue, activity] = await Promise.all([
        getRevenueReport({ groupBy: period }),
        getUserActivityReport(30)
      ]);

      setRevenueData(revenue.data);
      setActivityData(activity.data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">View detailed reports and statistics</p>
        </div>

        <div className="flex gap-2">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                period === p
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}ly
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white">
          <FiDollarSign className="text-4xl mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(revenueData?.totals?.totalRevenue || 0)}
          </div>
          <div className="text-green-100">Total Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <FiTrendingUp className="text-4xl mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">
            {revenueData?.totals?.totalTransactions || 0}
          </div>
          <div className="text-blue-100">Total Transactions</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <FiUsers className="text-4xl mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">
            {activityData?.activeBuyers || 0}
          </div>
          <div className="text-purple-100">Active Buyers</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Draw */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue by Draw</h2>
          {revenueData?.byDraw?.length > 0 ? (
            <div className="space-y-4">
              {revenueData.byDraw.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.drawName}</p>
                    <p className="text-sm text-gray-500">{item.transactions} transactions</p>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Top Buyers */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Buyers</h2>
          {activityData?.topBuyers?.length > 0 ? (
            <div className="space-y-4">
              {activityData.topBuyers.map((buyer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{buyer.fullName}</p>
                      <p className="text-sm text-gray-500">{buyer.tokens} tokens</p>
                    </div>
                  </div>
                  <span className="font-bold text-indigo-600">
                    {formatCurrency(buyer.totalSpent)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Revenue by Payment Method */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue by Payment Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {revenueData?.byPaymentMethod?.map((method, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900 uppercase mb-2">
                {method._id}
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(method.revenue)}
              </p>
              <p className="text-sm text-gray-500">{method.transactions} transactions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;