import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for token
api.interceptors.request.use(
  (config) => {
    // Add user token for user coupon actions
    if (
      config.url?.includes('/coupons/apply') ||
      config.url?.includes('/coupons/redeem') ||
      config.url?.includes('/coupons/validate')
    ) {
      const userToken = localStorage.getItem('token');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    } else {
      // Admin token for admin actions
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Coupon API calls - Updated to match server.js routes
export const couponAPI = {
  // Get all coupons with filters (user-side: public)
  getUserCoupons: (params = {}) => api.get('/api/v1/coupons/public', { params }),
  
  // Get all coupons with filters (admin-side: list)
  getCoupons: (params = {}) => {
    console.log("API: getCoupons called with params", params);
    return api.get('/api/v1/admin/coupons', { params });
  },
  
  // Create new coupon (admin)
  createCoupon: (data) => api.post('/api/v1/admin/coupons', data),
  
  // Update coupon (admin)
  updateCoupon: (id, data) => api.put(`/api/v1/admin/coupons/${id}`, data),
  
  // Delete coupon (admin)
  deleteCoupon: (id) => api.delete(`/api/v1/admin/coupons/${id}`),
  
  // Apply coupon (user)
  applyCoupon: (data) => api.post('/api/v1/coupons/apply', data),

  // Redeem coupon (user)
  redeemCoupon: (data) => api.post('/api/v1/coupons/redeem', data),

   // Free upgrade endpoint
  freeUpgrade: (data) => api.post('/api/v1/subscription/free-upgrade', data),

  // Add this method to fetch all plans for admin
  getAllPlansForAdmin: () => api.get('/api/v1/admin/subscriptions/plans'),
};

// Analytics API calls - Updated to match server.js routes
export const analyticsAPI = {
  // Get overview statistics
  getOverview: () => api.get('/api/v1/admin/analytics/overview'),
  
  // Get revenue trends
  getRevenueTrends: (months = 6) => api.get('/api/v1/admin/analytics/revenue-trends', { params: { months } }),
  
  // Get top performing coupons
  getTopPerformers: (limit = 5) => api.get('/api/v1/admin/analytics/top-performers', { params: { limit } }),
  
  // Get user segments
  getUserSegments: () => api.get('/api/v1/admin/analytics/user-segments'),
  
  // Get plan distribution
  getPlanDistribution: () => api.get('/api/v1/admin/analytics/plan-distribution'),
  
  // Get conversion funnel
  getConversionFunnel: () => api.get('/api/v1/admin/analytics/conversion-funnel'),
};

export default api;

// All API calls already use planId as argument, so no change needed here.
