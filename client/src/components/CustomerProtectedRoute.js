import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CircularProgress, Box } from '@mui/material';

const CustomerProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Memoize the auth check to prevent unnecessary re-renders
  const authState = useMemo(() => {
    try {
      const customerToken = localStorage.getItem('customerToken');
      const customer = JSON.parse(localStorage.getItem('customer') || 'null');
      
      if (!customerToken || !customer) {
        return { isAuthorized: false, shouldShowError: true };
      }

      return { 
        isAuthorized: true, 
        shouldShowError: false 
      };
    } catch (error) {
      console.error('Customer authentication error:', error);
      return { isAuthorized: false, shouldShowError: true };
    }
  }, []); // Only compute once on mount

  useEffect(() => {
    if (authState.shouldShowError && !authState.isAuthorized) {
      toast.error('Please log in to access your account');
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
    // If not authorized, redirect to customer login with the current location
    return (
      <Navigate 
        to="/customer" 
        state={{ 
          from: location,
          authError: 'Please log in to access your account'
        }} 
        replace 
      />
    );
  }

  // If authorized, render the child routes
  return <Outlet />;
};

export default CustomerProtectedRoute;
