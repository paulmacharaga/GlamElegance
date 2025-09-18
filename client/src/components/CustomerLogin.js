import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  IconButton,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { ArrowBack, Login, PersonAdd, Visibility, VisibilityOff } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import glamLogo from '../assets/glam-new-logo.png';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    address: ''
  });

  // Check if already logged in
  useEffect(() => {
    const customerToken = localStorage.getItem('customerToken');
    const customer = JSON.parse(localStorage.getItem('customer') || 'null');
    
    if (customerToken && customer) {
      const from = location.state?.from?.pathname || '/customer/dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location.state?.from?.pathname]);

  const handleLoginChange = useCallback((field, value) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleRegisterChange = useCallback((field, value) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email.trim(),
          password: loginData.password
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
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      // Store auth data and redirect
      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customer', JSON.stringify(data.customer));

      toast.success('Login successful!');
      
      // Use the redirect URL from location state or default to dashboard
      const redirectTo = location.state?.from?.pathname || '/customer/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [loginData.email, loginData.password, location.state?.from?.pathname, navigate]);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();

    if (!registerData.name || !registerData.email || !registerData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerData.name.trim(),
          email: registerData.email.trim(),
          password: registerData.password,
          phone: registerData.phone.trim(),
          dateOfBirth: registerData.dateOfBirth || null,
          address: registerData.address.trim()
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
        throw new Error(data.message || `Registration failed with status ${response.status}`);
      }

      // Store auth data and redirect
      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customer', JSON.stringify(data.customer));

      toast.success('Account created successfully!');
      
      // Redirect to dashboard
      navigate('/customer/dashboard', { replace: true });
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }, [registerData, navigate]);

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
            Customer Portal
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
              <Typography variant="h5" gutterBottom>
                Welcome to Glam Elegance
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access your bookings, loyalty rewards, and more
              </Typography>
            </Box>

            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered sx={{ mb: 3 }}>
              <Tab label="Sign In" icon={<Login />} />
              <Tab label="Create Account" icon={<PersonAdd />} />
            </Tabs>

            {activeTab === 0 && (
              <form onSubmit={handleLogin}>
                <Box mb={3}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleLoginChange('email', e.target.value)}
                    required
                  />
                </Box>

                <Box mb={3}>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => handleLoginChange('password', e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
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
              </form>
            )}

            {activeTab === 1 && (
              <form onSubmit={handleRegister}>
                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Full Name *"
                    value={registerData.name}
                    onChange={(e) => handleRegisterChange('name', e.target.value)}
                    required
                  />
                </Box>

                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Email *"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => handleRegisterChange('email', e.target.value)}
                    required
                  />
                </Box>

                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={registerData.phone}
                    onChange={(e) => handleRegisterChange('phone', e.target.value)}
                  />
                </Box>

                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={registerData.dateOfBirth}
                    onChange={(e) => handleRegisterChange('dateOfBirth', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={registerData.address}
                    onChange={(e) => handleRegisterChange('address', e.target.value)}
                  />
                </Box>

                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Password *"
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => handleRegisterChange('password', e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                  />
                </Box>

                <Box mb={3}>
                  <TextField
                    fullWidth
                    label="Confirm Password *"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => handleRegisterChange('confirmPassword', e.target.value)}
                    required
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
                  sx={{
                    py: 1.5,
                    borderRadius: 25,
                    background: 'linear-gradient(135deg, #2D1B69 0%, #5E4BA4 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1A0F3D 0%, #2D1B69 100%)'
                    }
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            )}

            <Divider sx={{ my: 3 }} />
            
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Need help? <Link to="/contact" style={{ color: '#6B2C7A' }}>Contact us</Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CustomerLogin;
