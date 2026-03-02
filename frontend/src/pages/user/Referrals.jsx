import { useState, useEffect } from 'react';
import { getMyReferralInfo } from '../../services/referralService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import { FiUsers, FiCopy, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import { copyToClipboard, formatDate } from '../../utils/helpers';

const Referrals = () => {
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await getMyReferralInfo();
      setReferralData(response.data);
    } catch (error) {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    copyToClipboard(referralData?.stats?.referralCode || '');
    toast.success('Referral code copied!');
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const stats = referralData?.stats || {};
  const referrals = referralData?.referrals || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h1>
        <p className="text-gray-600">Invite friends and earn rewards!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Referrals */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <FiUsers className="text-3xl mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.totalReferrals || 0}</div>
          <div className="text-sm opacity-90">Total Referrals</div>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <FiCheckCircle className="text-3xl mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.completedReferrals || 0}</div>
          <div className="text-sm opacity-90">Completed</div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <FiClock className="text-3xl mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.pendingReferrals || 0}</div>
          <div className="text-sm opacity-90">Pending</div>
        </div>

        {/* Total Points */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white shadow-lg">
          <FiTrendingUp className="text-3xl mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{stats.currentPoints || 0}</div>
          <div className="text-sm opacity-90">Current Points</div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Your Referral Code</h2>
        <p className="text-indigo-100 mb-6">
          Share this code with friends. Earn 100 points when they make their first purchase!
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 bg-white rounded-lg px-6 py-4 text-gray-900">
            <p className="text-sm text-gray-500 mb-1">Your Code</p>
            <p className="text-2xl font-bold">{stats.referralCode || 'N/A'}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <FiCopy size={20} />
            <span>Copy Code</span>
          </button>
        </div>
      </div>

      {/* Points Value */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white">
            <FiCheckCircle size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {stats.currentPoints || 0} Points Available
            </h3>
            <p className="text-green-600 font-medium">
              Worth {stats.pointsValue || 'Rs 0'} in discounts
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Use points to get discounts on your next token purchase
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              1
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Share Code</h3>
            <p className="text-sm text-gray-600">
              Share your unique referral code with friends
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              2
            </div>
            <h3 className="font-medium text-gray-900 mb-2">They Register</h3>
            <p className="text-sm text-gray-600">
              Friends sign up using your referral code
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              3
            </div>
            <h3 className="font-medium text-gray-900 mb-2">First Purchase</h3>
            <p className="text-sm text-gray-600">
              They make their first token purchase
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
              4
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Earn Points</h3>
            <p className="text-sm text-gray-600">
              You receive 100 points (= Rs 20)
            </p>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Your Referrals</h2>

        {referrals.length > 0 ? (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {referral.referredUser?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {referral.referredUser || 'User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Joined {formatDate(referral.joinedAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      referral.status === 'rewarded'
                        ? 'bg-green-100 text-green-600'
                        : referral.status === 'completed'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {referral.status}
                  </span>
                  {referral.pointsAwarded > 0 && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      +{referral.pointsAwarded} points
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiUsers className="mx-auto text-5xl mb-3 opacity-50" />
            <p>No referrals yet</p>
            <p className="text-sm mt-1">Start sharing your code to earn rewards!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Referrals;