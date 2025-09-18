import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Save,
  Stars,
  Add,
  Visibility,
  History,
  Search
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../utils/api';

const LoyaltyManagement = () => {
  // Loyalty Program Settings State
  const [programSettings, setProgramSettings] = useState({
    name: 'Hair Studio Rewards',
    description: 'Earn points with every booking and redeem them for discounts on future services!',
    pointsPerBooking: 10,
    pointsPerDollar: 1,
    rewardThreshold: 100,
    rewardAmount: 10,
    birthdayDiscountRate: 20,
    birthdayDiscountDays: 7,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Customer Loyalty State
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Customer Detail Dialog State
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add Points Dialog State
  const [addPointsDialogOpen, setAddPointsDialogOpen] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsDescription, setPointsDescription] = useState('');

  // Customer Search State
  const [searchEmail, setSearchEmail] = useState('');

  // Define fetchCustomers with useCallback to prevent it from changing on every render
  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const response = await api.get(`/api/loyalty/customers?page=${page + 1}&limit=${rowsPerPage}`);
      setCustomers(response.data.customers || []);
      setTotalCustomers(response.data.total || 0);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching loyalty customers:', error);
        toast.error('Failed to load loyalty customers');
      }
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setCustomersLoading(false);
    }
  }, [page, rowsPerPage]);

  // Fetch loyalty program settings on component mount
  useEffect(() => {
    fetchLoyaltyProgram();
    fetchCustomers();
  }, [fetchCustomers]);

  const fetchLoyaltyProgram = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/loyalty/program');
      setProgramSettings(response.data);
      setError(null);
    } catch (error) {
      if (error.response?.status === 404) {
        // No program exists yet, use defaults - this is normal, not an error
        setError('No loyalty program configured yet. Create one below.');
      } else {
        console.error('Error fetching loyalty program:', error);
        setError('Failed to load loyalty program settings.');
        toast.error('Failed to load loyalty program settings');
      }
    } finally {
      setLoading(false);
    }
  };

  // fetchCustomers is now defined above with useCallback

  const fetchCustomerHistory = async (email) => {
    setHistoryLoading(true);
    try {
      const response = await api.get(`/api/loyalty/customer/${email}/history`);
      setCustomerHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching customer history:', error);
      toast.error('Failed to load customer history');
      setCustomerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await api.post('/api/loyalty/program', programSettings);
      setSuccess(true);
      toast.success('Loyalty program settings saved successfully');
      
      // Refresh data
      fetchLoyaltyProgram();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving loyalty program:', error);
      setError('Failed to save loyalty program settings.');
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProgramSettings({
      ...programSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerHistory(customer.customerEmail);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedCustomer(null);
    setCustomerHistory([]);
  };

  const handleOpenAddPointsDialog = (customer) => {
    setSelectedCustomer(customer);
    setPointsToAdd('');
    setPointsDescription('');
    setAddPointsDialogOpen(true);
  };

  const handleCloseAddPointsDialog = () => {
    setAddPointsDialogOpen(false);
    setPointsToAdd('');
    setPointsDescription('');
  };

  const handleAddPoints = async () => {
    try {
      await api.post(`/api/loyalty/customer/${selectedCustomer.customerEmail}/add-points`, {
        points: pointsToAdd,
        description: pointsDescription
      });
      
      toast.success('Points added successfully');
      handleCloseAddPointsDialog();
      
      // Refresh data
      fetchCustomers();
      
      // If detail dialog is open, refresh customer history
      if (detailDialogOpen) {
        fetchCustomerHistory(selectedCustomer.customerEmail);
      }
    } catch (error) {
      console.error('Error adding points:', error);
      toast.error('Failed to add points');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail) return;
    
    setCustomersLoading(true);
    try {
      const response = await api.get(`/api/loyalty/customer/${searchEmail}`);
      if (response.data) {
        // Find the customer in the database to get full details
        const customerResponse = await api.get(`/api/loyalty/customers`);
        const foundCustomer = customerResponse.data.customers.find(
          c => c.customerEmail.toLowerCase() === searchEmail.toLowerCase()
        );
        
        if (foundCustomer) {
          setCustomers([foundCustomer]);
          setTotalCustomers(1);
        } else {
          // Fallback if we can't find the full customer record
          setCustomers([{
            customerEmail: response.data.customerEmail,
            customerName: response.data.customerName,
            points: response.data.points,
            totalPointsEarned: response.data.totalPointsEarned,
            rewardsRedeemed: response.data.rewardsRedeemed
          }]);
          setTotalCustomers(1);
        }
      }
    } catch (error) {
      console.error('Error searching for customer:', error);
      if (error.response && error.response.status === 404) {
        toast.error('Customer not found');
      } else {
        toast.error('Error searching for customer');
      }
      // Reset to normal view
      fetchCustomers();
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleResetSearch = () => {
    setSearchEmail('');
    fetchCustomers();
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Stars sx={{ mr: 1 }} /> Loyalty Program Management
      </Typography>
      
      {/* Loyalty Program Settings */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Program Settings
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>
        ) : null}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Loyalty program settings saved successfully!
          </Alert>
        )}
        
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Program Name"
            name="name"
            value={programSettings.name}
            onChange={handleInputChange}
            margin="normal"
            variant="outlined"
          />
          
          <TextField
            fullWidth
            label="Program Description"
            name="description"
            value={programSettings.description}
            onChange={handleInputChange}
            margin="normal"
            variant="outlined"
            multiline
            rows={2}
          />
          
          <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
            <TextField
              label="Points Per Booking"
              name="pointsPerBooking"
              type="number"
              value={programSettings.pointsPerBooking}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Stars fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Points Per Dollar"
              name="pointsPerDollar"
              type="number"
              value={programSettings.pointsPerDollar}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Stars fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Reward Threshold"
              name="rewardThreshold"
              type="number"
              value={programSettings.rewardThreshold}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              helperText="Points needed for reward"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Stars fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Reward Amount"
              name="rewardAmount"
              type="number"
              value={programSettings.rewardAmount}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              helperText="Discount amount in dollars"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    $
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Birthday Discount Rate"
              name="birthdayDiscountRate"
              type="number"
              value={programSettings.birthdayDiscountRate}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              helperText="Birthday discount percentage"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    %
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Birthday Discount Days"
              name="birthdayDiscountDays"
              type="number"
              value={programSettings.birthdayDiscountDays}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              helperText="Days before/after birthday discount is valid"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    days
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={programSettings.isActive}
                onChange={handleInputChange}
                name="isActive"
                color="primary"
              />
            }
            label="Program Active"
            sx={{ mt: 2 }}
          />
          
          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSettings}
              disabled={loading}
              startIcon={<Save />}
            >
              Save Settings
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Customer Loyalty Management */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Customer Loyalty
        </Typography>
        
        {/* Search */}
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 3, display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            label="Search by Email"
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
          {searchEmail && (
            <Button 
              variant="outlined" 
              onClick={handleResetSearch}
            >
              Reset
            </Button>
          )}
        </Box>
        
        {customersLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Points</TableCell>
                    <TableCell align="center">Total Earned</TableCell>
                    <TableCell align="center">Rewards Redeemed</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.length > 0 ? (
                    customers.map((customer) => (
                      <TableRow key={customer._id || customer.customerEmail}>
                        <TableCell>{customer.customerName}</TableCell>
                        <TableCell>{customer.customerEmail}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            icon={<Stars fontSize="small" />} 
                            label={customer.points} 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">{customer.totalPointsEarned}</TableCell>
                        <TableCell align="center">{customer.rewardsRedeemed}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewCustomer(customer)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Points">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenAddPointsDialog(customer)}
                            >
                              <Add />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No customers found in the loyalty program
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCustomers}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Customer Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedCustomer && (
          <>
            <DialogTitle>
              Customer Loyalty Details
            </DialogTitle>
            <DialogContent>
              <Box mb={3}>
                <Typography variant="h6">{selectedCustomer.customerName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCustomer.customerEmail}
                </Typography>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current Points
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    {selectedCustomer.points}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Earned
                  </Typography>
                  <Typography variant="h5">
                    {selectedCustomer.totalPointsEarned}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Rewards Redeemed
                  </Typography>
                  <Typography variant="h5">
                    {selectedCustomer.rewardsRedeemed}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <History sx={{ mr: 1 }} /> Points History
              </Typography>
              
              {historyLoading ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : customerHistory.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Points</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerHistory.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {format(new Date(item.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              size="small"
                              label={`${item.type === 'earned' ? '+' : '-'}${item.points}`}
                              color={item.type === 'earned' ? 'success' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.source}</TableCell>
                          <TableCell>{item.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  No points history available
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetailDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Add Points Dialog */}
      <Dialog 
        open={addPointsDialogOpen} 
        onClose={handleCloseAddPointsDialog}
      >
        {selectedCustomer && (
          <>
            <DialogTitle>
              Add Points for {selectedCustomer.customerName}
            </DialogTitle>
            <DialogContent>
              <Box mt={1}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Points to Add"
                  type="number"
                  fullWidth
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Stars fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="dense"
                  label="Description"
                  fullWidth
                  value={pointsDescription}
                  onChange={(e) => setPointsDescription(e.target.value)}
                  placeholder="e.g., Bonus points for referral"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAddPointsDialog}>Cancel</Button>
              <Button 
                onClick={handleAddPoints} 
                color="primary" 
                variant="contained"
                disabled={!pointsToAdd || !pointsDescription}
              >
                Add Points
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default LoyaltyManagement;
