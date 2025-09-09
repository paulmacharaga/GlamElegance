import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import toast from 'react-hot-toast';
import axios from 'axios';

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleGoogleAuthSuccess = async () => {
      try {
        // Get token from URL query params
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          toast.error('Authentication failed: No token received');
          navigate('/admin/login');
          return;
        }
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Get user info
        const response = await axios.get('/api/auth/me');
        localStorage.setItem('user', JSON.stringify(response.data));
        
        toast.success('Successfully signed in with Google');
        navigate('/admin/dashboard');
      } catch (error) {
        console.error('Google auth success error:', error);
        toast.error('Failed to complete Google authentication');
        navigate('/admin/login');
      }
    };
    
    handleGoogleAuthSuccess();
  }, [location, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E8EAF6 100%)'
      }}
    >
      <CircularProgress size={60} sx={{ mb: 3 }} />
      <Typography variant="h5" gutterBottom>
        Completing Google Sign In...
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Please wait while we authenticate your account
      </Typography>
    </Box>
  );
};

export default GoogleAuthSuccess;
