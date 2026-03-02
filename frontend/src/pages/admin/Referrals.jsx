import { useState, useEffect } from 'react';
import { getAllReferrals, getTopReferrers } from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import { FiUsers, FiAward } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';

const AdminReferrals = () => {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [topReferrers, setTopReferrers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filter, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter !== 'all') params.status = filter;

      const [referralsRes, topRes] = await Promise.all([
        getAllReferrals(params),
        getTopReferrers(5)
      ]);

      setReferrals(referralsRes.data);
      setPagination(referralsRes.pagination);
      setTopReferrers(topRes.data);
    } catch (error) {
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 1) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Management</h1>
        <p className="text-gray-600">View and manage referral program</p>
      </div>

      {/* Top Referrers */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <FiAward />
          <span>Top Referrers</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topReferrers.map((referrer, index) => (
            <div key={referrer._id} className="bg-white bg-opacity-10 rounded-lg p-4 text-center">
              <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center font-bold mx-auto mb-2">
                {index + 1}
              </div>
              <p className="font-medium truncate">{referrer.fullName}</p>
              <p className="text-2xl font-bold">{referrer.totalReferrals}</p>
              <p className="text-xs text-indigo-200">referrals</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {['all', 'pending', 'completed', 'rewarded'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setPage(1);
            }}
            className={`px-6 py-2 rounded-lg font-medium capitalize transition-all ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Referrals List */}
      {referrals.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Referrer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Referred User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Points
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <tr key={referral._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {referral.referrer?.fullName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {referral.referred?.fullName}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-700">
                      {referral.referralCode}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        referral.status === 'rewarded' ? 'bg-green-100 text-green-600' :
                        referral.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {referral.pointsAwarded || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(referral.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
                className="px-4 py-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FiUsers className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">No referrals found</p>
        </div>
      )}
    </div>
  );
};

export default AdminReferrals;