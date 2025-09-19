import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { Google } from '@mui/icons-material';
// import axios from 'axios'; // Uncomment when Google auth is implemented
import toast from 'react-hot-toast';
import GoogleAuthButton from './GoogleAuthButton';

const GoogleAccountManager = () => {
  // User state will be used when Google auth is implemented
  // const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    // Google account functionality is not yet implemented
    // This is a placeholder that doesn't make API calls
    const fetchUserData = () => {
      // Get user data from localStorage instead of API call
      try {
        const staffData = localStorage.getItem('staff');
        if (staffData) {
          // User data is available but not used in this placeholder
          // const parsedData = JSON.parse(staffData);
          // setUser(parsedData);
        }
      } catch (error) {
        console.log('Using placeholder user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUnlinkGoogle = () => {
    // Google account functionality is not yet implemented
    toast.info('Google account functionality is not yet implemented');
    setUnlinkDialogOpen(false);
  };

  const handleGoogleAuthSuccess = () => {
    // Google account functionality is not yet implemented
    toast.info('Google account linking is not yet implemented');
    setLinkDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Google Account Integration
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Google account functionality is not yet implemented. This feature will be available in a future update.
          </Alert>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            When implemented, you'll be able to connect your Google account for easier sign-in and account management.
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Google />}
            disabled
          >
            Connect Google Account (Coming Soon)
          </Button>
        </CardContent>
      </Card>
      
      {/* Unlink Dialog - Hidden but kept for future implementation */}
      <Dialog open={unlinkDialogOpen} onClose={() => setUnlinkDialogOpen(false)}>
        <DialogTitle>Unlink Google Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to unlink your Google account? You will no longer be able to sign in using Google.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUnlinkGoogle} color="error" variant="contained">
            Unlink
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Link Dialog - Hidden but kept for future implementation */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)}>
        <DialogTitle>Connect Google Account</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Click the button below to connect your Google account:
          </Typography>
          <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
            <GoogleAuthButton 
              onSuccess={handleGoogleAuthSuccess} 
              buttonText="Connect with Google"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleAccountManager;
