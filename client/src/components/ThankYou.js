import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  CheckCircle,
  Home,
  BookOnline,
  Feedback
} from '@mui/icons-material';

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const theme = useTheme();

  const getContent = () => {
    switch (type) {
      case 'booking':
        return {
          title: 'Booking Confirmed!',
          message: 'Your appointment has been successfully booked. You will receive a confirmation email shortly.',
          icon: <BookOnline sx={{ fontSize: 80, color: theme.palette.primary.main }} />,
          additionalInfo: 'Please arrive 10 minutes early for your appointment.'
        };
      case 'feedback':
        return {
          title: 'Thank You!',
          message: 'Your feedback has been submitted successfully. We appreciate you taking the time to share your experience.',
          icon: <Feedback sx={{ fontSize: 80, color: theme.palette.secondary.main }} />,
          additionalInfo: 'Your input helps us improve our services.'
        };
      default:
        return {
          title: 'Thank You!',
          message: 'Your request has been processed successfully.',
          icon: <CheckCircle sx={{ fontSize: 80, color: theme.palette.primary.main }} />,
          additionalInfo: ''
        };
    }
  };

  const content = getContent();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E8EAF6 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 3
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ textAlign: 'center', p: 5 }}>
            {content.icon}
            
            <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              {content.title}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {content.message}
            </Typography>
            
            {content.additionalInfo && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontStyle: 'italic' }}>
                {content.additionalInfo}
              </Typography>
            )}
            
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                sx={{
                  borderRadius: 25,
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #2D1B69 0%, #5E4BA4 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1A0F3D 0%, #2D1B69 100%)'
                  }
                }}
              >
                Back to Home
              </Button>
              
              {type === 'feedback' && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/book')}
                  sx={{ borderRadius: 25, px: 4, py: 1.5 }}
                >
                  Book Another Appointment
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ThankYou;
