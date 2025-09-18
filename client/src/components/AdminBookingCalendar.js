import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  AccessTime,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AdminBookingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, booking: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookingDate: '',
    bookingTime: '',
    notes: '',
    status: 'pending'
  });

  // Get the start and end of the current week (memoized to prevent infinite loops)
  const startOfWeek = useMemo(() => currentDate.startOf('week'), [currentDate]);
  const endOfWeek = useMemo(() => currentDate.endOf('week'), [currentDate]);
  
  // Business hours
  const businessHours = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const fetchStaff = async () => {
    try {
      const response = await api.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed while loading staff. Please refresh the page or log in again.');
        toast.error('Authentication failed. Please refresh or log in again.');
      } else {
        setError('Failed to load staff members');
      }
    }
  };

  const refreshBookings = async () => {
    setLoading(true);
    try {
      const startDate = startOfWeek.format('YYYY-MM-DD');
      const endDate = endOfWeek.format('YYYY-MM-DD');

      let url = `/api/bookings?startDate=${startDate}&endDate=${endDate}`;
      if (selectedStaff) {
        url += `&stylist=${selectedStaff}`;
      }

      const response = await api.get(url);
      setBookings(response.data.bookings || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please refresh the page or log in again.');
        toast.error('Authentication failed. Please refresh the page or log in again.');
        return;
      }
      
      setError('Failed to load bookings');
      setBookings([]);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        const startDate = startOfWeek.format('YYYY-MM-DD');
        const endDate = endOfWeek.format('YYYY-MM-DD');

        let url = `/api/bookings?startDate=${startDate}&endDate=${endDate}`;
        if (selectedStaff) {
          url += `&stylist=${selectedStaff}`;
        }

        const response = await api.get(url);
        setBookings(response.data.bookings || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        
        if (error.response?.status === 401) {
          setError('Authentication failed. Please refresh the page or log in again.');
          toast.error('Authentication failed. Please refresh the page or log in again.');
          return;
        }
        
        setError('Failed to load bookings');
        setBookings([]);
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [startOfWeek, endOfWeek, selectedStaff]);

  const handlePreviousWeek = () => {
    setCurrentDate(currentDate.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentDate(currentDate.add(1, 'week'));
  };

  const handleStaffChange = (event) => {
    setSelectedStaff(event.target.value);
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/status`, { status });
      toast.success('Booking status updated');
      refreshBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleMenuOpen = (event, booking) => {
    setAnchorEl(event.currentTarget);
    setSelectedBooking(booking);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBooking(null);
  };

  const handleEditBooking = () => {
    if (selectedBooking) {
      setEditFormData({
        customerName: selectedBooking.customerName,
        customerEmail: selectedBooking.customerEmail,
        customerPhone: selectedBooking.customerPhone,
        bookingDate: dayjs(selectedBooking.bookingDate).format('YYYY-MM-DD'),
        bookingTime: selectedBooking.bookingTime,
        notes: selectedBooking.notes || '',
        status: selectedBooking.status
      });
      setEditDialog({ open: true, booking: selectedBooking });
    }
    handleMenuClose();
  };

  const handleDeleteBooking = async () => {
    if (selectedBooking && window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.delete(`/api/bookings/${selectedBooking._id}`);
        toast.success('Booking deleted successfully');
        refreshBookings();
      } catch (error) {
        console.error('Failed to delete booking:', error);
        toast.error('Failed to delete booking');
      }
    }
    handleMenuClose();
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editFormData,
        bookingDate: new Date(editFormData.bookingDate)
      };
      
      await api.patch(`/api/bookings/${editDialog.booking._id}`, updateData);
      toast.success('Booking updated successfully');
      setEditDialog({ open: false, booking: null });
      refreshBookings();
    } catch (error) {
      console.error('Failed to update booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, booking: null });
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

  // Group bookings by day and time
  const getBookingsForDayAndTime = (day, time) => {
    try {
      if (!Array.isArray(bookings)) {
        console.warn('Bookings is not an array:', bookings);
        return [];
      }

      const date = startOfWeek.add(day, 'day').format('YYYY-MM-DD');
      return bookings.filter(booking => {
        try {
          if (!booking || !booking.bookingDate || !booking.bookingTime) {
            return false;
          }
          const bookingDate = dayjs(booking.bookingDate).format('YYYY-MM-DD');
          return bookingDate === date && booking.bookingTime === time;
        } catch (error) {
          console.error('Error filtering booking:', error, booking);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in getBookingsForDayAndTime:', error);
      return [];
    }
  };

  // Check if a day is Sunday (closed)
  const isSunday = (day) => {
    return startOfWeek.add(day, 'day').day() === 0;
  };

  // Generate the days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    try {
      return {
        dayIndex: i,
        date: startOfWeek.add(i, 'day'),
        isClosed: isSunday(i)
      };
    } catch (error) {
      console.error('Error generating week day:', error, i);
      return {
        dayIndex: i,
        date: dayjs(),
        isClosed: true
      };
    }
  });

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            error.includes('Authentication failed') || error.includes('session') ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  localStorage.removeItem('staffToken');
                  localStorage.removeItem('staff');
                  window.location.href = '/admin';
                }}
              >
                LOG OUT
              </Button>
            ) : null
          }
        >
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarToday sx={{ mr: 1 }} /> Staff Booking Calendar
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="staff-select-label">Filter by Staff</InputLabel>
            <Select
              labelId="staff-select-label"
              value={selectedStaff}
              label="Filter by Staff"
              onChange={handleStaffChange}
            >
              <MenuItem key="all-staff" value="">All Staff</MenuItem>
              {staff.map((staffMember) => (
                <MenuItem key={staffMember.id || staffMember._id} value={staffMember.name}>
                  {staffMember.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handlePreviousWeek}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="subtitle1" sx={{ mx: 1 }}>
              {startOfWeek.format('MMM D')} - {endOfWeek.format('MMM D, YYYY')}
            </Typography>
            <IconButton onClick={handleNextWeek}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 900, p: 2 }}>
            {/* Calendar Header - Days of the week */}
            <Grid container spacing={1}>
              <Grid item xs={2}>
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle2">Time</Typography>
                </Box>
              </Grid>
              
              {weekDays.map((day) => (
                <Grid item xs key={day.dayIndex}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1, 
                      textAlign: 'center',
                      bgcolor: day.isClosed ? 'grey.100' : day.date.isSame(dayjs(), 'day') ? 'primary.light' : 'background.paper',
                      color: day.date.isSame(dayjs(), 'day') ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="subtitle2">
                      {day.date.format('ddd')}
                    </Typography>
                    <Typography variant="body2">
                      {day.date.format('MMM D')}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Time Slots and Bookings */}
            {businessHours.map((time) => (
              <Grid container spacing={1} key={time} sx={{ mb: 1 }}>
                <Grid item xs={2}>
                  <Box sx={{ p: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2">{time}</Typography>
                  </Box>
                </Grid>
                
                {weekDays.map((day) => {
                  const dayBookings = getBookingsForDayAndTime(day.dayIndex, time);
                  
                  return (
                    <Grid item xs key={`${day.dayIndex}-${time}`}>
                      <Box 
                        sx={{ 
                          height: '100%', 
                          minHeight: dayBookings.length > 0 ? 'auto' : '60px',
                          bgcolor: day.isClosed ? 'grey.100' : 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 0.5
                        }}
                      >
                        {dayBookings.length > 0 ? (
                          dayBookings.map((booking) => (
                            <Card 
                              key={booking._id} 
                              sx={{ 
                                mb: 0.5, 
                                minHeight: 60,
                                bgcolor: getStatusColor(booking.status) === 'success' ? 'success.light' : 
                                       getStatusColor(booking.status) === 'warning' ? 'warning.light' : 
                                       getStatusColor(booking.status) === 'info' ? 'info.light' : 'error.light',
                                '&:hover': { 
                                  transform: 'scale(1.02)',
                                  transition: 'transform 0.2s'
                                }
                              }}
                            >
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                    {booking.customerName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                                    {booking.service?.name || 'Service'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                                    {booking.stylist || 'Staff'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Chip 
                                      label={booking.status} 
                                      size="small" 
                                      color={getStatusColor(booking.status)}
                                      sx={{ fontSize: '0.6rem', height: 16 }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleMenuOpen(e, booking)}
                                      sx={{ p: 0.25 }}
                                    >
                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                                      <Button
                                        key={status}
                                        size="small"
                                        variant={booking.status === status ? 'contained' : 'outlined'}
                                        color={getStatusColor(status)}
                                        onClick={() => updateBookingStatus(booking._id, status)}
                                        sx={{ 
                                          minWidth: 'auto', 
                                          fontSize: '0.6rem', 
                                          px: 0.5, 
                                          py: 0.25,
                                          textTransform: 'capitalize'
                                        }}
                                      >
                                        {status.charAt(0).toUpperCase()}
                                      </Button>
                                    ))}
                                  </Box>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                          ))
                        ) : (
                          // Show empty slot when no bookings
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%',
                            minHeight: '60px',
                            color: 'text.disabled',
                            fontSize: '0.75rem'
                          }}>
                            {day.isClosed ? 'Closed' : ''}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            ))}
          </Box>
        </Paper>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditBooking}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Booking</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteBooking}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Booking</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Booking Dialog */}
      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Booking</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Name"
                value={editFormData.customerName}
                onChange={(e) => handleEditFormChange('customerName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Email"
                type="email"
                value={editFormData.customerEmail}
                onChange={(e) => handleEditFormChange('customerEmail', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Phone"
                value={editFormData.customerPhone}
                onChange={(e) => handleEditFormChange('customerPhone', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Booking Date"
                type="date"
                value={editFormData.bookingDate}
                onChange={(e) => handleEditFormChange('bookingDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Booking Time</InputLabel>
                <Select
                  value={editFormData.bookingTime}
                  label="Booking Time"
                  onChange={(e) => handleEditFormChange('bookingTime', e.target.value)}
                >
                  {businessHours.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  label="Status"
                  onChange={(e) => handleEditFormChange('status', e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={editFormData.notes}
                onChange={(e) => handleEditFormChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminBookingCalendar;
