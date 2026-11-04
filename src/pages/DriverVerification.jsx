import React, { useState, useEffect } from 'react';
import { 
  Search, Eye, CheckCircle, XCircle, Clock, User, Car, 
  Truck, FileText, Image, Camera, Shield, AlertCircle,
  RefreshCw, UserCheck, UserX, Phone, Mail, MapPin, 
  Calendar, IdCard, Award, Navigation, CreditCard, 
  Home, Hash, Building, Weight, Box, Ruler, Fuel,
  Download, ZoomIn, ZoomOut, X, Plus, Minus
} from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

function DriverVerification() {
  const [drivers, setDrivers] = useState({ cab: [], goods: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPendingVerifications();
      console.log('Pending verifications:', response.data);
      setDrivers(response.data.data || { cab: [], goods: [] });
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const driverId = selectedDriver?.userId || selectedDriver?._id;
      
      const response = await adminAPI.processVerification(
        driverId,
        'approve',
        {
          driverType: selectedDriver.driverType || 'cab',
          remarks: 'Driver approved by admin',
          reason: ''
        }
      );
      
      if (response.data.success) {
        toast.success('Driver approved successfully!');
        setShowModal(false);
        fetchPendingVerifications();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve driver');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!remarks) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setProcessing(true);
    try {
      const driverId = selectedDriver?.userId || selectedDriver?._id;
      
      const response = await adminAPI.processVerification(
        driverId,
        'reject',
        {
          driverType: selectedDriver.driverType || 'cab',
          remarks: remarks,
          reason: remarks
        }
      );
      
      if (response.data.success) {
        toast.success('Driver rejected successfully');
        setShowModal(false);
        setShowRejectConfirm(false);
        setRemarks('');
        fetchPendingVerifications();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject driver');
    } finally {
      setProcessing(false);
    }
  };

  const viewDriverDetails = (driver) => {
    setSelectedDriver(driver);
    setShowModal(true);
    setRemarks('');
    setShowRejectConfirm(false);
    setImageErrors({});
  };

  const openImageViewer = (imageUrl, documentName) => {
    if (!imageUrl) return;
    let url = imageUrl;
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    } else if (!url.startsWith('https://')) {
      url = `https://dump-and-drop-server.onrender.com${url}`;
    }
    setCurrentImage({ url, name: documentName });
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
    setShowImageModal(true);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Simple direct download
  const downloadImage = (imageUrl, fileName) => {
    let url = imageUrl;
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    } else if (!url.startsWith('https://')) {
      url = `https://dump-and-drop-server.onrender.com${url}`;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageError = (imageKey) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  const getAllDrivers = () => {
    let all = [];
    if (selectedType === 'all' || selectedType === 'cab') {
      all = [...all, ...drivers.cab.map(d => ({ ...d, driverType: 'cab' }))];
    }
    if (selectedType === 'all' || selectedType === 'goods') {
      all = [...all, ...drivers.goods.map(d => ({ ...d, driverType: 'goods' }))];
    }
    
    if (searchTerm) {
      all = all.filter(d => 
        (d.fullName || d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.phone || '').includes(searchTerm)
      );
    }
    
    return all;
  };

  const getDocumentStatus = (driver) => {
    const docs = [
      { name: 'ID Proof', uploaded: !!(driver.idFrontUrl || driver.idBackUrl) },
      { name: 'Driving License', uploaded: !!(driver.dlFrontUrl || driver.dlBackUrl) },
      { name: 'RC Book', uploaded: !!driver.rcPhotoUrl },
      { name: 'Insurance', uploaded: !!driver.insurancePhotoUrl },
      { name: 'Vehicle Photo', uploaded: !!driver.vehiclePhotoUrl },
      { name: 'PUC Certificate', uploaded: !!driver.pucPhotoUrl }
    ];
    const uploadedCount = docs.filter(d => d.uploaded).length;
    return { total: docs.length, uploaded: uploadedCount, percentage: (uploadedCount / docs.length) * 100 };
  };

  const getDocumentImages = (driver, type) => {
    const images = [];
    switch(type) {
      case 'id':
        if (driver.idFrontUrl) images.push({ url: driver.idFrontUrl, name: 'ID Proof (Front)' });
        if (driver.idBackUrl) images.push({ url: driver.idBackUrl, name: 'ID Proof (Back)' });
        break;
      case 'license':
        if (driver.dlFrontUrl) images.push({ url: driver.dlFrontUrl, name: 'Driving License (Front)' });
        if (driver.dlBackUrl) images.push({ url: driver.dlBackUrl, name: 'Driving License (Back)' });
        break;
      case 'vehicle':
        if (driver.rcPhotoUrl) images.push({ url: driver.rcPhotoUrl, name: 'RC Book' });
        if (driver.vehiclePhotoUrl) images.push({ url: driver.vehiclePhotoUrl, name: 'Vehicle Photo' });
        break;
      case 'insurance':
        if (driver.insurancePhotoUrl) images.push({ url: driver.insurancePhotoUrl, name: 'Insurance Document' });
        break;
      case 'puc':
        if (driver.pucPhotoUrl) images.push({ url: driver.pucPhotoUrl, name: 'PUC Certificate' });
        break;
      default:
        break;
    }
    return images;
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    } else if (!url.startsWith('https://')) {
      return `https://dump-and-drop-server.onrender.com${url}`;
    }
    return url;
  };

  const [imageErrors, setImageErrors] = useState({});

  // Render image card component
  const renderImageCard = (img, driverName) => {
    const imageUrl = getImageUrl(img.url);
    const imageKey = img.url;
    return (
      <div key={imageKey} className="border rounded-lg p-2 bg-gray-50">
        <p className="text-xs text-gray-600 mb-1">{img.name}</p>
        {!imageErrors[img.url] ? (
          <img 
            src={imageUrl} 
            alt={img.name}
            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
            onClick={() => openImageViewer(img.url, img.name)}
            onError={() => handleImageError(img.url)}
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
            <p className="text-xs text-gray-500">Image not available</p>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => openImageViewer(img.url, img.name)}
            className="flex-1 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1"
          >
            <ZoomIn className="w-3 h-3" /> View
          </button>
          <button
            onClick={() => downloadImage(img.url, `${driverName}_${img.name}.jpg`)}
            className="flex-1 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-1"
          >
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allDrivers = getAllDrivers();
  const stats = {
    total: allDrivers.length,
    cab: drivers.cab.length,
    goods: drivers.goods.length,
    documentsComplete: allDrivers.filter(d => getDocumentStatus(d).percentage === 100).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Review and verify driver document submissions</p>
        </div>
        <button 
          onClick={fetchPendingVerifications}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">{stats.total}</p>
          <p className="text-sm text-gray-500">Pending Verification</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{stats.cab}</p>
          <p className="text-sm text-gray-500">Cab Drivers</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{stats.goods}</p>
          <p className="text-sm text-gray-500">Goods Drivers</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-purple-600">{stats.documentsComplete}</p>
          <p className="text-sm text-gray-500">Docs Complete</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="cab">Cab Drivers</option>
            <option value="goods">Goods Drivers</option>
          </select>
        </div>
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allDrivers.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Pending Verifications</h3>
            <p className="text-gray-500 mt-2">All drivers have been verified</p>
          </div>
        ) : (
          allDrivers.map((driver) => {
            const docStatus = getDocumentStatus(driver);
            return (
              <div key={driver._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        driver.driverType === 'cab' ? 'bg-purple-100' : 'bg-green-100'
                      }`}>
                        {driver.driverType === 'cab' ? 
                          <Car className="w-5 h-5 text-purple-600" /> : 
                          <Truck className="w-5 h-5 text-green-600" />
                        }
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{driver.fullName || driver.name}</h3>
                        <p className="text-xs text-gray-500">{driver.phone}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Vehicle Type</p>
                      <p className="text-sm font-medium text-gray-900">{driver.vehicleType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Registration Number</p>
                      <p className="text-sm font-medium text-gray-900">{driver.regNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Document Upload Status</span>
                      <span>{docStatus.uploaded}/{docStatus.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${docStatus.percentage === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${docStatus.percentage}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => viewDriverDetails(driver)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Review Documents
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedDriver.driverType === 'cab' ? 'Cab Driver Details' : 'Goods Driver Details'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              {/* Profile Header */}
              <div className={`bg-gradient-to-r ${selectedDriver.driverType === 'cab' ? 'from-purple-600 to-pink-500' : 'from-green-600 to-emerald-500'} -mx-5 -mt-5 px-6 py-6 mb-6`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    {selectedDriver.driverType === 'cab' ? 
                      <Car className="w-8 h-8 text-white" /> : 
                      <Truck className="w-8 h-8 text-white" />
                    }
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedDriver.fullName || selectedDriver.name}</h2>
                    <p className="text-white/80 text-sm">{selectedDriver.driverType === 'cab' ? 'Cab Driver' : 'Goods Driver'}</p>
                    <p className="text-white/70 text-xs mt-1">Status: Pending Verification</p>
                  </div>
                </div>
              </div>

              {/* ============ CAB DRIVER DETAILS ============ */}
              {selectedDriver.driverType === 'cab' && (
                <>
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div><p className="text-xs text-gray-500">Full Name</p><p className="text-sm font-medium">{selectedDriver.fullName || selectedDriver.name}</p></div>
                      <div><p className="text-xs text-gray-500">Phone Number</p><p className="text-sm">{selectedDriver.phone}</p></div>
                      <div><p className="text-xs text-gray-500">Email</p><p className="text-sm">{selectedDriver.email || 'Not provided'}</p></div>
                      <div><p className="text-xs text-gray-500">Date of Birth</p><p className="text-sm">{selectedDriver.dob ? new Date(selectedDriver.dob).toLocaleDateString() : 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Address</p><p className="text-sm">{selectedDriver.address || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Pincode</p><p className="text-sm">{selectedDriver.pincode || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Emergency Contact</p><p className="text-sm">{selectedDriver.emergencyName || 'N/A'} ({selectedDriver.emergencyPhone || 'N/A'})</p></div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <IdCard className="w-5 h-5 text-red-600" />
                      ID & License Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-4">
                      <div><p className="text-xs text-gray-500">ID Type</p><p className="text-sm">{selectedDriver.idType || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">ID Number</p><p className="text-sm">{selectedDriver.idNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Driving License No.</p><p className="text-sm">{selectedDriver.dlNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">License Valid From</p><p className="text-sm">{selectedDriver.dlValidFrom ? new Date(selectedDriver.dlValidFrom).toLocaleDateString() : 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">License Valid To</p><p className="text-sm">{selectedDriver.dlValidTo ? new Date(selectedDriver.dlValidTo).toLocaleDateString() : 'N/A'}</p></div>
                    </div>
                    
                    {(() => {
                      const idImages = getDocumentImages(selectedDriver, 'id');
                      if (idImages.length > 0) {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">ID Proof Images:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {idImages.map(img => renderImageCard(img, selectedDriver.name))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {(() => {
                      const licenseImages = getDocumentImages(selectedDriver, 'license');
                      if (licenseImages.length > 0) {
                        return (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Driving License Images:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {licenseImages.map(img => renderImageCard(img, selectedDriver.name))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Car className="w-5 h-5 text-blue-600" />
                      Vehicle Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-4">
                      <div><p className="text-xs text-gray-500">Vehicle Type</p><p className="text-sm font-medium">{selectedDriver.vehicleType || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Registration Number</p><p className="text-sm">{selectedDriver.regNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Brand / Model</p><p className="text-sm">{selectedDriver.brand || 'N/A'} {selectedDriver.model || ''}</p></div>
                      <div><p className="text-xs text-gray-500">Year / Color</p><p className="text-sm">{selectedDriver.year || 'N/A'} / {selectedDriver.color || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">RC Number</p><p className="text-sm">{selectedDriver.rcNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Seat Capacity</p><p className="text-sm font-semibold">{selectedDriver.seatCapacity || 'N/A'} seats</p></div>
                      <div><p className="text-xs text-gray-500">AC Available</p><p className="text-sm">{selectedDriver.isAC ? 'Yes' : 'No'}</p></div>
                    </div>

                    {(() => {
                      const vehicleImages = getDocumentImages(selectedDriver, 'vehicle');
                      if (vehicleImages.length > 0) {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Vehicle Documents:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {vehicleImages.map(img => renderImageCard(img, selectedDriver.name))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-600" />
                      Insurance & PUC
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-4">
                      <div><p className="text-xs text-gray-500">Insurance Number</p><p className="text-sm">{selectedDriver.insuranceNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Insurance Expiry</p><p className="text-sm">{selectedDriver.insuranceExpiry ? new Date(selectedDriver.insuranceExpiry).toLocaleDateString() : 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">PUC Expiry</p><p className="text-sm">{selectedDriver.pucExpiry ? new Date(selectedDriver.pucExpiry).toLocaleDateString() : 'N/A'}</p></div>
                    </div>

                    {(() => {
                      const insuranceImages = getDocumentImages(selectedDriver, 'insurance');
                      if (insuranceImages.length > 0) {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Insurance Document:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {insuranceImages.map(img => renderImageCard(img, selectedDriver.name))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {(() => {
                      const pucImages = getDocumentImages(selectedDriver, 'puc');
                      if (pucImages.length > 0) {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">PUC Certificate:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {pucImages.map(img => renderImageCard(img, selectedDriver.name))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </>
              )}

              {/* ============ GOODS DRIVER DETAILS ============ */}
              {selectedDriver.driverType === 'goods' && (
                <>
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div><p className="text-xs text-gray-500">Full Name</p><p className="text-sm font-medium">{selectedDriver.fullName || selectedDriver.name}</p></div>
                      <div><p className="text-xs text-gray-500">Phone Number</p><p className="text-sm">{selectedDriver.phone}</p></div>
                      <div><p className="text-xs text-gray-500">Email</p><p className="text-sm">{selectedDriver.email || 'Not provided'}</p></div>
                      <div><p className="text-xs text-gray-500">Date of Birth</p><p className="text-sm">{selectedDriver.dob ? new Date(selectedDriver.dob).toLocaleDateString() : 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Address</p><p className="text-sm">{selectedDriver.address || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Pincode</p><p className="text-sm">{selectedDriver.pincode || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Emergency Contact</p><p className="text-sm">{selectedDriver.emergencyName || 'N/A'} ({selectedDriver.emergencyPhone || 'N/A'})</p></div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-green-600" />
                      Vehicle Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-4">
                      <div><p className="text-xs text-gray-500">Vehicle Type</p><p className="text-sm font-medium">{selectedDriver.vehicleType || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Registration Number</p><p className="text-sm">{selectedDriver.regNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Brand / Model</p><p className="text-sm">{selectedDriver.brand || 'N/A'} {selectedDriver.model || ''}</p></div>
                      <div><p className="text-xs text-gray-500">Year / Color</p><p className="text-sm">{selectedDriver.year || 'N/A'} / {selectedDriver.color || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">RC Number</p><p className="text-sm">{selectedDriver.rcNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Capacity</p><p className="text-sm font-semibold">{selectedDriver.capacity || 'N/A'} tons</p></div>
                      <div><p className="text-xs text-gray-500">Vehicle Size</p><p className="text-sm">{selectedDriver.vehicleSize || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Permit Number</p><p className="text-sm">{selectedDriver.permitNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Vehicle Type ID</p><p className="text-sm">{selectedDriver.vehicleTypeId || 'N/A'}</p></div>
                    </div>

                    {(() => {
                      const vehicleImages = getDocumentImages(selectedDriver, 'vehicle');
                      if (vehicleImages.length > 0) {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Vehicle Documents:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {vehicleImages.map(img => renderImageCard(img, selectedDriver.name))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-600" />
                      Insurance
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-4">
                      <div><p className="text-xs text-gray-500">Insurance Number</p><p className="text-sm">{selectedDriver.insuranceNumber || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-500">Insurance Expiry</p><p className="text-sm">{selectedDriver.insuranceExpiry ? new Date(selectedDriver.insuranceExpiry).toLocaleDateString() : 'N/A'}</p></div>
                    </div>

                    {(() => {
                      const insuranceImages = getDocumentImages(selectedDriver, 'insurance');
                      if (insuranceImages.length > 0) {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Insurance Document:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {insuranceImages.map(img => renderImageCard(img, selectedDriver.name))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 py-3 rounded-lg font-medium transition bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <UserCheck className="w-5 h-5" />}
                  Approve Driver
                </button>
                <button
                  onClick={() => setShowRejectConfirm(true)}
                  className="flex-1 py-3 rounded-lg font-medium transition bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <UserX className="w-5 h-5" />
                  Reject Driver
                </button>
              </div>

              {/* Rejection Reason Input */}
              {showRejectConfirm && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Please specify why this driver is being rejected..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setShowRejectConfirm(false)}
                      className="flex-1 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={processing || !remarks}
                      className="flex-1 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <XCircle className="w-4 h-4" />}
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zoomable Image Viewer Modal */}
      {showImageModal && currentImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-10 bg-black/50 rounded-lg p-2 backdrop-blur-sm">
              <div className="flex gap-2">
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center gap-1"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">Zoom In</span>
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center gap-1"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">Zoom Out</span>
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center gap-1"
                  title="Reset Zoom"
                >
                  <span className="text-sm">Reset</span>
                </button>
              </div>
              <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {Math.round(zoomLevel * 100)}%
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadImage(currentImage.url, currentImage.name)}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Image Container with Zoom and Pan */}
            <div 
              className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <div
                style={{
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  cursor: zoomLevel > 1 ? 'grab' : 'default',
                }}
                className="inline-block"
              >
                <img
                  src={currentImage.url}
                  alt={currentImage.name}
                  className="max-w-none max-h-[90vh] object-contain"
                  draggable={false}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/500x300?text=Image+Not+Available';
                  }}
                />
              </div>
            </div>

            {/* Image Name Footer */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white bg-black/50 inline-block px-4 py-2 rounded-full text-sm">
                {currentImage.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverVerification;