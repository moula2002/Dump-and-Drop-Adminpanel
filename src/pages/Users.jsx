import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, User, Phone, Calendar, Download, RefreshCw, Users as UsersIcon, UserCheck, UserX, X } from 'lucide-react';
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

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, statusFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers(1, 500, searchTerm);

      let usersData = [];
      if (response.data?.users && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else if (response.data?.data?.users && Array.isArray(response.data.data.users)) {
        usersData = response.data.data.users;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      }

      const customersOnly = usersData.filter(user => user && user.role === 'customer');
      setUsers(customersOnly);
      setFilteredUsers(customersOnly);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'active' ? user.isAdminVerified !== false : user.isAdminVerified === false
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.name || '').toLowerCase().includes(searchLower) ||
        (user.phone || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
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
    doc.text("Customers Report", 196, 18, { align: "right" });
    
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
      ["Total Customers", stats.total],
      ["Active Customers", stats.active],
      ["Blocked Customers", stats.blocked],
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

    const tableData = filteredUsers.map((user, i) => [
      i + 1,
      user.name || 'N/A',
      user.phone || 'N/A',
      new Date(user.createdAt).toLocaleDateString(),
      user.isAdminVerified !== false ? 'Active' : 'Blocked',
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["No", "Name", "Phone", "Joined", "Status"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35, halign: "center" },
        4: { cellWidth: 30, halign: "center" },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Dump & Drop Admin Portal", 14, 287);
        const pageNumber = doc.internal.getCurrentPageInfo ? doc.internal.getCurrentPageInfo().pageNumber : data.pageNumber;
        doc.text(`Page ${pageNumber}`, 196, 287, { align: "right" });
      
          }
    });

    doc.save(`customers_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const handleViewUser = (user) => {
    const userId = user?._id || user?.id || user?.userId;
    if (userId) {
      navigate(`/users/${userId}`);
    } else {
      toast.error('Invalid user ID');
    }
  };

  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter(u => u.isAdminVerified !== false).length,
    blocked: filteredUsers.filter(u => u.isAdminVerified === false).length,
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all registered customers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToPDF} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button onClick={fetchUsers} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-blue-600">{stats.total}</p><p className="text-xs text-gray-500">Total Customers</p></div>
            <UsersIcon className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-green-600">{stats.active}</p><p className="text-xs text-gray-500">Active</p></div>
            <UserCheck className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-red-600">{stats.blocked}</p><p className="text-xs text-gray-500">Blocked</p></div>
            <UserX className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          {(searchTerm || statusFilter !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-1">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Users Table - Email column removed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-500">No customers found</td></tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user?._id || user?.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => handleViewUser(user)}>
                    <td className="px-5 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div>
                        <div><p className="text-sm font-medium text-gray-900">{user?.name || 'N/A'}</p><p className="text-xs text-gray-500">ID: {(user?._id || user?.id)?.slice(-6) || 'N/A'}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{user?.phone || 'N/A'}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user?.isAdminVerified !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user?.isAdminVerified !== false ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleViewUser(user)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Users;