import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, CheckCircle, XCircle, User, Car, Clock, Download, RefreshCw, Users, UserCheck, UserX, TrendingUp, X } from 'lucide-react';
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

// Helper function for full number format - NO abbreviations, just plain number
const formatFullNumber = (amount) => {
  if (!amount || amount === 0) return '₹0';
  const num = Math.round(amount || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

function Drivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('approved');

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    filterDrivers();
  }, [searchTerm, statusFilter, drivers]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getDrivers();
      console.log('Drivers API Response:', response);

      let driversData = [];
      if (response.data?.drivers) {
        driversData = response.data.drivers;
      } else if (response.data?.data?.drivers) {
        driversData = response.data.data.drivers;
      } else if (Array.isArray(response.data)) {
        driversData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        driversData = response.data.data;
      }

      const processedDrivers = driversData.map(driver => {
        let phoneNumber = 'N/A';

        if (driver.phone) {
          phoneNumber = driver.phone;
        } else if (driver.userId?.phone) {
          phoneNumber = driver.userId.phone;
        } else if (driver.userId && typeof driver.userId === 'object' && driver.userId.phone) {
          phoneNumber = driver.userId.phone;
        } else if (driver.userPhone) {
          phoneNumber = driver.userPhone;
        }

        let displayName = driver.fullName || driver.name || 'N/A';
        if (driver.userId?.name && driver.userId.name !== displayName) {
          displayName = driver.userId.name;
        }

        return {
          ...driver,
          displayPhone: phoneNumber,
          displayName: displayName
        };
      });

      const approvedDrivers = processedDrivers.filter(driver => driver.status === 'approved');

      console.log('Processed drivers with phone:', processedDrivers);
      console.log('Approved drivers only:', approvedDrivers);
      setDrivers(processedDrivers);
      setFilteredDrivers(approvedDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const filterDrivers = () => {
    let filtered = [...drivers];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(driver => driver.status === statusFilter);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(driver =>
        (driver.displayName || '').toLowerCase().includes(searchLower) ||
        (driver.regNumber || '').toLowerCase().includes(searchLower) ||
        (driver.vehicleType || '').toLowerCase().includes(searchLower) ||
        (driver.displayPhone || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredDrivers(filtered);
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
    doc.text("Drivers Report", 196, 18, { align: "right" });
    
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
      ["Total Drivers", stats.total],
      ["Approved Drivers", stats.approved],
      ["Pending Drivers", stats.pending],
      ["Rejected Drivers", stats.rejected],
      ["Total Earnings", `Rs. ${Math.round(stats.totalEarnings).toLocaleString('en-IN')}`],
      ["Total Rides", stats.totalRides],
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

    const tableData = filteredDrivers.map((driver, i) => [
      i + 1,
      driver.displayName || driver.fullName || driver.name || 'N/A',
      driver.displayPhone || 'N/A',
      driver.vehicleType || 'N/A',
      driver.regNumber || 'N/A',
      driver.status || 'N/A',
      driver.totalRides || 0,
      `Rs. ${Math.round(driver.totalEarnings || 0).toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["No", "Name", "Phone", "Vehicle Type", "Reg Number", "Status", "Rides", "Earnings"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" },
            columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 30 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 16, halign: "center" },
        6: { cellWidth: 12, halign: "right" },
        7: { cellWidth: 20, halign: "right" },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Dump & Drop Admin Portal", 14, 287);
        const pageNumber = doc.internal.getCurrentPageInfo ? doc.internal.getCurrentPageInfo().pageNumber : data.pageNumber;
        doc.text(`Page ${pageNumber}`, 196, 287, { align: "right" });
      
          }
    });

    doc.save(`drivers_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const handleViewDriver = (driver) => {
    const driverId = driver.userId?._id || driver.userId || driver._id;
    console.log('Navigating to driver:', driverId);
    navigate(`/drivers/${driverId}`);
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Approved' };
    } else if (status === 'pending') {
      return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, text: 'Pending' };
    } else {
      return { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Rejected' };
    }
  };

  const stats = {
    total: drivers.length,
    approved: drivers.filter(d => d.status === 'approved').length,
    pending: drivers.filter(d => d.status === 'pending').length,
    rejected: drivers.filter(d => d.status === 'rejected').length,
    totalEarnings: drivers.reduce((sum, d) => sum + (d.totalEarnings || 0), 0),
    totalRides: drivers.reduce((sum, d) => sum + (d.totalRides || 0), 0)
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
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all registered drivers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button onClick={fetchDrivers} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-blue-600">{stats.total}</p><p className="text-xs text-gray-500">Total Drivers</p></div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-green-600">{stats.approved}</p><p className="text-xs text-gray-500">Approved</p></div>
            <UserCheck className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p><p className="text-xs text-gray-500">Pending</p></div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-red-600">{stats.rejected}</p><p className="text-xs text-gray-500">Rejected</p></div>
            <UserX className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-purple-600">{formatFullNumber(stats.totalEarnings)}</p><p className="text-xs text-gray-500">Total Earnings</p></div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-orange-600">{stats.totalRides}</p><p className="text-xs text-gray-500">Total Rides</p></div>
            <Car className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, vehicle, reg number or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          {(searchTerm || statusFilter !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('approved'); }} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-1">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No drivers found</div>
        ) : (
          filteredDrivers.map((driver) => {
            const statusBadge = getStatusBadge(driver.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div key={driver._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer" onClick={() => handleViewDriver(driver)}>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{driver.displayName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{driver.totalRides || 0} rides</span>
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusBadge.text}
                    </div>
                  </div>

                  <div className="pt-2 pb-3">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      {driver.vehicleType || 'N/A'} - {driver.regNumber || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span className="font-medium">📞</span> {driver.displayPhone}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Total Earnings</p>
                      <p className="text-lg font-bold text-gray-900">{formatFullNumber(driver.totalEarnings || 0)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleViewDriver(driver); }} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Drivers;