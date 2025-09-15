import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Skeleton,
  Tabs,
  Tab,
  Paper,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { ArrowBack, CalendarToday, AccessTime, Person, ViewDay, CalendarMonth, Stars, CardGiftcard } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../utils/api';
import toast from 'react-hot-toast';
import BookingCalendar from './BookingCalendar';
import CustomerLoyalty from './CustomerLoyalty';

const BookingForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'calendar'
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    service: '',
    stylist: '',
    appointmentDate: null,
    appointmentTime: '',
    notes: '',
    useReward: false
  });
  
  const [loyaltyReward, setLoyaltyReward] = useState(null);

  // Fetch services and staff when component mounts
  useEffect(() => {
    fetchServices();
    fetchStaff();
  }, []);

  useEffect(() => {
    if (formData.appointmentDate) {
      fetchAvailableSlots(formData.appointmentDate);
    }
  }, [formData.appointmentDate]);

  // Fetch services from API
  const fetchServices = async () => {
    setLoadingServices(true);
    setError(null);
    try {
      const response = await api.get('/api/services');
      // Only include active services
      const activeServices = response.data.filter(service => service.isActive);
      setServices(activeServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again later.');
      toast.error('Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  // Fetch staff from API
  const fetchStaff = async () => {
    setLoadingStaff(true);
    setError(null);
    try {
      const response = await api.get('/api/staff');
      // Only include active staff members
      const activeStaff = response.data.filter(staffMember => staffMember.isActive);
      setStaff(activeStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to load staff. Please try again later.');
      toast.error('Failed to load staff');
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const response = await api.get(`/api/bookings/availability/${formattedDate}`);
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      toast.error('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleTimeSlotSelect = (date, time) => {
    setFormData(prev => ({
      ...prev,
      appointmentDate: dayjs(date),
      appointmentTime: time
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || 
        !formData.service || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Get the selected service details for the booking
      const selectedService = services.find(s => s._id === formData.service);
      
      const bookingData = {
        ...formData,
        appointmentDate: dayjs(formData.appointmentDate).format('YYYY-MM-DD'),
        // Include service details for the booking
        serviceDetails: selectedService ? {
          id: selectedService._id,
          name: selectedService.name,
          duration: selectedService.duration,
          price: selectedService.price
        } : null
      };

      // Create the booking
      const bookingResponse = await api.post('/api/bookings', bookingData);
      
      // If using loyalty reward, redeem points
      if (formData.useReward && loyaltyReward) {
        try {
          await api.post(`/api/loyalty/customer/${formData.customerEmail}/redeem`, {
            bookingId: bookingResponse.data.booking.id
          });
          toast.success('Loyalty reward applied to your booking!');
        } catch (loyaltyError) {
          console.error('Loyalty redemption error:', loyaltyError);
          // Don't fail the booking if loyalty redemption fails
        }
      }
      
      toast.success('Booking created successfully!');
      navigate('/thank-you?type=booking');
    } catch (error) {
      console.error('Booking error:', error);
      const message = error.response?.data?.message || 'Failed to create booking';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoyaltyRewardSuccess = (rewardAmount) => {
    setLoyaltyReward(rewardAmount);
    setFormData(prev => ({
      ...prev,
      useReward: true
    }));
    toast.success(`$${rewardAmount} reward available!`);
  };

  const isWeekend = (date) => {
    const day = dayjs(date).day();
    return day === 0; // Sunday closed
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F8F9FA 0%, #E8EAF6 100%)',
          py: 3
        }}
      >
        <Container maxWidth="md">
          {/* Header */}
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" color="primary" fontWeight="bold">
              Book Your Appointment
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Personal Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1 }} />
                      Personal Information
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      required
                    />
                  </Grid>

                  {/* Service Selection */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Service Details
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Service</InputLabel>
                      {loadingServices ? (
                        <Skeleton variant="rectangular" height={56} />
                      ) : (
                        <Select
                          value={formData.service}
                          label="Service"
                          onChange={(e) => handleInputChange('service', e.target.value)}
                          disabled={loadingServices || services.length === 0}
                        >
                          {services.length > 0 ? (
                            services.map((service) => (
                              <MenuItem key={service._id} value={service._id}>
                                <Box>
                                  <Typography variant="body1">{service.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {service.duration} min • ${service.price}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>No services available</MenuItem>
                          )}
                        </Select>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Preferred Stylist (Optional)</InputLabel>
                      {loadingStaff ? (
                        <Skeleton variant="rectangular" height={56} />
                      ) : (
                        <Select
                          value={formData.stylist}
                          label="Preferred Stylist (Optional)"
                          onChange={(e) => handleInputChange('stylist', e.target.value)}
                          disabled={loadingStaff}
                        >
                          <MenuItem value="">Any Available Stylist</MenuItem>
                          {staff.length > 0 ? (
                            staff.map((staffMember) => (
                              <MenuItem key={staffMember._id} value={staffMember._id}>
                                {staffMember.name} - {staffMember.title}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>No stylists available</MenuItem>
                          )}
                        </Select>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Date and Time Selection */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ mr: 1 }} />
                        Date & Time
                      </Typography>
                      
                      <Tabs 
                        value={viewMode} 
                        onChange={(e, newValue) => setViewMode(newValue)}
                        indicatorColor="primary"
                        textColor="primary"
                      >
                        <Tab 
                          value="form" 
                          label="Simple" 
                          icon={<ViewDay />} 
                          iconPosition="start"
                        />
                        <Tab 
                          value="calendar" 
                          label="Calendar" 
                          icon={<CalendarMonth />} 
                          iconPosition="start"
                        />
                      </Tabs>
                    </Box>
                  </Grid>

                  {viewMode === 'form' ? (
                    <>
                      <Grid item xs={12} md={6}>
                        <DatePicker
                          label="Appointment Date"
                          value={formData.appointmentDate}
                          onChange={(date) => handleInputChange('appointmentDate', date)}
                          shouldDisableDate={isWeekend}
                          minDate={dayjs()}
                          maxDate={dayjs().add(3, 'month')}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required disabled={!formData.appointmentDate}>
                          <InputLabel>
                            <Box display="flex" alignItems="center">
                              <AccessTime sx={{ mr: 1, fontSize: 20 }} />
                              Appointment Time
                            </Box>
                          </InputLabel>
                          <Select
                            value={formData.appointmentTime}
                            label="Appointment Time"
                            onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                          >
                            {loadingSlots ? (
                              <MenuItem disabled>
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                Loading available times...
                              </MenuItem>
                            ) : (
                              availableSlots.map((slot) => (
                                <MenuItem key={slot} value={slot}>
                                  {slot}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={12}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <BookingCalendar 
                          onSelectTimeSlot={handleTimeSlotSelect}
                          selectedService={formData.service}
                          selectedStaff={formData.stylist}
                        />
                        
                        {formData.appointmentDate && formData.appointmentTime && (
                          <Box sx={{ mt: 2, p: 1, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}>
                            <Typography variant="subtitle1" align="center">
                              Selected: {dayjs(formData.appointmentDate).format('dddd, MMMM D')} at {formData.appointmentTime}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  )}

                  {/* Additional Notes */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Notes (Optional)"
                      multiline
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any specific requests, allergies, or preferences..."
                    />
                  </Grid>

                  {/* Service Info */}
                  {formData.service && !loadingServices && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Selected Service:</strong> {services.find(s => s._id === formData.service)?.name}
                          <br />
                          <strong>Duration:</strong> {services.find(s => s._id === formData.service)?.duration} minutes
                          <br />
                          <strong>Price:</strong> ${services.find(s => s._id === formData.service)?.price}
                          {loyaltyReward && formData.useReward && (
                            <>
                              <br />
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', mt: 1 }}>
                                <CardGiftcard sx={{ mr: 0.5 }} />
                                <strong>Loyalty Discount:</strong> -${loyaltyReward}
                              </Box>
                            </>
                          )}
                          {services.find(s => s._id === formData.service)?.description && (
                            <>
                              <br />
                              <strong>Description:</strong> {services.find(s => s._id === formData.service)?.description}
                            </>
                          )}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                  
                  {/* Loyalty Program */}
                  {formData.customerEmail && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 3 }} />
                      <CustomerLoyalty 
                        bookingEmail={formData.customerEmail} 
                        onRedeemSuccess={handleLoyaltyRewardSuccess}
                      />
                      
                      {loyaltyReward && (
                        <Box sx={{ mt: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.useReward}
                                onChange={(e) => handleInputChange('useReward', e.target.checked)}
                                color="secondary"
                              />
                            }
                            label={
                              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Stars sx={{ mr: 0.5, color: 'secondary.main' }} />
                                Apply ${loyaltyReward} loyalty reward to this booking
                              </Typography>
                            }
                          />
                        </Box>
                      )}
                    </Grid>
                  )}

                  {/* Error Message */}
                  {error && (
                    <Grid item xs={12}>
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                      </Alert>
                    </Grid>
                  )}
                  
                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="center" mt={3}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading || loadingServices || loadingStaff}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 25,
                          background: 'linear-gradient(135deg, #2D1B69 0%, #5E4BA4 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #1A0F3D 0%, #2D1B69 100%)'
                          }
                        }}
                      >
                        {loading ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Booking...
                          </>
                        ) : (
                          'Confirm Booking'
                        )}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default BookingForm;
