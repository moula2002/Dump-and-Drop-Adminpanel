import axios from 'axios';

// Use localhost for development, change to your backend IP if needed
const API_BASE_URL = 'https://dump-and-drop.onrender.com/api/admin';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  // Auth
  adminLogin: (email, password) => api.post('/login', { email, password }),

  getDashboardStats: () => api.get('/dashboard/stats'),
  getRevenueData: (period) => api.get(`/dashboard/revenue?period=${period}`),
  // Users
  getUsers: (page = 1, limit = 10, search = '') =>
    api.get('/users', { params: { page, limit, search } }),
  getUserDetails: (userId) => {
    console.log('Calling getUserDetails with ID:', userId);
    return api.get(`/users/${userId}`);
  },
  updateUserStatus: (userId, status, reason = '') =>
    api.put(`/users/${userId}/status`, { status, reason }),

  // Drivers
  getDrivers: () => api.get('/drivers'),
  getDriverById: (driverId) => api.get(`/drivers/${driverId}`),
  verifyDriver: (driverId, status, reason = '') =>
    api.put(`/drivers/${driverId}/verify`, { status, reason }),

  // Rides
  getRides: (page = 1, limit = 10, filters = {}) =>
    api.get('/rides', { params: { page, limit, ...filters } }),
  cancelRide: (rideId, reason) => api.put(`/rides/${rideId}/cancel`, { reason }),
  // Commission
  getCommissionSettings: () => api.get('/commission'),
  updateCommissionSettings: (settings) => api.put('/commission', settings),
  getDriverCommission: () => api.get('/commission/driver'),
  // Settings
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),

  // Vehicles (mock for now - implement backend endpoints as needed)
  getVehicles: () => Promise.resolve({ data: { vehicles: [] } }),
  addVehicle: (data) => Promise.resolve({ data: { success: true } }),
  updateVehicle: (id, data) => Promise.resolve({ data: { success: true } }),
  deleteVehicle: (id) => Promise.resolve({ data: { success: true } }),

  // Payouts (mock)
  getPayouts: () => Promise.resolve({ data: { payouts: [] } }),
  processPayout: (id) => Promise.resolve({ data: { success: true } }),

  // Reports (mock)
  generateReport: (type, start, end) => Promise.resolve({ data: {} }),
  // Add these to your adminAPI object in api.js
  // Driver Verification - FIXED
  getPendingVerifications: () => api.get('/verifications/pending'),
  getVerificationDetails: (driverId) => api.get(`/verifications/${driverId}`),
  processVerification: (driverId, action, data) => {
    // Ensure driverId is a string, not an object
    const id = typeof driverId === 'string' ? driverId : (driverId._id || driverId.userId);
    console.log(`Sending request to: /verifications/${id}/${action}`);
    return api.post(`/verifications/${id}/${action}`, data);
  },
  getNotifications: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/notifications${params ? `?${params}` : ''}`);
  },
  getNotificationStats: () => api.get('/notifications/stats'),
  markNotificationAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  sendNotification: (data) => api.post('/notifications/send', data),
  // Payments
  getPayments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/payments${queryString ? `?${queryString}` : ''}`);
  },
  getPaymentById: (id) => api.get(`/payments/${id}`),
  updatePaymentStatus: (id, data) => api.put(`/payments/${id}/status`, data),

  // Transactions
  getTransactions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/transactions${queryString ? `?${queryString}` : ''}`);
  },
  // Payouts
  getPayouts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/payouts${queryString ? `?${queryString}` : ''}`);
  },
  getPayoutSummary: () => api.get('/payouts/summary'),
  getDriverWallet: (driverId) => api.get(`/payouts/drivers/${driverId}/wallet`),
  processPayout: (id) => api.put(`/payouts/${id}/process`),
  createPayout: (data) => api.post('/payouts/create', data),

  // Bookings
  getBookings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/bookings${queryString ? `?${queryString}` : ''}`);
  },
  // Cancel booking
  cancelBooking: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  exportBookings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/bookings/export${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob'
    });
  },

  getRevenueReports: (period) => api.get(`/revenue-reports?period=${period}`),
  exportRevenueReport: (period) => api.get(`/reports/revenue/export?period=${period}`, {
    responseType: 'blob'
  }),
  // Cancelled Rides
  getCancelledRides: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/cancelled-rides${queryString ? `?${queryString}` : ''}`);
  },
  exportCancelledRides: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/cancelled-rides/export${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob'
    });
  },

  // Custom Reports
  generateReport: (type, startDate, endDate) => {
    return api.get(`/reports/generate?type=${type}&startDate=${startDate}&endDate=${endDate}`);
  },

  // Rentals
  getRentalsList: () => api.get('/rentals-list'),

  // Password Resets
  getPasswordResetRequests: () => api.get('/password-resets'),
  approvePasswordReset: (id) => api.put(`/password-resets/${id}/approve`),
};

export default api;