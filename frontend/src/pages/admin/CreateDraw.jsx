import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDraw } from '../../services/adminService';
import { toast } from 'react-toastify';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

const CreateDraw = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    drawName: '',
    description: '',
    totalTokens: 100,
    tokenPrice: 500,
    maxTokensPerUser: 10,
    startDate: '',
    endDate: '',
    grandPrizeTitle: '',
    grandPrizeDescription: '',
    grandPrizeValue: '',
    grandPrizeCategory: 'cash',
    isAutoClose: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const drawData = {
        drawName: formData.drawName,
        description: formData.description,
        totalTokens: parseInt(formData.totalTokens),
        tokenPrice: parseInt(formData.tokenPrice),
        maxTokensPerUser: parseInt(formData.maxTokensPerUser),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        grandPrize: {
          title: formData.grandPrizeTitle,
          description: formData.grandPrizeDescription,
          value: parseInt(formData.grandPrizeValue),
          category: formData.grandPrizeCategory
        },
        isAutoClose: formData.isAutoClose
      };

      await createDraw(drawData);
      toast.success('Draw created successfully!');
      navigate('/admin/draws');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create draw');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/draws')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Back to Draws</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Draw</h1>
        <p className="text-gray-600">Set up a new lucky draw</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Draw Name *
              </label>
              <input
                type="text"
                name="drawName"
                value={formData.drawName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="e.g., New Year Lucky Draw 2024"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="Describe the draw..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Tokens *
              </label>
              <input
                type="number"
                name="totalTokens"
                value={formData.totalTokens}
                onChange={handleChange}
                required
                min={10}
                max={10000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Price (Rs) *
              </label>
              <input
                type="number"
                name="tokenPrice"
                value={formData.tokenPrice}
                onChange={handleChange}
                required
                min={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens Per User *
              </label>
              <input
                type="number"
                name="maxTokensPerUser"
                value={formData.maxTokensPerUser}
                onChange={handleChange}
                required
                min={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isAutoClose"
                  checked={formData.isAutoClose}
                  onChange={handleChange}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Auto close when tokens sold out
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Draw Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Grand Prize */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Grand Prize</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Title *
              </label>
              <input
                type="text"
                name="grandPrizeTitle"
                value={formData.grandPrizeTitle}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="e.g., Honda City Car"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Description
              </label>
              <textarea
                name="grandPrizeDescription"
                value={formData.grandPrizeDescription}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder="Describe the prize..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Value (Rs) *
              </label>
              <input
                type="number"
                name="grandPrizeValue"
                value={formData.grandPrizeValue}
                onChange={handleChange}
                required
                min={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Category *
              </label>
              <select
                name="grandPrizeCategory"
                value={formData.grandPrizeCategory}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="item">Item</option>
                <option value="voucher">Voucher</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/draws')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FiSave />
            <span>{loading ? 'Creating...' : 'Create Draw'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDraw;