import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import CabRides from './pages/CabRides';
import GoodsDelivery from './pages/GoodsDelivery';
import AllRides from './pages/AllRides';
import Bookings from './pages/Bookings';
import CancellationRequests from './pages/CancellationRequests';
import CancelledOrders from './pages/CancelledOrders';
import CommissionSettings from './pages/CommissionSettings';
import Payouts from './pages/Payouts';
import Revenue from './pages/Revenue';
import CustomerProfile from './pages/CustomerProfile';
import DriverProfile from './pages/DriverProfile';
import DriverVerification from './pages/DriverVerification';
import Vehicles from './pages/Vehicles';
import VehicleRates from './pages/VehicleRates';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import AllBookings from './pages/AllBookings';
import RevenueReports from './pages/RevenueReports';
import CancelledRides from './pages/CancelledRides';
import Rentals from './pages/Rentals';



function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    if (token && user) {
      setIsAuthenticated(true);
      setAdminUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const AdminLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-64">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          adminUser={adminUser}
          onLogout={handleLogout}
        />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={<Login setIsAuthenticated={setIsAuthenticated} setAdminUser={setAdminUser} />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CustomerProfile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/drivers"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Drivers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/drivers/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DriverProfile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver-verification"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DriverVerification />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cab-rides"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CabRides />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/goods-delivery"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <GoodsDelivery />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/all-rides"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AllRides />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Bookings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cancellation-requests"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CancellationRequests />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cancelled-orders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CancelledOrders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/commission-settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CommissionSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payouts"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Payouts />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/revenue"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Revenue />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Vehicles />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle-rates"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <VehicleRates />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Notifications />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Settings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Payments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        // Add these routes
        <Route
          path="/all-bookings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AllBookings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/revenue-reports"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <RevenueReports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/cancelled-rides"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CancelledRides />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rentals"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Rentals />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;