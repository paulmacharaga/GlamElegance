import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Grid
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Category,
  Build
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const AdminHierarchicalServices = () => {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Category management state
  const [categoryDialog, setCategoryDialog] = useState({ open: false, category: null, isEdit: false });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    displayOrder: 0
  });
  
  // Service management state
  const [serviceDialog, setServiceDialog] = useState({ open: false, service: null, isEdit: false });
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    basePrice: '',
    baseDuration: '',
    displayOrder: 0
  });

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  // Utility function to get valid token
  const getValidToken = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('staffToken');

    if (!token || token === 'null' || token === 'undefined') {
      toast.error('Please login again to continue.');
      return null;
    }

    // Check if token is expired by trying to decode it
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp && payload.exp < currentTime) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('staffToken');
        return null;
      }

      return token;
    } catch (error) {
      console.error('Invalid token format:', error);
      toast.error('Invalid session. Please login again.');
      localStorage.removeItem('token');
      localStorage.removeItem('staffToken');
      return null;
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/hierarchical-services/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        setError('Failed to load service categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load service categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const token = getValidToken();
      if (!token) {
        return; // Skip if no valid token
      }

      const response = await fetch('/api/hierarchical-services/admin/all-services', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Category CRUD operations
  const openCategoryDialog = (category = null) => {
    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        displayOrder: category.displayOrder || 0
      });
      setCategoryDialog({ open: true, category, isEdit: true });
    } else {
      setCategoryForm({
        name: '',
        description: '',
        icon: '',
        displayOrder: categories.length
      });
      setCategoryDialog({ open: true, category: null, isEdit: false });
    }
  };

  const saveCategoryDialog = async () => {
    try {
      const token = getValidToken();
      if (!token) {
        return; // Error already shown by getValidToken
      }

      const url = categoryDialog.isEdit
        ? `/api/hierarchical-services/admin/categories/${categoryDialog.category.id}`
        : '/api/hierarchical-services/admin/categories';

      const response = await fetch(url, {
        method: categoryDialog.isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryForm)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(categoryDialog.isEdit ? 'Category updated!' : 'Category created!');
        setCategoryDialog({ open: false, category: null, isEdit: false });
        fetchCategories();
      } else {
        console.error('API Error:', data);
        toast.error(data.message || 'Failed to save category');

        // If authentication error, suggest re-login
        if (data.message && data.message.includes('token')) {
          toast.error('Authentication expired. Please logout and login again.');
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category: ' + error.message);
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also delete all services in this category.')) {
      return;
    }
    
    try {
      const token = getValidToken();
      if (!token) {
        return;
      }

      const response = await fetch(`/api/hierarchical-services/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Category deleted!');
        fetchCategories();
        fetchServices();
      } else {
        toast.error(data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Service CRUD operations
  const openServiceDialog = (service = null) => {
    if (service) {
      setServiceForm({
        name: service.name,
        description: service.description || '',
        categoryId: service.categoryId,
        basePrice: service.basePrice.toString(),
        baseDuration: service.baseDuration.toString(),
        displayOrder: service.displayOrder || 0
      });
      setServiceDialog({ open: true, service, isEdit: true });
    } else {
      setServiceForm({
        name: '',
        description: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        basePrice: '',
        baseDuration: '',
        displayOrder: services.length
      });
      setServiceDialog({ open: true, service: null, isEdit: false });
    }
  };

  const saveServiceDialog = async () => {
    try {
      const token = getValidToken();
      if (!token) {
        return;
      }
      const url = serviceDialog.isEdit 
        ? `/api/hierarchical-services/admin/services/${serviceDialog.service.id}`
        : '/api/hierarchical-services/admin/services';
      
      const response = await fetch(url, {
        method: serviceDialog.isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...serviceForm,
          basePrice: serviceForm.basePrice ? parseFloat(serviceForm.basePrice) : null,
          baseDuration: serviceForm.baseDuration ? parseInt(serviceForm.baseDuration) : null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(serviceDialog.isEdit ? 'Service updated!' : 'Service created!');
        setServiceDialog({ open: false, service: null, isEdit: false });
        fetchServices();
        fetchCategories(); // Refresh to update service counts
      } else {
        toast.error(data.message || 'Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      const token = getValidToken();
      if (!token) {
        return;
      }

      const response = await fetch(`/api/hierarchical-services/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Service deleted!');
        fetchServices();
        fetchCategories();
      } else {
        toast.error(data.message || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  if (loading && categories.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Service Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => {
            fetchCategories();
            fetchServices();
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Category />} label="Categories" />
          <Tab icon={<Build />} label="Services" />
        </Tabs>
      </Box>

      {/* Categories Tab */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Service Categories</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCategoryDialog()}
            >
              Add Category
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Services Count</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {category.icon && <span style={{ marginRight: 8 }}>{category.icon}</span>}
                        <Typography fontWeight="medium">{category.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>
                      <Chip label={category._count?.services || 0} size="small" />
                    </TableCell>
                    <TableCell>{category.displayOrder}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => openCategoryDialog(category)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => deleteCategory(category.id)} 
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {categories.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No categories found
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openCategoryDialog()}
              >
                Create Your First Category
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Services Tab */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Services</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openServiceDialog()}
              disabled={categories.length === 0}
            >
              Add Service
            </Button>
          </Box>

          {categories.length === 0 ? (
            <Alert severity="info">
              Please create at least one category before adding services.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <Typography fontWeight="medium">{service.name}</Typography>
                        {service.description && (
                          <Typography variant="body2" color="text.secondary">
                            {service.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{service.category?.name}</TableCell>
                      <TableCell>{service.basePrice ? `$${service.basePrice}` : 'Variable'}</TableCell>
                      <TableCell>{service.baseDuration ? `${service.baseDuration} min` : 'Variable'}</TableCell>
                      <TableCell>{service.displayOrder}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => openServiceDialog(service)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => deleteService(service.id)}
                          size="small"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {services.length === 0 && categories.length > 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No services found
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => openServiceDialog()}
              >
                Create Your First Service
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialog.open} onClose={() => setCategoryDialog({ open: false, category: null, isEdit: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {categoryDialog.isEdit ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Icon (emoji or text)"
            value={categoryForm.icon}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
            margin="normal"
            placeholder="💇‍♀️ or ✂️"
          />
          <TextField
            fullWidth
            label="Display Order"
            type="number"
            value={categoryForm.displayOrder}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog({ open: false, category: null, isEdit: false })}>
            Cancel
          </Button>
          <Button
            onClick={saveCategoryDialog}
            variant="contained"
            disabled={!categoryForm.name.trim()}
          >
            {categoryDialog.isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceDialog.open} onClose={() => setServiceDialog({ open: false, service: null, isEdit: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {serviceDialog.isEdit ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Service Name"
            value={serviceForm.name}
            onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={serviceForm.description}
            onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={serviceForm.categoryId}
            onChange={(e) => setServiceForm(prev => ({ ...prev, categoryId: e.target.value }))}
            margin="normal"
            required
            SelectProps={{ native: true }}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </TextField>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Base Price ($) - Optional"
                type="number"
                value={serviceForm.basePrice}
                onChange={(e) => setServiceForm(prev => ({ ...prev, basePrice: e.target.value }))}
                margin="normal"
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Leave empty if pricing varies"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Duration (minutes) - Optional"
                type="number"
                value={serviceForm.baseDuration}
                onChange={(e) => setServiceForm(prev => ({ ...prev, baseDuration: e.target.value }))}
                margin="normal"
                inputProps={{ min: 1, step: 1 }}
                helperText="Leave empty if duration varies"
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Display Order"
            type="number"
            value={serviceForm.displayOrder}
            onChange={(e) => setServiceForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialog({ open: false, service: null, isEdit: false })}>
            Cancel
          </Button>
          <Button
            onClick={saveServiceDialog}
            variant="contained"
            disabled={!serviceForm.name.trim() || !serviceForm.categoryId}
          >
            {serviceDialog.isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminHierarchicalServices;
