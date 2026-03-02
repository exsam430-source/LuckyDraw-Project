import { useState, useEffect } from 'react';
import { getMyPayments } from '../../services/userService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiCreditCard, FiDownload, FiEye } from 'react-icons/fi';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

const MyPayments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [filter, page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await getMyPayments(params);
      setPayments(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  if (loading && page === 1) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Payments</h1>
        <p className="text-gray-600">Track all your payment history</p>
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
            setFilter('pending');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            filter === 'pending'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            setFilter('approved');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            filter === 'approved'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => {
            setFilter('rejected');
            setPage(1);
          }}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            filter === 'rejected'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Payments List */}
      {payments.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Receipt #
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
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {payment.receiptNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.draw?.drawName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.numberOfTokens}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(payment.finalAmount)}
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                        >
                          <FiEye size={16} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {payments.map((payment) => (
                <div key={payment._id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {payment.receiptNumber}
                    </span>
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

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.draw?.drawName || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.numberOfTokens} tokens • {formatCurrency(payment.finalAmount)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDateTime(payment.createdAt)}
                    </span>
                    <button
                      onClick={() => handleViewDetails(payment)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
          <FiCreditCard className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Payments Yet</h3>
          <p className="text-gray-600">Your payment history will appear here</p>
        </div>
      )}

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Payment Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Receipt Number</p>
                <p className="font-medium text-gray-900">{selectedPayment.receiptNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedPayment.status === 'approved'
                      ? 'bg-green-100 text-green-600'
                      : selectedPayment.status === 'rejected'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {selectedPayment.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Draw</p>
              <p className="font-medium text-gray-900">
                {selectedPayment.draw?.drawName || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-900 uppercase">
                  {selectedPayment.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of Tokens</p>
                <p className="font-medium text-gray-900">{selectedPayment.numberOfTokens}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Price</span>
                  <span className="font-medium">{formatCurrency(selectedPayment.tokenPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedPayment.totalAmount)}</span>
                </div>
                {selectedPayment.discountApplied > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>- {formatCurrency(selectedPayment.discountApplied)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total Paid</span>
                  <span className="text-indigo-600">
                    {formatCurrency(selectedPayment.finalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {selectedPayment.tokensAssigned && selectedPayment.tokensAssigned.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Assigned Tokens</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPayment.tokensAssigned.map((token) => (
                    <span
                      key={token._id}
                      className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg font-medium"
                    >
                      #{token.tokenNumber}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedPayment.status === 'rejected' && selectedPayment.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                <p className="text-sm text-red-600">{selectedPayment.rejectionReason}</p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Submitted: {formatDateTime(selectedPayment.createdAt)}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyPayments;