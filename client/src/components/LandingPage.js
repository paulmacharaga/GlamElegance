import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Star,
  BookOnline,
  Feedback,
  Spa,
  ContentCut,
  Palette,
  Person
} from '@mui/icons-material';
// import api from '../utils/api'; // Uncomment when tracking is re-enabled

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // QR scan tracking functionality is temporarily disabled
  // Uncomment this when QR codes are implemented and ready to use
  /*
  useEffect(() => {
    // Track QR scan when landing page loads
    const trackQRScan = async () => {
      try {
        console.log('Tracking QR scan...');
        const response = await api.post('/api/qr/scan');
        console.log('QR scan tracking response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Failed to track QR scan:', error);
        // Don't let tracking errors affect the user experience
        return { success: false, error: error.message };
      }
    };

    trackQRScan();
  }, []);
  */

  const handleGoogleReview = () => {
    // Open Google review page
    const reviewUrl = 'https://g.page/r/CZk1YXkdm5XEEB0/review';
    window.open(reviewUrl, '_blank');
    
    // Google review click tracking is temporarily disabled
    // Uncomment this when tracking is needed
    /*
    try {
      // Track Google review click
      console.log('Tracking Google review click...');
      const response = await api.post('/api/qr/google-review-click');
      console.log('Google review click tracking response:', response.data);
    } catch (error) {
      console.error('Failed to track Google review click:', error);
      // Analytics errors shouldn't affect user experience
    }
    */
  };

  const actionCards = [
    {
      title: 'Leave a Google Review',
      description: 'Share your experience with others',
      icon: <Star sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      action: handleGoogleReview,
      color: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
    },
    {
      title: 'Share Private Feedback',
      description: 'Help us improve our services',
      icon: <Feedback sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      action: () => navigate('/feedback'),
      color: 'linear-gradient(135deg, #2D1B69 0%, #5E4BA4 100%)'
    },
    {
      title: 'Book an Appointment',
      description: 'Schedule your next visit',
      icon: <BookOnline sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
      action: () => navigate('/book'),
      color: 'linear-gradient(135deg, #E91E63 0%, #F48FB1 100%)'
    },
    {
      title: 'Customer Portal',
      description: 'Access your bookings & rewards',
      icon: <Person sx={{ fontSize: 40, color: 'white' }} />,
      action: () => navigate('/customer'),
      color: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'
    }
  ];

  const services = [
    { name: 'Haircuts', icon: <ContentCut /> },
    { name: 'Braids', icon: <Spa /> },
    { name: 'Coloring', icon: <Palette /> }
  ];

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
        <Box textAlign="center" mb={4}>
          {/* Logo */}
          <Box sx={{ mb: 2 }}>
            <img
              src="/glam-new-logo.png"
              alt="Glam Elegance Logo"
              style={{
                height: isMobile ? '80px' : '120px',
                width: 'auto',
                maxWidth: '100%'
              }}
            />
          </Box>
          <Typography
            variant="h1"
            sx={{
              background: 'linear-gradient(135deg, #2D1B69 0%, #E91E63 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              fontSize: isMobile ? '2rem' : '3rem'
            }}
          >
            Glam Elegance
          </Typography>
          <Typography
            variant="h3"
            color="text.secondary"
            sx={{ mb: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }}
          >
            Welcome! How can we help you today?
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose one of the options below to get started
          </Typography>
        </Box>

        {/* Services Icons */}
        <Box display="flex" justifyContent="center" mb={4}>
          {services.map((service, index) => (
            <Box key={index} mx={2} textAlign="center">
              <IconButton
                sx={{
                  background: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    background: theme.palette.primary.dark
                  },
                  mb: 1
                }}
              >
                {service.icon}
              </IconButton>
              <Typography variant="caption" display="block" color="text.secondary">
                {service.name}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Action Cards */}
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} mb={4}>
          {actionCards.map((card, index) => (
            <Grid item xs={3} sm={3} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  border: `2px solid transparent`,
                  '&:hover': {
                    border: `2px solid ${theme.palette.primary.main}`,
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 30px rgba(45, 27, 105, 0.2)'
                  }
                }}
                onClick={card.action}
              >
                <CardContent sx={{ textAlign: 'center', p: { xs: 1, sm: 1.5, md: 2.5 } }}>
                  <Box
                    sx={{
                      width: { xs: 40, sm: 50, md: 70 },
                      height: { xs: 40, sm: 50, md: 70 },
                      borderRadius: '50%',
                      background: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 0.5, sm: 1, md: 1.5 }
                    }}
                  >
                    {React.cloneElement(card.icon, { 
                      sx: { fontSize: { xs: 20, sm: 28, md: 36 }, color: card.icon.props.sx.color } 
                    })}
                  </Box>
                  <Typography variant="h6" gutterBottom color="text.primary" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1.1rem' }, lineHeight: 1.2 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, lineHeight: 1.2 }}>
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Call to Action */}
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" mb={2}>
            Need help? Our team is here to assist you
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/book')}
            sx={{
              borderRadius: 25,
              px: 3,
              py: 1
            }}
          >
            Contact Us
          </Button>
        </Box>

        {/* Footer */}
        <Box textAlign="center" mt={4} pt={3} borderTop={1} borderColor="divider">
          <Typography variant="caption" color="text.secondary">
            © 2024 Hair Studio. Crafted with care for your beauty journey.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
