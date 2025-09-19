import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Icon,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup
} from '@mui/material';
import { ArrowBack, ArrowForward, ShoppingCart } from '@mui/icons-material';

const HierarchicalServiceSelector = ({ onServiceSelected, onBack }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  // Removed price calculation - customers don't see pricing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    'Select Service Category',
    'Choose Service',
    'Customize Options',
    'Review & Confirm'
  ];

  // Fetch service categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hierarchical-services/categories');
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

  const fetchCategoryServices = async (categoryId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hierarchical-services/categories/${categoryId}/services`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
        setSelectedCategory(data.category);
      } else {
        setError('Failed to load services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceDetails = async (serviceId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hierarchical-services/services/${serviceId}`);
      const data = await response.json();
      
      if (data.success) {
        setServiceDetails(data.service);
        setSelectedVariants({});
        // No price calculation for customers
      } else {
        setError('Failed to load service details');
      }
    } catch (error) {
      console.error('Error fetching service details:', error);
      setError('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  // Price calculation removed - customers don't see pricing

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    fetchCategoryServices(category.id);
    setActiveStep(1);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    fetchServiceDetails(service.id);
    setActiveStep(2);
  };

  const handleVariantChange = (variantType, variantId, isChecked) => {
    const newSelectedVariants = { ...selectedVariants };
    
    if (variantType === 'duration' || variantType === 'intensity' || variantType === 'style') {
      // Radio button behavior - only one selection per type
      newSelectedVariants[variantType] = isChecked ? variantId : null;
    } else {
      // Checkbox behavior - multiple selections allowed
      if (!newSelectedVariants[variantType]) {
        newSelectedVariants[variantType] = [];
      }
      
      if (isChecked) {
        newSelectedVariants[variantType].push(variantId);
      } else {
        newSelectedVariants[variantType] = newSelectedVariants[variantType].filter(id => id !== variantId);
      }
    }
    
    setSelectedVariants(newSelectedVariants);
    // No price calculation for customers
  };

  const handleNext = () => {
    if (activeStep === 2) {
      setActiveStep(3);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleConfirm = () => {
    if (onServiceSelected && selectedService) {
      const allSelectedVariantIds = Object.values(selectedVariants)
        .flat()
        .filter(id => id !== null);

      // Get selected variant details for display
      const selectedVariantDetails = [];
      if (serviceDetails && serviceDetails.variants) {
        Object.values(serviceDetails.variants).flat().forEach(variant => {
          if (allSelectedVariantIds.includes(variant.id)) {
            selectedVariantDetails.push(variant);
          }
        });
      }

      onServiceSelected({
        service: selectedService,
        category: selectedCategory,
        variants: selectedVariantDetails,
        variantIds: allSelectedVariantIds,
        totalDuration: selectedService.baseDuration // Use base duration only
      });
    }
  };

  if (loading && categories.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        Select Your Service
      </Typography>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Step 1: Select Category */}
        <Step>
          <StepLabel>Select Service Category</StepLabel>
          <StepContent>
            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { elevation: 4 },
                      border: selectedCategory?.id === category.id ? 2 : 0,
                      borderColor: 'primary.main'
                    }}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      {category.icon && (
                        <Icon sx={{ fontSize: 48, mb: 1, color: 'primary.main' }}>
                          {category.icon}
                        </Icon>
                      )}
                      <Typography variant="h6" gutterBottom>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                      <Chip 
                        label={`${category._count.services} services`}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </StepContent>
        </Step>

        {/* Step 2: Select Service */}
        <Step>
          <StepLabel>Choose Service</StepLabel>
          <StepContent>
            {selectedCategory && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedCategory.name} Services
                </Typography>
                <Grid container spacing={2}>
                  {services.map((service) => (
                    <Grid item xs={12} sm={6} key={service.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { elevation: 4 },
                          border: selectedService?.id === service.id ? 2 : 0,
                          borderColor: 'primary.main'
                        }}
                        onClick={() => handleServiceSelect(service)}
                      >
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {service.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {service.description}
                          </Typography>
                          <Box display="flex" justifyContent="flex-end" alignItems="center">
                            <Chip
                              label={`${service.baseDuration} min`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          {service._count.variants > 0 && (
                            <Chip 
                              label={`${service._count.variants} options`}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </StepContent>
        </Step>

        {/* Step 3: Customize Options */}
        <Step>
          <StepLabel>Customize Options</StepLabel>
          <StepContent>
            {serviceDetails && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Customize {serviceDetails.name}
                </Typography>

                {serviceDetails.variants && Object.keys(serviceDetails.variants).map((variantType) => (
                  <Box key={variantType} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ textTransform: 'capitalize' }}>
                      {variantType === 'addon' ? 'Add-ons' : variantType}
                    </Typography>

                    {(variantType === 'duration' || variantType === 'intensity' || variantType === 'style') ? (
                      <FormControl component="fieldset">
                        <RadioGroup
                          value={selectedVariants[variantType] || ''}
                          onChange={(e) => handleVariantChange(variantType, e.target.value, true)}
                        >
                          {serviceDetails.variants[variantType].map((variant) => (
                            <FormControlLabel
                              key={variant.id}
                              value={variant.id}
                              control={<Radio />}
                              label={
                                <Box>
                                  <Typography variant="body1">
                                    {variant.name}
                                  </Typography>
                                  {variant.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {variant.description}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    ) : (
                      <FormGroup>
                        {serviceDetails.variants[variantType].map((variant) => (
                          <FormControlLabel
                            key={variant.id}
                            control={
                              <Checkbox
                                checked={selectedVariants[variantType]?.includes(variant.id) || false}
                                onChange={(e) => handleVariantChange(variantType, variant.id, e.target.checked)}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body1">
                                  {variant.name}
                                </Typography>
                                {variant.description && (
                                  <Typography variant="body2" color="text.secondary">
                                    {variant.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        ))}
                      </FormGroup>
                    )}
                  </Box>
                ))}

                {/* Price summary removed - customers don't see pricing */}

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForward />}
                  >
                    Review Selection
                  </Button>
                </Box>
              </Box>
            )}
          </StepContent>
        </Step>

        {/* Step 4: Review & Confirm */}
        <Step>
          <StepLabel>Review & Confirm</StepLabel>
          <StepContent>
            {selectedService && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Service Summary
                </Typography>

                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {selectedService.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {selectedCategory.name}
                    </Typography>

                    {Object.values(selectedVariants).flat().filter(id => id !== null).length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Selected Options:
                        </Typography>
                        {serviceDetails && serviceDetails.variants &&
                          Object.values(serviceDetails.variants).flat()
                            .filter(variant => Object.values(selectedVariants).flat().includes(variant.id))
                            .map((variant) => (
                              <Chip
                                key={variant.id}
                                label={variant.name}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))
                        }
                      </Box>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body1" color="text.secondary">
                          Estimated Duration: {selectedService.baseDuration} minutes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Final pricing will be provided by our staff
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleConfirm}
                        startIcon={<ShoppingCart />}
                      >
                        Request This Service
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </StepContent>
        </Step>
      </Stepper>

      {/* Navigation Buttons */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={handleBack}
          startIcon={<ArrowBack />}
          disabled={activeStep === 0 && !onBack}
        >
          {activeStep === 0 ? 'Back' : 'Previous'}
        </Button>

        {loading && <CircularProgress size={24} />}
      </Box>
    </Box>
  );
};

export default HierarchicalServiceSelector;
