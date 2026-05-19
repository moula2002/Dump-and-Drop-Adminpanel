import React, { useState, useEffect } from 'react';
import {
    XCircle,
    Search,
    Eye,
    Download,
    RefreshCw,
    X,
    User,
    MapPin,
    DollarSign,
    Calendar,
    Clock,
    Car,
    Truck,
    AlertCircle
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

function CancelledRides() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedReason, setSelectedReason] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedRide, setSelectedRide] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        totalAmount: 0,
        rentalAmount: 0,
        byDriver: 0,
        byCustomer: 0,
        byAdmin: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCancelledRides();
    }, [selectedType, selectedReason, currentPage]);

    const fetchCancelledRides = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 20,
                type: selectedType,
                reason: selectedReason,
                startDate: dateRange.start,
                endDate: dateRange.end,
                search: searchTerm
            };

            const response = await adminAPI.getCancelledRides(params);

            if (response.data.success) {
                console.log('Cancelled rides response:', response.data);
                setRides(response.data.rides || []);
                setStats(response.data.stats || {
                    total: 0,
                    totalAmount: 0,
                    rentalAmount: 0,
                    byDriver: 0,
                    byCustomer: 0,
                    byAdmin: 0
                });
                setTotalPages(response.data.pages || 1);
            } else {
                setMockData();
            }
        } catch (error) {
            console.error('Error fetching cancelled rides:', error);
            toast.error('Failed to load cancelled rides');
            setMockData();
        } finally {
            setLoading(false);
        }
    };

    const setMockData = () => {
        setRides([
            {
                _id: 'RIDE001',
                rideType: 'cab',
                customer: { name: 'John Doe', phone: '9876543210' },
                driver: { name: 'Rajesh Kumar', phone: '9876543211' },
                fromCity: 'Airport',
                toCity: 'City Center',
                amount: 350,
                rentalAmount: 0,
                isRental: false,
                cancelledBy: 'customer',
                cancelReason: 'Changed plans',
                cancelledAt: new Date(),
                createdAt: new Date(),
                passengerDetails: [{ name: 'John Doe', phone: '9876543210' }]
            },
            {
                _id: 'RIDE002',
                rideType: 'goods',
                customer: { name: 'Jane Smith', phone: '9876543212' },
                driver: { name: 'Suresh Kumar', phone: '9876543213' },
                fromCity: 'Warehouse A',
                toCity: 'Mall B',
                amount: 1200,
                rentalAmount: 0,
                isRental: false,
                cancelledBy: 'driver',
                cancelReason: 'Vehicle issue',
                cancelledAt: new Date(),
                createdAt: new Date(),
                passengerDetails: []
            },
            {
                _id: 'RIDE003',
                rideType: 'cab',
                customer: { name: 'Amit Patel', phone: '9876543214' },
                driver: { name: 'Rahul Mehta', phone: '9876543215' },
                fromCity: 'Ahmedabad',
                toCity: 'Vadodara',
                amount: 0,
                rentalAmount: 2500,
                isRental: true,
                cancelledBy: 'admin',
                cancelReason: 'Admin cancelled',
                cancelledAt: new Date(),
                createdAt: new Date(),
                passengerDetails: [{ name: 'Amit Patel', phone: '9876543214' }]
            }
        ]);
        setStats({
            total: 3,
            totalAmount: 1550,
            rentalAmount: 2500,
            byDriver: 1,
            byCustomer: 1,
            byAdmin: 1
        });
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
    doc.text("Cancelled Rides Report", 196, 18, { align: "right" });
    
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
            ["Total Cancelled Rides", stats.total],
            ["Total Lost Revenue", formatCurrency(stats.totalAmount)],
            ["Rental Revenue Lost", formatCurrency(stats.rentalAmount)],
            ["Cancelled by Customer", stats.byCustomer],
            ["Cancelled by Driver", stats.byDriver],
            ["Cancelled by Admin", stats.byAdmin]
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

        const tableData = rides.map((ride, i) => {
            let cancelledByLabel = 'Unknown';
            if (ride.cancelledBy === 'customer') cancelledByLabel = 'Customer';
            else if (ride.cancelledBy === 'driver') cancelledByLabel = 'Driver';
            else if (ride.cancelledBy === 'admin') cancelledByLabel = 'Admin';

            return [
                i + 1,
                ride._id?.slice(-8) || 'N/A',
                ride.rideType === 'cab' ? 'Cab' : 'Goods',
                getCustomerName(ride),
                getDriverName(ride),
                `${ride.fromCity || 'N/A'} → ${ride.toCity || 'N/A'}`,
                formatCurrency(ride.amount || 0),
                ride.isRental ? formatCurrency(ride.rentalAmount) : '-',
                cancelledByLabel,
                new Date(ride.cancelledAt || ride.createdAt).toLocaleDateString()
            ];
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [["No", "ID", "Type", "Customer", "Driver", "Route", "Amount", "Rental Amount", "Cancelled By", "Date"]],
            body: tableData,
            theme: "striped",
            styles: { fontSize: 7.5, cellPadding: 2.5, valign: "middle" },
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" },
                        columnStyles: {
                0: { cellWidth: 7, halign: "center" },
                1: { cellWidth: 14, halign: "center" },
                2: { cellWidth: 10, halign: "center" },
                3: { cellWidth: 18 },
                4: { cellWidth: 18 },
                5: { cellWidth: 35 },
                6: { cellWidth: 16, halign: "right" },
                7: { cellWidth: 20, halign: "right" },
                8: { cellWidth: 18, halign: "center" },
                9: { cellWidth: 16, halign: "center" }
            },
            didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Dump & Drop Admin Portal", 14, 287);
        const pageNumber = doc.internal.getCurrentPageInfo ? doc.internal.getCurrentPageInfo().pageNumber : data.pageNumber;
        doc.text(`Page ${pageNumber}`, 196, 287, { align: "right" });
            }
        });

        doc.save(`cancelled_rides_report_${new Date().toISOString().split("T")[0]}.pdf`);
        toast.success("PDF downloaded successfully");
    };

    const getCustomerName = (ride) => {
        if (ride.rideType === 'cab') {
            if (ride.passengerDetails && ride.passengerDetails.length > 0) {
                return ride.passengerDetails[0].name || ride.customer?.name || 'N/A';
            }
            return ride.customer?.name || 'N/A';
        }
        return ride.customer?.name || 'N/A';
    };

    const getCustomerPhone = (ride) => {
        if (ride.rideType === 'cab') {
            if (ride.passengerDetails && ride.passengerDetails.length > 0) {
                return ride.passengerDetails[0].phone || ride.customer?.phone || 'N/A';
            }
            return ride.customer?.phone || 'N/A';
        }
        return ride.customer?.phone || 'N/A';
    };

    const getDriverName = (ride) => {
        return ride.driver?.name || 'N/A';
    };

    const getDriverPhone = (ride) => {
        return ride.driver?.phone || 'N/A';
    };

    const getCancelledByBadge = (cancelledBy) => {
        const by = String(cancelledBy || '').toLowerCase();
        
        if (by === 'customer') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                    By Customer
                </span>
            );
        } else if (by === 'driver') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                    By Driver
                </span>
            );
        } else if (by === 'admin') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    By Admin
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    Unknown
                </span>
            );
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value.length === 0 || e.target.value.length > 2) {
            fetchCancelledRides();
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedType('all');
        setSelectedReason('all');
        setDateRange({ start: '', end: '' });
        setCurrentPage(1);
        fetchCancelledRides();
    };

    if (loading && rides.length === 0) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Cancelled Rides</h1>
                    <p className="text-sm text-gray-500 mt-1">View and analyse all cancelled rides</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                    <button
                        onClick={fetchCancelledRides}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <p className="text-xs text-gray-500">Total Cancelled</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                    </div>
                    <p className="text-xs text-gray-500">Lost Revenue</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.rentalAmount)}</p>
                    </div>
                    <p className="text-xs text-gray-500">Rental Revenue Lost</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-yellow-600" />
                        <p className="text-2xl font-bold text-gray-900">{stats.byCustomer}</p>
                    </div>
                    <p className="text-xs text-gray-500">Cancelled by Customer</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Car className="w-5 h-5 text-orange-600" />
                        <p className="text-2xl font-bold text-gray-900">{stats.byDriver}</p>
                    </div>
                    <p className="text-xs text-gray-500">Cancelled by Driver</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-2xl font-bold text-gray-900">{stats.byAdmin}</p>
                    </div>
                    <p className="text-xs text-gray-500">Cancelled by Admin</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by ride ID, customer, driver..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="cab">Cab Rides</option>
                        <option value="goods">Goods Delivery</option>
                    </select>

                    <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Reasons</option>
                        <option value="customer">By Customer</option>
                        <option value="driver">By Driver</option>
                        <option value="admin">By Admin</option>
                    </select>

                    <input
                        type="date"
                        placeholder="Start Date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                        type="date"
                        placeholder="End Date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {(searchTerm || selectedType !== 'all' || selectedReason !== 'all' || dateRange.start || dateRange.end) && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Cancelled Rides Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ride ID</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rental Amount</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cancelled By</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rides.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-5 py-10 text-center text-gray-500">
                                        No cancelled rides found
                                    </td>
                                </tr>
                            ) : (
                                rides.map((ride) => {
                                    return (
                                        <tr key={ride._id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3">
                                                <p className="text-sm font-medium text-gray-900">#{ride._id?.slice(-8)}</p>
                                                {ride.isRental && (
                                                    <span className="text-[10px] bg-teal-100 text-teal-700 px-1 rounded ml-1">Rental</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1">
                                                    {ride.rideType === 'cab' ?
                                                        <Car className="w-4 h-4 text-blue-600" /> :
                                                        <Truck className="w-4 h-4 text-green-600" />
                                                    }
                                                    <span className="text-sm text-gray-600">
                                                        {ride.rideType === 'cab' ? 'Cab' : 'Goods'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{getCustomerName(ride)}</p>
                                                    <p className="text-xs text-gray-500">{getCustomerPhone(ride)}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div>
                                                    <p className="text-sm text-gray-900">{getDriverName(ride)}</p>
                                                    <p className="text-xs text-gray-500">{getDriverPhone(ride)}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                    <span className="text-sm text-gray-600">{ride.fromCity || 'N/A'}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="text-sm text-gray-600">{ride.toCity || 'N/A'}</span>
                                                </div>
                                            </td>
                                            {/* Amount Column - Shows ride amount */}
                                            <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                                                {formatCurrency(ride.amount || 0)}
                                            </td>
                                            {/* Rental Amount Column - Shows rental amount for rentals */}
                                            <td className="px-5 py-3 text-sm font-semibold text-teal-600">
                                                {ride.isRental ? formatCurrency(ride.rentalAmount) : '-'}
                                            </td>
                                            <td className="px-5 py-3">{getCancelledByBadge(ride.cancelledBy)}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{formatDate(ride.cancelledAt || ride.createdAt)}</td>
                                            <td className="px-5 py-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRide(ride);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Cancelled Ride Details Modal */}
            {showModal && selectedRide && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Cancelled Ride Details</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span className="font-semibold text-red-700">Ride Cancelled</span>
                                </div>
                                <p className="text-sm text-red-600">
                                    This ride was cancelled on {formatDate(selectedRide.cancelledAt || selectedRide.createdAt)}
                                </p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    Cancellation Details
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cancelled By</span>
                                        {getCancelledByBadge(selectedRide.cancelledBy)}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cancellation Time</span>
                                        <span className="font-medium">{formatDate(selectedRide.cancelledAt || selectedRide.createdAt)}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <p className="text-gray-600 mb-1">Reason</p>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                                            {selectedRide.cancelReason || 'No reason provided'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                    Ride Details
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-sm"><span className="text-gray-500">From:</span> {selectedRide.fromCity || 'N/A'}</p>
                                    <p className="text-sm"><span className="text-gray-500">To:</span> {selectedRide.toCity || 'N/A'}</p>
                                    <p className="text-sm"><span className="text-gray-500">Amount:</span> {formatCurrency(selectedRide.amount)}</p>
                                    {selectedRide.isRental && selectedRide.rentalAmount > 0 && (
                                        <p className="text-sm"><span className="text-gray-500">Rental Amount:</span> {formatCurrency(selectedRide.rentalAmount)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Customer</h4>
                                    <p className="text-sm">{getCustomerName(selectedRide)}</p>
                                    <p className="text-xs text-gray-500">{getCustomerPhone(selectedRide)}</p>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Driver</h4>
                                    <p className="text-sm">{getDriverName(selectedRide)}</p>
                                    <p className="text-xs text-gray-500">{getDriverPhone(selectedRide)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CancelledRides;