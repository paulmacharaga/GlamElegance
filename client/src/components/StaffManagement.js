import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Chip,
  Grid,
  InputAdornment,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Avatar,
  Tabs,
  Tab,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../utils/api';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentStaff, setCurrentStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    title: 'Stylist',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    bio: '',
    photo: '',
    specialties: [],
    services: [],
    workingHours: {
      monday: { start: '09:00', end: '17:00', isWorking: true },
      tuesday: { start: '09:00', end: '17:00', isWorking: true },
      wednesday: { start: '09:00', end: '17:00', isWorking: true },
      thursday: { start: '09:00', end: '17:00', isWorking: true },
      friday: { start: '09:00', end: '17:00', isWorking: true },
      saturday: { start: '09:00', end: '17:00', isWorking: false },
      sunday: { start: '09:00', end: '17:00', isWorking: false }
    },
    isActive: true
  });

  // Fetch all staff members
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staff');
        window.location.href = '/admin';
      } else {
        toast.error('Failed to load staff members');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch all services for selection
  const fetchServices = async () => {
    try {
      const response = await api.get('/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staff');
        window.location.href = '/admin';
      }
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, []);

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          [field]: field === 'isWorking' ? value : value
        }
      }
    });
  };

  const handleSpecialtiesChange = (event, values) => {
    setFormData({
      ...formData,
      specialties: values
    });
  };

  const handleServicesChange = (event, values) => {
    setFormData({
      ...formData,
      services: values.map(service => service._id)
    });
  };

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setCurrentStaff(null);
    setPasswordError('');
    setFormData({
      name: '',
      title: 'Stylist',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'staff',
      bio: '',
      photo: '',
      specialties: [],
      services: [],
      workingHours: {
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '09:00', end: '17:00', isWorking: false },
        sunday: { start: '09:00', end: '17:00', isWorking: false }
      },
      isActive: true
    });
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (staffMember) => {
    setDialogMode('edit');
    setCurrentStaff(staffMember);

    setFormData({
      name: staffMember.name,
      title: staffMember.title || 'Stylist',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      password: '', // Don't pre-fill password for security
      role: staffMember.role || 'staff',
      bio: staffMember.bio || '',
      photo: staffMember.photo || '',
      specialties: staffMember.specialties || [],
      services: Array.isArray(staffMember.services) ? staffMember.services.map(service => 
        typeof service === 'string' ? service : service._id
      ) : [],
      workingHours: staffMember.workingHours || {
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '09:00', end: '17:00', isWorking: false },
        sunday: { start: '09:00', end: '17:00', isWorking: false }
      },
      isActive: staffMember.isActive
    });
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentStaff(null);
  };

  const validateForm = () => {
    // Password validation only for new staff or when password is being changed
    if (dialogMode === 'add' && !formData.password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (formData.password && formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    setPasswordError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const dataToSend = { ...formData };
      
      // Remove confirmPassword before sending
      delete dataToSend.confirmPassword;
      
      // Only include password if it was changed (for edit mode)
      if (dialogMode === 'edit' && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      if (dialogMode === 'add') {
        await api.post('/api/staff', dataToSend);
        toast.success('Staff member added successfully');
      } else {
        await api.put(`/api/staff/${currentStaff._id}`, dataToSend);
        toast.success('Staff member updated successfully');
      }
      
      handleCloseDialog();
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff member:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staff');
        window.location.href = '/admin';
      } else {
        toast.error(error.response?.data?.message || 'Failed to save staff member');
      }
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear password error when user starts typing
    if ((name === 'password' || name === 'confirmPassword') && passwordError) {
      setPasswordError('');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await api.delete(`/api/staff/${staffId}`);
        
        toast.success('Staff member deleted successfully');
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff member:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('staffToken');
          localStorage.removeItem('staff');
          window.location.href = '/admin';
        } else {
          toast.error(error.response?.data?.message || 'Failed to delete staff member');
        }
      }
    }
  };

  // Filter staff based on search term
  const filteredStaff = staff.filter(staffMember => 
    staffMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (staffMember.email && staffMember.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (staffMember.title && staffMember.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get service names for a staff member
  const getServiceNames = (staffMember) => {
    if (!staffMember.services || !Array.isArray(staffMember.services) || staffMember.services.length === 0) return '-';
    
    return staffMember.services.map(service => {
      const serviceObj = services.find(s => s._id === service || s._id === service._id);
      return serviceObj ? serviceObj.name : 'Unknown Service';
    }).join(', ');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">Staff Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add New Staff Member
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search staff members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell>Photo</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staffMember) => (
                  <TableRow key={staffMember._id} hover>
                    <TableCell>
                      {staffMember.photo ? (
                        <Avatar src={staffMember.photo} alt={staffMember.name} />
                      ) : (
                        <Avatar>{staffMember.name.charAt(0)}</Avatar>
                      )}
                    </TableCell>
                    <TableCell>{staffMember.name}</TableCell>
                    <TableCell>{staffMember.title || 'Stylist'}</TableCell>
                    <TableCell>{staffMember.email || '-'}</TableCell>
                    <TableCell>{getServiceNames(staffMember)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={staffMember.isActive ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={staffMember.isActive ? 'success' : 'default'} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton 
                          color="primary" 
                          size="small" 
                          onClick={() => handleOpenEditDialog(staffMember)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleDeleteStaff(staffMember._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" py={2}>
                      {searchTerm 
                        ? 'No staff members match your search criteria' 
                        : 'No staff members found. Add your first staff member!'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Staff Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Staff Member' : 'Edit Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="staff tabs">
              <Tab icon={<PersonIcon />} label="Basic Info" />
              <Tab icon={<ScheduleIcon />} label="Working Hours" />
              <Tab icon={<ImageIcon />} label="Photo & Bio" />
            </Tabs>
          </Box>

          {/* Basic Info Tab */}
          {tabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  SelectProps={{ native: true }}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={dialogMode === 'add' ? 'Password *' : 'New Password'}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required={dialogMode === 'add'}
                  error={!!passwordError}
                  helperText={passwordError}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              {formData.password && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={!!passwordError}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={formData.specialties}
                  onChange={handleSpecialtiesChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Specialties"
                      placeholder="Add specialties"
                      helperText="Type and press Enter to add specialties"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={services}
                  getOptionLabel={(option) => option.name}
                  value={services.filter(service => formData.services.includes(service._id))}
                  onChange={handleServicesChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Services"
                      placeholder="Select services"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          )}

          {/* Working Hours Tab */}
          {tabValue === 1 && (
            <Grid container spacing={2}>
              {Object.entries(formData.workingHours).map(([day, hours]) => (
                <Grid item xs={12} key={day}>
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                          {day}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={hours.isWorking}
                              onChange={(e) => handleWorkingHoursChange(day, 'isWorking', e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Working"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Start Time"
                          type="time"
                          value={hours.start}
                          onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                          disabled={!hours.isWorking}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="End Time"
                          type="time"
                          value={hours.end}
                          onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                          disabled={!hours.isWorking}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Photo & Bio Tab */}
          {tabValue === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Photo URL"
                  name="photo"
                  value={formData.photo}
                  onChange={handleInputChange}
                  helperText="Enter a URL for the staff member's photo"
                />
              </Grid>
              {formData.photo && (
                <Grid item xs={12} display="flex" justifyContent="center" my={2}>
                  <Avatar
                    src={formData.photo}
                    alt={formData.name}
                    sx={{ width: 100, height: 100 }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.name}
          >
            {dialogMode === 'add' ? 'Add Staff Member' : 'Update Staff Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffManagement;
