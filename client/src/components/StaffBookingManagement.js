import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Edit,
  Email,
  Refresh,
  AttachMoney
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const StaffBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, booking: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [priceForm, setPriceForm] = useState({
    totalPrice: '',
    notes: ''
  });

  const tabs = ['Pending Requests', 'Confirmed Bookings', 'All Bookings'];

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token') || localStorage.getItem('staffToken');
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setError('Failed to load bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!confirmDialog.booking || !priceForm.totalPrice) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setConfirmLoading(true);
      
      const token = localStorage.getItem('token') || localStorage.getItem('staffToken');
      const response = await fetch(`/api/bookings/${confirmDialog.booking.id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          totalPrice: parseFloat(priceForm.totalPrice),
          notes: priceForm.notes
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Booking confirmed and customer notified!');
        setConfirmDialog({ open: false, booking: null });
        setPriceForm({ totalPrice: '', notes: '' });
        fetchBookings(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to confirm booking');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking');
    } finally {
      setConfirmLoading(false);
    }
  };

  const openConfirmDialog = (booking) => {
    setConfirmDialog({ open: true, booking });
    setPriceForm({
      totalPrice: '',
      notes: booking.notes || ''
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, booking: null });
    setPriceForm({ totalPrice: '', notes: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const filterBookings = (status) => {
    switch (status) {
      case 0: return bookings.filter(b => b.status === 'pending');
      case 1: return bookings.filter(b => b.status === 'confirmed');
      case 2: return bookings;
      default: return bookings;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Booking Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchBookings}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab} />
          ))}
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filterBookings(activeTab).map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {booking.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.customerEmail}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.customerPhone}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {booking.service?.name || 'Service not found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.service?.category?.name}
                    </Typography>
                    {booking.serviceVariants && booking.serviceVariants.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {booking.serviceVariants.map((sv) => (
                          <Chip
                            key={sv.id}
                            label={sv.variant.name}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Duration: {booking.totalDuration} min
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body1">
                    {formatDate(booking.bookingDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {booking.bookingTime}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={booking.status}
                    color={getStatusColor(booking.status)}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                
                <TableCell>
                  {booking.totalPrice ? (
                    <Typography variant="body1" fontWeight="medium" color="success.main">
                      ${booking.totalPrice}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Pending pricing
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell>
                  <Box display="flex" gap={1}>
                    {booking.status === 'pending' && (
                      <IconButton
                        color="primary"
                        onClick={() => openConfirmDialog(booking)}
                        title="Confirm with pricing"
                      >
                        <AttachMoney />
                      </IconButton>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <IconButton
                        color="info"
                        title="Resend confirmation email"
                      >
                        <Email />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filterBookings(activeTab).length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No bookings found
          </Typography>
        </Box>
      )}

      {/* Confirm Booking Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Booking with Pricing</DialogTitle>
        <DialogContent>
          {confirmDialog.booking && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {confirmDialog.booking.customerName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Service: {confirmDialog.booking.service?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {formatDate(confirmDialog.booking.bookingDate)} at {confirmDialog.booking.bookingTime}
              </Typography>
              
              <TextField
                fullWidth
                label="Total Price"
                type="number"
                value={priceForm.totalPrice}
                onChange={(e) => setPriceForm(prev => ({ ...prev, totalPrice: e.target.value }))}
                required
                sx={{ mt: 2, mb: 2 }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
              
              <TextField
                fullWidth
                label="Additional Notes (Optional)"
                multiline
                rows={3}
                value={priceForm.notes}
                onChange={(e) => setPriceForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information for the customer..."
              />
              
              <Alert severity="info" sx={{ mt: 2 }}>
                The customer will receive an email confirmation with the final price and booking details.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} disabled={confirmLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBooking}
            variant="contained"
            disabled={confirmLoading || !priceForm.totalPrice}
            startIcon={confirmLoading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {confirmLoading ? 'Confirming...' : 'Confirm & Send Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffBookingManagement;
