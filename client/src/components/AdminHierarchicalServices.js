import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
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
  Icon
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Edit,
  Delete,
  Refresh,
  PlayArrow
} from '@mui/icons-material';

const AdminHierarchicalServices = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [setupDialog, setSetupDialog] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/hierarchical-services/admin/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
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

  const handleSetupServices = async () => {
    try {
      setSetupLoading(true);
      setError(null);
      
      const response = await fetch('/api/hierarchical-services/admin/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Hierarchical service structure setup completed successfully!');
        setSetupDialog(false);
        fetchCategories(); // Refresh the data
      } else {
        setError(data.message || 'Failed to setup hierarchical services');
      }
    } catch (error) {
      console.error('Error setting up services:', error);
      setError('Failed to setup hierarchical services');
    } finally {
      setSetupLoading(false);
    }
  };

  const getVariantTypeColor = (type) => {
    switch (type) {
      case 'duration': return 'primary';
      case 'intensity': return 'secondary';
      case 'style': return 'success';
      case 'addon': return 'warning';
      case 'length': return 'info';
      default: return 'default';
    }
  };

  const formatPrice = (price) => {
    return price >= 0 ? `+$${price}` : `-$${Math.abs(price)}`;
  };

  const formatDuration = (duration) => {
    return duration >= 0 ? `+${duration}min` : `-${Math.abs(duration)}min`;
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
          Hierarchical Services Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCategories}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => setSetupDialog(true)}
            color="primary"
          >
            Setup Services
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {categories.length === 0 && !loading ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No Hierarchical Services Found
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Set up the hierarchical service structure to get started.
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => setSetupDialog(true)}
              sx={{ mt: 2 }}
            >
              Setup Services Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} key={category.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    {category.icon && (
                      <Icon sx={{ mr: 2, color: 'primary.main' }}>
                        {category.icon}
                      </Icon>
                    )}
                    <Box flexGrow={1}>
                      <Typography variant="h5" gutterBottom>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${category.services.length} services`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  {category.services.map((service) => (
                    <Accordion key={service.id} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" width="100%">
                          <Box flexGrow={1}>
                            <Typography variant="h6">
                              {service.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {service.description}
                            </Typography>
                          </Box>
                          <Box textAlign="right" mr={2}>
                            <Typography variant="h6" color="primary">
                              ${service.basePrice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {service.baseDuration} min
                            </Typography>
                          </Box>
                          <Chip
                            label={`${service.variants.length} variants`}
                            size="small"
                            color="secondary"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {service.variants.length > 0 ? (
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Variant Name</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Price Modifier</TableCell>
                                  <TableCell>Duration Modifier</TableCell>
                                  <TableCell>Description</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {service.variants.map((variant) => (
                                  <TableRow key={variant.id}>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight="medium">
                                        {variant.name}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={variant.type}
                                        size="small"
                                        color={getVariantTypeColor(variant.type)}
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography
                                        variant="body2"
                                        color={variant.priceModifier >= 0 ? 'success.main' : 'error.main'}
                                      >
                                        {variant.priceModifier !== 0 ? formatPrice(variant.priceModifier) : '$0'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography
                                        variant="body2"
                                        color={variant.durationModifier >= 0 ? 'primary.main' : 'warning.main'}
                                      >
                                        {variant.durationModifier !== 0 ? formatDuration(variant.durationModifier) : '0min'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {variant.description || '-'}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No variants configured for this service.
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Setup Confirmation Dialog */}
      <Dialog open={setupDialog} onClose={() => setSetupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Setup Hierarchical Services</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            This will create a comprehensive hierarchical service structure with:
          </Typography>
          <ul>
            <li>4 main service categories (Hair, Nails, Facial, Massage)</li>
            <li>Multiple services within each category</li>
            <li>Customization options for each service</li>
            <li>Pricing and duration variants</li>
          </ul>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will replace any existing service data. Make sure to backup if needed.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupDialog(false)} disabled={setupLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSetupServices}
            variant="contained"
            disabled={setupLoading}
            startIcon={setupLoading ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {setupLoading ? 'Setting up...' : 'Setup Services'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminHierarchicalServices;
