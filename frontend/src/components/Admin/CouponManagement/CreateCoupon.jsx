import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { couponAPI } from '../../../services/couponService';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Tag, 
  Percent, 
  Calendar, 
  Users, 
  Settings,
  Save,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const CreateCoupon = ({ existingCoupon = null, isEditing = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    description: '',
    applicablePlans: [],
    usageLimit: '',
    usageLimitPerUser: '',
    expiresAt: '',
    isActive: true,
    minimumPurchase: '',
    maximumDiscount: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  // Fetch plans from backend (use axios directly, like admin sub mgmt page)
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/admin/subscriptions/plans`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        // Only use active plans
        setPlans((res.data.plans || []).filter(plan => plan.isActive));
      } catch (err) {
        toast.error('Failed to fetch plans');
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    if (existingCoupon) {
      setFormData({
        code: existingCoupon.code || '',
        type: existingCoupon.type || 'percentage',
        value: existingCoupon.value || '',
        description: existingCoupon.description || '',
        applicablePlans: existingCoupon.applicablePlans || [],
        usageLimit: existingCoupon.usageLimit || '',
        usageLimitPerUser: existingCoupon.usageLimitPerUser || '',
        expiresAt: existingCoupon.expiresAt ? new Date(existingCoupon.expiresAt).toISOString().split('T')[0] : '',
        isActive: existingCoupon.isActive !== undefined ? existingCoupon.isActive : true,
        minimumPurchase: existingCoupon.minimumPurchase || '',
        maximumDiscount: existingCoupon.maximumDiscount || ''
      });
    }
  }, [existingCoupon]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlanChange = (planId) => {
    setFormData(prev => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(planId)
        ? prev.applicablePlans.filter(id => id !== planId)
        : [...prev.applicablePlans, planId]
    }));
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code) newErrors.code = 'Coupon code is required';
    if (!formData.value) newErrors.value = 'Value is required';
    if (!formData.expiresAt) newErrors.expiresAt = 'Expiry date is required';
    if (formData.applicablePlans.length === 0) newErrors.applicablePlans = 'Select at least one plan';
    
    if (formData.type === 'percentage' && (formData.value < 1 || formData.value > 100)) {
      newErrors.value = 'Percentage must be between 1-100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const couponData = {
        ...formData,
        value: parseFloat(formData.value),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : 1,
        minimumPurchase: formData.minimumPurchase ? parseFloat(formData.minimumPurchase) : 0,
        maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : null
      };

      if (isEditing && existingCoupon) {
        await couponAPI.updateCoupon(existingCoupon._id, couponData);
        toast.success('Coupon updated successfully!');
      } else {
        await couponAPI.createCoupon(couponData);
        toast.success('Coupon created successfully!');
      }
      
      navigate('/admin/coupons');
    } catch (error) {
      console.error('Error saving coupon:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save coupon';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculatePreviewDiscount = (planPrice) => {
    if (!formData.value) return 0;
    
    if (formData.type === 'percentage') {
      const discount = (planPrice * formData.value) / 100;
      return formData.maximumDiscount ? 
        Math.min(discount, formData.maximumDiscount) : discount;
    }
    return Math.min(formData.value, planPrice);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/admin/coupons')}
          className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Coupon' : 'Create New Coupon'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update coupon details' : 'Set up discount codes and promotional offers'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-purple-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coupon Code - full width row */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={generateCouponCode}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                  {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      placeholder={formData.type === 'percentage' ? '50' : '100'}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      {formData.type === 'percentage' ? <Percent className="w-4 h-4" /> : <span>₹</span>}
                    </div>
                  </div>
                  {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {errors.expiresAt && <p className="text-red-500 text-sm mt-1">{errors.expiresAt}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter coupon description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Applicable Plans */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-600" />
                Applicable Plans
              </h2>
              
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={plan._id}
                        checked={formData.applicablePlans.includes(plan._id)}
                        onChange={() => handlePlanChange(plan._id)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor={plan._id} className="ml-3 text-sm font-medium text-gray-900">
                        {plan.name}
                      </label>
                    </div>
                    <span className="text-sm text-gray-500">₹{plan.price}</span>
                  </div>
                ))}
              </div>
              {errors.applicablePlans && <p className="text-red-500 text-sm mt-1">{errors.applicablePlans}</p>}
            </div>

            {/* Usage Limits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Usage Limits
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimitPerUser"
                    value={formData.usageLimitPerUser}
                    onChange={handleInputChange}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Purchase (₹)
                  </label>
                  <input
                    type="number"
                    name="minimumPurchase"
                    value={formData.minimumPurchase}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {formData.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Discount (₹)
                    </label>
                    <input
                      type="number"
                      name="maximumDiscount"
                      value={formData.maximumDiscount}
                      onChange={handleInputChange}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activate coupon immediately</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/coupons')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                disabled={loading}
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : (isEditing ? 'Update Coupon' : 'Create Coupon')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-purple-600" />
              Preview
            </h3>
            
            {formData.code && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {formData.code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formData.type === 'percentage' ? `${formData.value}% OFF` : `₹${formData.value} OFF`}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Applicable Plans:</h4>
                  {formData.applicablePlans.map(planId => {
                    const plan = plans.find(p => p._id === planId);
                    if (!plan) return null;
                    
                    const discount = calculatePreviewDiscount(plan.price);
                    const finalPrice = plan.price - discount;
                    
                    return (
                      <div key={planId} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{plan.name}</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 line-through">₹{plan.price}</div>
                            <div className="font-bold text-green-600">₹{finalPrice}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  {formData.expiresAt && (
                    <div>Expires: {new Date(formData.expiresAt).toLocaleDateString()}</div>
                  )}
                  {formData.usageLimit && (
                    <div>Usage limit: {formData.usageLimit}</div>
                  )}
                  {formData.minimumPurchase && (
                    <div>Min purchase: ₹{formData.minimumPurchase}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCoupon;
