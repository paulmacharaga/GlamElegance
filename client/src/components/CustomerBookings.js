import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  Phone,
  Email,
  Edit,
  Cancel,
  Add
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CustomerBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editDialog, setEditDialog] = useState({ open: false, booking: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, booking: null });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('customerToken');
      
      if (!token) {
        navigate('/customer');
        return;
      }

      const response = await fetch('/api/customers/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        throw new Error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return new Date(booking.bookingDate) >= new Date() && booking.status !== 'cancelled';
    }
    if (filter === 'past') {
      return new Date(booking.bookingDate) < new Date();
    }
    return booking.status === filter;
  });

  const handleCancelBooking = async () => {
    if (!cancelDialog.booking) return;

    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`/api/bookings/${cancelDialog.booking.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
        setCancelDialog({ open: false, booking: null });
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          My Bookings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/book')}
          sx={{
            background: 'linear-gradient(135deg, #2D1B69 0%, #5E4BA4 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1A0F3D 0%, #2D1B69 100%)'
            }
          }}
        >
          Book New Appointment
        </Button>
      </Box>

      <Box mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter Bookings</InputLabel>
          <Select
            value={filter}
            label="Filter Bookings"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">All Bookings</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="past">Past</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {filteredBookings.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          {filter === 'all' 
            ? "You don't have any bookings yet. Book your first appointment!" 
            : `No ${filter} bookings found.`
          }
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredBookings.map((booking) => (
            <Grid item xs={12} md={6} key={booking.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="div">
                      Booking #{booking.id.slice(-6)}
                    </Typography>
                    <Chip 
                      label={booking.status.toUpperCase()} 
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarToday sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {format(new Date(booking.bookingDate), 'EEEE, MMMM d, yyyy')}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <AccessTime sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {booking.bookingTime}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <Person sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {booking.customerName}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <Email sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {booking.customerEmail}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={2}>
                    <Phone sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {booking.customerPhone}
                    </Typography>
                  </Box>

                  {booking.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Notes:</strong> {booking.notes}
                      </Typography>
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" gap={1}>
                    {booking.status === 'pending' && new Date(booking.bookingDate) > new Date() && (
                      <Button
                        size="small"
                        startIcon={<Cancel />}
                        color="error"
                        onClick={() => setCancelDialog({ open: true, booking })}
                      >
                        Cancel
                      </Button>
                    )}
                    
                    {booking.status === 'completed' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate('/feedback', { state: { bookingId: booking.id } })}
                      >
                        Leave Review
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, booking: null })}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, booking: null })}>
            Keep Booking
          </Button>
          <Button onClick={handleCancelBooking} color="error" variant="contained">
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerBookings;
