import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, MapPin, Calendar, Car,
  CreditCard, Shield, ArrowLeft,
  CheckCircle, XCircle, AlertCircle, Clock,
  Eye, Truck, Package, IdCard, Wrench, Ban,
  Weight, Navigation,
  DollarSign,
  UserCheck, UserX, Download, RefreshCw
} from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTableImport from 'jspdf-autotable';
const autoTable = (doc, options) => {
  if (options) {
    if (options.body && Array.isArray(options.body)) {
      options.body = options.body.map(row => {
        if (Array.isArray(row)) {
          return row.map(cell => {
            if (typeof cell === 'string') {
              return cell.replace(/→/g, '->').replace(/₹/g, 'Rs. ').replace(/\.00\b/g, '');
            }
            return cell;
          });
        }
        return row;
      });
    }
    if (options.head && Array.isArray(options.head)) {
      options.head = options.head.map(row => {
        if (Array.isArray(row)) {
          return row.map(cell => {
            if (typeof cell === 'string') {
              return cell.replace(/→/g, '->').replace(/₹/g, 'Rs. ').replace(/\.00\b/g, '');
            }
            return cell;
          });
        }
        return row;
      });
    }
  }
  autoTableImport(doc, options);
};

// Helper function for full number format - NO abbreviations
const formatFullNumber = (amount) => {
  if (!amount || amount === 0) return '₹0';
  const num = Math.round(amount || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

function DriverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [driverType, setDriverType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showUnapproveModal, setShowUnapproveModal] = useState(false);
  const [unapproveReason, setUnapproveReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDriverDetails();
  }, [id]);

  const fetchDriverDetails = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getDriverById(id);
      console.log('Driver API Response:', response);

      let driverData = null;
      if (response.data?.data) {
        driverData = response.data.data;
      } else if (response.data?.driver) {
        driverData = response.data.driver;
      } else if (response.data) {
        driverData = response.data;
      }

      console.log('Processed driver data:', driverData);

      if (driverData) {
        const vehicleType = (driverData.vehicleType || '').toLowerCase();
        const goodsTypes = ['truck', 'container', 'multi axle', 'multiaxle', 'pickup', 'goods', 'lorry', 'trailer'];
        const cabTypes = ['car', 'van', 'suv', 'cab', 'sedan', 'hatchback', 'muv'];

        if (goodsTypes.some(type => vehicleType.includes(type))) {
          setDriverType('goods');
        } else if (cabTypes.some(type => vehicleType.includes(type))) {
          setDriverType('cab');
        } else if (driverData.seatCapacity !== undefined && driverData.seatCapacity !== null) {
          setDriverType('cab');
        } else if (driverData.capacity !== undefined || driverData.vehicleSize !== undefined) {
          setDriverType('goods');
        } else {
          setDriverType('unknown');
        }
      }

      setDriver(driverData);
    } catch (error) {
      console.error('Error fetching driver:', error);
      toast.error('Failed to load driver details');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const date = new Date().toLocaleString();

    // Premium PDF Header
    doc.setFillColor(79, 70, 229); // Modern Indigo
    doc.rect(0, 0, 210, 26, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Dump & Drop", 14, 18);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Driver Profile Report", 196, 18, { align: "right" });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 36);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Personal Information", 14, 35);

    const personalInfo = [
      ["Full Name", getFullName()],
      ["Phone Number", getPhone()],
      ["Email", getEmail()],
      ["Address", getAddress()],
      ["Status", getStatus()],
      ["Total Rides", getTotalRides()],
      ["Total Earnings", `Rs. ${Math.round(getTotalEarnings()).toLocaleString('en-IN')}`],
      ["Today's Earnings", `Rs. ${Math.round(getValue(driver.todayEarnings, 0)).toLocaleString('en-IN')}`],
      ["Monthly Earnings", `Rs. ${Math.round(getValue(driver.monthlyEarnings, 0)).toLocaleString('en-IN')}`],
    ];

    autoTable(doc, {
      startY: 56,
      body: personalInfo,
      theme: "grid",
            styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229], cellWidth: 100 }
            }
    });

    let yPos = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text("Vehicle Information", 14, yPos);
    yPos += 8;

    let vehicleInfo = [];
    if (driverType === 'cab') {
      vehicleInfo = [
        ["Vehicle Type", getValue(driver.vehicleType, 'N/A')],
        ["Registration Number", getValue(driver.regNumber, 'N/A')],
        ["Brand / Model", `${getValue(driver.brand, 'N/A')} ${getValue(driver.model, '')}`],
        ["Year / Color", `${getValue(driver.year, 'N/A')} / ${getValue(driver.color, 'N/A')}`],
        ["RC Number", getValue(driver.rcNumber, 'N/A')],
        ["Seat Capacity", `${getValue(driver.seatCapacity, 'N/A')} seats`],
        ["AC Available", driver.isAC ? 'Yes' : 'No'],
      ];
    } else if (driverType === 'goods') {
      vehicleInfo = [
        ["Vehicle Type", getValue(driver.vehicleType, 'N/A')],
        ["Registration Number", getValue(driver.regNumber, 'N/A')],
        ["Brand / Model", `${getValue(driver.brand, 'N/A')} ${getValue(driver.model, '')}`],
        ["Year / Color", `${getValue(driver.year, 'N/A')} / ${getValue(driver.color, 'N/A')}`],
        ["RC Number", getValue(driver.rcNumber, 'N/A')],
        ["Capacity", `${getValue(driver.capacity, 'N/A')} tons`],
        ["Vehicle Size", getValue(driver.vehicleSize, 'N/A')],
      ];
    }

    autoTable(doc, {
      startY: yPos,
      body: vehicleInfo,
      theme: "grid",
            styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229], cellWidth: 100 }
            }
    });

    if (driver.insuranceNumber) {
      yPos = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text("Insurance Information", 14, yPos);
      yPos += 8;

      const insuranceInfo = [
        ["Insurance Number", getValue(driver.insuranceNumber, 'N/A')],
        ["Insurance Expiry", driver.insuranceExpiry ? new Date(driver.insuranceExpiry).toLocaleDateString() : 'N/A'],
      ];

      if (driverType === 'cab') {
        insuranceInfo.push(["PUC Expiry", driver.pucExpiry ? new Date(driver.pucExpiry).toLocaleDateString() : 'N/A']);
      }

      autoTable(doc, {
        startY: yPos,
        body: insuranceInfo,
        theme: "grid",
            styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229], cellWidth: 100 }
            }
      });
    }

    if (driverType === 'cab' && (driver.idType || driver.dlNumber)) {
      doc.addPage();
      let yPosPage2 = 20;

      doc.setFillColor(41, 98, 255);
      doc.rect(0, 0, 210, 15, "F");
      doc.setTextColor(255);
      doc.setFontSize(12);
      doc.text("ID & License Information", 105, 10, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);

      const licenseInfo = [
        ["ID Type", getValue(driver.idType, 'N/A')],
        ["ID Number", getValue(driver.idNumber, 'N/A')],
        ["Driving License No.", getValue(driver.dlNumber, 'N/A')],
        ["License Valid From", driver.dlValidFrom ? new Date(driver.dlValidFrom).toLocaleDateString() : 'N/A'],
        ["License Valid To", driver.dlValidTo ? new Date(driver.dlValidTo).toLocaleDateString() : 'N/A'],
      ];

      autoTable(doc, {
        startY: yPosPage2,
        body: licenseInfo,
        theme: "grid",
            styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229], cellWidth: 100 }
            }
      });
    }

    doc.save(`driver_profile_${getFullName()}_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const handleApproveDriver = async () => {
    setProcessing(true);
    try {
      const response = await adminAPI.verifyDriver(id, 'approved', '');
      if (response.data.success) {
        toast.success('Driver approved successfully!');
        setShowApproveModal(false);
        fetchDriverDetails();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Approve driver error:', error);
      toast.error('Failed to approve driver');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnapproveDriver = async () => {
    setProcessing(true);
    try {
      const response = await adminAPI.verifyDriver(id, 'pending', unapproveReason);
      if (response.data.success) {
        toast.success('Driver has been unapproved successfully!');
        setShowUnapproveModal(false);
        setUnapproveReason('');
        fetchDriverDetails();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Unapprove driver error:', error);
      toast.error('Failed to unapprove driver');
    } finally {
      setProcessing(false);
    }
  };

  const hasValue = (value) => {
    return value !== undefined && value !== null && value !== '' && value !== 'N/A';
  };

  const getValue = (value, fallback = 'N/A') => {
    return (value !== undefined && value !== null && value !== '') ? value : fallback;
  };

  const getFullName = () => driver?.fullName || driver?.name || 'N/A';
  const getPhone = () => driver?.phone || driver?.userId?.phone || 'N/A';
  const getEmail = () => driver?.email || driver?.userId?.email || 'Not provided';
  const getAddress = () => driver?.address || 'Not set';
  const getStatus = () => driver?.status || 'pending';
  const getTotalRides = () => driver?.totalRides || 0;
  const getTotalEarnings = () => driver?.totalEarnings || 0;
  const getProfilePhoto = () => driver?.profilePicture || driver?.profilePhoto || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Driver not found</h2>
        <button onClick={() => navigate('/drivers')} className="mt-4 text-blue-600 hover:underline">Back to Drivers</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/drivers')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              {driverType === 'cab' ? 'Cab Driver' : driverType === 'goods' ? 'Goods Driver' : 'Driver'}
              | ID: {driver.userId || driver._id?.slice(-8)}
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={fetchDriverDetails}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {getStatus() !== 'approved' && (
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Approve Driver
            </button>
          )}

          {getStatus() !== 'pending' && (
            <button
              onClick={() => setShowUnapproveModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Unapprove Driver
            </button>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}>
        <div className={`bg-gradient-to-r ${driverType === 'cab' ? 'from-purple-600 to-pink-500' : driverType === 'goods' ? 'from-green-600 to-emerald-500' : 'from-gray-600 to-gray-500'} px-6 py-8`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              {getProfilePhoto() ? (
                <img
                  src={getProfilePhoto()}
                  alt={getFullName()}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center"><svg class="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>';
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  {driverType === 'cab' ?
                    <Car className="w-12 h-12 text-white" /> :
                    driverType === 'goods' ?
                      <Truck className="w-12 h-12 text-white" /> :
                      <User className="w-12 h-12 text-white" />
                  }
                </div>
              )}
              <div className="absolute -bottom-2 -right-2">
                {getStatus() === 'approved' ? (
                  <CheckCircle className="w-6 h-6 text-green-400 bg-white rounded-full" />
                ) : getStatus() === 'pending' ? (
                  <Clock className="w-6 h-6 text-yellow-400 bg-white rounded-full" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 bg-white rounded-full" />
                )}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <h2 className="text-2xl font-bold text-white">{getFullName()}</h2>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatus() === 'approved' ? 'bg-green-100 text-green-700' :
                    getStatus() === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {getStatus() === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                    getStatus() === 'pending' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {getStatus().charAt(0).toUpperCase() + getStatus().slice(1)}
                </span>
              </div>
              <p className="text-white/80 text-sm mt-1">Member since {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <span className="text-white/80 text-sm">{getTotalRides()} rides completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats - Full number format */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-b border-gray-100 bg-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatFullNumber(getTotalEarnings())}</p>
            <p className="text-xs text-gray-500">Total Earnings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{getTotalRides()}</p>
            <p className="text-xs text-gray-500">Total Rides</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatFullNumber(getValue(driver.todayEarnings, 0))}</p>
            <p className="text-xs text-gray-500">Today's Earnings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{formatFullNumber(getValue(driver.monthlyEarnings, 0))}</p>
            <p className="text-xs text-gray-500">Monthly Earnings</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-xs text-gray-500">Full Name</p><p className="text-sm font-medium text-gray-900">{getFullName()}</p></div>
            <div><p className="text-xs text-gray-500">Phone Number</p><p className="text-sm text-gray-900">{getPhone()}</p></div>
            {hasValue(driver.email) && <div><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900">{getEmail()}</p></div>}
            {hasValue(driver.dob) && <div><p className="text-xs text-gray-500">Date of Birth</p><p className="text-sm text-gray-900">{new Date(driver.dob).toLocaleDateString()}</p></div>}
            {hasValue(driver.address) && <div><p className="text-xs text-gray-500">Address</p><p className="text-sm text-gray-900">{driver.address}</p></div>}
            {hasValue(driver.pincode) && <div><p className="text-xs text-gray-500">Pincode</p><p className="text-sm text-gray-900">{driver.pincode}</p></div>}
            {hasValue(driver.emergencyName) && <div><p className="text-xs text-gray-500">Emergency Contact</p><p className="text-sm text-gray-900">{driver.emergencyName} ({driver.emergencyPhone || 'N/A'})</p></div>}
          </div>
        </div>

        {/* ============ CAB DRIVER SPECIFIC SECTIONS ============ */}
        {driverType === 'cab' && (
          <>
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Vehicle Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-500">Vehicle Type</p><p className="text-sm font-medium text-gray-900">{driver.vehicleType || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Registration Number</p><p className="text-sm text-gray-900">{driver.regNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Brand / Model</p><p className="text-sm text-gray-900">{driver.brand || 'N/A'} {driver.model || ''}</p></div>
                <div><p className="text-xs text-gray-500">Year / Color</p><p className="text-sm text-gray-900">{driver.year || 'N/A'} / {driver.color || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">RC Number</p><p className="text-sm text-gray-900">{driver.rcNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Seat Capacity</p><p className="text-sm text-gray-900">{driver.seatCapacity || 'N/A'} seats</p></div>
                <div><p className="text-xs text-gray-500">AC Available</p><p className="text-sm text-gray-900">{driver.isAC ? 'Yes' : 'No'}</p></div>
              </div>
            </div>

            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                Insurance & PUC
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-500">Insurance Number</p><p className="text-sm text-gray-900">{driver.insuranceNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Insurance Expiry</p><p className="text-sm text-gray-900">{driver.insuranceExpiry ? new Date(driver.insuranceExpiry).toLocaleDateString() : 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">PUC Expiry</p><p className="text-sm text-gray-900">{driver.pucExpiry ? new Date(driver.pucExpiry).toLocaleDateString() : 'N/A'}</p></div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <IdCard className="w-5 h-5 text-red-600" />
                ID & License Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-500">ID Type</p><p className="text-sm text-gray-900">{driver.idType || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">ID Number</p><p className="text-sm text-gray-900">{driver.idNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Driving License No.</p><p className="text-sm text-gray-900">{driver.dlNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">License Valid From</p><p className="text-sm text-gray-900">{driver.dlValidFrom ? new Date(driver.dlValidFrom).toLocaleDateString() : 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">License Valid To</p><p className="text-sm text-gray-900">{driver.dlValidTo ? new Date(driver.dlValidTo).toLocaleDateString() : 'N/A'}</p></div>
              </div>
            </div>
          </>
        )}

        {/* ============ GOODS DRIVER SPECIFIC SECTIONS ============ */}
        {driverType === 'goods' && (
          <>
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                Vehicle Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-500">Vehicle Type</p><p className="text-sm font-medium text-gray-900">{driver.vehicleType || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Registration Number</p><p className="text-sm text-gray-900">{driver.regNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Brand / Model</p><p className="text-sm text-gray-900">{driver.brand || 'N/A'} {driver.model || ''}</p></div>
                <div><p className="text-xs text-gray-500">Year / Color</p><p className="text-sm text-gray-900">{driver.year || 'N/A'} / {driver.color || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">RC Number</p><p className="text-sm text-gray-900">{driver.rcNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Capacity</p><p className="text-sm font-semibold text-gray-900">{driver.capacity || 'N/A'} tons</p></div>
                <div><p className="text-xs text-gray-500">Vehicle Size</p><p className="text-sm text-gray-900">{driver.vehicleSize || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Permit Number</p><p className="text-sm text-gray-900">{driver.permitNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Vehicle Type ID</p><p className="text-sm text-gray-900">{driver.vehicleTypeId || 'N/A'}</p></div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                Insurance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Insurance Number</p><p className="text-sm text-gray-900">{driver.insuranceNumber || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Insurance Expiry</p><p className="text-sm text-gray-900">{driver.insuranceExpiry ? new Date(driver.insuranceExpiry).toLocaleDateString() : 'N/A'}</p></div>
              </div>
            </div>
          </>
        )}

        {/* Location */}
        {hasValue(driver.location?.lat) && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-purple-600" />
              Current Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Latitude</p><p className="text-sm font-mono text-gray-900">{driver.location.lat}</p></div>
              <div><p className="text-xs text-gray-500">Longitude</p><p className="text-sm font-mono text-gray-900">{driver.location.lng}</p></div>
            </div>
            <div className="mt-4">
              <a
                href={`https://www.google.com/maps?q=${driver.location.lat},${driver.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <MapPin className="w-4 h-4" />
                View on Google Maps
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Approve Driver</h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to approve <span className="font-semibold">{getFullName()}</span>?
              </p>
              <p className="text-xs text-gray-500 mt-1">The driver will be able to start accepting rides immediately.</p>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleApproveDriver} disabled={processing} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircle className="w-4 h-4" />}
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unapprove Confirmation Modal */}
      {showUnapproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Ban className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Unapprove Driver</h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to unapprove <span className="font-semibold">{getFullName()}</span>?
              </p>
              <p className="text-xs text-gray-500 mt-1">This will change their status to pending.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for unapproving (optional)</label>
              <textarea value={unapproveReason} onChange={(e) => setUnapproveReason(e.target.value)} placeholder="Optional: Enter reason for unapproving..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowUnapproveModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleUnapproveDriver} disabled={processing} className="flex-1 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Ban className="w-4 h-4" />}
                Confirm Unapprove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverProfile;