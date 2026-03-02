import { useState, useEffect } from 'react';
import { getAllDrawsAdmin, getPrizesByDraw, createPrize, assignTokenToPrize } from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiAward, FiPlus, FiTarget } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const AdminPrizes = () => {
  const [loading, setLoading] = useState(true);
  const [draws, setDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [tokenNumber, setTokenNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const [prizeForm, setPrizeForm] = useState({
    title: '',
    description: '',
    prizeType: 'secondary',
    value: '',
    prizeCategory: 'cash',
    position: 2
  });

  useEffect(() => {
    fetchDraws();
  }, []);

  useEffect(() => {
    if (selectedDraw) {
      fetchPrizes();
    }
  }, [selectedDraw]);

  const fetchDraws = async () => {
    try {
      const response = await getAllDrawsAdmin({ limit: 50 });
      setDraws(response.data);
      if (response.data.length > 0) {
        setSelectedDraw(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load draws');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrizes = async () => {
    try {
      const response = await getPrizesByDraw(selectedDraw._id);
      setPrizes(response.data);
    } catch (error) {
      toast.error('Failed to load prizes');
    }
  };

  const handleAddPrize = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPrize({
        drawId: selectedDraw._id,
        ...prizeForm,
        value: parseInt(prizeForm.value),
        position: parseInt(prizeForm.position)
      });
      toast.success('Prize added successfully');
      setShowAddModal(false);
      setPrizeForm({
        title: '',
        description: '',
        prizeType: 'secondary',
        value: '',
        prizeCategory: 'cash',
        position: 2
      });
      fetchPrizes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add prize');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignToken = async () => {
    if (!tokenNumber) {
      toast.error('Please enter a token number');
      return;
    }

    setSaving(true);
    try {
      await assignTokenToPrize(selectedPrize._id, parseInt(tokenNumber));
      toast.success('Token assigned to prize (secretly)');
      setShowAssignModal(false);
      setTokenNumber('');
      setSelectedPrize(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign token');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prize Management</h1>
          <p className="text-gray-600">Manage prizes and assign winning tokens</p>
        </div>
        {selectedDraw && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg"
          >
            <FiPlus size={20} />
            <span>Add Prize</span>
          </button>
        )}
      </div>

      {/* Draw Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Select Draw</h2>
        <select
          value={selectedDraw?._id || ''}
          onChange={(e) => {
            const draw = draws.find(d => d._id === e.target.value);
            setSelectedDraw(draw);
          }}
          className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
        >
          {draws.map((draw) => (
            <option key={draw._id} value={draw._id}>
              {draw.drawName} ({draw.status})
            </option>
          ))}
        </select>
      </div>

      {/* Prizes List */}
      {prizes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <div key={prize._id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  prize.prizeType === 'grand'
                    ? 'bg-yellow-100 text-yellow-600'
                    : prize.prizeType === 'secondary'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <FiAward size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  prize.prizeType === 'grand' ? 'bg-yellow-100 text-yellow-600' :
                  prize.prizeType === 'secondary' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {prize.prizeType}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{prize.title}</h3>
              <p className="text-gray-600 mb-4">{prize.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500">Value:</span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatCurrency(prize.value)}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  prize.isAwarded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {prize.isAwarded ? 'Awarded' : 'Not Awarded'}
                </span>
              </div>

              {!prize.isAwarded && (
                <button
                  onClick={() => {
                    setSelectedPrize(prize);
                    setShowAssignModal(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <FiTarget size={16} />
                  <span>Assign Token</span>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FiAward className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">
            {selectedDraw ? 'No prizes added yet' : 'Select a draw to view prizes'}
          </p>
        </div>
      )}

      {/* Add Prize Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Prize"
        >
          <form onSubmit={handleAddPrize} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Title *
              </label>
              <input
                type="text"
                value={prizeForm.title}
                onChange={(e) => setPrizeForm({ ...prizeForm, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={prizeForm.description}
                onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prize Type *
                </label>
                <select
                  value={prizeForm.prizeType}
                  onChange={(e) => setPrizeForm({ ...prizeForm, prizeType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="secondary">Secondary</option>
                  <option value="consolation">Consolation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={prizeForm.prizeCategory}
                  onChange={(e) => setPrizeForm({ ...prizeForm, prizeCategory: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="cash">Cash</option>
                  <option value="item">Item</option>
                  <option value="voucher">Voucher</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value (Rs) *
                </label>
                <input
                  type="number"
                  value={prizeForm.value}
                  onChange={(e) => setPrizeForm({ ...prizeForm, value: e.target.value })}
                  required
                  min={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="number"
                  value={prizeForm.position}
                  onChange={(e) => setPrizeForm({ ...prizeForm, position: e.target.value })}
                  min={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Prize'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Token Modal */}
      {showAssignModal && selectedPrize && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setTokenNumber('');
            setSelectedPrize(null);
          }}
          title="Assign Winning Token"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Secret Assignment:</strong> The token number will be hidden. 
                When this token is drawn, the prize will be revealed.
              </p>
            </div>

            <div>
              <p className="text-gray-700 mb-2">
                Assigning token for: <strong>{selectedPrize.title}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Number *
              </label>
              <input
                type="number"
                value={tokenNumber}
                onChange={(e) => setTokenNumber(e.target.value)}
                min={1}
                max={selectedDraw?.totalTokens || 100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                placeholder={`1 - ${selectedDraw?.totalTokens || 100}`}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setTokenNumber('');
                  setSelectedPrize(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignToken}
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Assigning...' : 'Assign Token'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPrizes;