import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const ProtectedRoute = ({ requiredRole = 'staff' }) => {
  // Check for staff authentication
  const staffToken = localStorage.getItem('staffToken');
  const staff = JSON.parse(localStorage.getItem('staff') || 'null');

  // If no staff token, redirect to login
  if (!staffToken || !staff) {
    toast.error('Please log in to access this page');
    return <Navigate to="/admin" replace />;
  }

  // Check if staff has the required role (if specified)
  if (requiredRole && staff.role !== requiredRole && staff.role !== 'admin') {
    toast.error('You do not have permission to access this page');
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If authenticated and authorized, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
