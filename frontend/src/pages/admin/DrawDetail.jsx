import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDrawByIdAdmin, changeDrawStatus, deleteDraw } from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiPlay,
  FiPause,
  FiAward,
  FiUsers,
  FiCreditCard,
  FiCalendar
} from 'react-icons/fi';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';

const DrawDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [draw, setDraw] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDraw();
  }, [id]);

  const fetchDraw = async () => {
    setLoading(true);
    try {
      const response = await getDrawByIdAdmin(id);
      setDraw(response.data.draw);
      setPrizes(response.data.prizes || []);
      setStatistics(response.data.statistics || {});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load draw');
      navigate('/admin/draws');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await changeDrawStatus(id, newStatus);
      toast.success(`Draw status changed to ${newStatus}`);
      fetchDraw();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change status');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDraw(id);
      toast.success('Draw deleted successfully');
      navigate('/admin/draws');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete draw');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!draw) return null;

  const statusColors = {
    upcoming: 'bg-yellow-100 text-yellow-600',
    active: 'bg-green-100 text-green-600',
    completed: 'bg-blue-100 text-blue-600',
    cancelled: 'bg-red-100 text-red-600'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/draws')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <FiArrowLeft />
            <span>Back to Draws</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{draw.drawName}</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/admin/draws/${id}/edit`}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FiEdit size={16} />
            <span>Edit</span>
          </Link>

          {draw.status === 'upcoming' && (
            <button
              onClick={() => handleStatusChange('active')}
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <FiPlay size={16} />
              <span>Activate</span>
            </button>
          )}

          {draw.status === 'active' && (
            <button
              onClick={() => handleStatusChange('upcoming')}
              className="inline-flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              <FiPause size={16} />
              <span>Pause</span>
            </button>
          )}

          {draw.tokensSold === 0 && (
            <button
              onClick={() => setDeleteModal(true)}
              className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <FiTrash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Status & Info Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${statusColors[draw.status] || 'bg-gray-100 text-gray-600'}`}>
              {draw.status?.toUpperCase()}
            </span>
            <p className="text-indigo-100">{draw.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-200">Created by</p>
            <p className="font-medium">{draw.createdBy?.fullName || 'Admin'}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <FiCreditCard className="mx-auto text-indigo-600 text-2xl mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(draw.tokenPrice)}
          </div>
          <div className="text-sm text-gray-500">Token Price</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <FiAward className="mx-auto text-green-600 text-2xl mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {statistics?.tokensSold || draw.tokensSold || 0}/{draw.totalTokens}
          </div>
          <div className="text-sm text-gray-500">Tokens Sold</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <FiUsers className="mx-auto text-purple-600 text-2xl mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {statistics?.totalParticipants || 0}
          </div>
          <div className="text-sm text-gray-500">Participants</div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <FiCalendar className="mx-auto text-orange-600 text-2xl mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {statistics?.remainingTokens ?? (draw.totalTokens - (draw.tokensSold || 0))}
          </div>
          <div className="text-sm text-gray-500">Remaining</div>
        </div>
      </div>

      {/* Draw Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Draw Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Draw Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Max Tokens Per User</span>
              <span className="font-medium text-gray-900">{draw.maxTokensPerUser}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Start Date</span>
              <span className="font-medium text-gray-900">{formatDateTime(draw.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">End Date</span>
              <span className="font-medium text-gray-900">{formatDateTime(draw.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Auto Close</span>
              <span className={`font-medium ${draw.isAutoClose ? 'text-green-600' : 'text-gray-600'}`}>
                {draw.isAutoClose ? 'Yes' : 'No'}
              </span>
            </div>
            {draw.drawExecutedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Executed At</span>
                <span className="font-medium text-gray-900">{formatDateTime(draw.drawExecutedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Grand Prize */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <FiAward className="text-yellow-600" />
            <span>Grand Prize</span>
          </h2>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {draw.grandPrize?.title}
          </h3>
          {draw.grandPrize?.description && (
            <p className="text-gray-600 mb-3">{draw.grandPrize.description}</p>
          )}
          <p className="text-xl font-bold text-indigo-600">
            Worth: {formatCurrency(draw.grandPrize?.value || 0)}
          </p>
        </div>
      </div>

      {/* Prizes List */}
      {prizes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              All Prizes ({prizes.length})
            </h2>
            <Link
              to="/admin/prizes"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              Manage Prizes →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map((prize) => (
              <div
                key={prize._id}
                className={`border-2 rounded-lg p-4 ${
                  prize.prizeType === 'grand'
                    ? 'border-yellow-300 bg-yellow-50'
                    : prize.prizeType === 'secondary'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    prize.prizeType === 'grand'
                      ? 'bg-yellow-200 text-yellow-800'
                      : prize.prizeType === 'secondary'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {prize.prizeType}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    #{prize.position}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900">{prize.title}</h4>
                <p className="text-indigo-600 font-medium">
                  {formatCurrency(prize.value)}
                </p>
                {prize.isAwarded && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded">
                    ✓ Awarded
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to={`/admin/payments?drawId=${id}`}
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <FiCreditCard className="text-indigo-600 text-2xl mb-2" />
          <h3 className="font-bold text-gray-900">View Payments</h3>
          <p className="text-sm text-gray-500">See all payments for this draw</p>
        </Link>

        <Link
          to="/admin/prizes"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <FiAward className="text-yellow-600 text-2xl mb-2" />
          <h3 className="font-bold text-gray-900">Manage Prizes</h3>
          <p className="text-sm text-gray-500">Add or edit prizes</p>
        </Link>

        <Link
          to="/admin/execute"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <FiPlay className="text-green-600 text-2xl mb-2" />
          <h3 className="font-bold text-gray-900">Execute Draw</h3>
          <p className="text-sm text-gray-500">Run the draw</p>
        </Link>
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <Modal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          title="Delete Draw"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{draw.drawName}</strong>?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setDeleteModal(false)}
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

export default DrawDetail;