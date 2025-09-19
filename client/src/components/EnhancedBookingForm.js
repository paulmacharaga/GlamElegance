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
  Chip,
  FormControlLabel,
  Checkbox,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday,
  AccessTime,
  Person,
  CheckCircle,
  PhotoCamera,
  Delete,
  CloudUpload
} from '@mui/icons-material';
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
    notes: '',
    joinLoyalty: false,
    inspirationImages: [],
    currentHairImages: {
      front: null,
      back: null,
      top: null
    }
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

  // Handle inspiration image uploads
  const handleInspirationImageUpload = (files) => {
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setFormData(prev => ({
      ...prev,
      inspirationImages: [...prev.inspirationImages, ...newImages]
    }));
  };

  // Remove inspiration image
  const removeInspirationImage = (index) => {
    setFormData(prev => {
      const newImages = [...prev.inspirationImages];
      // Clean up the object URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return {
        ...prev,
        inspirationImages: newImages
      };
    });
  };

  // Handle current hair image upload
  const handleCurrentHairImageUpload = (angle, file) => {
    if (!file) return;

    // Clean up previous image URL if exists
    if (formData.currentHairImages[angle]?.preview) {
      URL.revokeObjectURL(formData.currentHairImages[angle].preview);
    }

    setFormData(prev => ({
      ...prev,
      currentHairImages: {
        ...prev.currentHairImages,
        [angle]: {
          file,
          preview: URL.createObjectURL(file)
        }
      }
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
        setLoading(false); // Fix: Reset loading state on validation failure
        return;
      }

      // Create FormData for file uploads
      const formDataToSend = new FormData();

      // Add basic booking data
      formDataToSend.append('customerName', formData.customerName);
      formDataToSend.append('customerEmail', formData.customerEmail);
      formDataToSend.append('customerPhone', formData.customerPhone);
      formDataToSend.append('serviceId', selectedService.service.id);
      formDataToSend.append('bookingDate', dayjs(formData.appointmentDate).format('YYYY-MM-DD'));
      formDataToSend.append('bookingTime', formData.appointmentTime);
      formDataToSend.append('notes', formData.notes || '');
      formDataToSend.append('totalDuration', selectedService.totalDuration);
      formDataToSend.append('joinLoyalty', formData.joinLoyalty);

      // Add variant IDs if any
      if (selectedService.variantIds && selectedService.variantIds.length > 0) {
        formDataToSend.append('variantIds', JSON.stringify(selectedService.variantIds));
      }

      // Add inspiration images (with error handling)
      try {
        formData.inspirationImages.forEach((image, index) => {
          if (image && image.file) {
            formDataToSend.append(`inspirationImages`, image.file);
          }
        });
      } catch (imageError) {
        console.error('Error processing inspiration images:', imageError);
        setError('Error processing inspiration images. Please try again.');
        setLoading(false);
        return;
      }

      // Add current hair images (with error handling)
      try {
        Object.entries(formData.currentHairImages).forEach(([angle, imageData]) => {
          if (imageData && imageData.file) {
            formDataToSend.append(`currentHair_${angle}`, imageData.file);
          }
        });
      } catch (imageError) {
        console.error('Error processing current hair images:', imageError);
        setError('Error processing current hair images. Please try again.');
        setLoading(false);
        return;
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: formDataToSend,
        signal: controller.signal
        // Don't set Content-Type header - let browser set it for FormData
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

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

      // Handle specific error types
      if (error.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error.message || 'Failed to create booking. Please try again.');
      }
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

                    {/* Inspiration Images Upload */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Inspiration Images (Optional)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Upload photos of styles you'd like to achieve
                      </Typography>

                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="inspiration-images-upload"
                        multiple
                        type="file"
                        onChange={(e) => handleInspirationImageUpload(e.target.files)}
                      />
                      <label htmlFor="inspiration-images-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUpload />}
                          sx={{ mb: 2 }}
                        >
                          Upload Inspiration Images
                        </Button>
                      </label>

                      {formData.inspirationImages.length > 0 && (
                        <ImageList sx={{ width: '100%', height: 200 }} cols={4} rowHeight={150}>
                          {formData.inspirationImages.map((image, index) => (
                            <ImageListItem key={index}>
                              <img
                                src={image.preview}
                                alt={`Inspiration ${index + 1}`}
                                loading="lazy"
                                style={{ objectFit: 'cover', height: '100%' }}
                              />
                              <ImageListItemBar
                                actionIcon={
                                  <IconButton
                                    sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                    onClick={() => removeInspirationImage(index)}
                                  >
                                    <Delete />
                                  </IconButton>
                                }
                              />
                            </ImageListItem>
                          ))}
                        </ImageList>
                      )}
                    </Grid>

                    {/* Current Hair Images Upload */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Current Hair Photos (Optional)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Help us understand your current hair condition
                      </Typography>

                      <Grid container spacing={2}>
                        {['front', 'back', 'top'].map((angle) => (
                          <Grid item xs={12} sm={4} key={angle}>
                            <Paper sx={{ p: 2, textAlign: 'center', minHeight: 200 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                {angle.charAt(0).toUpperCase() + angle.slice(1)} View
                              </Typography>

                              {formData.currentHairImages[angle] ? (
                                <Box>
                                  <img
                                    src={formData.currentHairImages[angle].preview}
                                    alt={`Current hair ${angle}`}
                                    style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 4 }}
                                  />
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleCurrentHairImageUpload(angle, null)}
                                    sx={{ mt: 1 }}
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              ) : (
                                <>
                                  <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id={`current-hair-${angle}`}
                                    type="file"
                                    onChange={(e) => handleCurrentHairImageUpload(angle, e.target.files[0])}
                                  />
                                  <label htmlFor={`current-hair-${angle}`}>
                                    <Button
                                      variant="outlined"
                                      component="span"
                                      startIcon={<PhotoCamera />}
                                      size="small"
                                    >
                                      Upload {angle}
                                    </Button>
                                  </label>
                                </>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>

                    {/* Loyalty Program Opt-in */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.joinLoyalty}
                            onChange={(e) => handleInputChange('joinLoyalty', e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">
                              Join our loyalty program
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Earn points with every visit and get exclusive rewards
                            </Typography>
                          </Box>
                        }
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
