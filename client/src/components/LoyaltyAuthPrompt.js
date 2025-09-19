import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Login,
  PersonAdd,
  Stars,
  CardGiftcard
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const LoyaltyAuthPrompt = ({ open, onClose, onAuthSuccess, customerEmail }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: customerEmail || '',
    password: '',
    name: '',
    phone: ''
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting customer sign in...');
      const response = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('Sign in response:', data);

      if (response.ok && data.success) {
        toast.success('Signed in successfully!');
        onAuthSuccess(data.customer);
        onClose();
      } else {
        toast.error(data.message || 'Sign in failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting customer registration...');
      const response = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone
        })
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok && data.success) {
        toast.success('Account created successfully!');
        onAuthSuccess(data.customer);
        onClose();
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Stars sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Join Our Loyalty Program</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box mb={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Sign in or create an account to access loyalty rewards, track your points, and redeem exclusive benefits!
            </Typography>
          </Alert>
          
          <Paper elevation={0} sx={{ bgcolor: 'primary.light', p: 2, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={1}>
              <CardGiftcard sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Loyalty Program Benefits
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              • Earn points with every booking
              • Redeem points for discounts
              • Exclusive member-only offers
              • Birthday rewards
            </Typography>
          </Paper>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab 
            label="Sign In" 
            icon={<Login />} 
            iconPosition="start"
          />
          <Tab 
            label="Create Account" 
            icon={<PersonAdd />} 
            iconPosition="start"
          />
        </Tabs>

        {activeTab === 0 ? (
          // Sign In Form
          <Box>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              margin="normal"
              required
            />
          </Box>
        ) : (
          // Registration Form
          <Box>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone (Optional)"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              margin="normal"
              required
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Skip for Now
        </Button>
        <Button
          variant="contained"
          onClick={activeTab === 0 ? handleSignIn : handleRegister}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Processing...' : (activeTab === 0 ? 'Sign In' : 'Create Account')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoyaltyAuthPrompt;
