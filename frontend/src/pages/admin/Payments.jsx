import { useState, useEffect } from 'react';
import { getAllPaymentsAdmin, approvePayment, rejectPayment, getPaymentByIdAdmin } from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiCheck, FiX, FiEye, FiImage } from 'react-icons/fi';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [filter, page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter !== 'all') params.status = filter;

      const response = await getAllPaymentsAdmin(params);
      setPayments(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = async (paymentId) => {
    try {
      const response = await getPaymentByIdAdmin(paymentId);
      setSelectedPayment(response.data.payment);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load payment details');
    }
  };

  const handleApprove = async (paymentId) => {
    setProcessing(true);
    try {
      await approvePayment(paymentId);
      toast.success('Payment approved successfully');
      setShowModal(false);
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await rejectPayment(selectedPayment._id, rejectReason);
      toast.success('Payment rejected');
      setShowRejectModal(false);
      setShowModal(false);
      setRejectReason('');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && page === 1) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Approve or reject user payments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
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

      {/* Payments Table */}
      {payments.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Draw
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Tokens
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{payment.user?.fullName}</p>
                        <p className="text-sm text-gray-500">{payment.user?.contactNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {payment.draw?.drawName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {payment.numberOfTokens}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatCurrency(payment.finalAmount)}
                    </td>
                    <td className="px-6 py-4 uppercase text-sm text-gray-700">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'approved' ? 'bg-green-100 text-green-600' :
                        payment.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewPayment(payment._id)}
                          className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(payment._id)}
                              className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowRejectModal(true);
                              }}
                              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <FiX size={18} />
                            </button>
                          </>
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
          <p className="text-gray-500">No payments found</p>
        </div>
      )}

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Payment Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">User</p>
                <p className="font-medium">{selectedPayment.user?.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium">{selectedPayment.user?.contactNumber}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Draw</p>
                <p className="font-medium">{selectedPayment.draw?.drawName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium uppercase">{selectedPayment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tokens</p>
                <p className="font-medium">{selectedPayment.numberOfTokens}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-bold text-indigo-600">{formatCurrency(selectedPayment.finalAmount)}</p>
              </div>
            </div>

            {/* Screenshot */}
            {selectedPayment.screenshotUrl && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Payment Screenshot</p>
                <a
                  href={selectedPayment.screenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={selectedPayment.screenshotUrl}
                    alt="Payment Screenshot"
                    className="max-w-full h-auto max-h-64 rounded-lg border"
                  />
                </a>
              </div>
            )}

            {/* Actions */}
            {selectedPayment.status === 'pending' && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedPayment._id)}
                  disabled={processing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
          title="Reject Payment"
        >
          <div className="space-y-4">
            <p className="text-gray-700">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              placeholder="e.g., Invalid transaction ID, amount mismatch..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPayments;