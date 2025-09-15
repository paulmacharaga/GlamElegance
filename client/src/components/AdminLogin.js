import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import api from '../utils/api';
import toast from 'react-hot-toast';
import glamLogo from '../assets/glam-new-logo.png';
// Google authentication temporarily disabled
// import TraditionalGoogleButton from './TraditionalGoogleButton';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', formData);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Token is automatically handled by the API interceptor
      
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
                  label="Username or Email"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
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
