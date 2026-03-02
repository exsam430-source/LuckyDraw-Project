import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableDraws } from '../../services/userService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import { FiGrid, FiClock, FiAward, FiArrowRight } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';

const AvailableDraws = () => {
  const [loading, setLoading] = useState(true);
  const [draws, setDraws] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchDraws();
  }, [filter, page]);

  const fetchDraws = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 9
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await getAvailableDraws(params);
      setDraws(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load draws');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Draws</h1>
        <p className="text-gray-600">Browse and join exciting lucky draws</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${filter === 'all'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
        >
          All Draws
        </button>
        <button
          onClick={() => {
            setFilter('active');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${filter === 'active'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
        >
          Active
        </button>
        <button
          onClick={() => {
            setFilter('upcoming');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${filter === 'upcoming'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
        >
          Upcoming
        </button>
      </div>

      {/* Draws Grid */}
      {draws.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draws.map((draw) => (
              <div
                key={draw._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden card-hover"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${draw.status === 'active'
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white'
                        }`}
                    >
                      {draw.status}
                    </span>
                    <span className="text-white text-sm">
                      {draw.remainingTokens || 0}/{draw.totalTokens}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-xl">{draw.drawName}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Grand Prize */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiAward className="text-yellow-500" size={20} />
                      <span className="text-sm font-medium text-gray-500">
                        Grand Prize
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {draw.grandPrize?.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      Worth: {formatCurrency(draw.grandPrize?.value || 0)}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Token Price:</span>
                      <span className="font-bold text-indigo-600">
                        {formatCurrency(draw.tokenPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Available:</span>
                      <span className="font-medium text-gray-900">
                        {draw.remainingTokens || 0} tokens
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Your Tokens:</span>
                      <span className="font-medium text-gray-900">
                        {draw.userTokenCount || 0}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                    <FiClock size={14} />
                    <span>Ends: {formatDate(draw.endDate)}</span>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/user/draws/${draw._id}`}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg"
                  >
                    <span>View Details & Prizes</span>
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-gray-700">
                Page {page} of {pagination.pages}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
                className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FiGrid className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Draws Available</h3>
          <p className="text-gray-600">Check back later for new draws!</p>
        </div>
      )}
    </div>
  );
};

export default AvailableDraws;