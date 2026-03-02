import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllDrawsAdmin, changeDrawStatus, deleteDraw } from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiPlay, FiPause } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/helpers';

const AdminDraws = () => {
  const [loading, setLoading] = useState(true);
  const [draws, setDraws] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, draw: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDraws();
  }, [filter, page]);

  const fetchDraws = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter !== 'all') params.status = filter;

      const response = await getAllDrawsAdmin(params);
      setDraws(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load draws');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (drawId, newStatus) => {
    try {
      await changeDrawStatus(drawId, newStatus);
      toast.success(`Draw status changed to ${newStatus}`);
      fetchDraws();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change status');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.draw) return;

    setDeleting(true);
    try {
      await deleteDraw(deleteModal.draw._id);
      toast.success('Draw deleted successfully');
      setDeleteModal({ show: false, draw: null });
      fetchDraws();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete draw');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && page === 1) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Draws</h1>
          <p className="text-gray-600">Create and manage lucky draws</p>
        </div>
        <Link
          to="/admin/draws/create"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          <FiPlus size={20} />
          <span>Create New Draw</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {['all', 'upcoming', 'active', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status);
              setPage(1);
            }}
            className={`px-6 py-2 rounded-lg font-medium capitalize transition-all ${
              filter === status
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Draws Table */}
      {draws.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Draw Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Token Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Tokens Sold
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    End Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {draws.map((draw) => (
                  <tr key={draw._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{draw.drawName}</p>
                        <p className="text-sm text-gray-500">{draw.grandPrize?.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatCurrency(draw.tokenPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{draw.tokensSold}</span>
                      <span className="text-gray-500">/{draw.totalTokens}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        draw.status === 'active' ? 'bg-green-100 text-green-600' :
                        draw.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                        draw.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {draw.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(draw.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/draws/${draw._id}`}
                          className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg"
                          title="View"
                        >
                          <FiEye size={18} />
                        </Link>
                        <Link
                          to={`/admin/draws/${draw._id}/edit`}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <FiEdit size={18} />
                        </Link>
                        {draw.status === 'upcoming' && (
                          <button
                            onClick={() => handleStatusChange(draw._id, 'active')}
                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg"
                            title="Activate"
                          >
                            <FiPlay size={18} />
                          </button>
                        )}
                        {draw.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(draw._id, 'upcoming')}
                            className="text-yellow-600 hover:text-yellow-800 p-2 hover:bg-yellow-50 rounded-lg"
                            title="Pause"
                          >
                            <FiPause size={18} />
                          </button>
                        )}
                        {draw.tokensSold === 0 && (
                          <button
                            onClick={() => setDeleteModal({ show: true, draw })}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                      </div>
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
          <p className="text-gray-500 mb-4">No draws found</p>
          <Link
            to="/admin/draws/create"
            className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-800"
          >
            <FiPlus />
            <span>Create your first draw</span>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <Modal
          isOpen={deleteModal.show}
          onClose={() => setDeleteModal({ show: false, draw: null })}
          title="Delete Draw"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{deleteModal.draw?.drawName}</strong>?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setDeleteModal({ show: false, draw: null })}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDraws;