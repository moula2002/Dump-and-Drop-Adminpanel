import React, { useState, useEffect } from 'react';
import { Search, Eye, XCircle, CheckCircle, Clock, MapPin, User, Calendar as CalIcon, DollarSign, Download, RefreshCw } from 'lucide-react';
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

function CabRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchRides();
  }, [statusFilter]);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getRides(1, 500, {
        type: 'cab',
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

  const handleCancelRide = async () => {
    if (!cancelReason) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    try {
      await adminAPI.cancelRide(selectedRide._id, cancelReason);
      toast.success('Ride cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      fetchRides();
    } catch (error) {
      toast.error('Failed to cancel ride');
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
    doc.text("Cab Rides Report", 196, 18, { align: "right" });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 36);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    const statsData = [
      ["Total Rides", filteredRides.length],
      ["Searching", stats.searching],
      ["Available", stats.available],
      ["Accepted", stats.accepted],
      ["Ongoing", stats.ongoing],
      ["Completed", stats.completed],
      ["Cancelled", stats.cancelled],
      ["Revenue", `Rs. ${stats.totalAmount.toFixed(1)}`],
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

    const tableData = filteredRides.map((r) => [
      `#${r._id?.slice(-5) || "N/A"}`,
      getAllPassengerNames(r).join('\n'),
      getIndividualRoutesArray(r).join('\n'),
      getMainRoute(r),
      `${new Date(getRideDate(r)).toLocaleDateString()}\n${new Date(getRideDate(r)).toLocaleTimeString()}`,
      `${getDriverName(r)}`,
      `Rs. ${getFare(r).toFixed(1)}`,
      getStatusLabel(r.status),
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["ID", "Passengers", "Individual Routes", "Main Route", "Date", "Driver", "Amount", "Status"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 6.5, cellPadding: 2, valign: "middle", overflow: "linebreak" },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 25 },
        2: { cellWidth: 32 },
        3: { cellWidth: 28 },
        4: { cellWidth: 20 },
        5: { cellWidth: 22 },
        6: { cellWidth: 15, halign: "right" },
        7: { cellWidth: 15, halign: "center" }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Dump & Drop Admin Portal", 14, 287);
        const pageNumber = doc.internal.getCurrentPageInfo ? doc.internal.getCurrentPageInfo().pageNumber : data.pageNumber;
        doc.text(`Page ${pageNumber}`, 196, 287, { align: "right" });
      
          }
    });

    doc.save(`cab_rides_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const getStatusLabel = (status) => {
    const statusConfig = {
      searching: 'Searching',
      available: 'Available',
      accepted: 'Accepted',
      ongoing: 'Ongoing',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusConfig[status?.toLowerCase()] || status || 'Pending';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      searching: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Searching' },
      available: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Available' },
      accepted: { color: 'bg-cyan-100 text-cyan-700', icon: Clock, label: 'Accepted' },
      ongoing: { color: 'bg-purple-100 text-purple-700', icon: Clock, label: 'Ongoing' },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig.searching;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getAllPassengerNames = (ride) => {
    let allNames = [];
    let processedNames = new Set();

    let mainCustomerName = null;
    if (ride.customerId?.name) mainCustomerName = ride.customerId.name;
    else if (ride.customer?.name) mainCustomerName = ride.customer.name;
    else if (ride.customerName) mainCustomerName = ride.customerName;

    if (mainCustomerName && !processedNames.has(mainCustomerName)) {
      processedNames.add(mainCustomerName);
      allNames.push(mainCustomerName);
    }

    if (ride.bookings && ride.bookings.length > 0) {
      ride.bookings.forEach(booking => {
        const name = booking.customerName;
        if (name && !processedNames.has(name)) {
          processedNames.add(name);
          allNames.push(name);
        }
      });
    }

    if (ride.bookedPassengers && ride.bookedPassengers.length > 0) {
      ride.bookedPassengers.forEach(p => {
        let name = null;
        if (typeof p === 'object') {
          name = p.name;
        } else if (typeof p === 'string' && !p.match(/^[0-9a-fA-F]{24}$/)) {
          name = p;
        }
        if (name && !processedNames.has(name)) {
          processedNames.add(name);
          allNames.push(name);
        }
      });
    }

    if (allNames.length === 0) return ['No passengers'];
    return allNames;
  };

  const getIndividualRoutesArray = (ride) => {
    let routes = [];

    if (ride.bookings && ride.bookings.length > 0) {
      ride.bookings.forEach(booking => {
        if (booking.fromCity && booking.toCity && booking.fromCity !== booking.toCity) {
          const route = `${booking.fromCity} -> ${booking.toCity}`;
          if (!routes.includes(route)) {
            routes.push(route);
          }
        }
      });
    }

    if (routes.length === 0 && ride.segments && ride.segments.length > 0) {
      ride.segments.forEach(segment => {
        if (segment.fromCity && segment.toCity && segment.fromCity !== segment.toCity) {
          const route = `${segment.fromCity} -> ${segment.toCity}`;
          if (!routes.includes(route)) {
            routes.push(route);
          }
        }
      });
    }

    if (routes.length === 0) return ['-'];
    return routes;
  };

  const getMainRoute = (ride) => {
    if (ride.segments && ride.segments.length > 0) {
      const firstSegment = ride.segments[0];
      const lastSegment = ride.segments[ride.segments.length - 1];
      if (firstSegment?.fromCity && lastSegment?.toCity) {
        if (firstSegment.fromCity === lastSegment.toCity) return firstSegment.fromCity;
        return `${firstSegment.fromCity} -> ${lastSegment.toCity}`;
      }
    }

    if (ride.routeMajorCities && ride.routeMajorCities.length >= 2) {
      const first = ride.routeMajorCities[0];
      const last = ride.routeMajorCities[ride.routeMajorCities.length - 1];
      if (first === last) return first;
      return `${first} -> ${last}`;
    }

    if (ride.fromCity && ride.toCity) {
      if (ride.fromCity === ride.toCity) return ride.fromCity;
      return `${ride.fromCity} -> ${ride.toCity}`;
    }

    return 'N/A';
  };

  const getDriverName = (ride) => {
    if (ride.driverId?.name) return ride.driverId.name;
    if (ride.driver?.name) return ride.driver.name;
    if (ride.driverName) return ride.driverName;
    return 'Not assigned';
  };

  const getDriverPhone = (ride) => {
    if (ride.driverId?.phone) return ride.driverId.phone;
    if (ride.driver?.phone) return ride.driver.phone;
    if (ride.driverPhone) return ride.driverPhone;
    return '';
  };

  const getFare = (ride) => {
    if (ride.pricePerSeat) return ride.pricePerSeat;
    if (ride.bookings && ride.bookings.length > 0 && ride.bookings[0].pricing?.customerAmount) {
      return ride.bookings[0].pricing.customerAmount;
    }
    return ride.price || ride.fare || ride.amount || 0;
  };

  const getRideDate = (ride) => {
    return ride.departureDate || ride.createdAt || new Date();
  };

  const filteredRides = rides.filter(ride => {
    const searchLower = searchTerm.toLowerCase();
    const passengerNames = getAllPassengerNames(ride).join(' ').toLowerCase();
    return (
      passengerNames.includes(searchLower) ||
      getMainRoute(ride).toLowerCase().includes(searchLower) ||
      getDriverName(ride).toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    searching: rides.filter(r => r.status?.toLowerCase() === 'searching').length,
    available: rides.filter(r => r.status?.toLowerCase() === 'available').length,
    accepted: rides.filter(r => r.status?.toLowerCase() === 'accepted').length,
    ongoing: rides.filter(r => r.status?.toLowerCase() === 'ongoing').length,
    completed: rides.filter(r => r.status?.toLowerCase() === 'completed').length,
    cancelled: rides.filter(r => r.status?.toLowerCase() === 'cancelled').length,
    totalAmount: rides.reduce((sum, r) => sum + getFare(r), 0)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cab Rides</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all cab ride bookings</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by passenger, route or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="searching">Searching</option>
            <option value="available">Available</option>
            <option value="accepted">Accepted</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchRides}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards - 6 cards (Draft removed) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-yellow-600">{stats.searching}</p>
          <p className="text-xs text-gray-500">Searching</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-blue-600">{stats.available}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-cyan-600">{stats.accepted}</p>
          <p className="text-xs text-gray-500">Accepted</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-purple-600">{stats.ongoing}</p>
          <p className="text-xs text-gray-500">Ongoing</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </div>
      </div>

      {/* Total Amount Card */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-3xl font-bold">₹{stats.totalAmount.toFixed(1)}</p>
          </div>
          <DollarSign className="w-12 h-12 opacity-50" />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ride ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passengers</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Individual Routes</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Main Route</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRides.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-10 text-center text-gray-500">
                    No rides found
                  </td>
                </tr>
              ) : (
                filteredRides.map((ride) => {
                  const passengers = getAllPassengerNames(ride);
                  const individualRoutes = getIndividualRoutesArray(ride);
                  return (
                    <tr key={ride._id || ride.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 align-top">
                        #{ride._id?.slice(-6) || ride.id?.slice(-6) || 'N/A'}
                      </td>
                      <td className="px-5 py-3 align-top">
                        {passengers.map((name, idx) => (
                          <p key={idx} className="text-sm text-gray-900 leading-relaxed">
                            {name}
                          </p>
                        ))}
                      </td>
                      <td className="px-5 py-3 align-top">
                        {individualRoutes.map((route, idx) => (
                          <p key={idx} className="text-xs text-gray-600 leading-relaxed">
                            {route}
                          </p>
                        ))}
                      </td>
                      <td className="px-5 py-3 align-top">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span className="text-sm font-semibold text-gray-900">{getMainRoute(ride)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 align-top">
                        {new Date(getRideDate(ride)).toLocaleDateString()} <br />
                        <span className="text-xs">{new Date(getRideDate(ride)).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-5 py-3 align-top">
                        {getDriverName(ride) !== 'Not assigned' ? (
                          <div>
                            <p className="text-sm text-gray-900">{getDriverName(ride)}</p>
                            <p className="text-xs text-gray-500">{getDriverPhone(ride)}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 align-top">
                        ₹{getFare(ride).toFixed(1)}
                      </td>
                      <td className="px-5 py-3 align-top">
                        {getStatusBadge(ride.status)}
                      </td>
                      <td className="px-5 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRide(ride);
                              setShowViewModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {ride.status !== 'cancelled' && ride.status !== 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedRide(ride);
                                setShowCancelModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Cancel Ride"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedRide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Ride Details</h3>
              <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Ride Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4 text-white">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-white/80">Ride ID</p>
                    <p className="text-base font-bold">#{selectedRide._id?.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/80">Status</p>
                    {getStatusBadge(selectedRide.status)}
                  </div>
                  <div>
                    <p className="text-xs text-white/80">Date & Time</p>
                    <p className="text-xs">{new Date(getRideDate(selectedRide)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/80">Amount</p>
                    <p className="text-base font-bold">₹{getFare(selectedRide).toFixed(1)}</p>
                  </div>
                </div>
              </div>

              {/* Passengers */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Passengers
                </h4>
                {getAllPassengerNames(selectedRide).map((name, idx) => (
                  <p key={idx} className="text-sm text-gray-900">{name}</p>
                ))}
              </div>

              {/* Route Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Route Details
                </h4>
                <p className="text-sm font-medium text-gray-900">Main Route: {getMainRoute(selectedRide)}</p>
                {getIndividualRoutesArray(selectedRide).length > 0 && getIndividualRoutesArray(selectedRide)[0] !== '-' && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Individual Routes:</p>
                    {getIndividualRoutesArray(selectedRide).map((route, idx) => (
                      <p key={idx} className="text-xs text-gray-600">{route}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Driver Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Driver Details
                </h4>
                <div className="space-y-1">
                  <p className="text-sm"><span className="text-gray-500">Name:</span> {getDriverName(selectedRide)}</p>
                  <p className="text-sm"><span className="text-gray-500">Phone:</span> {getDriverPhone(selectedRide) || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedRide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cancel Ride</h3>
            <p className="text-sm text-gray-600 mb-3">Ride ID: #{selectedRide._id?.slice(-6)}</p>
            <p className="text-sm text-gray-600 mb-3">Passengers: {getAllPassengerNames(selectedRide).join(', ')}</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows="3"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelRide}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CabRides;