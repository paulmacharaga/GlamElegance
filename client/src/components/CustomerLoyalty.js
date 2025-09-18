import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CardGiftcard,
  Redeem,
  Stars,
  EmojiEvents,
  Search
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const CustomerLoyalty = ({ bookingEmail, onRedeemSuccess }) => {
  const [email, setEmail] = useState(bookingEmail || '');
  const [searchEmail, setSearchEmail] = useState('');
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [programInfo, setProgramInfo] = useState(null);
  const [programLoading, setProgramLoading] = useState(false);

  // Fetch loyalty program info on component mount
  useEffect(() => {
    fetchLoyaltyProgram();
  }, []);

  // Fetch customer loyalty info when email is provided
  useEffect(() => {
    if (email) {
      fetchCustomerLoyalty(email);
    }
  }, [email]);

  const fetchLoyaltyProgram = async () => {
    setProgramLoading(true);
    try {
      const response = await fetch('/api/loyalty/program');
      const data = await response.json();
      setProgramInfo(data);
    } catch (error) {
      console.error('Error fetching loyalty program:', error);
      // Don't show error for program info, it's not critical
    } finally {
      setProgramLoading(false);
    }
  };

  const fetchCustomerLoyalty = async (customerEmail) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/loyalty/customer/${customerEmail}`);
      const data = await response.json();
      setLoyaltyInfo(data);
    } catch (error) {
      console.error('Error fetching customer loyalty:', error);
      if (error.response && error.response.status === 404) {
        setError('Customer not found in loyalty program. Complete a booking to join!');
      } else {
        setError('Failed to load loyalty information. Please try again.');
        toast.error('Failed to load loyalty information');
      }
      setLoyaltyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchEmail) {
      setEmail(searchEmail);
    }
  };

  const handleRedeemOpen = () => {
    setRedeemDialogOpen(true);
  };

  const handleRedeemClose = () => {
    setRedeemDialogOpen(false);
  };

  const handleRedeem = async () => {
    try {
      const response = await fetch(`/api/loyalty/customer/${email}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to redeem points');
      }
      
      toast.success('Points redeemed successfully!');
      setRedeemDialogOpen(false);
      
      // Refresh loyalty info
      fetchCustomerLoyalty(email);
      
      // Notify parent component if needed
      if (onRedeemSuccess) {
        onRedeemSuccess(response.data.rewardAmount);
      }
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast.error(error.response?.data?.message || 'Failed to redeem points');
    }
  };

  const renderProgressBar = () => {
    if (!loyaltyInfo || !programInfo) return null;
    
    const progress = (loyaltyInfo.points / programInfo.rewardThreshold) * 100;
    
    return (
      <Box sx={{ mt: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2" color="text.secondary">
            {loyaltyInfo.points} points
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {programInfo.rewardThreshold} points
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(progress, 100)} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress >= 100 ? 'success.main' : 'primary.main',
            }
          }}
        />
        <Box display="flex" justifyContent="center" mt={1}>
          <Typography variant="body2" color={progress >= 100 ? 'success.main' : 'text.secondary'}>
            {progress >= 100 ? (
              <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                <EmojiEvents sx={{ mr: 0.5, fontSize: 16 }} />
                Reward Available!
              </Box>
            ) : (
              `${loyaltyInfo.pointsToNextReward} more points to next reward`
            )}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Stars sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
        <Typography variant="h5" component="h2">
          Loyalty Program
        </Typography>
      </Box>
      
      {programInfo && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            {programInfo.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {programInfo.description || 'Earn points with every booking and redeem them for discounts on future services!'}
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
            <Chip 
              icon={<Stars />} 
              label={`${programInfo.pointsPerBooking} points per booking`} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              icon={<CardGiftcard />} 
              label={`$${programInfo.rewardAmount} reward at ${programInfo.rewardThreshold} points`} 
              color="secondary" 
              variant="outlined" 
            />
          </Box>
        </Box>
      )}
      
      {programLoading && <CircularProgress size={24} sx={{ mb: 2 }} />}
      
      <Divider sx={{ my: 2 }} />
      
      {!bookingEmail && (
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Check your loyalty points:
          </Typography>
          <Box display="flex" gap={1}>
            <TextField
              size="small"
              label="Email Address"
              variant="outlined"
              fullWidth
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={<Search />}
              disabled={!searchEmail}
            >
              Search
            </Button>
          </Box>
        </Box>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>
      ) : loyaltyInfo ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            {loyaltyInfo.customerName}'s Loyalty Status
          </Typography>
          
          {renderProgressBar()}
          
          <Box display="flex" flexWrap="wrap" gap={2} justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Points
              </Typography>
              <Typography variant="h5" color="primary.main">
                {loyaltyInfo.points}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Earned
              </Typography>
              <Typography variant="h5">
                {loyaltyInfo.totalPointsEarned}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Rewards Redeemed
              </Typography>
              <Typography variant="h5">
                {loyaltyInfo.rewardsRedeemed}
              </Typography>
            </Box>
          </Box>
          
          {loyaltyInfo.points >= (programInfo?.rewardThreshold || 100) && (
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              startIcon={<Redeem />}
              onClick={handleRedeemOpen}
              sx={{ mt: 2 }}
            >
              Redeem Reward (${programInfo?.rewardAmount || 10} off)
            </Button>
          )}
        </Box>
      ) : null}
      
      {/* Redeem Confirmation Dialog */}
      <Dialog open={redeemDialogOpen} onClose={handleRedeemClose}>
        <DialogTitle>Redeem Loyalty Reward</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to redeem {programInfo?.rewardThreshold || 100} points for a ${programInfo?.rewardAmount || 10} discount?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This reward can be applied to your next booking.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRedeemClose}>Cancel</Button>
          <Button onClick={handleRedeem} color="primary" variant="contained">
            Redeem Now
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CustomerLoyalty;
