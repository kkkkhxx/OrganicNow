import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './component/Toast.jsx';
import ProtectedRoute from './components/ProtectedRoute';

// Import pages
import Login from './pages/Login';
import Dashboard from './pages/dashboard';
import RoomManagement from './pages/roommanagement';
import TenantManagement from './pages/tenantmanagement';
import InvoiceManagement from './pages/Invoicemanagement';
import MaintenanceRequest from './pages/maintenancerequest';
import AssetManagement from './pages/AssetManagement';
import PackageManagement from './pages/PackageManagement';
import MaintenanceSchedule from './pages/MaintenanceSchedule';

// Import detail pages
import TenantDetail from './pages/tenantdetail';
import RoomDetail from './pages/roomdetail';
import InvoiceDetails from './pages/Invoicedetails';
import MaintenanceDetails from './pages/MaintenanceDetails';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/roommanagement" element={
              <ProtectedRoute>
                <RoomManagement />
              </ProtectedRoute>
            } />
            <Route path="/tenantmanagement" element={
              <ProtectedRoute>
                <TenantManagement />
              </ProtectedRoute>
            } />
            <Route path="/invoicemanagement" element={
              <ProtectedRoute>
                <InvoiceManagement />
              </ProtectedRoute>
            } />
            <Route path="/maintenancerequest" element={
              <ProtectedRoute>
                <MaintenanceRequest />
              </ProtectedRoute>
            } />
            <Route path="/assetmanagement" element={
              <ProtectedRoute>
                <AssetManagement />
              </ProtectedRoute>
            } />
            <Route path="/packagemanagement" element={
              <ProtectedRoute>
                <PackageManagement />
              </ProtectedRoute>
            } />
            <Route path="/maintenanceschedule" element={
              <ProtectedRoute>
                <MaintenanceSchedule />
              </ProtectedRoute>
            } />
            
            {/* Detail Pages */}
            <Route path="/tenantdetail" element={
              <ProtectedRoute>
                <TenantDetail />
              </ProtectedRoute>
            } />
            <Route path="/roomdetail" element={
              <ProtectedRoute>
                <RoomDetail />
              </ProtectedRoute>
            } />
            <Route path="/invoicedetails" element={
              <ProtectedRoute>
                <InvoiceDetails />
              </ProtectedRoute>
            } />
            <Route path="/maintenancedetails" element={
              <ProtectedRoute>
                <MaintenanceDetails />
              </ProtectedRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
