// src/components/Layout/Header.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Bell, User, Search, LogOut, Settings as SettingsIcon, X } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

function Header({ sidebarOpen, setSidebarOpen, adminUser, onLogout }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupNotification, setPopupNotification] = useState(null);
  const dropdownRef = useRef(null);
  const popupTimeoutRef = useRef(null);
  const lastNotificationIdsRef = useRef(new Set()); // Store already shown notification IDs
  const isInitialLoadRef = useRef(true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showPopup = useCallback((notification) => {
    // Clear previous timeout
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    
    setPopupNotification(notification);
    
    // Auto hide after 5 seconds
    popupTimeoutRef.current = setTimeout(() => {
      setPopupNotification(null);
    }, 5000);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await adminAPI.getNotifications({ limit: 20, isRead: 'false' });
      
      let notificationsList = [];
      let unread = 0;
      
      if (response.data?.notifications) {
        notificationsList = response.data.notifications;
        unread = response.data.unreadCount || notificationsList.filter(n => !n.isRead).length;
      } else if (Array.isArray(response.data)) {
        notificationsList = response.data;
        unread = notificationsList.filter(n => !n.isRead).length;
      }
      
      // Find NEW notifications (not in our current list AND not shown before)
      const currentIds = new Set(notifications.map(n => n._id));
      const newNotifications = notificationsList.filter(n => 
        !currentIds.has(n._id) && !lastNotificationIdsRef.current.has(n._id)
      );
      
      // Show popup for each new notification (only once)
      if (newNotifications.length > 0) {
        if (isInitialLoadRef.current) {
          // On first load, just mark all current unread notifications as shown without displaying toasts/popups
          newNotifications.forEach(notif => {
            lastNotificationIdsRef.current.add(notif._id);
          });
          isInitialLoadRef.current = false;
        } else {
          newNotifications.forEach(notif => {
            // Mark as shown
            lastNotificationIdsRef.current.add(notif._id);
            
            // Show popup
            showPopup(notif);
            
            // Also show toast
            toast.success(notif.title, {
              duration: 5000,
              position: 'top-right',
            });
          });
        }
      } else if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      
      setNotifications(notificationsList);
      setUnreadCount(unread);
      
      // Update document title
      if (unread > 0) {
        document.title = `(${unread}) Admin Dashboard`;
      } else {
        document.title = 'Admin Dashboard';
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [notifications, showPopup]);

  // Poll for notifications every 5 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await adminAPI.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminAPI.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      document.title = 'Admin Dashboard';
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '🔔';
    }
  };

  const getTypeBgColor = (type) => {
    switch(type) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-800">Dump & Drop Admin</h1>
              <p className="text-xs text-gray-500">Live Dashboard</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-3 py-2 w-96 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none ml-2 text-sm w-full"
            />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  </>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
                    <h3 className="font-semibold text-gray-900">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs text-red-500 animate-pulse">● {unreadCount} new</span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif._id}
                          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all ${
                            !notif.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => handleMarkAsRead(notif._id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-xl">{getTypeIcon(notif.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notif.body}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2 animate-pulse"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 text-center border-t border-gray-100 bg-gray-50">
                    <a href="/notifications" className="text-xs text-blue-600 hover:text-blue-700">
                      View all notifications
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{adminUser?.name || 'Admin'}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                  </p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{adminUser?.name || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{adminUser?.email || 'admin@dumpdrop.com'}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <hr className="my-1" />
                    <button 
                      onClick={onLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============ POPUP NOTIFICATION ============ */}
      {popupNotification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className={`bg-white rounded-lg shadow-2xl border-l-4 ${getTypeBgColor(popupNotification.type)} w-96 max-w-full overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getTypeIcon(popupNotification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900">{popupNotification.title}</h4>
                    <button 
                      onClick={() => setPopupNotification(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{popupNotification.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(popupNotification.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div className="h-full bg-blue-500 animate-progress-shrink"></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes progress-shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-progress-shrink {
          animation: progress-shrink 5s linear forwards;
        }
      `}</style>
    </>
  );
}

export default Header;