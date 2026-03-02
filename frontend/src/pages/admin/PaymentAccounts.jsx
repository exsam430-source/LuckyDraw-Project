import { useState, useEffect } from 'react';
import {
  getAllPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
  setPrimaryAccount
} from '../../services/paymentAccountService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiStar,
  FiSmartphone,
  FiImage
} from 'react-icons/fi';

const PaymentAccounts = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, account: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    accountType: 'easypaisa',
    accountName: '',
    accountNumber: '',
    isActive: true,
    isPrimary: false
  });
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await getAllPaymentAccounts();
      setAccounts(response.data);
    } catch (error) {
      toast.error('Failed to load payment accounts');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      accountType: 'easypaisa',
      accountName: '',
      accountNumber: '',
      isActive: true,
      isPrimary: false
    });
    setQrFile(null);
    setQrPreview('');
    setEditAccount(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (account) => {
    setEditAccount(account);
    setForm({
      accountType: account.accountType,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      isActive: account.isActive,
      isPrimary: account.isPrimary
    });
    setQrPreview(account.qrCode || '');
    setQrFile(null);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('accountType', form.accountType);
      formData.append('accountName', form.accountName);
      formData.append('accountNumber', form.accountNumber);
      formData.append('isActive', form.isActive);
      formData.append('isPrimary', form.isPrimary);
      if (qrFile) {
        formData.append('qrCode', qrFile);
      }

      if (editAccount) {
        await updatePaymentAccount(editAccount._id, formData);
        toast.success('Account updated successfully');
      } else {
        await createPaymentAccount(formData);
        toast.success('Account created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.account) return;
    setDeleting(true);
    try {
      await deletePaymentAccount(deleteModal.account._id);
      toast.success('Account deleted');
      setDeleteModal({ show: false, account: null });
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await setPrimaryAccount(id);
      toast.success('Primary account updated');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set primary');
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Accounts</h1>
          <p className="text-gray-600">Manage global EasyPaisa & JazzCash accounts</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          <FiPlus size={20} />
          <span>Add Account</span>
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div
              key={account._id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                account.isPrimary ? 'border-yellow-400' : 'border-transparent'
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-4 text-white ${
                  account.accountType === 'easypaisa'
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FiSmartphone size={20} />
                    <span className="font-bold uppercase">{account.accountType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {account.isPrimary && (
                      <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <FiStar size={12} />
                        <span>PRIMARY</span>
                      </span>
                    )}
                    {!account.isActive && (
                      <span className="bg-gray-800 bg-opacity-50 px-2 py-1 rounded-full text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {account.accountName}
                </h3>
                <p className="text-xl font-mono text-gray-700 mb-4">
                  {account.accountNumber}
                </p>

                {account.qrCode && (
                  <div className="mb-4">
                    <img
                      src={account.qrCode}
                      alt="QR Code"
                      className="w-32 h-32 object-contain border rounded-lg mx-auto"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(account)}
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <FiEdit size={18} />
                    </button>
                    {!account.isPrimary && (
                      <button
                        onClick={() =>
                          setDeleteModal({ show: true, account })
                        }
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                  {!account.isPrimary && account.isActive && (
                    <button
                      onClick={() => handleSetPrimary(account._id)}
                      className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-800 px-3 py-1 hover:bg-yellow-50 rounded-lg text-sm font-medium"
                    >
                      <FiStar size={14} />
                      <span>Set Primary</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FiSmartphone className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Payment Accounts
          </h3>
          <p className="text-gray-600 mb-4">
            Add your EasyPaisa or JazzCash accounts for users to send payments.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <FiPlus />
            <span>Add your first account</span>
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={editAccount ? 'Edit Payment Account' : 'Add Payment Account'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type *
              </label>
              <select
                value={form.accountType}
                onChange={(e) =>
                  setForm({ ...form, accountType: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="easypaisa">EasyPaisa</option>
                <option value="jazzcash">JazzCash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                value={form.accountName}
                onChange={(e) =>
                  setForm({ ...form, accountName: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="e.g. Muhammad Ali"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="03001234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
              {qrPreview && (
                <img
                  src={qrPreview}
                  alt="QR Preview"
                  className="w-32 h-32 object-contain border rounded-lg mt-2"
                />
              )}
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPrimary}
                  onChange={(e) =>
                    setForm({ ...form, isPrimary: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Set as Primary
                </span>
              </label>
            </div>

            {form.isPrimary && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Setting as primary will remove primary from all other
                  accounts.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editAccount
                  ? 'Update Account'
                  : 'Add Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModal.show && (
        <Modal
          isOpen={deleteModal.show}
          onClose={() => setDeleteModal({ show: false, account: null })}
          title="Delete Payment Account"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete the{' '}
              <strong>{deleteModal.account?.accountType?.toUpperCase()}</strong>{' '}
              account <strong>{deleteModal.account?.accountName}</strong>?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setDeleteModal({ show: false, account: null })}
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

export default PaymentAccounts;