import { useState, useEffect } from 'react';
import { getResults } from '../../services/userService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import { FiTrendingUp, FiAward, FiX } from 'react-icons/fi';
import { formatDateTime } from '../../utils/helpers';

const Results = () => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [page]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await getResults({ page, limit: 10 });
      setResults(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load results');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Draw Results</h1>
        <p className="text-gray-600">View results of completed draws you participated in</p>
      </div>

      {/* Results List */}
      {results.length > 0 ? (
        <>
          <div className="space-y-6">
            {results.map((result) => (
              <div key={result.draw.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{result.draw.name}</h3>
                      <p className="text-indigo-100">
                        Executed: {formatDateTime(result.draw.executedAt)}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <div className="text-3xl font-bold">{result.totalTokens}</div>
                      <div className="text-sm text-indigo-100">Your Tokens</div>
                    </div>
                  </div>
                </div>

                {/* Grand Prize Info */}
                <div className="bg-yellow-50 border-b border-yellow-200 p-4">
                  <div className="flex items-center space-x-2">
                    <FiAward className="text-yellow-600" size={20} />
                    <span className="font-medium text-gray-900">Grand Prize:</span>
                    <span className="text-gray-700">{result.draw.grandPrize.title}</span>
                  </div>
                </div>

                {/* Tokens List */}
                <div className="p-6">
                  {result.winningTokens > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FiAward className="text-green-600" size={24} />
                        <h4 className="text-lg font-bold text-green-900">
                          🎉 Congratulations! You Won!
                        </h4>
                      </div>
                      <p className="text-green-700">
                        You have {result.winningTokens} winning token(s)
                      </p>
                    </div>
                  )}

                  <h4 className="font-bold text-gray-900 mb-4">Your Tokens:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {result.tokens.map((token) => (
                      <div
                        key={token.tokenNumber}
                        className={`relative p-4 rounded-lg text-center font-bold ${
                          token.isWinner
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg ring-2 ring-yellow-600'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {token.isWinner && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                            ✓
                          </div>
                        )}
                        <div className="text-2xl">#{token.tokenNumber}</div>
                        {token.isWinner && token.prize && (
                          <div className="text-xs mt-2 bg-white bg-opacity-20 rounded px-2 py-1">
                            {token.prize.title}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {result.winningTokens === 0 && (
                    <div className="mt-4 text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">
                        Better luck next time! Keep participating for more chances to win.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
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
          <FiTrendingUp className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Results Yet</h3>
          <p className="text-gray-600">
            Results will appear here once draws you participated in are completed
          </p>
        </div>
      )}
    </div>
  );
};

export default Results;