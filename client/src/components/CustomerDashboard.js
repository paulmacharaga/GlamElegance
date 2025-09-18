import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip
} from '@mui/material';
import {
  Dashboard,
  BookOnline,
  Stars,
  Person,
  Logout,
  CalendarToday,
  TrendingUp
} from '@mui/icons-material';
import CustomerBookings from './CustomerBookings';
import CustomerLoyalty from './CustomerLoyalty';
import CustomerProfile from './CustomerProfile';
import toast from 'react-hot-toast';
import glamLogo from '../assets/glam-new-logo.png';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    upcomingBookings: [],
    recentBookings: [],
    loyaltyPoints: 0,
    totalBookings: 0
  });

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
    toast.success('Logged out successfully');
    navigate('/customer');
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const customerData = JSON.parse(localStorage.getItem('customer'));
      setCustomer(customerData);

      const token = localStorage.getItem('customerToken');
      if (!token) {
        navigate('/customer');
        return;
      }

      // Fetch bookings
      const bookingsResponse = await fetch('/api/customers/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (bookingsResponse.ok) {
        const bookings = await bookingsResponse.json();
        const now = new Date();
        const upcomingBookings = bookings.filter(b => 
          new Date(b.bookingDate) >= now && b.status !== 'cancelled'
        ).slice(0, 3);
        const recentBookings = bookings.filter(b => 
          new Date(b.bookingDate) < now
        ).slice(0, 3);
        
        setDashboardData(prev => ({
          ...prev,
          upcomingBookings,
          recentBookings,
          totalBookings: bookings.length
        }));
      }

      // Fetch loyalty points
      const loyaltyResponse = await fetch('/api/customers/loyalty', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (loyaltyResponse.ok) {
        const loyalty = await loyaltyResponse.json();
        setDashboardData(prev => ({
          ...prev,
          loyaltyPoints: loyalty.totalPoints || 0
        }));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customer');
        navigate('/customer');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const customerToken = localStorage.getItem('customerToken');
    if (!customerToken) {
      navigate('/customer');
      return;
    }
    
    fetchDashboardData();
  }, [fetchDashboardData, navigate]);

  // Sync activeTab with current route
  useEffect(() => {
    const routes = ['/customer/dashboard', '/customer/bookings', '/customer/loyalty', '/customer/profile'];
    const currentIndex = routes.indexOf(location.pathname);
    if (currentIndex !== -1) {
      setActiveTab(currentIndex);
    }
  }, [location.pathname]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const routes = ['/customer/dashboard', '/customer/bookings', '/customer/loyalty', '/customer/profile'];
    navigate(routes[newValue] || '/customer/dashboard');
  };

  const menuItems = [
    { icon: <Dashboard />, label: 'Dashboard', path: '/customer/dashboard' },
    { icon: <BookOnline />, label: 'My Bookings', path: '/customer/bookings' },
    { icon: <Stars />, label: 'Loyalty Rewards', path: '/customer/loyalty' },
    { icon: <Person />, label: 'Profile', path: '/customer/profile' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <img
              src={glamLogo}
              alt="Glam Elegance Logo"
              style={{
                height: '40px',
                width: 'auto',
                marginRight: '12px'
              }}
            />
            <Dashboard sx={{ mr: 1 }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Glam Elegance - Customer Portal
          </Typography>
          <Button color="inherit" onClick={() => navigate('/book')}>
            Book Now
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        {customer && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Welcome back, {customer.name}! 
          </Alert>
        )}

        <Box sx={{ display: 'flex' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            orientation="vertical"
            variant="scrollable"
            sx={{ width: 240, minWidth: 240, borderRight: 1, borderColor: 'divider' }}
          >
            {menuItems.map((item, index) => {
              const isActive = window.location.pathname === item.path;
              return (
                <Tab
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 64,
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    backgroundColor: isActive ? 'rgba(107, 44, 122, 0.1)' : 'transparent',
                    color: isActive ? 'primary.main' : 'inherit',
                    fontWeight: isActive ? 500 : 'normal',
                    '&:hover': {
                      backgroundColor: 'rgba(107, 44, 122, 0.05)',
                    },
                  }}
                />
              );
            })}
          </Tabs>

          <Box sx={{ flexGrow: 1, p: 3 }}>
            {/* Dashboard Overview */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h4" gutterBottom>Dashboard Overview</Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <BookOnline color="primary" sx={{ mr: 2, fontSize: 40 }} />
                          <Box>
                            <Typography variant="h4">{dashboardData.totalBookings}</Typography>
                            <Typography color="text.secondary">Total Bookings</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <Stars color="warning" sx={{ mr: 2, fontSize: 40 }} />
                          <Box>
                            <Typography variant="h4">{dashboardData.loyaltyPoints}</Typography>
                            <Typography color="text.secondary">Loyalty Points</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center">
                          <CalendarToday color="success" sx={{ mr: 2, fontSize: 40 }} />
                          <Box>
                            <Typography variant="h4">{dashboardData.upcomingBookings.length}</Typography>
                            <Typography color="text.secondary">Upcoming</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Upcoming Bookings
                        </Typography>
                        {dashboardData.upcomingBookings.length > 0 ? (
                          dashboardData.upcomingBookings.map((booking) => (
                            <Box key={booking.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="subtitle2">{booking.customerName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime}
                              </Typography>
                              <Chip 
                                label={booking.status} 
                                size="small" 
                                color={booking.status === 'confirmed' ? 'success' : 'default'}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          ))
                        ) : (
                          <Typography color="text.secondary">No upcoming bookings</Typography>
                        )}
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          sx={{ mt: 2 }}
                          onClick={() => navigate('/book')}
                        >
                          Book New Appointment
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Recent Activity
                        </Typography>
                        {dashboardData.recentBookings.length > 0 ? (
                          dashboardData.recentBookings.map((booking) => (
                            <Box key={booking.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="subtitle2">{booking.customerName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime}
                              </Typography>
                              <Chip 
                                label={booking.status} 
                                size="small" 
                                color={booking.status === 'completed' ? 'success' : 'default'}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          ))
                        ) : (
                          <Typography color="text.secondary">No recent activity</Typography>
                        )}
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          sx={{ mt: 2 }}
                          onClick={() => setActiveTab(1)}
                        >
                          View All Bookings
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* My Bookings */}
            {activeTab === 1 && <CustomerBookings />}
            
            {/* Loyalty Rewards */}
            {activeTab === 2 && <CustomerLoyalty />}
            
            {/* Profile */}
            {activeTab === 3 && <CustomerProfile />}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CustomerDashboard;
