import { useState, useEffect } from 'react';
import { getMyTokens } from '../../services/userService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import { FiAward, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';

const MyTokens = () => {
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchTokens();
  }, [filter, page]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20
      };

      if (filter !== 'all') {
        params.filter = filter; // 'active' or 'ended'
      }

      const response = await getMyTokens(params);
      setTokens(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  // Check if draw has ended
  const isDrawEnded = (token) => {
    const drawStatus = token.draw?.status;
    return drawStatus === 'completed' || drawStatus === 'cancelled';
  };

  if (loading && page === 1) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tokens</h1>
        <p className="text-gray-600">View all your lucky draw tokens</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilter('active');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            filter === 'active'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <FiClock size={16} />
          Active
        </button>
        <button
          onClick={() => {
            setFilter('ended');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            filter === 'ended'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <FiCheckCircle size={16} />
          Ended
        </button>
      </div>

      {/* Tokens List */}
      {tokens.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tokens.map((token) => {
              const ended = isDrawEnded(token);
              const isWinner = token.isWinner && token.prize;

              return (
                <div
                  key={token._id}
                  className={`bg-white rounded-xl shadow-lg p-6 text-center card-hover relative ${
                    isWinner ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  {/* Winner Badge */}
                  {isWinner && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow">
                      🏆 WINNER
                    </div>
                  )}

                  {/* Token Number */}
                  <div
                    className={`w-20 h-20 mx-auto mb-4 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                      isWinner
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : ended
                        ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600'
                    }`}
                  >
                    #{token.tokenNumber}
                  </div>

                  {/* Draw Name */}
                  <h3 className="font-bold text-gray-900 mb-2 truncate">
                    {token.draw?.drawName || 'Unknown Draw'}
                  </h3>

                  {/* Draw Status Badge */}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                      isWinner
                        ? 'bg-yellow-100 text-yellow-700'
                        : ended
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {isWinner ? '🏆 WINNER' : ended ? 'ENDED' : 'ACTIVE'}
                  </span>

                  {/* Prize Info for Winners */}
                  {isWinner && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <FiTrendingUp className="mx-auto text-yellow-600 mb-1" size={20} />
                      <p className="text-sm font-bold text-yellow-800">
                        {token.prize.title}
                      </p>
                      {token.prize.value && (
                        <p className="text-xs text-yellow-600">
                          Worth Rs {token.prize.value.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500">
                    Purchased: {formatDate(token.createdAt)}
                  </p>
                </div>
              );
            })}
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
          <FiAward className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {filter === 'all' 
              ? 'No Tokens Yet' 
              : filter === 'active' 
                ? 'No Active Tokens' 
                : 'No Ended Draws'}
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Purchase tokens from available draws to see them here!'
              : filter === 'active'
                ? 'You have no tokens in active draws'
                : 'None of your draws have ended yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyTokens;