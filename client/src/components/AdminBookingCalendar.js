import React, { useState, useEffect, useCallback } from 'react';
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
  Divider
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  AccessTime,
  Person,
  Spa
} from '@mui/icons-material';
import dayjs from 'dayjs';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminBookingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the start and end of the current week
  const startOfWeek = currentDate.startOf('week');
  const endOfWeek = currentDate.endOf('week');
  
  // Business hours
  const businessHours = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [currentDate, selectedStaff, fetchBookings]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to load staff members');
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = startOfWeek.format('YYYY-MM-DD');
      const endDate = endOfWeek.format('YYYY-MM-DD');

      let url = `/api/bookings?startDate=${startDate}&endDate=${endDate}`;
      if (selectedStaff) {
        url += `&stylist=${selectedStaff}`;
      }

      const response = await axios.get(url);
      setBookings(response.data.bookings);
      setError(null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
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
      await axios.patch(`/api/bookings/${bookingId}/status`, { status });
      toast.success('Booking status updated');
      fetchBookings();
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
          if (!booking || !booking.appointmentDate || !booking.appointmentTime) {
            return false;
          }
          const bookingDate = dayjs(booking.appointmentDate).format('YYYY-MM-DD');
          return bookingDate === date && booking.appointmentTime === time;
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
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
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
              <MenuItem value="">All Staff</MenuItem>
              {staff.map((staffMember) => (
                <MenuItem key={staffMember._id} value={staffMember.name}>
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
                        {dayBookings.map((booking) => (
                          <Card 
                            key={booking._id} 
                            sx={{ 
                              mb: 0.5, 
                              bgcolor: getStatusColor(booking.status) + '.light',
                              '&:last-child': { mb: 0 }
                            }}
                          >
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                {booking.customerName}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Spa sx={{ fontSize: 12 }} />
                                {booking.service?.name || booking.service || 'Service'}
                              </Typography>
                              {booking.stylist && (
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Person sx={{ fontSize: 12 }} />
                                  {booking.stylist}
                                </Typography>
                              )}
                              <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip 
                                  label={booking.status} 
                                  color={getStatusColor(booking.status)}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.6rem' }}
                                />
                                {booking.status === 'pending' && (
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.6rem', py: 0, minWidth: 'auto' }}
                                    onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                  >
                                    Confirm
                                  </Button>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AdminBookingCalendar;
