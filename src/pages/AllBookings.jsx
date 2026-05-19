import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Search,
    Eye,
    Download,
    RefreshCw,
    X,
    User,
    MapPin,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Car,
    AlertTriangle
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

function AllBookings() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelBookingId, setCancelBookingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        searching: 0,
        available: 0,
        accepted: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        totalAmount: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchBookings();
    }, [selectedType, selectedStatus, currentPage]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 20,
                type: selectedType,
                status: selectedStatus,
                startDate: dateRange.start,
                endDate: dateRange.end,
                search: searchTerm
            };

            const response = await adminAPI.getBookings(params);

            if (response.data.success) {
                setBookings(response.data.bookings || []);
                setStats({
                    total: response.data.stats?.total || 0,
                    searching: response.data.stats?.searching || 0,
                    available: response.data.stats?.available || 0,
                    accepted: response.data.stats?.accepted || 0,
                    ongoing: response.data.stats?.ongoing || 0,
                    completed: response.data.stats?.completed || 0,
                    cancelled: response.data.stats?.cancelled || 0,
                    totalAmount: response.data.stats?.totalAmount || 0
                });
                setTotalPages(response.data.pages || 1);
                setFilteredBookings(response.data.bookings || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
            setMockData();
        } finally {
            setLoading(false);
        }
    };

    const setMockData = () => {
        const mockBookings = [
            {
                _id: 'BOOK001',
                rideType: 'cab',
                customer: { name: 'Rajesh Kumar', phone: '9876543210' },
                driver: { name: 'Suresh Singh', phone: '9876543211' },
                fromCity: 'Delhi',
                toCity: 'Gurgaon',
                amount: 350,
                rentalAmount: 0,
                status: 'completed',
                createdAt: new Date(),
                passengerDetails: [{ name: 'Rajesh Kumar', phone: '9876543210', route: 'Delhi → Gurgaon' }],
                mainRoute: 'Delhi → Gurgaon',
                isRental: false,
                startDate: null,
                endDate: null
            },
            {
                _id: 'BOOK002',
                rideType: 'goods',
                customer: { name: 'Priya Sharma', phone: '9876543212' },
                driver: { name: 'Amit Verma', phone: '9876543213' },
                fromCity: 'Mumbai',
                toCity: 'Pune',
                amount: 1200,
                rentalAmount: 0,
                status: 'ongoing',
                createdAt: new Date(),
                passengerDetails: [],
                mainRoute: 'Mumbai → Pune',
                isRental: false,
                startDate: null,
                endDate: null
            },
            {
                _id: 'BOOK003',
                rideType: 'cab',
                customer: { name: 'Amit Patel', phone: '9876543214' },
                driver: { name: 'Rahul Mehta', phone: '9876543215' },
                fromCity: 'Ahmedabad',
                toCity: 'Vadodara',
                amount: 0,
                rentalAmount: 2500,
                status: 'active',
                createdAt: new Date(),
                passengerDetails: [{ name: 'Amit Patel', phone: '9876543214', route: 'Ahmedabad → Vadodara' }],
                mainRoute: 'Ahmedabad → Vadodara',
                isRental: true,
                startDate: '2024-04-20',
                endDate: '2024-04-25'
            }
        ];
        setBookings(mockBookings);
        setFilteredBookings(mockBookings);
        setStats({
            total: 45,
            searching: 5,
            available: 8,
            accepted: 12,
            ongoing: 6,
            completed: 10,
            cancelled: 4,
            totalAmount: 18500
        });
    };

    const handleCancelBooking = async () => {
        if (!cancelBookingId) return;

        if (!cancelReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        setCancelling(true);
        try {
            const response = await adminAPI.cancelBooking(cancelBookingId, { reason: cancelReason });

            if (response.data.success) {
                toast.success('Booking cancelled successfully');
                setShowCancelModal(false);
                setCancelReason('');
                setCancelBookingId(null);
                fetchBookings();
            } else {
                toast.error(response.data.message || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setCancelling(false);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(booking =>
                (booking._id || '').toLowerCase().includes(searchLower) ||
                (booking.customer?.name || '').toLowerCase().includes(searchLower) ||
                (booking.customer?.phone || '').toLowerCase().includes(searchLower) ||
                (booking.driver?.name || '').toLowerCase().includes(searchLower) ||
                (booking.fromCity || '').toLowerCase().includes(searchLower) ||
                (booking.toCity || '').toLowerCase().includes(searchLower)
            );
        }

        if (dateRange.start && dateRange.end) {
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);

            filtered = filtered.filter(booking => {
                const bookingDate = new Date(booking.createdAt);
                return bookingDate >= startDate && bookingDate <= endDate;
            });
        }

        setFilteredBookings(filtered);
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
    doc.text("All Bookings Report", 196, 18, { align: "right" });
    
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
            ["Total Bookings", stats.total],
            ["Searching", stats.searching],
            ["Available", stats.available],
            ["Accepted", stats.accepted],
            ["Ongoing", stats.ongoing],
            ["Completed", stats.completed],
            ["Cancelled", stats.cancelled],
            ["Total Revenue", `Rs. ${(stats.totalAmount || 0).toLocaleString()}`]
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

        const tableData = filteredBookings.map((booking, i) => {
            const isRental = booking.isRental || (booking.amount === 0 && booking.startDate && booking.endDate);
            const displayAmount = isRental ? (booking.rentalAmount || 0) : (booking.amount || 0);

            if (booking.rideType === 'cab') {
                const passengerDetails = booking.passengerDetails || [];
                return [
                    i + 1,
                    booking._id?.slice(-8) || 'N/A',
                    'Cab',
                    passengerDetails.map(p => p.name).join('\n') || 'No passengers',
                    passengerDetails.map(p => p.route).join('\n') || '-',
                    booking.mainRoute || 'N/A',
                    `Rs. ${displayAmount.toLocaleString()}`,
                    new Date(booking.createdAt).toLocaleDateString(),
                    booking.status || 'N/A',
                ];
            } else {
                return [
                    i + 1,
                    booking._id?.slice(-8) || 'N/A',
                    'Goods',
                    booking.customer?.name || 'N/A',
                    `${booking.fromCity || 'N/A'} -> ${booking.toCity || 'N/A'}`,
                    '-',
                    `Rs. ${displayAmount.toLocaleString()}`,
                    new Date(booking.createdAt).toLocaleDateString(),
                    booking.status || 'N/A',
                ];
            }
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [["No", "ID", "Type", "Customer/Passengers", "Route Details", "Main Route", "Amount", "Date", "Status"]],
            body: tableData,
            theme: "striped",
            styles: { fontSize: 6.5, cellPadding: 2, valign: "middle", overflow: "linebreak" },
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" },
            columnStyles: {
                0: { cellWidth: 10, halign: "center" },
                1: { cellWidth: 18 },
                2: { cellWidth: 12, halign: "center" },
                3: { cellWidth: 25 },
                4: { cellWidth: 30 },
                5: { cellWidth: 20 },
                6: { cellWidth: 15, halign: "right" },
                7: { cellWidth: 20, halign: "center" },
                8: { cellWidth: 18, halign: "center" },
            },
            didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Dump & Drop Admin Portal", 14, 287);
        const pageNumber = doc.internal.getCurrentPageInfo ? doc.internal.getCurrentPageInfo().pageNumber : data.pageNumber;
        doc.text(`Page ${pageNumber}`, 196, 287, { align: "right" });
      
              }
    });

        doc.save(`all_bookings_report_${new Date().toISOString().split("T")[0]}.pdf`);
        toast.success("PDF downloaded successfully");
    };

    const getStatusBadge = (status) => {
        const config = {
            searching: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Searching' },
            available: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Available' },
            accepted: { color: 'bg-cyan-100 text-cyan-700', icon: CheckCircle, label: 'Accepted' },
            ongoing: { color: 'bg-purple-100 text-purple-700', icon: Clock, label: 'Ongoing' },
            completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
            cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
            active: { color: 'bg-teal-100 text-teal-700', icon: CheckCircle, label: 'Active' }
        };
        const c = config[status] || config.searching;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${c.color}`}>
                <Icon className="w-3 h-3" />
                {c.label}
            </span>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedType('all');
        setSelectedStatus('all');
        setDateRange({ start: '', end: '' });
        setCurrentPage(1);
        fetchBookings();
    };

    // Helper function to check if cancel button should be shown
    // Hide cancel button only for 'cancelled' status
    const shouldShowCancelButton = (status) => {
        return status !== 'cancelled';
    };

    useEffect(() => {
        filterBookings();
    }, [searchTerm, dateRange, bookings]);

    if (loading && bookings.length === 0) {
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
                    <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage all ride bookings</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToPDF}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                    <button
                        onClick={fetchBookings}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Status Dashboard Cards - 7 statuses including Cancelled */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
                <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-blue-500">
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
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
                <div className="bg-white rounded-xl p-3 shadow-sm text-center border-l-4 border-red-500">
                    <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                    <p className="text-xs text-gray-500">Cancelled</p>
                </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-xl p-3 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] opacity-80">Total Revenue</p>
                        <p className="text-xl font-bold">{formatCurrency(stats.totalAmount || 0)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 opacity-50" />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, customer, phone, driver, route..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="all">All Types</option>
                        <option value="cab">Cab</option>
                        <option value="goods">Goods</option>
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="searching">Searching</option>
                        <option value="available">Available</option>
                        <option value="accepted">Accepted</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <input
                        type="date"
                        placeholder="Start"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-36"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        placeholder="End"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-36"
                    />

                    {(searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || dateRange.start || dateRange.end) && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Bookings Table - Cancel Button shows for all except 'cancelled' status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer / Passengers</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route Details</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="px-3 py-8 text-center text-gray-500">
                                    No bookings found
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((booking, index) => {
                                const isRental = booking.isRental || (booking.amount === 0 && booking.startDate && booking.endDate);
                                const displayAmount = isRental ? (booking.rentalAmount || 0) : (booking.amount || 0);
                                // Show cancel button only for non-cancelled bookings
                                const showCancelBtn = shouldShowCancelButton(booking.status);

                                return (
                                    <tr key={booking._id} className="hover:bg-gray-50 transition">
                                        <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                            #{booking._id?.slice(-8)}
                                            {isRental && (
                                                <span className="ml-1 text-[10px] bg-teal-100 text-teal-700 px-1 rounded">Rental</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1">
                                                {booking.rideType === 'cab' ?
                                                    <Car className="w-3 h-3 text-blue-600" /> :
                                                    <Truck className="w-3 h-3 text-green-600" />
                                                }
                                                <span className="text-xs text-gray-600">
                                                    {booking.rideType === 'cab' ? 'Cab' : 'Goods'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            {booking.rideType === 'cab' ? (
                                                <div className="max-w-[180px]">
                                                    {(booking.passengerDetails || []).length === 0 ? (
                                                        <p className="text-xs text-gray-500">No passengers</p>
                                                    ) : (
                                                        (booking.passengerDetails || []).map((p, idx) => (
                                                            <p key={idx} className="text-xs text-gray-900 leading-tight">
                                                                {p.name}
                                                            </p>
                                                        ))
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm text-gray-900">{booking.customer?.name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500">{booking.customer?.phone || 'N/A'}</p>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {isRental && booking.startDate && booking.endDate ? (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-teal-500" />
                                                    <span className="text-xs text-teal-600">
                                                        {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ) : (
                                                booking.rideType === 'cab' ? (
                                                    <div className="max-w-[180px]">
                                                        <p className="text-xs text-gray-600">{booking.mainRoute || 'N/A'}</p>
                                                        {(booking.passengerDetails || []).length > 0 && (
                                                            <div className="mt-1 pt-1 border-t border-gray-100">
                                                                {(booking.passengerDetails || []).map((p, idx) => (
                                                                    <p key={idx} className="text-[9px] text-gray-400">
                                                                        {p.route}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-gray-400" />
                                                        <span className="text-xs text-gray-600">{booking.fromCity || 'N/A'} → {booking.toCity || 'N/A'}</span>
                                                    </div>
                                                )
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-sm text-gray-900">{booking.driver?.name || 'Not assigned'}</p>
                                            <p className="text-xs text-gray-500">{booking.driver?.phone || ''}</p>
                                        </td>
                                        <td className="px-3 py-2 text-sm font-semibold text-green-600 whitespace-nowrap">
                                            {formatCurrency(displayAmount)}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2">{getStatusBadge(booking.status)}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {/* Cancel Button - Shows for all bookings except 'cancelled' */}
                                                {showCancelBtn && (
                                                    <button
                                                        onClick={() => {
                                                            setCancelBookingId(booking._id);
                                                            setShowCancelModal(true);
                                                        }}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Cancel Booking"
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
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

            {/* Booking Details Modal */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4 text-white">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-white/80">Booking ID</p>
                                        <p className="text-base font-bold">#{selectedBooking._id?.slice(-8)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/80">Status</p>
                                        {getStatusBadge(selectedBooking.status)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/80">Date & Time</p>
                                        <p className="text-xs">{formatDate(selectedBooking.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/80">Amount</p>
                                        <p className="text-base font-bold">
                                            {selectedBooking.isRental ?
                                                formatCurrency(selectedBooking.rentalAmount || 0) :
                                                formatCurrency(selectedBooking.amount || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedBooking.rideType === 'cab' ? (
                                <>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Passengers
                                        </h4>
                                        {(selectedBooking.passengerDetails || []).length === 0 ? (
                                            <p className="text-sm text-gray-500">No passengers</p>
                                        ) : (
                                            (selectedBooking.passengerDetails || []).map((p, idx) => (
                                                <p key={idx} className="text-sm text-gray-900">{p.name} - {p.phone}</p>
                                            ))
                                        )}
                                    </div>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            Route Details
                                        </h4>
                                        {(selectedBooking.isRental || (selectedBooking.amount === 0 && selectedBooking.startDate && selectedBooking.endDate)) && selectedBooking.startDate && selectedBooking.endDate ? (
                                            <>
                                                <p className="text-sm text-gray-600">Start Date: {new Date(selectedBooking.startDate).toLocaleDateString()}</p>
                                                <p className="text-sm text-gray-600">End Date: {new Date(selectedBooking.endDate).toLocaleDateString()}</p>
                                            </>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">{selectedBooking.mainRoute || 'N/A'}</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Customer Details
                                        </h4>
                                        <p className="text-sm"><span className="text-gray-500">Name:</span> {selectedBooking.customer?.name || 'N/A'}</p>
                                        <p className="text-sm"><span className="text-gray-500">Phone:</span> {selectedBooking.customer?.phone || 'N/A'}</p>
                                    </div>
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            Route Details
                                        </h4>
                                        {(selectedBooking.isRental || (selectedBooking.amount === 0 && selectedBooking.startDate && selectedBooking.endDate)) && selectedBooking.startDate && selectedBooking.endDate ? (
                                            <>
                                                <p className="text-sm text-gray-600">Start Date: {new Date(selectedBooking.startDate).toLocaleDateString()}</p>
                                                <p className="text-sm text-gray-600">End Date: {new Date(selectedBooking.endDate).toLocaleDateString()}</p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-600">{selectedBooking.fromCity || 'N/A'} → {selectedBooking.toCity || 'N/A'}</p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="border border-gray-200 rounded-lg p-3">
                                <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Driver Details
                                </h4>
                                <div className="space-y-1">
                                    <p className="text-sm"><span className="text-gray-500">Name:</span> {selectedBooking.driver?.name || 'Not assigned'}</p>
                                    <p className="text-sm"><span className="text-gray-500">Phone:</span> {selectedBooking.driver?.phone || 'N/A'}</p>
                                </div>
                            </div>

                            {selectedBooking.payment && (
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        Payment Details
                                    </h4>
                                    <div className="space-y-1">
                                        <p className="text-sm"><span className="text-gray-500">Amount:</span> {formatCurrency(selectedBooking.payment.amount)}</p>
                                        <p className="text-sm"><span className="text-gray-500">Mode:</span> {selectedBooking.payment.mode || 'N/A'}</p>
                                        <p className="text-sm"><span className="text-gray-500">Status:</span> {selectedBooking.payment.status || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                    setCancelBookingId(null);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                <p className="text-sm text-red-700">
                                    Are you sure you want to cancel this booking? This action cannot be undone.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Cancellation <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Please provide a reason for cancelling this booking..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                    rows="3"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason('');
                                        setCancelBookingId(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                                >
                                    No, Keep Booking
                                </button>
                                <button
                                    onClick={handleCancelBooking}
                                    disabled={cancelling || !cancelReason.trim()}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {cancelling ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Cancelling...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Yes, Cancel Booking
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AllBookings;