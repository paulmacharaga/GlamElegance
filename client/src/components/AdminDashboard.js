import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Toolbar
} from '@mui/material';
import {
  Dashboard,
  BookOnline,
  Spa,
  People,
  Stars,
  Logout
} from '@mui/icons-material';
// GoogleAccountManager import removed as it's not used
import ServiceManagement from './ServiceManagement';
import StaffManagement from './StaffManagement';
import AdminBookingCalendar from './AdminBookingCalendar';
import LoyaltyManagement from './LoyaltyManagement';
// API import removed as it's not used
import toast from 'react-hot-toast';
import glamLogo from '../assets/glam-new-logo.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  // State for action menu (removed as it's not used)
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staff');
    navigate('/admin');
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const staffData = JSON.parse(localStorage.getItem('staff'));
      setStaff(staffData);
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
    const staffToken = localStorage.getItem('staffToken');
    if (!staffToken) {
      navigate('/admin');
      return;
    }
    
    fetchDashboardData();
  }, [fetchDashboardData, navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const routes = ['/admin/dashboard', '/admin/bookings', '/admin/services', '/admin/staff', '/admin/loyalty'];
    navigate(routes[newValue] || '/admin/dashboard');
  };

  const menuItems = [
    { icon: <Dashboard />, label: 'Dashboard', path: '/admin/dashboard', roles: ['admin', 'staff'] },
    { icon: <BookOnline />, label: 'Bookings', path: '/admin/bookings', roles: ['admin', 'staff'] },
    { icon: <Spa />, label: 'Services', path: '/admin/services', roles: ['admin'] },
    { icon: <People />, label: 'Staff', path: '/admin/staff', roles: ['admin'] },
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

      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
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
                {/* Add your dashboard overview content here */}
              </Box>
            )}
            {activeTab === 1 && <AdminBookingCalendar />}
            {activeTab === 2 && <ServiceManagement />}
            {activeTab === 3 && <StaffManagement />}
            {activeTab === 4 && <LoyaltyManagement />}
          </Box>
        </Box>

        {/* Action Menu - Removed as it's not used in this component */}
      </Container>
    </Box>
  );
};

export default AdminDashboard;
