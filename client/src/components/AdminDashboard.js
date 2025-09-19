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
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Dashboard,
  BookOnline,
  Spa,
  People,
  PersonAdd,
  Stars,
  Logout
} from '@mui/icons-material';
// GoogleAccountManager import removed as it's not used
import AdminHierarchicalServices from './AdminHierarchicalServices';
import StaffManagement from './StaffManagement';
import StaffBookingManagement from './StaffBookingManagement';
import LoyaltyManagement from './LoyaltyManagement';
import CustomerManagement from './CustomerManagement';
import GoogleAccountManager from './GoogleAccountManager';
import toast from 'react-hot-toast';
import glamLogo from '../assets/glam-new-logo.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  // State for action menu (removed as it's not used)
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentBookings: [],
    upcomingBookings: []
  });

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staff');
    // Also clear any user tokens to ensure clean logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/admin');
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const staffData = JSON.parse(localStorage.getItem('staff'));
      setStaff(staffData);

      // Fetch dashboard statistics
      const token = localStorage.getItem('staffToken');
      if (token) {
        try {
          // Fetch bookings for stats
          const bookingsResponse = await fetch('/api/bookings', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            const bookings = bookingsData.bookings || [];
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const todayBookings = bookings.filter(b => {
              const bookingDate = new Date(b.bookingDate);
              return bookingDate >= today && bookingDate < tomorrow;
            });

            const upcomingBookings = bookings.filter(b => {
              const bookingDate = new Date(b.bookingDate);
              return bookingDate >= today && b.status !== 'cancelled';
            }).slice(0, 5);

            const recentBookings = bookings.filter(b => {
              const bookingDate = new Date(b.bookingDate);
              return bookingDate < today;
            }).slice(0, 5);

            // Get unique customers count
            const uniqueCustomers = new Set(bookings.map(b => b.customerEmail)).size;

            setDashboardStats({
              totalBookings: bookings.length,
              todayBookings: todayBookings.length,
              totalCustomers: uniqueCustomers,
              totalRevenue: bookings.filter(b => b.status === 'completed').length * 50, // Estimate
              recentBookings,
              upcomingBookings
            });
          }
        } catch (statsError) {
          console.error('Error fetching dashboard stats:', statsError);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staff');
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Check authentication and token format
    const staffToken = localStorage.getItem('staffToken');
    if (!staffToken) {
      navigate('/admin');
      return;
    }
    
    // Check if token has new format (migration check)
    try {
      const payload = JSON.parse(atob(staffToken.split('.')[1]));
      if (!payload.type || payload.type !== 'staff') {
        console.log('Token format outdated, redirecting to login');
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staff');
        navigate('/admin');
        return;
      }
    } catch (error) {
      console.log('Invalid token format, redirecting to login');
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staff');
      navigate('/admin');
      return;
    }
    
    fetchDashboardData();
  }, [fetchDashboardData, navigate]);

  // Sync activeTab with current route
  useEffect(() => {
    const routes = ['/admin/dashboard', '/admin/bookings', '/admin/services', '/admin/staff', '/admin/customers', '/admin/loyalty'];
    const currentIndex = routes.indexOf(location.pathname);
    if (currentIndex !== -1) {
      setActiveTab(currentIndex);
    }
  }, [location.pathname]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const routes = ['/admin/dashboard', '/admin/bookings', '/admin/services', '/admin/staff', '/admin/customers', '/admin/loyalty'];
    navigate(routes[newValue] || '/admin/dashboard');
  };

  const menuItems = [
    { icon: <Dashboard />, label: 'Dashboard', path: '/admin/dashboard', roles: ['admin', 'staff'] },
    { icon: <BookOnline />, label: 'Bookings', path: '/admin/bookings', roles: ['admin', 'staff'] },
    { icon: <Spa />, label: 'Services', path: '/admin/services', roles: ['admin'] },
    { icon: <People />, label: 'Staff', path: '/admin/staff', roles: ['admin'] },
    { icon: <PersonAdd />, label: 'Customers', path: '/admin/customers', roles: ['admin', 'staff'] },
    { icon: <Stars />, label: 'Loyalty', path: '/admin/loyalty', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(staff?.role || '')
  );

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
            Glam Elegance Admin
          </Typography>
          <Button color="inherit" onClick={() => navigate('/admin/qr')}>
            QR Generator
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3, px: { xs: 2, sm: 3, md: 4 } }}>
        {staff && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Welcome back, {staff.name}! You are logged in as {staff.role}.
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
            {filteredMenuItems.map((item, index) => {
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
            {/* Tab Content */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h4" gutterBottom>Dashboard Overview</Typography>
                
                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: 120 }}>
                      <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center" width="100%">
                          <BookOnline color="primary" sx={{ mr: 2, fontSize: 40 }} />
                          <Box>
                            <Typography variant="h4">{dashboardStats.totalBookings}</Typography>
                            <Typography color="text.secondary">Total Bookings</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: 120 }}>
                      <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center" width="100%">
                          <Dashboard color="success" sx={{ mr: 2, fontSize: 40 }} />
                          <Box>
                            <Typography variant="h4">{dashboardStats.todayBookings}</Typography>
                            <Typography color="text.secondary">Today's Bookings</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: 120 }}>
                      <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center" width="100%">
                          <People color="info" sx={{ mr: 2, fontSize: 40 }} />
                          <Box>
                            <Typography variant="h4">{dashboardStats.totalCustomers}</Typography>
                            <Typography color="text.secondary">Total Customers</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: 120 }}>
                      <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center" width="100%">
                          <Stars color="warning" sx={{ mr: 2, fontSize: 40 }} />
                          <Box>
                            <Typography variant="h4">${dashboardStats.totalRevenue}</Typography>
                            <Typography color="text.secondary">Est. Revenue</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Recent Activity */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: 400 }}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" gutterBottom>
                          Upcoming Bookings
                        </Typography>
                        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                          {dashboardStats.upcomingBookings.length > 0 ? (
                            dashboardStats.upcomingBookings.map((booking) => (
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
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: 400 }}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" gutterBottom>
                          Google Account Settings
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <GoogleAccountManager />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Quick Actions */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BookOnline />}
                      onClick={() => setActiveTab(1)}
                      sx={{ py: 2 }}
                    >
                      View All Bookings
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Spa />}
                      onClick={() => setActiveTab(2)}
                      sx={{ py: 2 }}
                    >
                      Manage Services
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<People />}
                      onClick={() => setActiveTab(3)}
                      sx={{ py: 2 }}
                    >
                      Manage Staff
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Stars />}
                      onClick={() => setActiveTab(4)}
                      sx={{ py: 2 }}
                    >
                      Loyalty Program
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
            {activeTab === 1 && <StaffBookingManagement />}
            {activeTab === 2 && <AdminHierarchicalServices />}
            {activeTab === 3 && <StaffManagement />}
            {activeTab === 4 && <CustomerManagement />}
            {activeTab === 5 && <LoyaltyManagement />}
          </Box>
        </Box>

        {/* Action Menu - Removed as it's not used in this component */}
      </Container>
    </Box>
  );
};

export default AdminDashboard;
