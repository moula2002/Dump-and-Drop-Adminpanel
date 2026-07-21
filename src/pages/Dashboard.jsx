import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Car, DollarSign, TrendingUp, TrendingDown,
  Download, RefreshCw, UserCheck, Truck, Package,
  Calendar, CheckCircle, XCircle, Clock, CreditCard,
  Wallet, Activity, BarChart3, PieChart, Eye
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
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

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalDrivers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    userGrowth: 0,
    totalRides: 0,
    totalCabRides: 0,
    totalGoodsRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    ongoingRides: 0,
    searchingRides: 0,
    draftRides: 0,
    completionRate: 0,
    rideGrowth: 0,
    totalRevenue: 0,
    cabRevenue: 0,
    goodsRevenue: 0,
    todayRevenue: 0,
    thisMonthRevenue: 0,
    platformCommission: 0,
    revenueGrowth: 0,
    totalApprovedDrivers: 0,
    totalPendingDrivers: 0,
    totalRejectedDrivers: 0,
    approvedCabDrivers: 0,
    pendingCabDrivers: 0,
    approvedGoodsDrivers: 0,
    pendingGoodsDrivers: 0,
    onlineDrivers: 0,
    totalBookings: 0,
    totalPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    driverCommission: 80
  });
  
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboardData = useCallback(async (showToastMsg = false) => {
    try {
      console.log('Fetching dashboard data for period:', period);
      
      const [statsRes, revenueRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getRevenueData(period)
      ]);

      console.log('Dashboard Stats Response:', statsRes.data);
      console.log('Revenue Data Response:', revenueRes.data);

      // Process stats data
      const statsData = statsRes.data?.data || statsRes.data || {};
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalCustomers: statsData.totalCustomers || 0,
        totalDrivers: statsData.totalDrivers || 0,
        activeUsers: statsData.activeUsers || 0,
        newUsersThisMonth: statsData.newUsersThisMonth || 0,
        userGrowth: statsData.userGrowth || 0,
        totalRides: statsData.totalRides || 0,
        totalCabRides: statsData.totalCabRides || 0,
        totalGoodsRides: statsData.totalGoodsRides || 0,
        completedRides: statsData.completedRides || 0,
        cancelledRides: statsData.cancelledRides || 0,
        ongoingRides: statsData.ongoingRides || 0,
        searchingRides: statsData.searchingRides || 0,
        draftRides: statsData.draftRides || 0,
        completionRate: statsData.completionRate || 0,
        rideGrowth: statsData.rideGrowth || 0,
        totalRevenue: statsData.totalRevenue || 0,
        cabRevenue: statsData.cabRevenue || 0,
        goodsRevenue: statsData.goodsRevenue || 0,
        todayRevenue: statsData.todayRevenue || 0,
        thisMonthRevenue: statsData.thisMonthRevenue || 0,
        platformCommission: statsData.platformCommission || 0,
        revenueGrowth: statsData.revenueGrowth || 0,
        totalApprovedDrivers: statsData.totalApprovedDrivers || 0,
        totalPendingDrivers: statsData.totalPendingDrivers || 0,
        totalRejectedDrivers: statsData.totalRejectedDrivers || 0,
        approvedCabDrivers: statsData.approvedCabDrivers || 0,
        pendingCabDrivers: statsData.pendingCabDrivers || 0,
        approvedGoodsDrivers: statsData.approvedGoodsDrivers || 0,
        pendingGoodsDrivers: statsData.pendingGoodsDrivers || 0,
        onlineDrivers: statsData.onlineDrivers || 0,
        totalBookings: statsData.totalBookings || 0,
        totalPayments: statsData.totalPayments || 0,
        pendingPayments: statsData.pendingPayments || 0,
        failedPayments: statsData.failedPayments || 0,
        driverCommission: statsData.driverCommission || 80
      });
      
      // Process revenue data - handle different response structures
      let revenueArray = [];
      if (revenueRes.data?.data && Array.isArray(revenueRes.data.data)) {
        revenueArray = revenueRes.data.data;
      } else if (revenueRes.data && Array.isArray(revenueRes.data)) {
        revenueArray = revenueRes.data;
      } else if (revenueRes.data?.revenueData && Array.isArray(revenueRes.data.revenueData)) {
        revenueArray = revenueRes.data.revenueData;
      }
      
      console.log('Processed revenue array:', revenueArray);
      setRevenueData(revenueArray);
      setLastUpdated(new Date());
      
      if (showToastMsg) {
        toast.success('Dashboard updated!');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (showToastMsg) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData(false);
  }, [period, fetchDashboardData]);

  const handleManualRefresh = () => fetchDashboardData(true);

  const formatCurrency = (amount) => {
    const num = amount || 0;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
  };

  const formatNumber = (num) => {
    return (num || 0).toLocaleString();
  };

  // Prepare pie chart data (only show if data exists)
  const rideTypePieData = [
    { name: 'Cab Rides', value: stats.totalCabRides || 0, color: '#3b82f6' },
    { name: 'Goods Delivery', value: stats.totalGoodsRides || 0, color: '#10b981' }
  ].filter(item => item.value > 0);
  
  const revenuePieData = [
    { name: 'Cab Revenue', value: stats.cabRevenue || 0, color: '#3b82f6' },
    { name: 'Goods Revenue', value: stats.goodsRevenue || 0, color: '#10b981' }
  ].filter(item => item.value > 0);
  
  const rideStatusData = [
    { name: 'Completed', value: stats.completedRides || 0, color: '#10b981' },
    { name: 'Ongoing', value: stats.ongoingRides || 0, color: '#f59e0b' },
    { name: 'Searching', value: stats.searchingRides || 0, color: '#8b5cf6' },
    { name: 'Draft', value: stats.draftRides || 0, color: '#6b7280' },
    { name: 'Cancelled', value: stats.cancelledRides || 0, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('DASHBOARD REPORT', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 35;
    
    // User Stats
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text('User Statistics', 14, yPos);
    yPos += 8;
    
    const userStats = [
      ['Total Users', formatNumber(stats.totalUsers)],
      ['Total Customers', formatNumber(stats.totalCustomers)],
      ['Total Drivers', formatNumber(stats.totalDrivers)],
      ['Active Users (30 days)', formatNumber(stats.activeUsers)],
      ['New Users This Month', formatNumber(stats.newUsersThisMonth)],
      ['User Growth', `${stats.userGrowth || 0}%`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: userStats,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Ride Stats
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Ride Statistics', 14, yPos);
    yPos += 8;
    
    const rideStats = [
      ['Total Rides', formatNumber(stats.totalRides)],
      ['Cab Rides', formatNumber(stats.totalCabRides)],
      ['Goods Deliveries', formatNumber(stats.totalGoodsRides)],
      ['Completed Rides', formatNumber(stats.completedRides)],
      ['Ongoing Rides', formatNumber(stats.ongoingRides)],
      ['Cancelled Rides', formatNumber(stats.cancelledRides)],
      ['Completion Rate', `${stats.completionRate || 0}%`],
      ['Ride Growth', `${stats.rideGrowth || 0}%`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: rideStats,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Revenue Stats
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Revenue Statistics', 14, yPos);
    yPos += 8;
    
    const revenueStats = [
      ['Total Revenue', formatCurrency(stats.totalRevenue)],
      ['Cab Revenue', formatCurrency(stats.cabRevenue)],
      ['Goods Revenue', formatCurrency(stats.goodsRevenue)],
      ['Today\'s Revenue', formatCurrency(stats.todayRevenue)],
      ['This Month Revenue', formatCurrency(stats.thisMonthRevenue)],
      ['Revenue Growth', `${stats.revenueGrowth || 0}%`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: revenueStats,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Driver Stats
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Driver Statistics', 14, yPos);
    yPos += 8;
    
    const driverStats = [
      ['Approved Drivers', formatNumber(stats.totalApprovedDrivers)],
      ['Pending Drivers', formatNumber(stats.totalPendingDrivers)],
      ['Rejected Drivers', formatNumber(stats.totalRejectedDrivers)],
      ['Cab Drivers (Approved)', formatNumber(stats.approvedCabDrivers)],
      ['Goods Drivers (Approved)', formatNumber(stats.approvedGoodsDrivers)],
      ['Online Drivers', formatNumber(stats.onlineDrivers)],
      ['Driver Commission', `${stats.driverCommission || 80}%`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: driverStats,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });
    
    doc.save(`dashboard_report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF downloaded successfully');
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Complete platform analytics</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <Eye className="w-3 h-3 mr-1" />
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button onClick={handleManualRefresh} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={exportToPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Stats Grid - Row 1: Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
            {(stats.userGrowth || 0) !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-medium ${(stats.userGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats.userGrowth || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.userGrowth || 0)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalUsers)}</p>
          <p className="text-sm text-gray-500">Total Users</p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-green-600">{formatNumber(stats.activeUsers)} active</span>
            <span className="text-blue-600">{formatNumber(stats.newUsersThisMonth)} new this month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 rounded-lg"><Car className="w-5 h-5 text-green-600" /></div>
            {(stats.rideGrowth || 0) !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-medium ${(stats.rideGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats.rideGrowth || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.rideGrowth || 0)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalRides)}</p>
          <p className="text-sm text-gray-500">Total Rides</p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-green-600">{formatNumber(stats.completedRides)} completed</span>
            <span className="text-yellow-600">{formatNumber(stats.ongoingRides)} ongoing</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 rounded-lg"><DollarSign className="w-5 h-5 text-orange-600" /></div>
            {(stats.revenueGrowth || 0) !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-medium ${(stats.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats.revenueGrowth || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stats.revenueGrowth || 0)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-blue-600">Today: {formatCurrency(stats.todayRevenue)}</span>
            <span className="text-green-600">This month: {formatCurrency(stats.thisMonthRevenue)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 rounded-lg"><UserCheck className="w-5 h-5 text-purple-600" /></div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalApprovedDrivers)}</p>
          <p className="text-sm text-gray-500">Approved Drivers</p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-yellow-600">{formatNumber(stats.totalPendingDrivers)} pending</span>
            <span className="text-green-600">{formatNumber(stats.onlineDrivers)} online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Row 2: Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Cab Rides</p>
          <p className="text-2xl font-bold">{formatNumber(stats.totalCabRides)}</p>
          <p className="text-xs opacity-80 mt-1">{formatCurrency(stats.cabRevenue)}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Goods Delivery</p>
          <p className="text-2xl font-bold">{formatNumber(stats.totalGoodsRides)}</p>
          <p className="text-xs opacity-80 mt-1">{formatCurrency(stats.goodsRevenue)}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Completion Rate</p>
          <p className="text-2xl font-bold">{stats.completionRate || 0}%</p>
          <p className="text-xs opacity-80 mt-1">{formatNumber(stats.completedRides)} / {formatNumber(stats.totalRides)}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-80">Cancelled Rides</p>
          <p className="text-2xl font-bold">{formatNumber(stats.cancelledRides)}</p>
          <p className="text-xs opacity-80 mt-1">{formatNumber(stats.failedPayments)} failed payments</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-72 text-gray-400">
              <div className="text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No revenue data available</p>
                <p className="text-xs mt-1">Complete some rides to see data</p>
              </div>
            </div>
          )}
        </div>

        {/* Rides Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Rides Trend</h3>
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rides" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-72 text-gray-400">
              <div className="text-center">
                <Car className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No rides data available</p>
                <p className="text-xs mt-1">Complete some rides to see data</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pie Charts Row - Only show if data exists */}
      {(rideTypePieData.length > 0 || revenuePieData.length > 0 || rideStatusData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ride Type Distribution */}
          {rideTypePieData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Ride Type Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={rideTypePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {rideTypePieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue Distribution */}
          {revenuePieData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Revenue Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={revenuePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {revenuePieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Ride Status Distribution */}
          {rideStatusData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Ride Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={rideStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {rideStatusData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;