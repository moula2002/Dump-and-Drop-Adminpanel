import React, { useState, useEffect } from 'react';
import { Car, Truck, Eye, X, Download, RefreshCw, Search, Calendar, Clock, User, Phone, Hash, DollarSign, Calendar as CalIcon, TrendingUp, MapPin } from 'lucide-react';
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

function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tripTypeFilter, setTripTypeFilter] = useState('all');

  useEffect(() => {
    fetchRentals();
  }, []);

  useEffect(() => {
    filterRentals();
  }, [searchTerm, statusFilter, tripTypeFilter, rentals]);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getRentalsList();
      if (response.data.success) {
        setRentals(response.data.rentals || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const filterRentals = () => {
    let filtered = [...rentals];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rental => rental.status === statusFilter);
    }

    if (tripTypeFilter !== 'all') {
      const isRoundTrip = tripTypeFilter === 'roundtrip';
      filtered = filtered.filter(rental => (String(rental.isRoundTrip) === 'true') === isRoundTrip);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rental =>
        (rental.vehicleNumber || '').toLowerCase().includes(searchLower) ||
        (rental.vehicleType || '').toLowerCase().includes(searchLower) ||
        (rental.customerName || '').toLowerCase().includes(searchLower) ||
        (rental.customerNumber || '').toLowerCase().includes(searchLower) ||
        (rental.driverName || '').toLowerCase().includes(searchLower) ||
        (rental.driverNumber || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredRentals(filtered);
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
    doc.text("Rentals Report", 196, 18, { align: "right" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 36);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    const statsData = [
      ["Total", stats.total],
      ["Pending", stats.pending],
      ["Accepted", stats.accepted],
      ["Active", stats.active],
      ["Completed", stats.completed],
      ["Cancelled", stats.cancelled],
      ["Rejected", stats.rejected],
      ["Revenue", `${stats.totalRevenue.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 56,
      body: statsData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      columnStyles: {
        0: { fontStyle: "bold", textColor: [30, 30, 30], cellWidth: 80 },
        1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229], cellWidth: 80 }
      }
    });

    const tableData = filteredRentals.map((r, i) => [
      i + 1,
      r.vehicleNumber || "N/A",
      r.vehicleType === "cab" ? "Cab" : "Goods",
      String(r.isRoundTrip) === 'true' ? "Round Trip" : "One Way",
      `${r.customerName || "N/A"}\n${r.customerNumber || ""}`,
      `${r.driverName || "Not assigned"}\n${r.driverNumber || ""}`,
      `${formatDate(r.startDate)}\n-> ${formatDate(r.endDate)}`,
      r.counterOfferPrice ? `₹${r.counterOfferPrice}` : '-',
      (r.status || "pending").toUpperCase(),
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["No", "Vehicle", "Type", "Trip", "Customer", "Driver", "Period", "Counter Offer", "Status"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 7.5, cellPadding: 2.5, valign: "middle", overflow: "linebreak" },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 16 },
        2: { cellWidth: 12, halign: "center" },
        3: { cellWidth: 16 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 32 },
        7: { cellWidth: 16, halign: "right" },
        8: { cellWidth: 16, halign: "center" },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Dump & Drop Admin Portal", 14, 287);
        const pageNumber = doc.internal.getCurrentPageInfo ? doc.internal.getCurrentPageInfo().pageNumber : data.pageNumber;
        doc.text(`Page ${pageNumber}`, 196, 287, { align: "right" });

      }
    });

    doc.save(`rentals_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.pending}`}>
        {status || 'Pending'}
      </span>
    );
  };

  const stats = {
    total: rentals.length,
    pending: rentals.filter(r => r.status === 'pending').length,
    accepted: rentals.filter(r => r.status === 'accepted').length,
    active: rentals.filter(r => r.status === 'active').length,
    completed: rentals.filter(r => r.status === 'completed').length,
    cancelled: rentals.filter(r => r.status === 'cancelled').length,
    rejected: rentals.filter(r => r.status === 'rejected').length,
    totalRevenue: rentals.reduce((sum, r) => sum + (r.cost || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="text-sm text-gray-500">Manage all rental bookings</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchRentals} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportToPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Status Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.accepted}</p>
          <p className="text-xs text-gray-500">Accepted</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-purple-500">
          <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-red-500">
          <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-orange-500">
          <p className="text-2xl font-bold text-orange-600">{stats.rejected}</p>
          <p className="text-xs text-gray-500">Rejected</p>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-xl p-4 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Total Rentals</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle, customer, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={tripTypeFilter}
            onChange={(e) => setTripTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Trip Types</option>
            <option value="roundtrip">Round Trip</option>
            <option value="oneway">One Way</option>
          </select>
          {(searchTerm || statusFilter !== 'all' || tripTypeFilter !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTripTypeFilter('all'); }} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition flex items-center gap-1">
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Number</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip Details</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From → To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counter Offer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRentals.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-8 text-center text-gray-500">No rentals found</td>
              </tr>
            ) : (
              filteredRentals.map((rental, index) => (
                <tr key={rental._id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{rental.vehicleNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {rental.vehicleType === 'cab' ? <Car className="w-4 h-4 text-blue-600" /> : <Truck className="w-4 h-4 text-green-600" />}
                      <span className="text-sm">{rental.vehicleType === 'cab' ? 'Cab' : 'Goods'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${String(rental.isRoundTrip) === 'true' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                        {String(rental.isRoundTrip) === 'true' ? 'Round Trip' : 'One Way'}
                      </span>
                      {(rental.leavingFrom || rental.goingTo) && (
                        <div className="mt-1 text-[11px] text-gray-500 max-w-[200px] truncate" title={`${rental.leavingFrom || 'N/A'} → ${rental.goingTo || 'N/A'}${String(rental.isRoundTrip) === 'true' ? ` → ${rental.leavingFrom || 'N/A'}` : ''}`}>
                          {rental.leavingFrom || 'N/A'} → {rental.goingTo || 'N/A'}
                          {String(rental.isRoundTrip) === 'true' && ` → ${rental.leavingFrom || 'N/A'}`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rental.customerName}</p>
                      <p className="text-xs text-gray-500">{rental.customerNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{rental.driverName}</p>
                      <p className="text-xs text-gray-500">{rental.driverNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatDate(rental.startDate)} → {formatDate(rental.endDate)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{rental.duration}</p>
                  </td>
                  <td className="px-4 py-3">
                    {rental.counterOfferPrice ? (
                      <span className="text-sm font-semibold text-orange-600">{formatCurrency(rental.counterOfferPrice)}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(rental.status)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelectedRental(rental); setShowModal(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && selectedRental && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl p-5 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Rental Details</h3>
                  <p className="text-blue-100 text-sm mt-1">Complete rental information</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Vehicle Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Vehicle Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Vehicle Number</p>
                    <p className="text-base font-semibold text-gray-900">{selectedRental.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vehicle Type</p>
                    <p className="text-base font-semibold">
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedRental.vehicleType === 'cab' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {selectedRental.vehicleType === 'cab' ? 'Cab' : 'Goods'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Trip Details Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Trip Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Trip Type</p>
                    <p className="text-base font-semibold mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${String(selectedRental.isRoundTrip) === 'true' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                        {String(selectedRental.isRoundTrip) === 'true' ? 'Round Trip' : 'One Way'}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-gray-500">Route</p>
                    <div className="text-sm font-medium text-gray-900 mt-1 flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                        <span className="leading-snug">{selectedRental.leavingFrom || 'Not specified'}</span>
                      </div>
                      <div className="w-0.5 h-3 bg-gray-300 ml-1"></div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                        <span className="leading-snug">{selectedRental.goingTo || 'Not specified'}</span>
                      </div>
                      {String(selectedRental.isRoundTrip) === 'true' && (
                        <>
                          <div className="w-0.5 h-3 bg-gray-300 ml-1"></div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                            <span className="leading-snug">{selectedRental.leavingFrom || 'Not specified'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                  <User className="w-5 h-5 text-green-600" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Customer Name</p>
                    <p className="text-base font-semibold text-gray-900">{selectedRental.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedRental.customerNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Driver Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Driver Name</p>
                    <p className="text-base font-semibold text-gray-900">{selectedRental.driverName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedRental.driverNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rental Period Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                  <CalIcon className="w-5 h-5 text-orange-600" />
                  Rental Period
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(selectedRental.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(selectedRental.endDate)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-base font-semibold text-blue-600">{selectedRental.duration}</p>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Payment Details
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Counter Offer</p>
                    {selectedRental.counterOfferPrice ? (
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedRental.counterOfferPrice)}</p>
                    ) : (
                      <p className="text-gray-400">Not offered</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <p className="text-xs text-gray-500">Status</p>
                  {getStatusBadge(selectedRental.status)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 rounded-b-2xl p-4 border-t flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rentals;