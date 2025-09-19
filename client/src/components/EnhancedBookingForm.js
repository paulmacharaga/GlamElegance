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
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip
} from '@mui/material';
import { ArrowBack, CalendarToday, AccessTime, Person, CheckCircle } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import HierarchicalServiceSelector from './HierarchicalServiceSelector';

const EnhancedBookingForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    appointmentDate: null,
    appointmentTime: '',
    notes: ''
  });

  const steps = [
    'Select Service',
    'Choose Date & Time',
    'Enter Details',
    'Confirm Booking'
  ];

  // Fetch available time slots for selected date
  const fetchAvailableSlots = async (date) => {
    if (!date || !selectedService) return;
    
    try {
      setLoadingSlots(true);
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      const response = await fetch(`/api/bookings/available-slots?date=${formattedDate}&duration=${selectedService.totalDuration}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.slots || []);
      } else {
        setError('Failed to load available time slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle service selection
  const handleServiceSelected = (serviceData) => {
    setSelectedService(serviceData);
    setActiveStep(1);
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      appointmentDate: newDate,
      appointmentTime: '' // Reset time when date changes
    }));
    
    if (newDate) {
      fetchAvailableSlots(newDate);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle time slot selection
  const handleTimeSelect = (time) => {
    setFormData(prev => ({
      ...prev,
      appointmentTime: time
    }));
    setActiveStep(2);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!selectedService || !formData.customerName || !formData.customerEmail || 
          !formData.customerPhone || !formData.appointmentDate || !formData.appointmentTime) {
        setError('Please fill in all required fields');
        return;
      }

      const bookingData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        serviceId: selectedService.service.id,
        variantIds: selectedService.variantIds || [],
        bookingDate: dayjs(formData.appointmentDate).format('YYYY-MM-DD'),
        bookingTime: formData.appointmentTime,
        notes: formData.notes,
        totalDuration: selectedService.totalDuration
        // No totalPrice - staff will set pricing
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Booking created successfully!');
        navigate('/thank-you', { 
          state: { 
            booking: data.booking,
            service: selectedService
          }
        });
      } else {
        setError(data.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else {
      navigate('/');
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Book Your Appointment
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Service Selection */}
          <Step>
            <StepLabel>Select Your Service</StepLabel>
            <StepContent>
              <HierarchicalServiceSelector
                onServiceSelected={handleServiceSelected}
                onBack={activeStep === 0 ? () => navigate('/') : null}
              />
            </StepContent>
          </Step>

          {/* Step 2: Date & Time Selection */}
          <Step>
            <StepLabel>Choose Date & Time</StepLabel>
            <StepContent>
              {selectedService && (
                <Box>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Selected Service
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedService.service.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedService.category.name}
                          </Typography>
                          {selectedService.variants.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {selectedService.variants.map((variant) => (
                                <Chip
                                  key={variant.id}
                                  label={variant.name}
                                  size="small"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body1" color="text.secondary">
                            Duration: {selectedService.totalDuration} minutes
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pricing will be confirmed by staff
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Select Date
                          </Typography>
                          <DatePicker
                            label="Appointment Date"
                            value={formData.appointmentDate}
                            onChange={handleDateChange}
                            minDate={dayjs()}
                            maxDate={dayjs().add(3, 'month')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined'
                              }
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Select Time
                          </Typography>
                          
                          {!formData.appointmentDate ? (
                            <Typography variant="body2" color="text.secondary">
                              Please select a date first
                            </Typography>
                          ) : loadingSlots ? (
                            <Box display="flex" justifyContent="center" py={2}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : availableSlots.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No available slots for this date
                            </Typography>
                          ) : (
                            <Grid container spacing={1}>
                              {availableSlots.map((slot) => (
                                <Grid item xs={6} sm={4} key={slot}>
                                  <Button
                                    variant={formData.appointmentTime === slot ? 'contained' : 'outlined'}
                                    fullWidth
                                    size="small"
                                    onClick={() => handleTimeSelect(slot)}
                                  >
                                    {slot}
                                  </Button>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </StepContent>
          </Step>

          {/* Step 3: Customer Details */}
          <Step>
            <StepLabel>Enter Your Details</StepLabel>
            <StepContent>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Contact Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        required
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                        required
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.customerPhone}
                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                        required
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Special Requests or Notes"
                        multiline
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        variant="outlined"
                        placeholder="Any special requests, allergies, or preferences..."
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!formData.customerName || !formData.customerEmail || !formData.customerPhone}
                    >
                      Review Booking
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </StepContent>
          </Step>

          {/* Step 4: Review & Confirm */}
          <Step>
            <StepLabel>Review & Confirm</StepLabel>
            <StepContent>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Booking Summary
                  </Typography>

                  {selectedService && (
                    <Box>
                      {/* Service Details */}
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Service Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedService.service.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedService.category.name}
                            </Typography>
                            {selectedService.variants.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" gutterBottom>
                                  Selected Options:
                                </Typography>
                                {selectedService.variants.map((variant) => (
                                  <Chip
                                    key={variant.id}
                                    label={variant.name}
                                    size="small"
                                    sx={{ mr: 1, mb: 1 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Grid>
                          <Grid item xs={12} sm={4} textAlign="right">
                            <Typography variant="body1" color="text.secondary">
                              Duration: {selectedService.totalDuration} minutes
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Final pricing will be confirmed by our staff
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Appointment Details */}
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Appointment Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Date
                            </Typography>
                            <Typography variant="body1">
                              {formData.appointmentDate ? dayjs(formData.appointmentDate).format('MMMM D, YYYY') : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Time
                            </Typography>
                            <Typography variant="body1">
                              {formData.appointmentTime || '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Customer Details */}
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Contact Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Name
                            </Typography>
                            <Typography variant="body1">
                              {formData.customerName || '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body1">
                              {formData.customerEmail || '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body1">
                              {formData.customerPhone || '-'}
                            </Typography>
                          </Grid>
                          {formData.notes && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                Notes
                              </Typography>
                              <Typography variant="body1">
                                {formData.notes}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>

                      <Divider sx={{ my: 2 }} />

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="medium" color="text.secondary">
                          Our staff will contact you with pricing and confirmation details
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleSubmit}
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                          {loading ? 'Submitting Request...' : 'Submit Service Request'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </StepContent>
          </Step>
        </Stepper>
      </Container>
    </LocalizationProvider>
  );
};

export default EnhancedBookingForm;
