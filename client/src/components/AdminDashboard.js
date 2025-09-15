import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tab,
  Tabs,
  Rating,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Dashboard,
  BookOnline,
  Feedback,
  QrCode,
  Logout,
  MoreVert,
  Refresh,
  Google,
  Spa,
  People,
  CalendarMonth,
  Stars
} from '@mui/icons-material';
import GoogleAccountManager from './GoogleAccountManager';
import ServiceManagement from './ServiceManagement';
import StaffManagement from './StaffManagement';
import AdminBookingCalendar from './AdminBookingCalendar';
import LoyaltyManagement from './LoyaltyManagement';
import axios from 'axios';
import toast from 'react-hot-toast';
import glamLogo from '../assets/glam-new-logo.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/admin');
  }, [navigate]);

  // Define loadDashboardData with useCallback to prevent it from changing on every render
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, feedbackRes, analyticsRes] = await Promise.all([
        axios.get('/api/bookings'),
        axios.get('/api/feedback'),
        axios.get('/api/analytics/dashboard')
      ]);

      setBookings(bookingsRes.data.bookings);
      setFeedback(feedbackRes.data.feedback);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);
  
  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/admin');
      return;
    }

    setUser(JSON.parse(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    loadDashboardData();
  }, [navigate, loadDashboardData]);

  // loadDashboardData is now defined above with useCallback

  // handleLogout is now defined above with useCallback

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.patch(`/api/bookings/${bookingId}/status`, { status });
      toast.success('Booking status updated');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const DashboardOverview = () => (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <QrCode sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary">
              {analytics?.summary?.qrScans || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              QR Scans
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <BookOnline sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
            <Typography variant="h4" color="secondary">
              {analytics?.summary?.bookingsCount || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bookings
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Feedback sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {analytics?.summary?.feedbackCount || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Feedback
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Rating value={analytics?.summary?.averageRating || 0} readOnly />
            <Typography variant="h4" color="warning.main">
              {analytics?.summary?.averageRating?.toFixed(1) || '0.0'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Rating
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Bookings */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Bookings
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.slice(0, 5).map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking.customerName}</TableCell>
                      <TableCell>{booking.service?.name || booking.service}</TableCell>
                      <TableCell>{formatDate(booking.appointmentDate)}</TableCell>
                      <TableCell>{booking.appointmentTime}</TableCell>
                      <TableCell>
                        <Chip 
                          label={booking.status} 
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                          disabled={booking.status !== 'pending'}
                        >
                          Confirm
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const BookingsTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
          <Typography variant="h6">All Bookings</Typography>
          <Button startIcon={<Refresh />} onClick={loadDashboardData}>
            Refresh
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Stylist</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell>{booking.customerName}</TableCell>
                  <TableCell>{booking.customerEmail}</TableCell>
                  <TableCell>{booking.customerPhone}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{booking.service?.name || booking.service}</Typography>
                      {booking.service?.price && (
                        <Typography variant="caption" color="text.secondary">
                          ${booking.service.price} • {booking.service.duration} min
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{booking.stylist || 'Any'}</TableCell>
                  <TableCell>{formatDate(booking.appointmentDate)}</TableCell>
                  <TableCell>{booking.appointmentTime}</TableCell>
                  <TableCell>
                    <Chip 
                      label={booking.status} 
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        // Store booking ID for menu actions
                        e.currentTarget.dataset.bookingId = booking._id;
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const FeedbackTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Customer Feedback
        </Typography>
        <Grid container spacing={2}>
          {feedback.map((item) => (
            <Grid item xs={12} md={6} key={item._id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                    <Rating value={item.rating} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(item.createdAt)}
                    </Typography>
                  </Box>
                  {item.comment && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      "{item.comment}"
                    </Typography>
                  )}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {item.customerName && (
                      <Chip label={item.customerName} size="small" variant="outlined" />
                    )}
                    {item.service && (
                      <Chip label={item.service} size="small" variant="outlined" />
                    )}
                    {item.stylist && (
                      <Chip label={item.stylist} size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
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
      {/* App Bar */}
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
        {user && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Welcome back, {user.name}! You are logged in as {user.role}.
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<Dashboard />} iconPosition="start" label="Dashboard" />
            <Tab icon={<BookOnline />} iconPosition="start" label="Bookings" />
            <Tab icon={<CalendarMonth />} iconPosition="start" label="Calendar" />
            <Tab icon={<Feedback />} iconPosition="start" label="Feedback" />
            <Tab icon={<Spa />} iconPosition="start" label="Services" />
            <Tab icon={<People />} iconPosition="start" label="Staff" />
            <Tab icon={<Stars />} iconPosition="start" label="Loyalty" />
            <Tab icon={<Google />} iconPosition="start" label="Google Account" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {currentTab === 0 && <DashboardOverview />}
        {currentTab === 1 && <BookingsTab />}
        {currentTab === 2 && <AdminBookingCalendar />}
        {currentTab === 3 && <FeedbackTab />}
        {currentTab === 4 && <ServiceManagement />}
        {currentTab === 5 && <StaffManagement />}
        {currentTab === 6 && <LoyaltyManagement />}
        {currentTab === 7 && <GoogleAccountManager />}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => {
            const bookingId = anchorEl?.dataset?.bookingId;
            if (bookingId) updateBookingStatus(bookingId, 'confirmed');
            setAnchorEl(null);
          }}>
            Confirm
          </MenuItem>
          <MenuItem onClick={() => {
            const bookingId = anchorEl?.dataset?.bookingId;
            if (bookingId) updateBookingStatus(bookingId, 'completed');
            setAnchorEl(null);
          }}>
            Mark Complete
          </MenuItem>
          <MenuItem onClick={() => {
            const bookingId = anchorEl?.dataset?.bookingId;
            if (bookingId) updateBookingStatus(bookingId, 'cancelled');
            setAnchorEl(null);
          }}>
            Cancel
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
