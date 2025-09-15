import React, { useState } from 'react';
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
  Rating,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  IconButton
} from '@mui/material';
import { ArrowBack, Feedback as FeedbackIcon } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedbackForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    customerEmail: '',
    customerName: '',
    service: '',
    stylist: '',
    isAnonymous: false
  });

  const services = [
    { value: 'haircut', label: 'Haircut' },
    { value: 'braids', label: 'Braids' },
    { value: 'coloring', label: 'Hair Coloring' },
    { value: 'styling', label: 'Hair Styling' },
    { value: 'treatment', label: 'Hair Treatment' },
    { value: 'consultation', label: 'Consultation' }
  ];

  const stylists = [
    'Sarah Johnson',
    'Maria Rodriguez',
    'Ashley Chen',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/feedback', formData);
      toast.success('Thank you for your feedback!');
      navigate('/thank-you?type=feedback');
    } catch (error) {
      console.error('Feedback error:', error);
      const message = error.response?.data?.message || 'Failed to submit feedback';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (value) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[value] || '';
  };

  return (
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
            Share Your Feedback
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <FeedbackIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                How was your experience?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your feedback helps us provide better service
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Rating */}
                <Grid item xs={12}>
                  <Box textAlign="center" mb={2}>
                    <Typography variant="h6" gutterBottom>
                      Overall Rating *
                    </Typography>
                    <Rating
                      name="rating"
                      value={formData.rating}
                      onChange={(event, newValue) => handleInputChange('rating', newValue)}
                      size="large"
                      sx={{
                        fontSize: '3rem',
                        '& .MuiRating-iconFilled': {
                          color: '#FFD700'
                        }
                      }}
                    />
                    {formData.rating > 0 && (
                      <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
                        {getRatingLabel(formData.rating)}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Comment */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tell us about your experience"
                    multiline
                    rows={4}
                    value={formData.comment}
                    onChange={(e) => handleInputChange('comment', e.target.value)}
                    placeholder="What did you like? How can we improve?"
                    inputProps={{ maxLength: 1000 }}
                    helperText={`${formData.comment.length}/1000 characters`}
                  />
                </Grid>

                {/* Anonymous Checkbox */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isAnonymous}
                        onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Submit feedback anonymously"
                  />
                </Grid>

                {/* Contact Information (if not anonymous) */}
                {!formData.isAnonymous && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Contact Information (Optional)
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Your Name"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      />
                    </Grid>
                  </>
                )}

                {/* Service Details */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Service Details (Optional)
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Service Received</InputLabel>
                    <Select
                      value={formData.service}
                      label="Service Received"
                      onChange={(e) => handleInputChange('service', e.target.value)}
                    >
                      {services.map((service) => (
                        <MenuItem key={service.value} value={service.value}>
                          {service.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Stylist</InputLabel>
                    <Select
                      value={formData.stylist}
                      label="Stylist"
                      onChange={(e) => handleInputChange('stylist', e.target.value)}
                    >
                      {stylists.map((stylist) => (
                        <MenuItem key={stylist} value={stylist}>
                          {stylist}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" mt={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
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
                          Submitting...
                        </>
                      ) : (
                        'Submit Feedback'
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
  );
};

export default FeedbackForm;
