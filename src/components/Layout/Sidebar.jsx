import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Truck,
  FileText,
  Settings,
  LogOut,
  UserCog,
  Package,
  XCircle,
  DollarSign,
  TrendingUp,
  ClipboardList,
  Bell,
  Shield,
  CreditCard,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import logoImage from '../../assets/DUMP.png';

const menuItems = [
  {
    category: "MAIN",
    items: [
      { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    category: "RIDE MANAGEMENT",
    items: [
      { path: '/cab-rides', name: 'Cab Rides', icon: Car },
      { path: '/goods-delivery', name: 'Goods Delivery', icon: Package },
      //  { path: '/all-rides', name: 'All Rides', icon: ClipboardList },
      { path: '/rentals', name: 'Vehicle Rentals', icon: Calendar },
    ]
  },
  {
    category: "BOOKING & CANCELLATION",
    items: [
      // { path: '/cancellation-requests', name: 'Cancellation Requests', icon: XCircle },
      // { path: '/cancelled-orders', name: 'Cancelled Orders', icon: AlertCircle },
      { path: '/all-bookings', name: 'All Bookings', icon: Calendar },
      { path: '/cancelled-rides', name: 'Cancelled Rides', icon: XCircle },
    ]
  },
  {
    category: "FINANCIAL",
    items: [
      { path: '/commission-settings', name: 'Commission Settings', icon: DollarSign },
      //  { path: '/payments', name: 'Payments', icon: CreditCard },

      //  { path: '/payouts', name: 'Payouts', icon: CreditCard },
      //  { path: '/revenue', name: 'Revenue Reports', icon: TrendingUp },
      { path: '/revenue-reports', name: 'Revenue Analytics', icon: TrendingUp },
    ]
  },
  {
    category: "USER MANAGEMENT",
    items: [
      { path: '/users', name: 'Customers', icon: Users },
      { path: '/drivers', name: 'Drivers', icon: UserCog },
      { path: '/driver-verification', name: 'Driver Verification', icon: Shield },
      { path: '/password-resets', name: 'Password Resets', icon: Shield },
    ]
  },
  // {
  //   category: "VEHICLE MANAGEMENT",
  //   items: [
  //     { path: '/vehicles', name: 'Vehicle Types', icon: Truck },
  //     { path: '/vehicle-rates', name: 'Rate Management', icon: TrendingUp },
  //   ]
  // },
  {
    category: "SYSTEM",
    items: [
      { path: '/reports', name: 'Reports', icon: FileText },
      { path: '/notifications', name: 'Notifications', icon: Bell },
      //   { path: '/settings', name: 'Settings', icon: Settings },
    ]
  },
];

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (category) => {
    setExpandedItems(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen w-66 bg-gradient-to-b from-gray-900 to-gray-800 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="sticky top-0 z-10 bg-gray-900">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-700">
            <div className="flex items-center">
              <img src={logoImage} alt="Dump & Drop" className="w-44 object-contain bg-white p-1.5 rounded-md" />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4">
          {menuItems.map((category, catIdx) => (
            <div key={catIdx} className="mb-6">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {category.category}
              </p>
              <div className="space-y-1">
                {category.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 transition-colors ${({ isActive }) => isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                    <span className="flex-1">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;