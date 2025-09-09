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
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentStaff, setCurrentStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    title: 'Stylist',
    email: '',
    phone: '',
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
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all services for selection
  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/services', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

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
    setFormData({
      name: '',
      title: 'Stylist',
      email: '',
      phone: '',
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
    
    // Find the full service objects that match the IDs in staffMember.services
    const selectedServices = services.filter(service => 
      staffMember.services.some(id => id === service._id || id._id === service._id)
    );
    
    setFormData({
      name: staffMember.name,
      title: staffMember.title || 'Stylist',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      bio: staffMember.bio || '',
      photo: staffMember.photo || '',
      specialties: staffMember.specialties || [],
      services: staffMember.services.map(service => 
        typeof service === 'string' ? service : service._id
      ),
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

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (dialogMode === 'add') {
        await axios.post('/api/staff', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Staff member added successfully');
      } else {
        await axios.put(`/api/staff/${currentStaff._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Staff member updated successfully');
      }
      
      handleCloseDialog();
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff member:', error);
      toast.error(error.response?.data?.message || 'Failed to save staff member');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/staff/${staffId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Staff member deleted successfully');
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff member:', error);
        toast.error('Failed to delete staff member');
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
    if (!staffMember.services || staffMember.services.length === 0) return '-';
    
    return staffMember.services.map(service => {
      if (typeof service === 'string') {
        const foundService = services.find(s => s._id === service);
        return foundService ? foundService.name : '';
      }
      return service.name;
    }).filter(Boolean).join(', ');
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
