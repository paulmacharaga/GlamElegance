import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { Google, Delete, Link } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import GoogleAuthButton from './GoogleAuthButton';

const GoogleAccountManager = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUnlinkGoogle = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/unlink-google');
      
      setUser(response.data.user);
      toast.success('Google account unlinked successfully');
      setUnlinkDialogOpen(false);
    } catch (error) {
      console.error('Error unlinking Google account:', error);
      toast.error(error.response?.data?.message || 'Failed to unlink Google account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthSuccess = (data) => {
    if (data.user) {
      setUser(data.user);
      setLinkDialogOpen(false);
      toast.success('Google account linked successfully');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Google color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Google Account Integration</Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {user?.googleId ? (
          <>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar src={user.avatar || undefined} alt={user.name}>
                    {user.name?.charAt(0) || 'U'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={user.name} 
                  secondary={user.email}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    color="error"
                    onClick={() => setUnlinkDialogOpen(true)}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Alert severity="success" sx={{ mt: 2 }}>
              Your Google account is connected. You can use it to sign in to the admin panel.
            </Alert>
          </>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" gutterBottom>
                Connect your Google account for easier sign-in
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<Link />}
                onClick={() => setLinkDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Connect Google Account
              </Button>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Connecting your Google account allows you to sign in without entering your password.
            </Alert>
          </>
        )}
      </CardContent>
      
      {/* Unlink Dialog */}
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
      
      {/* Link Dialog */}
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
    </Card>
  );
};

export default GoogleAccountManager;
