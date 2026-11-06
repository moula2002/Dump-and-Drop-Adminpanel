import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Phone, Calendar, Star, ArrowLeft,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Ban,
  Car, Clock, DollarSign, MapPin, TrendingUp, Trash2
} from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUserDetails(id);

      let customerData = null;
      if (response.data?.data) {
        customerData = response.data.data;
      } else if (response.data?.user) {
        customerData = response.data.user;
      } else if (response.data) {
        customerData = response.data;
      }

      console.log('Customer Data:', customerData);
      setCustomer(customerData);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!blockReason) {
      toast.error('Please provide a reason for blocking');
      return;
    }
    try {
      await adminAPI.updateUserStatus(id, 'blocked', blockReason);
      toast.success('User blocked successfully');
      setShowBlockModal(false);
      setBlockReason('');
      fetchCustomerDetails();
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async () => {
    try {
      await adminAPI.updateUserStatus(id, 'active');
      toast.success('User unblocked successfully');
      fetchCustomerDetails();
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      setDeleting(true);
      await adminAPI.deleteUser(id);
      toast.success('Customer deleted successfully');
      navigate('/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Customer not found</h2>
        <button onClick={() => navigate('/users')} className="mt-4 text-blue-600 hover:underline">Back to Users</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/users')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Profile</h1>
            <p className="text-sm text-gray-500 mt-1">View customer information</p>
          </div>
        </div>
        <div className="flex gap-3">
          {customer.isAdminVerified === false ? (
            <button onClick={handleUnblockUser} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Unblock User
            </button>
          ) : (
            <button onClick={() => setShowBlockModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-2">
              <Ban className="w-4 h-4" />
              Block User
            </button>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Customer
          </button>
          <button
            onClick={fetchCustomerDetails}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section with Profile Photo */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {customer.profilePicture ? (
                <img
                  src={customer.profilePicture}
                  alt={customer.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center"><svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>';
                  }}
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2">
                {customer.isAdminVerified !== false ? (
                  <CheckCircle className="w-5 h-5 text-green-400 bg-white rounded-full" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 bg-white rounded-full" />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{customer.name || 'N/A'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3 text-blue-200" />
                <span className="text-white text-sm">{customer.phone || 'N/A'}</span>
                <span className="text-blue-200 text-xs">•</span>
                <Calendar className="w-3 h-3 text-blue-200" />
                <span className="text-white text-sm">Joined {formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 border-b border-gray-100 bg-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{customer.totalRides || 0}</p>
            <p className="text-xs text-gray-500">Total Rides</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.totalSpent || 0)}</p>
            <p className="text-xs text-gray-500">Total Spent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{customer.completedRides || 0}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{customer.cancelledRides || 0}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="text-sm font-medium text-gray-900">{customer.name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Phone Number</p>
              <p className="text-sm text-gray-900 flex items-center gap-2">
                <Phone className="w-3 h-3 text-gray-400" />
                {customer.phone || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm text-gray-900 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-gray-400" />
                {formatDate(customer.createdAt)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${customer.isAdminVerified !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {customer.isAdminVerified !== false ? 'Active' : 'Blocked'}
              </span>
            </div>
          </div>
        </div>

        {/* Ride History - All Rides */}
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            Ride History
          </h3>
          {customer.rides && customer.rides.length > 0 ? (
            <div className="space-y-3">
              {customer.rides.map((ride, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {ride.from || 'N/A'} → {ride.to || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(ride.date)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${ride.rideType === 'Cab' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {ride.rideType || 'Cab'}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(ride.fare || 0)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                          ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                        {ride.status ? (ride.status.charAt(0).toUpperCase() + ride.status.slice(1)) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No rides found</p>
            </div>
          )}
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Block User</h3>
            <p className="text-sm text-gray-600 mb-3">Are you sure you want to block {customer.name}?</p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason for blocking..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows="3"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowBlockModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleBlockUser} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Block User</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Customer</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete customer <span className="font-semibold text-gray-900">{customer.name || 'this customer'}</span>? All profile and wallet records will be permanently removed.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerProfile;