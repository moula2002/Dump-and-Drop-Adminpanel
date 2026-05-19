import React, { useState, useEffect } from 'react';
import { Search, Eye, Car, Package, MapPin, User, Calendar as CalIcon, DollarSign, Filter, X, Calendar, Download, RefreshCw } from 'lucide-react';
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

function AllRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchRides();
  }, [typeFilter, statusFilter, dateFilter, selectedDate]);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getRides(1, 500, { 
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });

      let ridesData = [];
      if (response.data?.rides) {
        ridesData = response.data.rides;
      } else if (response.data?.data?.rides) {
        ridesData = response.data.data.rides;
      } else if (Array.isArray(response.data)) {
        ridesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        ridesData = response.data.data;
      }

      setRides(ridesData);
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to load rides');
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
    doc.text("All Rides Report", 196, 18, { align: "right" });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 36);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Statistics Summary", 14, 52);
    
    const statsData = [
      ["Total Rides", stats.total],
      ["Total Revenue", `Rs. ${stats.totalAmount.toLocaleString()}`],
      ["Draft", stats.draft],
      ["Searching", stats.searching],
      ["Available", stats.available],
      ["Accepted", stats.accepted],
      ["Ongoing", stats.ongoing],
      ["Completed", stats.completed],
      ["Cancelled", stats.cancelled],
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

    const tableData = filteredRides.map((ride, i) => [
      i + 1,
      ride.role === 'cab_ride' ? 'Cab' : 'Goods',
      ride._id?.slice(-6) || 'N/A',
      getCustomerName(ride),
      getCustomerPhone(ride),
      `${getFromLocation(ride)} -> ${getToLocation(ride)}`,
      new Date(getRideDate(ride)).toLocaleDateString(),
      `Rs. ${getFare(ride).toLocaleString()}`,
      ride.status || 'N/A',
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["No", "Type", "Ride ID", "Customer", "Phone", "Route", "Date", "Amount", "Status"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 7.5, cellPadding: 2.5, valign: "middle" },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" },
            columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 25 },
        4: { cellWidth: 22 },
        5: { cellWidth: 35 },
        6: { cellWidth: 18, halign: "center" },
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

    doc.save(`all_rides_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const filterByDate = (ride) => {
    if (dateFilter === 'all') return true;

    const rideDate = new Date(ride.date || ride.createdAt || ride.departureDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    switch (dateFilter) {
      case 'today':
        return rideDate.toDateString() === today.toDateString();
      case 'week':
        return rideDate >= weekStart;
      case 'month':
        return rideDate >= monthStart;
      case 'year':
        return rideDate >= yearStart;
      case 'selected':
        if (selectedDate) {
          const selected = new Date(selectedDate);
          return rideDate.toDateString() === selected.toDateString();
        }
        return true;
      default:
        return true;
    }
  };

  const getTypeIcon = (ride) => {
    const type = ride.type || ride.role;
    if (type === 'cab' || type === 'cab_ride') {
      return <Car className="w-4 h-4 text-blue-600" />;
    }
    return <Package className="w-4 h-4 text-green-600" />;
  };

  const getCustomerName = (ride) => {
    return ride.customer?.name || ride.customerName || ride.customerId?.name || 'N/A';
  };

  const getCustomerPhone = (ride) => {
    return ride.customer?.phone || ride.customerPhone || ride.customerId?.phone || 'N/A';
  };

  const getFromLocation = (ride) => {
    return ride.from || ride.fromCity || ride.pickupLocation?.address || 'N/A';
  };

  const getToLocation = (ride) => {
    return ride.to || ride.toCity || ride.dropLocation?.address || 'N/A';
  };

  const getRideDate = (ride) => {
    return ride.date || ride.createdAt || ride.departureDate || new Date();
  };

  const getFare = (ride) => {
    return ride.fare || ride.price || ride.amount || 0;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-700',
      searching: 'bg-yellow-100 text-yellow-700',
      available: 'bg-blue-100 text-blue-700',
      accepted: 'bg-cyan-100 text-cyan-700',
      ongoing: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const color = statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
    return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${color}`}>{status || 'N/A'}</span>;
  };

  const filteredRides = rides.filter(ride => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      getCustomerName(ride).toLowerCase().includes(searchLower) ||
      getCustomerPhone(ride).toLowerCase().includes(searchLower) ||
      getFromLocation(ride).toLowerCase().includes(searchLower) ||
      getToLocation(ride).toLowerCase().includes(searchLower);

    const matchesDate = filterByDate(ride);

    return matchesSearch && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSelectedDate('');
    setShowCalendar(false);
  };

  const stats = {
    total: filteredRides.length,
    totalAmount: filteredRides.reduce((sum, ride) => sum + getFare(ride), 0),
    draft: filteredRides.filter(r => r.status === 'draft').length,
    searching: filteredRides.filter(r => r.status === 'searching').length,
    available: filteredRides.filter(r => r.status === 'available').length,
    accepted: filteredRides.filter(r => r.status === 'accepted').length,
    ongoing: filteredRides.filter(r => r.status === 'ongoing').length,
    completed: filteredRides.filter(r => r.status === 'completed').length,
    cancelled: filteredRides.filter(r => r.status === 'cancelled').length,
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Rides</h1>
          <p className="text-sm text-gray-500 mt-1">View all rides across the platform</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchRides}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Status Dashboard Cards - All 7 Status Types */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-gray-500">
          <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
          <p className="text-xs text-gray-500">Draft</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{stats.searching}</p>
          <p className="text-xs text-gray-500">Searching</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-cyan-500">
          <p className="text-2xl font-bold text-cyan-600">{stats.accepted}</p>
          <p className="text-xs text-gray-500">Accepted</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-purple-500">
          <p className="text-2xl font-bold text-purple-600">{stats.ongoing}</p>
          <p className="text-xs text-gray-500">Ongoing</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
      </div>

      {/* Revenue and Cancelled Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-xl p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Total Revenue</p>
              <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="w-10 h-10 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-xl p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">Cancelled Rides</p>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
            <X className="w-10 h-10 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, phone or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="cab">Cab Rides</option>
            <option value="goods">Goods Delivery</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="searching">Searching</option>
            <option value="available">Available</option>
            <option value="accepted">Accepted</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value === 'selected') {
                  setShowCalendar(true);
                } else {
                  setShowCalendar(false);
                  setSelectedDate('');
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="selected">Select Date</option>
            </select>
          </div>

          {showCalendar && (
            <div className="relative">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value) {
                      setDateFilter('selected');
                    }
                  }}
                  className="bg-transparent outline-none text-sm"
                  placeholder="Select date"
                />
                {selectedDate && (
                  <button
                    onClick={() => {
                      setSelectedDate('');
                      setDateFilter('all');
                      setShowCalendar(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {selectedDate && (
                <div className="mt-2 text-xs text-blue-600">
                  Showing rides for: {formatDate(selectedDate)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rides Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ride ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRides.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-gray-500">
                    No rides found
                  </td>
                </tr>
              ) : (
                filteredRides.map((ride) => (
                  <tr key={ride._id || ride.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">{getTypeIcon(ride)}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      #{ride._id?.slice(-6) || ride.id?.slice(-6) || 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{getCustomerName(ride)}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{getCustomerPhone(ride)}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {getFromLocation(ride)} → {getToLocation(ride)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(getRideDate(ride)).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">₹{getFare(ride)}</td>
                    <td className="px-5 py-3">{getStatusBadge(ride.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      {filteredRides.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredRides.length}</span> rides
            </p>
            <p className="text-sm font-semibold text-gray-900">
              Total: ₹{stats.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllRides;