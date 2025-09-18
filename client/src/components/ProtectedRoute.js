import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ requiredRole = 'staff' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Memoize the auth check to prevent unnecessary re-renders
  const authState = useMemo(() => {
    try {
      const staffToken = localStorage.getItem('staffToken');
      const staff = JSON.parse(localStorage.getItem('staff') || 'null');
      
      if (!staffToken || !staff) {
        return { isAuthorized: false, shouldShowError: true };
      }

      // Check if staff has the required role
      const hasRequiredRole = !requiredRole || staff.role === requiredRole || staff.role === 'admin';
      return { 
        isAuthorized: hasRequiredRole, 
        shouldShowError: !hasRequiredRole 
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { isAuthorized: false, shouldShowError: true };
    }
  }, [requiredRole]); // Only recompute when requiredRole changes

  useEffect(() => {
    if (authState.shouldShowError) {
      if (!authState.isAuthorized) {
        toast.error(authState.shouldShowError === 'no-auth' 
          ? 'Please log in to access this page' 
          : 'You do not have permission to access this page');
      }
    }
    
    // Small delay to ensure toast is shown before navigation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [authState]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!authState.isAuthorized) {
    // If not authorized, redirect to login with the current location
    return (
      <Navigate 
        to="/admin" 
        state={{ 
          from: location,
          authError: authState.shouldShowError === 'no-auth' 
            ? 'Please log in to access this page'
            : 'You do not have permission to access this page'
        }} 
        replace 
      />
    );
  }

  // If authorized, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
