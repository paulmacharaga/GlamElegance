import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  FormControlLabel,
  Checkbox,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Switch
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday,
  AccessTime,
  Person,
  CheckCircle,
  PhotoCamera,
  Delete,
  CloudUpload,
  Stars,
  CardGiftcard
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import HierarchicalServiceSelector from './HierarchicalServiceSelector';
import CustomerLoyalty from './CustomerLoyalty';
import LoyaltyAuthPrompt from './LoyaltyAuthPrompt';

const EnhancedBookingForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedService, setSelectedService] = useState(null);
  const [loyaltyReward, setLoyaltyReward] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoyaltyAuth, setShowLoyaltyAuth] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    appointmentDate: null,
    appointmentTime: '',
    notes: '',
    joinLoyalty: false,
    useReward: false,
    inspirationImages: [],
    currentHairImages: {
      front: null,
      back: null,
      top: null
    }
  });
  
  // Field validation state
  const [fieldErrors, setFieldErrors] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  const steps = [
    'Select Service',
    'Choose Date & Time',
    'Enter Details',
    'Confirm Booking'
  ];

  // Fetch available time slots for selected date
  const fetchAvailableSlots = async (date) => {
    if (!date || !selectedService) {
      console.log('Cannot fetch slots - missing date or service:', { date, selectedService });
      return;
    }
    
    try {
      setLoadingSlots(true);
      setError(null); // Clear any previous errors
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      console.log('Fetching available slots for date:', formattedDate, 'with duration:', selectedService.totalDuration);
      
      const url = `/api/bookings/available-slots?date=${formattedDate}&duration=${selectedService.totalDuration}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      console.log('Available slots API response status:', response.status);
      
      const data = await response.json();
      console.log('Available slots API response data:', data);
      
      if (data.success) {
        console.log('Available slots retrieved successfully:', data.slots?.length || 0, 'slots');
        
        // Filter out past time slots if the selected date is today
        let availableSlots = data.slots || [];
        const isToday = dayjs(date).isSame(dayjs(), 'day');
        
        if (isToday) {
          const currentTime = dayjs();
          availableSlots = availableSlots.filter(slot => {
            try {
              // Parse the time slot (format: "HH:MM" in 24-hour format from server)
              const [hours, minutes] = slot.split(':').map(part => parseInt(part, 10));
              
              if (isNaN(hours) || isNaN(minutes)) {
                console.error(`Invalid time format in slot: ${slot}`);
                return false;
              }
              
              const slotTime = dayjs().hour(hours).minute(minutes).second(0);
              
              // Keep the slot if it's in the future (add a buffer of 30 minutes)
              return slotTime.isAfter(currentTime.add(30, 'minute'));
            } catch (parseError) {
              console.error(`Error parsing time slot ${slot}:`, parseError);
              return false;
            }
          });
          
          console.log(`Filtered out past time slots for today. ${data.slots.length - availableSlots.length} slots removed.`);
        }
        
        // Format slots for display (convert 24h format to 12h format)
        const formattedSlots = availableSlots.map(slot => {
          try {
            const [hours, minutes] = slot.split(':').map(part => parseInt(part, 10));
            if (isNaN(hours) || isNaN(minutes)) return slot; // Return original if parsing fails
            
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          } catch (error) {
            console.error(`Error formatting time slot ${slot}:`, error);
            return slot; // Return original if formatting fails
          }
        });
        
        setAvailableSlots(formattedSlots);
      } else {
        console.error('Failed to load available slots - API returned error:', data);
        setError(data.message || 'Failed to load available time slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', { error, details: { name: error.name, message: error.message } });
      setError('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle service selection
  const handleServiceSelected = (serviceData) => {
    setSelectedService(serviceData);
    setActiveStep(1);
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      appointmentDate: newDate,
      appointmentTime: '' // Reset time when date changes
    }));
    
    if (newDate) {
      fetchAvailableSlots(newDate);
    }
  };

  // Validate a single field
  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'customerName':
        if (value.trim() === '') {
          error = 'Name is required';
        } else if (value.trim().length < 2) {
          error = 'Name is too short';
        }
        break;
        
      case 'customerEmail':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value.trim() === '') {
          error = 'Email is required';
        } else if (!emailRegex.test(value)) {
          error = 'Please enter a valid email';
        }
        break;
        
      case 'customerPhone':
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (value.trim() === '') {
          error = 'Phone number is required';
        } else if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
          error = 'Please enter a valid phone number';
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };
  
  // Handle form input changes with validation
  const handleInputChange = (field, value) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validate field if it's one we track errors for
    if (fieldErrors.hasOwnProperty(field)) {
      const error = validateField(field, value);
      setFieldErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  // Handle inspiration image uploads
  const handleInspirationImageUpload = (files) => {
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setFormData(prev => ({
      ...prev,
      inspirationImages: [...prev.inspirationImages, ...newImages]
    }));
  };

  // Remove inspiration image
  const removeInspirationImage = (index) => {
    setFormData(prev => {
      const newImages = [...prev.inspirationImages];
      // Clean up the object URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return {
        ...prev,
        inspirationImages: newImages
      };
    });
  };

  // Handle current hair image upload
  const handleCurrentHairImageUpload = (angle, file) => {
    if (!file) return;

    // Clean up previous image URL if exists
    if (formData.currentHairImages[angle]?.preview) {
      URL.revokeObjectURL(formData.currentHairImages[angle].preview);
    }

    setFormData(prev => ({
      ...prev,
      currentHairImages: {
        ...prev.currentHairImages,
        [angle]: {
          file,
          preview: URL.createObjectURL(file)
        }
      }
    }));
  };

  // Helper function to parse time string in either 12h or 24h format
  const parseTimeString = (timeString) => {
    try {
      // Check if time is in 12-hour format (contains AM/PM)
      const is12HourFormat = /am|pm/i.test(timeString);
      
      if (is12HourFormat) {
        // Parse 12-hour format (e.g., "10:00 AM")
        const [timePart, ampm] = timeString.split(/\s+/);
        const [hours, minutes] = timePart.split(':').map(part => parseInt(part, 10));
        const isPM = /pm/i.test(ampm);
        
        let hour = hours;
        // Convert to 24-hour format
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        
        return { hour, minute: minutes, valid: !isNaN(hour) && !isNaN(minutes) };
      } else {
        // Parse 24-hour format (e.g., "14:00")
        const [hours, minutes] = timeString.split(':').map(part => parseInt(part, 10));
        return { hour: hours, minute: minutes, valid: !isNaN(hours) && !isNaN(minutes) };
      }
    } catch (error) {
      console.error(`Error parsing time string: ${timeString}`, error);
      return { valid: false };
    }
  };

  // Handle time slot selection
  const handleTimeSelect = (time) => {
    console.log(`Time slot selected: ${time}`);
    
    // Additional validation to ensure the time hasn't passed
    const isToday = dayjs(formData.appointmentDate).isSame(dayjs(), 'day');
    
    if (isToday) {
      try {
        const { hour, minute, valid } = parseTimeString(time);
        
        if (!valid) {
          console.error(`Invalid time format: ${time}`);
          toast.error('Invalid time format. Please select another time slot.');
          return;
        }
        
        const slotTime = dayjs().hour(hour).minute(minute).second(0);
        const currentTime = dayjs();
        
        console.log('Time validation:', {
          selectedTime: time,
          parsedHour: hour,
          parsedMinute: minute,
          slotTime: slotTime.format('HH:mm'),
          currentTime: currentTime.format('HH:mm'),
          bufferTime: currentTime.add(30, 'minute').format('HH:mm'),
          isPast: slotTime.isBefore(currentTime.add(30, 'minute'))
        });
        
        // Check if the time has already passed (with a 30-minute buffer)
        if (slotTime.isBefore(currentTime.add(30, 'minute'))) {
          toast.error('This time slot is no longer available. Please select a future time.');
          return;
        }
      } catch (error) {
        console.error('Error validating time slot:', error);
        toast.error('Error validating time slot. Please try again.');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      appointmentTime: time
    }));
    setActiveStep(2);
  };

  // Handle form submission
  const handleSubmit = async () => {
    const submissionId = `submit_${Date.now()}`;
    console.group(`Booking Submission: ${submissionId}`);
    try {
      console.log(`[${submissionId}] Starting booking submission process`);
      console.log(`[${submissionId}] Form data:`, {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        appointmentDate: formData.appointmentDate ? dayjs(formData.appointmentDate).format('YYYY-MM-DD') : null,
        appointmentTime: formData.appointmentTime,
        hasNotes: !!formData.notes,
        joinLoyalty: formData.joinLoyalty,
        useReward: formData.useReward,
        inspirationImages: formData.inspirationImages.length,
        currentHairImages: Object.values(formData.currentHairImages).filter(Boolean).length
      });
      console.log(`[${submissionId}] Selected service:`, selectedService ? {
        name: selectedService.service?.name,
        id: selectedService.service?.id,
        category: selectedService.category?.name,
        duration: selectedService.totalDuration
      } : 'None');
      
      setLoading(true);
      setError(null);

      // Validate required fields with detailed feedback
      const missingFields = [];
      if (!selectedService) missingFields.push('service');
      if (!formData.customerName) missingFields.push('name');
      if (!formData.customerEmail) missingFields.push('email');
      if (!formData.customerPhone) missingFields.push('phone');
      if (!formData.appointmentDate) missingFields.push('date');
      if (!formData.appointmentTime) missingFields.push('time');

      if (missingFields.length > 0) {
        console.error(`[${submissionId}] Form validation failed - missing required fields:`, missingFields);
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail)) {
        console.error(`[${submissionId}] Invalid email format:`, formData.customerEmail);
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      
      // Validate phone format (basic check)
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(formData.customerPhone.replace(/\s+/g, ''))) {
        console.error(`[${submissionId}] Invalid phone format:`, formData.customerPhone);
        setError('Please enter a valid phone number');
        setLoading(false);
        return;
      }
      
      // Validate that the appointment date and time haven't passed
      const appointmentDate = dayjs(formData.appointmentDate).format('YYYY-MM-DD');
      const now = dayjs();
      const today = now.format('YYYY-MM-DD');
      
      console.log(`[${submissionId}] Validating appointment time:`, {
        appointmentDate,
        today,
        isToday: appointmentDate === today,
        appointmentTime: formData.appointmentTime
      });
      
      // If the appointment is for today, check if the time has passed
      if (appointmentDate === today) {
        try {
          const { hour, minute, valid } = parseTimeString(formData.appointmentTime);
          
          if (!valid) {
            console.error(`[${submissionId}] Invalid appointment time format:`, formData.appointmentTime);
            setError('Invalid appointment time format');
            setLoading(false);
            return;
          }
          
          const appointmentTime = dayjs().hour(hour).minute(minute).second(0);
          
          console.log(`[${submissionId}] Time validation:`, {
            parsedHour: hour,
            parsedMinute: minute,
            appointmentTime: appointmentTime.format('HH:mm'),
            currentTime: now.format('HH:mm'),
            bufferTime: now.add(30, 'minute').format('HH:mm'),
            isPast: appointmentTime.isBefore(now.add(30, 'minute'))
          });
          
          // Check if the time has already passed (with a 30-minute buffer)
          if (appointmentTime.isBefore(now.add(30, 'minute'))) {
            console.error(`[${submissionId}] Appointment time has passed or is too soon`);
            setError('This appointment time is no longer available. Please select a future time.');
            setLoading(false);
            return;
          }
        } catch (timeError) {
          console.error(`[${submissionId}] Error validating appointment time:`, timeError);
          setError('Error validating appointment time. Please try again.');
          setLoading(false);
          return;
        }
      }

      console.log(`[${submissionId}] Form validation passed, preparing data for submission`);
      
      // Create FormData for file uploads
      console.log(`[${submissionId}] Creating FormData object`);
      const formDataToSend = new FormData();
      
      // Add a debug field to track this submission
      formDataToSend.append('submissionId', submissionId);

      // Check selectedService structure with detailed logging
      console.log(`[${submissionId}] Validating service structure:`, {
        hasSelectedService: !!selectedService,
        hasServiceObject: selectedService && !!selectedService.service,
        hasServiceId: selectedService && selectedService.service && !!selectedService.service.id,
        serviceDetails: selectedService ? {
          name: selectedService.service?.name,
          id: selectedService.service?.id,
          category: selectedService.category?.name,
          variants: selectedService.variants?.length || 0,
          totalDuration: selectedService.totalDuration
        } : 'null'
      });
      
      if (!selectedService || !selectedService.service || !selectedService.service.id) {
        console.error(`[${submissionId}] Invalid selectedService structure:`, selectedService);
        setError('Please select a valid service');
        setLoading(false);
        return;
      }
      
      // Add basic booking data
      formDataToSend.append('customerName', formData.customerName);
      formDataToSend.append('customerEmail', formData.customerEmail);
      formDataToSend.append('customerPhone', formData.customerPhone);
      
      // Service ID handling with extra validation
      try {
        if (!selectedService?.service?.id) {
          throw new Error('Invalid service ID');
        }
        formDataToSend.append('serviceId', selectedService.service.id);
        console.log(`[${submissionId}] Added serviceId:`, selectedService.service.id);
      } catch (serviceError) {
        console.error(`[${submissionId}] Service ID error:`, serviceError);
        setError('Invalid service selection. Please try again.');
        setLoading(false);
        return;
      }
      
      formDataToSend.append('bookingDate', dayjs(formData.appointmentDate).format('YYYY-MM-DD'));
      formDataToSend.append('bookingTime', formData.appointmentTime);
      formDataToSend.append('notes', formData.notes || '');
      formDataToSend.append('totalDuration', selectedService.totalDuration || 60); // Add duration explicitly
      formDataToSend.append('joinLoyalty', formData.joinLoyalty);
      formDataToSend.append('useReward', formData.useReward);

      // Add variant IDs if any
      if (selectedService.variantIds && selectedService.variantIds.length > 0) {
        formDataToSend.append('variantIds', JSON.stringify(selectedService.variantIds));
        console.log('Added variant IDs:', selectedService.variantIds);
      } else {
        console.log('No variant IDs to add');
      }

      // Add inspiration images (if any)
      console.log(`[${submissionId}] Processing inspiration images:`, formData.inspirationImages.length);
      if (formData.inspirationImages && formData.inspirationImages.length > 0) {
        try {
          const validImages = [];
          const invalidImages = [];
          
          formData.inspirationImages.forEach((image, index) => {
            if (image && image.file) {
              try {
                // Validate image file
                if (!image.file.type.startsWith('image/')) {
                  console.error(`[${submissionId}] Invalid image type for inspiration image ${index}:`, image.file.type);
                  invalidImages.push({ index, reason: 'Invalid file type' });
                  return;
                }
                
                if (image.file.size > 5 * 1024 * 1024) { // 5MB limit
                  console.error(`[${submissionId}] Image too large for inspiration image ${index}:`, image.file.size);
                  invalidImages.push({ index, reason: 'File too large' });
                  return;
                }
                
                formDataToSend.append(`inspirationImages`, image.file);
                console.log(`[${submissionId}] Added inspiration image ${index}:`, {
                  name: image.file.name,
                  type: image.file.type,
                  size: `${(image.file.size / 1024).toFixed(2)} KB`
                });
                validImages.push(index);
              } catch (error) {
                console.error(`[${submissionId}] Error processing inspiration image ${index}:`, error);
                invalidImages.push({ index, reason: error.message });
              }
            }
          });
          
          console.log(`[${submissionId}] Inspiration images processed:`, {
            total: formData.inspirationImages.length,
            valid: validImages.length,
            invalid: invalidImages.length,
            invalidDetails: invalidImages
          });
          
        } catch (imageError) {
          console.error(`[${submissionId}] Error processing inspiration images:`, imageError);
          // Continue with submission even if image processing fails
        }
      } else {
        console.log(`[${submissionId}] No inspiration images to process`);
      }

      // Add current hair images (if any)
      console.log(`[${submissionId}] Processing current hair images`);
      if (formData.currentHairImages) {
        try {
          const processedAngles = [];
          const failedAngles = [];
          
          Object.entries(formData.currentHairImages).forEach(([angle, imageData]) => {
            if (imageData && imageData.file) {
              try {
                // Validate image file
                if (!imageData.file.type.startsWith('image/')) {
                  console.error(`[${submissionId}] Invalid image type for ${angle} hair image:`, imageData.file.type);
                  failedAngles.push({ angle, reason: 'Invalid file type' });
                  return;
                }
                
                if (imageData.file.size > 5 * 1024 * 1024) { // 5MB limit
                  console.error(`[${submissionId}] Image too large for ${angle} hair image:`, imageData.file.size);
                  failedAngles.push({ angle, reason: 'File too large' });
                  return;
                }
                
                formDataToSend.append(`currentHair_${angle}`, imageData.file);
                console.log(`[${submissionId}] Added current hair image ${angle}:`, {
                  name: imageData.file.name,
                  type: imageData.file.type,
                  size: `${(imageData.file.size / 1024).toFixed(2)} KB`
                });
                processedAngles.push(angle);
              } catch (error) {
                console.error(`[${submissionId}] Error processing ${angle} hair image:`, error);
                failedAngles.push({ angle, reason: error.message });
              }
            }
          });
          
          console.log(`[${submissionId}] Current hair images processed:`, {
            processed: processedAngles,
            failed: failedAngles
          });
          
        } catch (imageError) {
          console.error(`[${submissionId}] Error processing current hair images:`, imageError);
          // Continue with submission even if image processing fails
        }
      } else {
        console.log(`[${submissionId}] No current hair images to process`);
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`[${submissionId}] Booking request timeout reached (30s)`);
        controller.abort();
      }, 30000); // 30 second timeout

      console.log(`[${submissionId}] Submitting booking request to API...`);
      let response;
      try {
        // Log FormData contents for debugging
        console.log(`[${submissionId}] FormData contents:`);
        for (const pair of formDataToSend.entries()) {
          if (pair[0] === 'inspirationImages' || pair[0].startsWith('currentHair_')) {
            console.log(`[${submissionId}] FormData field: ${pair[0]}`, {
              type: pair[1].type,
              name: pair[1].name,
              size: pair[1].size
            });
          } else {
            console.log(`[${submissionId}] FormData field: ${pair[0]}`, pair[1]);
          }
        }
        
        const startTime = performance.now();
        
        // Use XMLHttpRequest for better debugging
        response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.open('POST', '/api/bookings');
          
          // Set up abort controller
          controller.signal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Request aborted'));
          });
          
          // Set up event listeners
          xhr.onload = function() {
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              json: async () => JSON.parse(xhr.responseText),
              text: async () => xhr.responseText
            });
          };
          
          xhr.onerror = function() {
            console.error(`[${submissionId}] XHR network error`);
            reject(new Error('Network error'));
          };
          
          xhr.onabort = function() {
            console.error(`[${submissionId}] XHR request aborted`);
            reject(new Error('Request aborted'));
          };
          
          xhr.ontimeout = function() {
            console.error(`[${submissionId}] XHR request timed out`);
            reject(new Error('Request timed out'));
          };
          
          xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              console.log(`[${submissionId}] Upload progress: ${percentComplete.toFixed(2)}%`);
            }
          };
          
          // Send the request
          xhr.send(formDataToSend);
        });
        
        const endTime = performance.now();
        const requestDuration = endTime - startTime;
        
        console.log(`[${submissionId}] Booking API response received:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          requestDuration: `${requestDuration.toFixed(2)}ms`
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error(`[${submissionId}] Fetch error:`, {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
        
        if (fetchError.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.');
        } else {
          setError(`Network error: ${fetchError.message}. Please check your connection and try again.`);
        }
        setLoading(false);
        return;
      }

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        try {
          // First try to get the response as text
          const responseText = await response.text();
          console.log(`[${submissionId}] Error response text:`, responseText);
          
          // Try to parse as JSON
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.error(`[${submissionId}] Failed to parse error response as JSON:`, parseError);
            errorData = { message: `Server error: ${response.status} (Invalid JSON response)` };
          }
          
          // More detailed error logging
          console.error(`[${submissionId}] Booking API error response:`, {
            status: response.status,
            statusText: response.statusText,
            errorData,
            responseText: responseText.substring(0, 500), // Limit to first 500 chars
            headers: response.headers,
            url: '/api/bookings'
          });
          
          // Log the full FormData contents for debugging
          console.log(`[${submissionId}] FormData that caused error:`);
          for (const pair of formDataToSend.entries()) {
            if (pair[0] === 'inspirationImages' || pair[0].startsWith('currentHair_')) {
              console.log(`[${submissionId}] - ${pair[0]}:`, {
                type: pair[1].type,
                name: pair[1].name,
                size: `${Math.round(pair[1].size / 1024)} KB`
              });
            } else {
              console.log(`[${submissionId}] - ${pair[0]}:`, pair[1]);
            }
          }
          
          // Try to get more detailed error information
          const errorMessage = errorData.message || 
                              errorData.userMessage || 
                              errorData.error || 
                              `Server error: ${response.status}`;
          
          // Handle specific error codes
          if (response.status === 400) {
            if (errorData.missingFields) {
              setError(`Missing required fields: ${errorData.missingFields.join(', ')}`);
            } else if (errorData.error === 'VALIDATION_ERROR') {
              setError(`Validation error: ${errorMessage}`);
            } else if (errorData.error === 'TIME_SLOT_UNAVAILABLE') {
              setError('This time slot is no longer available. Please select another time.');
            } else {
              setError(`Request error: ${errorMessage}`);
            }
          } else if (response.status === 422) {
            setError(`Image processing error: ${errorMessage}`);
          } else if (response.status === 429) {
            setError('Too many requests. Please try again later.');
          } else if (response.status >= 500) {
            setError(`Server error (${response.status}): ${errorMessage}. Please try again or contact support.`);
          } else {
            setError(`Error: ${errorMessage}`);
          }
          
          setLoading(false);
          return;
        } catch (responseError) {
          console.error(`[${submissionId}] Error handling error response:`, responseError);
          setError(`Server error: ${response.status} ${response.statusText}. Please try again or contact support.`);
          setLoading(false);
          return;
        }
      }

      // Parse successful response
      let data;
      try {
        data = await response.json();
        console.log(`[${submissionId}] Booking API response data:`, data);
      } catch (parseError) {
        console.error(`[${submissionId}] Error parsing success response:`, parseError);
        setError('Error processing server response');
        setLoading(false);
        return;
      }

      if (data.success) {
        console.log(`[${submissionId}] Booking created successfully:`, {
          bookingId: data.booking?.id,
          customerName: data.booking?.customerName,
          serviceId: data.booking?.serviceId,
          bookingDate: data.booking?.bookingDate,
          bookingTime: data.booking?.bookingTime,
          status: data.booking?.status
        });
        
        // If using loyalty reward, redeem points
        if (formData.useReward && loyaltyReward) {
          try {
            console.log(`[${submissionId}] Redeeming loyalty points...`);
            const loyaltyStartTime = performance.now();
            const loyaltyResponse = await fetch(`/api/loyalty/customer/${formData.customerEmail}/redeem`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: data.booking.id
              })
            });
            const loyaltyEndTime = performance.now();
            
            console.log(`[${submissionId}] Loyalty redemption response:`, {
              status: loyaltyResponse.status,
              ok: loyaltyResponse.ok,
              duration: `${(loyaltyEndTime - loyaltyStartTime).toFixed(2)}ms`
            });
            
            try {
              const loyaltyData = await loyaltyResponse.json();
              console.log(`[${submissionId}] Loyalty redemption data:`, loyaltyData);
              
              if (loyaltyResponse.ok) {
                toast.success('Loyalty reward applied to your booking!');
              } else {
                console.error(`[${submissionId}] Loyalty redemption failed:`, loyaltyData);
                // Show a warning but don't block the booking success
                toast.error('Could not apply loyalty reward, but your booking was created');
              }
            } catch (parseError) {
              console.error(`[${submissionId}] Error parsing loyalty response:`, parseError);
            }
          } catch (loyaltyError) {
            console.error(`[${submissionId}] Loyalty redemption error:`, { 
              error: loyaltyError, 
              details: { name: loyaltyError.name, message: loyaltyError.message } 
            });
            // Don't fail the booking if loyalty redemption fails
            toast.error('Could not apply loyalty reward, but your booking was created');
          }
        }
        
        toast.success('Booking created successfully!');
        navigate('/thank-you', {
          state: {
            booking: data.booking,
            service: selectedService,
            requestId: submissionId
          }
        });
      } else {
        console.error(`[${submissionId}] Booking API returned success: false`, data);
        setError(data.message || 'Failed to create booking');
        setLoading(false);
      }
    } catch (error) {
      console.error(`[${submissionId}] Unhandled error in booking submission:`, { 
        name: error.name, 
        message: error.message,
        stack: error.stack 
      });

      // This catch block should only handle errors not caught in the try blocks above
      setError(`Unexpected error: ${error.message}. Please try again or contact support.`);
      setLoading(false);
    } finally {
      console.log(`[${submissionId}] Form submission process completed`);
      // setLoading(false) is called in the individual error handlers to ensure it's always called
      console.groupEnd();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else {
      navigate('/');
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };
  
  const handleLoyaltyRewardSuccess = (rewardAmount) => {
    setLoyaltyReward(rewardAmount);
    setFormData(prev => ({
      ...prev,
      useReward: true
    }));
    toast.success(`$${rewardAmount} reward available!`);
  };
  
  const handleAuthSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    console.log('User authenticated:', user);
  };
  
  const handleLoyaltyPrompt = () => {
    if (!isAuthenticated) {
      setShowLoyaltyAuth(true);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Book Your Appointment
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Service Selection */}
          <Step>
            <StepLabel>Select Your Service</StepLabel>
            <StepContent>
              <HierarchicalServiceSelector
                onServiceSelected={handleServiceSelected}
                onBack={activeStep === 0 ? () => navigate('/') : null}
              />
            </StepContent>
          </Step>

          {/* Step 2: Date & Time Selection */}
          <Step>
            <StepLabel>Choose Date & Time</StepLabel>
            <StepContent>
              {selectedService && (
                <Box>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Selected Service
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedService.service.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedService.category.name}
                          </Typography>
                          {selectedService.variants.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {selectedService.variants.map((variant) => (
                                <Chip
                                  key={variant.id}
                                  label={variant.name}
                                  size="small"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2" color="text.secondary">
                            Duration: {selectedService.totalDuration} minutes (estimated)
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Final duration and pricing will be confirmed by staff
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Select Date
                          </Typography>
                          <DatePicker
                            label="Appointment Date"
                            value={formData.appointmentDate}
                            onChange={handleDateChange}
                            minDate={dayjs()}
                            maxDate={dayjs().add(3, 'month')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined'
                              }
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Select Time
                          </Typography>
                          
                          {!formData.appointmentDate ? (
                            <Typography variant="body2" color="text.secondary">
                              Please select a date first
                            </Typography>
                          ) : loadingSlots ? (
                            <Box display="flex" justifyContent="center" py={2}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : availableSlots.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No available slots for this date
                            </Typography>
                          ) : (
                            <Grid container spacing={1}>
                              {availableSlots.map((slot) => (
                                <Grid item xs={6} sm={4} key={slot}>
                                  <Button
                                    variant={formData.appointmentTime === slot ? 'contained' : 'outlined'}
                                    fullWidth
                                    size="small"
                                    onClick={() => handleTimeSelect(slot)}
                                  >
                                    {slot}
                                  </Button>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </StepContent>
          </Step>

          {/* Step 3: Customer Details */}
          <Step>
            <StepLabel>Enter Your Details</StepLabel>
            <StepContent>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Contact Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        required
                        variant="outlined"
                        error={!!fieldErrors.customerName}
                        helperText={fieldErrors.customerName}
                        onBlur={() => {
                          if (!formData.customerName) {
                            setFieldErrors(prev => ({ ...prev, customerName: 'Name is required' }));
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                        required
                        variant="outlined"
                        error={!!fieldErrors.customerEmail}
                        helperText={fieldErrors.customerEmail}
                        onBlur={() => {
                          if (!formData.customerEmail) {
                            setFieldErrors(prev => ({ ...prev, customerEmail: 'Email is required' }));
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.customerPhone}
                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                        required
                        variant="outlined"
                        error={!!fieldErrors.customerPhone}
                        helperText={fieldErrors.customerPhone}
                        onBlur={() => {
                          if (!formData.customerPhone) {
                            setFieldErrors(prev => ({ ...prev, customerPhone: 'Phone number is required' }));
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Special Requests or Notes"
                        multiline
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        variant="outlined"
                        placeholder="Any special requests, allergies, or preferences..."
                      />
                    </Grid>

                    {/* Inspiration Images Upload */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Inspiration Images (Optional)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Upload photos of styles you'd like to achieve
                      </Typography>

                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="inspiration-images-upload"
                        multiple
                        type="file"
                        onChange={(e) => handleInspirationImageUpload(e.target.files)}
                      />
                      <label htmlFor="inspiration-images-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUpload />}
                          sx={{ mb: 2 }}
                        >
                          Upload Inspiration Images
                        </Button>
                      </label>

                      {formData.inspirationImages.length > 0 && (
                        <ImageList sx={{ width: '100%', height: 200 }} cols={4} rowHeight={150}>
                          {formData.inspirationImages.map((image, index) => (
                            <ImageListItem key={index}>
                              <img
                                src={image.preview}
                                alt={`Inspiration ${index + 1}`}
                                loading="lazy"
                                style={{ objectFit: 'cover', height: '100%' }}
                              />
                              <ImageListItemBar
                                actionIcon={
                                  <IconButton
                                    sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                    onClick={() => removeInspirationImage(index)}
                                  >
                                    <Delete />
                                  </IconButton>
                                }
                              />
                            </ImageListItem>
                          ))}
                        </ImageList>
                      )}
                    </Grid>

                    {/* Current Hair Images Upload */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Current Hair Photos (Optional)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Help us understand your current hair condition
                      </Typography>

                      <Grid container spacing={2}>
                        {['front', 'back', 'top'].map((angle) => (
                          <Grid item xs={12} sm={4} key={angle}>
                            <Paper sx={{ p: 2, textAlign: 'center', minHeight: 200 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                {angle.charAt(0).toUpperCase() + angle.slice(1)} View
                              </Typography>

                              {formData.currentHairImages[angle] ? (
                                <Box>
                                  <img
                                    src={formData.currentHairImages[angle].preview}
                                    alt={`Current hair ${angle}`}
                                    style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 4 }}
                                  />
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleCurrentHairImageUpload(angle, null)}
                                    sx={{ mt: 1 }}
                                  >
                                    Remove
                                  </Button>
                                </Box>
                              ) : (
                                <>
                                  <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id={`current-hair-${angle}`}
                                    type="file"
                                    onChange={(e) => handleCurrentHairImageUpload(angle, e.target.files[0])}
                                  />
                                  <label htmlFor={`current-hair-${angle}`}>
                                    <Button
                                      variant="outlined"
                                      component="span"
                                      startIcon={<PhotoCamera />}
                                      size="small"
                                    >
                                      Upload {angle}
                                    </Button>
                                  </label>
                                </>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>

                    {/* Customer Loyalty Component */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      {formData.customerEmail && (
                        <Box mb={3}>
                          {isAuthenticated ? (
                            <>
                              <CustomerLoyalty 
                                bookingEmail={currentUser?.email || formData.customerEmail} 
                                onRedeemSuccess={handleLoyaltyRewardSuccess}
                              />
                              
                              {loyaltyReward && (
                                <Box sx={{ mt: 2 }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={formData.useReward}
                                        onChange={(e) => handleInputChange('useReward', e.target.checked)}
                                        color="secondary"
                                      />
                                    }
                                    label={
                                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Stars sx={{ mr: 0.5, color: 'secondary.main' }} />
                                        Apply ${loyaltyReward} loyalty reward to this booking
                                      </Typography>
                                    }
                                  />
                                </Box>
                              )}
                            </>
                          ) : (
                            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                              <Box display="flex" flexDirection="column" alignItems="center">
                                <Stars sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                  Unlock Loyalty Rewards
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                                  Sign in or create an account to access exclusive loyalty benefits, earn points, and redeem rewards on your bookings.
                                </Typography>
                                <Button
                                  variant="contained"
                                  startIcon={<CardGiftcard />}
                                  onClick={handleLoyaltyPrompt}
                                  size="large"
                                >
                                  Access Loyalty Program
                                </Button>
                              </Box>
                            </Paper>
                          )}
                        </Box>
                      )}
                      
                      {/* Loyalty Program Opt-in */}
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.joinLoyalty}
                            onChange={(e) => handleInputChange('joinLoyalty', e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">
                              Join our loyalty program
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Earn points with every visit and get exclusive rewards
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        // Validate all fields before proceeding
                        const nameError = validateField('customerName', formData.customerName);
                        const emailError = validateField('customerEmail', formData.customerEmail);
                        const phoneError = validateField('customerPhone', formData.customerPhone);
                        
                        setFieldErrors({
                          customerName: nameError,
                          customerEmail: emailError,
                          customerPhone: phoneError
                        });
                        
                        // Only proceed if there are no errors
                        if (!nameError && !emailError && !phoneError) {
                          handleNext();
                        } else {
                          // Show a toast with error message
                          toast.error('Please fix the form errors before continuing');
                        }
                      }}
                      disabled={!formData.customerName || !formData.customerEmail || !formData.customerPhone}
                    >
                      Review Booking
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </StepContent>
          </Step>

          {/* Step 4: Review & Confirm */}
          <Step>
            <StepLabel>Review & Confirm</StepLabel>
            <StepContent>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Booking Summary
                  </Typography>

                  {selectedService && (
                    <Box>
                      {/* Service Details */}
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Service Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedService.service.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedService.category.name}
                            </Typography>
                            {selectedService.variants.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" gutterBottom>
                                  Selected Options:
                                </Typography>
                                {selectedService.variants.map((variant) => (
                                  <Chip
                                    key={variant.id}
                                    label={variant.name}
                                    size="small"
                                    sx={{ mr: 1, mb: 1 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Grid>
                          <Grid item xs={12} sm={4} textAlign="right">
                            <Typography variant="body2" color="text.secondary">
                              Duration: {selectedService.totalDuration} minutes (estimated)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Final duration and pricing will be confirmed by our staff
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Appointment Details */}
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Appointment Details
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Date
                            </Typography>
                            <Typography variant="body1">
                              {formData.appointmentDate ? dayjs(formData.appointmentDate).format('MMMM D, YYYY') : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Time
                            </Typography>
                            <Typography variant="body1">
                              {formData.appointmentTime || '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Customer Details */}
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          Contact Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Name
                            </Typography>
                            <Typography variant="body1">
                              {formData.customerName || '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body1">
                              {formData.customerEmail || '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body1">
                              {formData.customerPhone || '-'}
                            </Typography>
                          </Grid>
                          {formData.notes && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                Notes
                              </Typography>
                              <Typography variant="body1">
                                {formData.notes}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>

                      {/* Loyalty Information */}
                      {loyaltyReward && formData.useReward && (
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                          <Box display="flex" alignItems="center">
                            <CardGiftcard sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight="medium">
                              Loyalty Reward Applied: ${loyaltyReward}
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            Your loyalty reward will be applied to this booking
                          </Typography>
                        </Paper>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="medium" color="text.secondary">
                          Our staff will contact you with duration, pricing and confirmation details
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleSubmit}
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                          {loading ? 'Submitting Request...' : 'Submit Service Request'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </StepContent>
          </Step>
        </Stepper>
        
        {/* Loyalty Authentication Dialog */}
        <LoyaltyAuthPrompt
          open={showLoyaltyAuth}
          onClose={() => setShowLoyaltyAuth(false)}
          onAuthSuccess={handleAuthSuccess}
          customerEmail={formData.customerEmail}
        />
      </Container>
    </LocalizationProvider>
  );
};

export default EnhancedBookingForm;
