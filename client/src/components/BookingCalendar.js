import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Event,
  AccessTime,
  CheckCircle
} from '@mui/icons-material';
import dayjs from 'dayjs';
import axios from 'axios';
import toast from 'react-hot-toast';

const BookingCalendar = ({ onSelectTimeSlot, selectedService }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate dates for the current week
  const generateWeekDates = (date) => {
    try {
      if (!date || !dayjs.isDayjs(date)) {
        console.error('Invalid date provided to generateWeekDates:', date);
        return [];
      }

      const startOfWeek = date.startOf('week');
      const dates = [];

      for (let i = 0; i < 7; i++) {
        const currentDate = startOfWeek.add(i, 'day');
        // Skip Sunday (day 0) if the salon is closed on Sundays
        if (currentDate.day() !== 0) {
          dates.push(currentDate);
        }
      }

      return dates;
    } catch (error) {
      console.error('Error generating week dates:', error);
      return [];
    }
  };

  const weekDates = generateWeekDates(currentDate);

  const fetchAvailableSlots = useCallback(async () => {
    if (!weekDates.length) return;

    setLoading(true);
    setError(null);

    try {
      const startDate = weekDates[0].format('YYYY-MM-DD');
      const endDate = weekDates[weekDates.length - 1].format('YYYY-MM-DD');

      // Build query parameters
      let queryParams = `startDate=${startDate}&endDate=${endDate}`;
      if (selectedService) queryParams += `&serviceId=${selectedService}`;

      const response = await axios.get(`/api/bookings/availability?${queryParams}`);

      if (response.data && typeof response.data.availableSlots === 'object') {
        setAvailableSlots(response.data.availableSlots);
      } else {
        console.warn('Invalid availability response format:', response.data);
        setAvailableSlots({});
      }
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      setError('Failed to load available time slots. Please try again.');
      toast.error('Failed to load available time slots');
      setAvailableSlots({});
    } finally {
      setLoading(false);
    }
  }, [weekDates, selectedService]);

  // Fetch available slots for the current week
  useEffect(() => {
    fetchAvailableSlots();
  }, [currentDate, selectedService, fetchAvailableSlots]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeClick = (time) => {
    setSelectedTime(time);
    
    if (selectedDate && time) {
      const formattedDate = selectedDate.format('YYYY-MM-DD');
      onSelectTimeSlot(formattedDate, time);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentDate(currentDate.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentDate(currentDate.add(1, 'week'));
  };

  const isDateDisabled = (date) => {
    // Disable dates in the past
    return date.isBefore(dayjs(), 'day');
  };

  const getAvailableTimesForDate = (date) => {
    try {
      if (!date || !dayjs.isDayjs(date)) {
        console.warn('Invalid date provided to getAvailableTimesForDate:', date);
        return [];
      }
      const formattedDate = date.format('YYYY-MM-DD');
      return availableSlots[formattedDate] || [];
    } catch (error) {
      console.error('Error getting available times for date:', error, date);
      return [];
    }
  };

  const formatDayLabel = (date) => {
    return date.format('ddd');
  };

  const formatDateLabel = (date) => {
    return date.format('D');
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <Event sx={{ mr: 1 }} />
          Select Date & Time
        </Typography>
        
        <Box>
          <IconButton onClick={handlePreviousWeek} disabled={weekDates[0] && isDateDisabled(weekDates[0])}>
            <ArrowBack />
          </IconButton>
          <Typography variant="body1" component="span" sx={{ mx: 1 }}>
            {weekDates[0]?.format('MMM D')} - {weekDates[weekDates.length - 1]?.format('MMM D')}
          </Typography>
          <IconButton onClick={handleNextWeek}>
            <ArrowForward />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <>
          {/* Date selection */}
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {weekDates.map((date) => {
              const isDisabled = isDateDisabled(date);
              const isSelected = selectedDate && selectedDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
              const hasSlots = getAvailableTimesForDate(date).length > 0;
              
              return (
                <Grid item xs={2} key={date.format('YYYY-MM-DD')}>
                  <Paper
                    elevation={isSelected ? 6 : 1}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      cursor: isDisabled || !hasSlots ? 'not-allowed' : 'pointer',
                      bgcolor: isSelected ? 'primary.light' : isDisabled || !hasSlots ? 'grey.100' : 'white',
                      color: isSelected ? 'white' : isDisabled || !hasSlots ? 'text.disabled' : 'text.primary',
                      '&:hover': {
                        bgcolor: isDisabled || !hasSlots ? 'grey.100' : 'primary.50',
                      },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => !isDisabled && hasSlots && handleDateClick(date)}
                  >
                    <Typography variant="subtitle2">{formatDayLabel(date)}</Typography>
                    <Typography variant="h5">{formatDateLabel(date)}</Typography>
                    
                    {hasSlots && (
                      <Typography variant="caption" display="block">
                        {getAvailableTimesForDate(date).length} slots
                      </Typography>
                    )}
                    
                    {!hasSlots && !isDisabled && (
                      <Typography variant="caption" color="text.secondary">
                        No slots
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {/* Time slot selection */}
          {selectedDate && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <AccessTime sx={{ fontSize: 18, mr: 1, verticalAlign: 'text-bottom' }} />
                Available Times for {selectedDate.format('dddd, MMMM D')}:
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {getAvailableTimesForDate(selectedDate).length > 0 ? (
                  getAvailableTimesForDate(selectedDate).map((time) => (
                    <Chip
                      key={time}
                      label={time}
                      onClick={() => handleTimeClick(time)}
                      color={selectedTime === time ? 'primary' : 'default'}
                      variant={selectedTime === time ? 'filled' : 'outlined'}
                      icon={selectedTime === time ? <CheckCircle /> : null}
                      sx={{ 
                        minWidth: '80px',
                        '&:hover': {
                          bgcolor: selectedTime === time ? 'primary.main' : 'primary.50',
                        }
                      }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No available time slots for this date.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default BookingCalendar;
