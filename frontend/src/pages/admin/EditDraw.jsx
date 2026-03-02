import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDrawByIdAdmin, updateDraw } from '../../services/adminService';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

const EditDraw = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draw, setDraw] = useState(null);

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
    isAutoClose: true
  });

  useEffect(() => {
    fetchDraw();
  }, [id]);

  const fetchDraw = async () => {
    setLoading(true);
    try {
      const response = await getDrawByIdAdmin(id);
      const d = response.data.draw;
      setDraw(d);

      // Format dates for datetime-local input
      const formatForInput = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
      };

      setFormData({
        drawName: d.drawName || '',
        description: d.description || '',
        totalTokens: d.totalTokens || 100,
        tokenPrice: d.tokenPrice || 500,
        maxTokensPerUser: d.maxTokensPerUser || 10,
        startDate: formatForInput(d.startDate),
        endDate: formatForInput(d.endDate),
        grandPrizeTitle: d.grandPrize?.title || '',
        grandPrizeDescription: d.grandPrize?.description || '',
        grandPrizeValue: d.grandPrize?.value || '',
        isAutoClose: d.isAutoClose !== false
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load draw');
      navigate('/admin/draws');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

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
          value: parseInt(formData.grandPrizeValue)
        },
        isAutoClose: formData.isAutoClose
      };

      await updateDraw(id, drawData);
      toast.success('Draw updated successfully!');
      navigate(`/admin/draws/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update draw');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!draw) return null;

  const isCompleted = draw.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/admin/draws/${id}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft />
          <span>Back to Draw</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Draw</h1>
        <p className="text-gray-600">{draw.drawName}</p>

        {isCompleted && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ This draw is completed. Editing is limited.
            </p>
          </div>
        )}

        {draw.tokensSold > 0 && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700 font-medium">
              ⚠️ {draw.tokensSold} tokens already sold. Some fields cannot be reduced below current values.
            </p>
          </div>
        )}
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
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                min={Math.max(10, draw.tokensSold || 0)}
                max={10000}
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {draw.tokensSold > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Min: {draw.tokensSold} (tokens already sold)
                </p>
              )}
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
                disabled={isCompleted || draw.tokensSold > 0}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {draw.tokensSold > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Cannot change — tokens already sold
                </p>
              )}
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
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isAutoClose"
                  checked={formData.isAutoClose}
                  onChange={handleChange}
                  disabled={isCompleted}
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
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        {!isCompleted && (
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/admin/draws/${id}`)}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FiSave />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditDraw;