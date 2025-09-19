import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { ArrowBack, Login, AdminPanelSettings } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import glamLogo from '../assets/glam-new-logo.png';
// Google authentication temporarily disabled
// import TraditionalGoogleButton from './TraditionalGoogleButton';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  
  // Clear any old tokens on component mount (for token format migration)
  useEffect(() => {
    // Clear potentially incompatible tokens from previous versions
    const token = localStorage.getItem('staffToken');
    if (token) {
      try {
        // Try to decode the token to check if it has the new format
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.type || payload.type !== 'staff') {
          console.log('Clearing old format token');
          localStorage.removeItem('staffToken');
          localStorage.removeItem('staff');
        }
      } catch (error) {
        // Invalid token format, clear it
        console.log('Clearing invalid token');
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staff');
      }
    }
  }, []);

  // Check if already logged in on initial render
  useEffect(() => {
    const staffToken = localStorage.getItem('staffToken');
    const staff = JSON.parse(localStorage.getItem('staff') || 'null');
    
    if (staffToken && staff) {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location.state?.from?.pathname]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!formData.identifier || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Use the staff authentication endpoint
      const response = await fetch('/api/staff-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password
        }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('Login failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      // Store auth data and redirect
      localStorage.setItem('staffToken', data.token);
      localStorage.setItem('staff', JSON.stringify(data.staff));
      
      // Clear any existing user tokens to avoid conflicts
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      toast.success('Login successful!');
      
      // Use the redirect URL from location state or default to dashboard
      const redirectTo = location.state?.from?.pathname || '/admin/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [formData.identifier, formData.password, location.state?.from?.pathname, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E8EAF6 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 3
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" color="primary" fontWeight="bold">
            Admin Login
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Box sx={{ mb: 2 }}>
                <img
                  src={glamLogo}
                  alt="Glam Elegance Logo"
                  style={{
                    height: '80px',
                    width: 'auto',
                    marginBottom: '16px'
                  }}
                />
              </Box>
              <AdminPanelSettings sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" gutterBottom>
                Staff Portal
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access the admin dashboard to manage bookings and feedback
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Email or Username"
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
                  required
                />
              </Box>

              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Login />}
                sx={{
                  py: 1.5,
                  borderRadius: 25,
                  background: 'linear-gradient(135deg, #2D1B69 0%, #5E4BA4 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1A0F3D 0%, #2D1B69 100%)'
                  }
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              
              {/* Google authentication temporarily disabled due to origin restrictions */}
              {/* <Box sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
                <Divider sx={{ flexGrow: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                  OR
                </Typography>
                <Divider sx={{ flexGrow: 1 }} />
              </Box>
              
              <TraditionalGoogleButton /> */}
              
              <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    Google authentication requires updating your Google Cloud Console configuration.
                    Please see the instructions below.
                  </Typography>
                </Alert>
              </Box>
            </form>


          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AdminLogin;
