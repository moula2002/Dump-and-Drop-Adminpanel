import React, { useState, useEffect } from 'react';
import { Search, Package, Truck, Eye, XCircle, CheckCircle, Clock, Download, RefreshCw, User, MapPin, DollarSign } from 'lucide-react';
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

function GoodsDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getRides(1, 500, {
        type: 'goods',
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

      setDeliveries(ridesData);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
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
    doc.text("Goods Delivery Report", 196, 18, { align: "right" });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 36);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    let startY = 56;

    const statsData = [
      ["Searching", stats.searching],
      ["Available", stats.available],
      ["Accepted", stats.accepted],
      ["Ongoing", stats.ongoing],
      ["Completed", stats.completed],
      ["Cancelled", stats.cancelled],
      ["Total Orders", filteredDeliveries.length],
      ["Total Revenue", `₹${stats.totalAmount.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY,
      body: statsData,
      theme: "grid",
            styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229] }
            }
    });

    const tableData = filteredDeliveries.map((d) => [
      `#${d._id?.slice(-5) || "N/A"}`,
      `${getCustomerName(d)}\n${getCustomerPhone(d)}`,
      `${getDriverName(d)}\n${getDriverPhone(d)}`,
      `${getFromLocation(d)}\n→\n${getToLocation(d)}`,
      `${getVehicleType(d)}\n${getGoodsType(d)}\n${getGoodsWeight(d)}`,
      `₹${getFare(d)}`,
      getStatusLabel(d.status),
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["ID", "Customer / Mobile", "Driver / Mobile", "Pickup → Drop", "Vehicle / Goods", "Amount", "Status"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" },
            columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 35 },
        4: { cellWidth: 28 },
        5: { cellWidth: 16, halign: "right" },
        6: { cellWidth: 18, halign: "center" },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Dump & Drop Admin Portal", 14, 287);
        const pageNumber = doc.internal.getCurrentPageInfo ? doc.internal.getCurrentPageInfo().pageNumber : data.pageNumber;
        doc.text(`Page ${pageNumber}`, 196, 287, { align: "right" });
      
          }
    });

    doc.save(`goods_delivery_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const getStatusLabel = (status) => {
    const statusConfig = {
      searching: 'Searching',
      available: 'Available',
      accepted: 'Accepted',
      ongoing: 'In Transit',
      completed: 'Delivered',
      cancelled: 'Cancelled',
    };
    return statusConfig[status?.toLowerCase()] || status || 'Pending';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      searching: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Searching' },
      available: { color: 'bg-blue-100 text-blue-700', icon: Truck, label: 'Available' },
      accepted: { color: 'bg-cyan-100 text-cyan-700', icon: CheckCircle, label: 'Accepted' },
      ongoing: { color: 'bg-purple-100 text-purple-700', icon: Truck, label: 'In Transit' },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Delivered' },
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

  const getCustomerName = (delivery) => {
    if (delivery.customer?.name) return delivery.customer.name;
    if (delivery.customerName) return delivery.customerName;
    if (delivery.customerId?.name) return delivery.customerId.name;
    return 'N/A';
  };

  const getCustomerPhone = (delivery) => {
    if (delivery.customer?.phone) return delivery.customer.phone;
    if (delivery.customerPhone) return delivery.customerPhone;
    if (delivery.customerId?.phone) return delivery.customerId.phone;
    return '';
  };

  const getFromLocation = (delivery) => {
    return delivery.from || delivery.fromCity || delivery.pickupLocation?.address || 'N/A';
  };

  const getToLocation = (delivery) => {
    return delivery.to || delivery.toCity || delivery.dropLocation?.address || 'N/A';
  };

  const getFare = (delivery) => {
    return delivery.fare || delivery.price || delivery.amount || 0;
  };

  const getVehicleType = (delivery) => {
    return delivery.vehicleType || delivery.carModel || 'N/A';
  };

  const getGoodsType = (delivery) => {
    if (delivery.goods?.type) return delivery.goods.type;
    if (delivery.packageType) return delivery.packageType;
    return 'N/A';
  };

  const getGoodsWeight = (delivery) => {
    if (delivery.goods?.weight) return delivery.goods.weight;
    if (delivery.weight) return `${delivery.weight}`;
    if (delivery.packageWeight) return `${delivery.packageWeight} kg`;
    return 'N/A';
  };

  const getDriverName = (delivery) => {
    if (delivery.driverId?.name) return delivery.driverId.name;
    if (delivery.driver?.name) return delivery.driver.name;
    if (delivery.driverName) return delivery.driverName;
    return 'Not assigned';
  };

  const getDriverPhone = (delivery) => {
    if (delivery.driverId?.phone) return delivery.driverId.phone;
    if (delivery.driver?.phone) return delivery.driver.phone;
    if (delivery.driverPhone) return delivery.driverPhone;
    return '';
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const searchLower = searchTerm.toLowerCase();
    return (
      getCustomerName(delivery).toLowerCase().includes(searchLower) ||
      getCustomerPhone(delivery).toLowerCase().includes(searchLower) ||
      getDriverName(delivery).toLowerCase().includes(searchLower) ||
      getDriverPhone(delivery).toLowerCase().includes(searchLower) ||
      getFromLocation(delivery).toLowerCase().includes(searchLower) ||
      getToLocation(delivery).toLowerCase().includes(searchLower) ||
      getVehicleType(delivery).toLowerCase().includes(searchLower) ||
      getGoodsType(delivery).toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    searching: deliveries.filter(d => d.status?.toLowerCase() === 'searching').length,
    available: deliveries.filter(d => d.status?.toLowerCase() === 'available').length,
    accepted: deliveries.filter(d => d.status?.toLowerCase() === 'accepted').length,
    ongoing: deliveries.filter(d => d.status?.toLowerCase() === 'ongoing').length,
    completed: deliveries.filter(d => d.status?.toLowerCase() === 'completed').length,
    cancelled: deliveries.filter(d => d.status?.toLowerCase() === 'cancelled').length,
    totalAmount: deliveries.reduce((sum, d) => sum + getFare(d), 0)
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
          <h1 className="text-2xl font-bold text-gray-900">Goods Delivery</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all goods delivery orders</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, driver, vehicle, goods..."
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
            <option value="ongoing">In Transit</option>
            <option value="completed">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchDeliveries}
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

      {/* Stats Cards - Removed Draft */}
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
          <p className="text-xs text-gray-500">In Transit</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-xs text-gray-500">Delivered</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </div>
      </div>

      {/* Total Amount Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-3xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
          </div>
          <Package className="w-12 h-12 opacity-50" />
        </div>
      </div>

      {/* Main Table - Added Driver Column */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer / Mobile</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver / Mobile</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup → Drop</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle / Goods</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-gray-500">
                    No deliveries found
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery._id || delivery.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      #{delivery._id?.slice(-6) || 'N/A'}
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getCustomerName(delivery)}</p>
                        <p className="text-xs text-gray-500">{getCustomerPhone(delivery)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getDriverName(delivery)}</p>
                        <p className="text-xs text-gray-500">{getDriverPhone(delivery)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-sm text-gray-600 max-w-[150px] truncate">{getFromLocation(delivery)}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm text-gray-600 max-w-[150px] truncate">{getToLocation(delivery)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{getVehicleType(delivery)}</p>
                        <p className="text-xs text-gray-500">{getGoodsType(delivery)} - {getGoodsWeight(delivery)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">₹{getFare(delivery)}</td>
                    <td className="px-5 py-3">{getStatusBadge(delivery.status)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowViewModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Delivery Details</h3>
              <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Delivery Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl p-4 text-white">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-white/80">Order ID</p>
                    <p className="text-base font-bold">#{selectedDelivery._id?.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/80">Status</p>
                    {getStatusBadge(selectedDelivery.status)}
                  </div>
                  <div>
                    <p className="text-xs text-white/80">Date & Time</p>
                    <p className="text-xs">{new Date(selectedDelivery.createdAt || selectedDelivery.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/80">Amount</p>
                    <p className="text-base font-bold">₹{getFare(selectedDelivery)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Details
                </h4>
                <div className="space-y-1">
                  <p className="text-sm"><span className="text-gray-500">Name:</span> {getCustomerName(selectedDelivery)}</p>
                  <p className="text-sm"><span className="text-gray-500">Phone:</span> {getCustomerPhone(selectedDelivery) || 'N/A'}</p>
                </div>
              </div>

              {/* Driver Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Driver Details
                </h4>
                <div className="space-y-1">
                  <p className="text-sm"><span className="text-gray-500">Name:</span> {getDriverName(selectedDelivery)}</p>
                  <p className="text-sm"><span className="text-gray-500">Phone:</span> {getDriverPhone(selectedDelivery) || 'N/A'}</p>
                </div>
              </div>

              {/* Route Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Route Details
                </h4>
                <p className="text-sm text-gray-600">Pickup: {getFromLocation(selectedDelivery)}</p>
                <p className="text-sm text-gray-600">Drop: {getToLocation(selectedDelivery)}</p>
              </div>

              {/* Goods Details */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" />
                  Goods Details
                </h4>
                <div className="space-y-1">
                  <p className="text-sm"><span className="text-gray-500">Vehicle Type:</span> {getVehicleType(selectedDelivery)}</p>
                  <p className="text-sm"><span className="text-gray-500">Goods Type:</span> {getGoodsType(selectedDelivery)}</p>
                  <p className="text-sm"><span className="text-gray-500">Weight:</span> {getGoodsWeight(selectedDelivery)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoodsDelivery;