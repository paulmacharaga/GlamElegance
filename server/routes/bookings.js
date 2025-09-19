const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const staffAuth = require('../middleware/staffAuth');
const { sendBookingConfirmation } = require('../utils/email');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/bookings';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();

// Middleware to handle both JSON and FormData
const handleBookingData = (req, res, next) => {
  console.log('handleBookingData middleware called');
  console.log('Content-Type:', req.headers['content-type']);
  
  // Create uploads directory if it doesn't exist
  const uploadDir = 'uploads/bookings';
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    } catch (dirError) {
      console.error('Error creating upload directory:', dirError);
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: 'UPLOAD_DIR_ERROR'
      });
    }
  }
  
  // Check if it's JSON request
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    console.log('Processing as JSON request');
    // For JSON requests, skip multer
    return next();
  } else {
    console.log('Processing as FormData request');
    // For FormData requests, use multer with error handling
    const multerUpload = upload.fields([
      { name: 'inspirationImages', maxCount: 10 },
      { name: 'currentHair_front', maxCount: 1 },
      { name: 'currentHair_back', maxCount: 1 },
      { name: 'currentHair_top', maxCount: 1 }
    ]);
    
    return multerUpload(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading
          return res.status(422).json({
            success: false,
            message: 'File upload error',
            error: err.message,
            code: err.code
          });
        } else {
          // An unknown error occurred
          return res.status(500).json({
            success: false,
            message: 'Unknown error during file upload',
            error: err.message
          });
        }
      }
      
      // If we get here, the upload was successful
      console.log('Files processed successfully:', req.files ? Object.keys(req.files).length : 0, 'file fields');
      next();
    });
  }
};

// Create new booking with optional image uploads
router.post('/', handleBookingData, [
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('customerPhone').notEmpty().withMessage('Phone number is required'),
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('appointmentDate').optional().isISO8601().withMessage('Valid date is required'),
  body('bookingDate').optional().notEmpty().withMessage('Valid date is required'),
  body('appointmentTime').optional().notEmpty().withMessage('Appointment time is required'),
  body('bookingTime').optional().notEmpty().withMessage('Appointment time is required')
], async (req, res) => {
  const requestId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  // Extract request data first to make variables available throughout the function
  const {
    customerName,
    customerEmail,
    customerPhone,
    serviceId,
    service, // Legacy field name
    variantIds = [],
    bookingDate,
    appointmentDate,
    bookingTime,
    appointmentTime,
    totalDuration,
    notes,
    joinLoyalty
  } = req.body;

  // Handle field name variations for backward compatibility
  const finalServiceId = serviceId || service;
  const finalBookingDate = bookingDate || appointmentDate;
  const finalBookingTime = bookingTime || appointmentTime;

  // Declare variables that will be used across multiple try-catch blocks
  let serviceDoc = null;

  try {
    console.log(`🚀 [${requestId}] Booking creation started`);
    console.log(`🚀 [${requestId}] Request body:`, req.body);

    // Validation 
    console.log(`🔍 [${requestId}] Request body:`, req.body);
    console.log(`🔍 [${requestId}] Request files:`, req.files ? Object.keys(req.files) : 'none');
    console.log(`🔍 [${requestId}] Content-Type:`, req.headers['content-type']);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`❌ [${requestId}] Validation failed:`, errors.array());

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed for one or more fields',
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg
        })),
        requestId
      });
    }

    // Log processing request data
    console.log(`🔍 [${requestId}] Processing request data...`);
    
    console.log(`🔍 [${requestId}] Variables defined:`, {
      finalServiceId,
      finalBookingDate,
      finalBookingTime
    });

    console.log(`🔄 [${requestId}] Field mapping:`, {
      serviceId: finalServiceId ? 'OK' : 'MISSING',
      bookingDate: finalBookingDate ? 'OK' : 'MISSING',
      bookingTime: finalBookingTime ? 'OK' : 'MISSING'
    });

    // Validate required fields
    const missingFields = [];
    if (!customerName) missingFields.push('customerName');
    if (!customerEmail) missingFields.push('customerEmail');
    if (!customerPhone) missingFields.push('customerPhone');
    if (!finalServiceId) missingFields.push('serviceId');
    if (!finalBookingDate) missingFields.push('bookingDate');
    if (!finalBookingTime) missingFields.push('bookingTime');

    if (missingFields.length > 0) {
      console.log(`❌ [${requestId}] Missing fields:`, missingFields);

      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
        requestId
      });
    }

    console.log(`✅ [${requestId}] Required fields validated`);
  } catch (fieldProcessingError) {
    console.error(`💥 [${requestId}] Field processing error:`, fieldProcessingError.message);

    return res.status(500).json({
      success: false,
      error: 'FIELD_PROCESSING_ERROR',
      message: 'Error processing request fields',
      requestId
    });
  }

  try {
    console.log(`🔍 [${requestId}] Validating service existence...`);
    console.log(`📋 [${requestId}] Looking for service ID: "${finalServiceId}"`);

    // Check if service exists and is active
    serviceDoc = await prisma.service.findUnique({
      where: { id: finalServiceId, isActive: true },
      include: {
        category: true,
        variants: {
          where: { isActive: true }
        }
      }
    });

    console.log(`📊 [${requestId}] Service Query Result:`, {
      found: !!serviceDoc,
      serviceId: finalServiceId,
      serviceName: serviceDoc?.name || 'N/A',
      categoryName: serviceDoc?.category?.name || 'N/A',
      isActive: serviceDoc?.isActive || 'N/A',
      baseDuration: serviceDoc?.baseDuration || 'N/A',
      basePrice: serviceDoc?.basePrice || 'N/A',
      variantCount: serviceDoc?.variants?.length || 0
    });

    if (!serviceDoc) {
      console.log(`❌ [${requestId}] SERVICE NOT FOUND:`, {
        searchedId: finalServiceId,
        searchCriteria: 'id + isActive: true'
      });

      return res.status(400).json({
        success: false,
        error: 'SERVICE_NOT_FOUND',
        message: 'Service not found or inactive',
        serviceId: finalServiceId,
        requestId
      });
    }

    console.log(`✅ [${requestId}] Service validated successfully: "${serviceDoc.name}"`);
  } catch (serviceValidationError) {
    console.error(`💥 [${requestId}] SERVICE VALIDATION ERROR:`, {
      error: serviceValidationError.message,
      stack: serviceValidationError.stack,
      serviceId: finalServiceId
    });

    return res.status(500).json({
      success: false,
      error: 'SERVICE_VALIDATION_ERROR',
      message: 'Error validating service',
      requestId
    });
  }

  try {
    console.log(`🔍 [${requestId}] Validating service variants...`);

    // Validate selected variants and calculate total duration
    // Use default duration of 60 minutes if baseDuration is null
    let calculatedDuration = serviceDoc.baseDuration || 60;
    let validVariants = [];

    console.log(`📊 [${requestId}] Variant Processing:`, {
      requestedVariantIds: variantIds,
      requestedCount: variantIds.length,
      availableVariants: serviceDoc.variants.map(v => ({ id: v.id, name: v.name }))
    });

    if (variantIds.length > 0) {
      validVariants = await prisma.serviceVariant.findMany({
        where: {
          id: { in: variantIds },
          serviceId: finalServiceId,
          isActive: true
        }
      });

      console.log(`📋 [${requestId}] Variant Validation Result:`, {
        requested: variantIds.length,
        found: validVariants.length,
        validVariants: validVariants.map(v => ({ id: v.id, name: v.name, durationModifier: v.durationModifier }))
      });

      if (validVariants.length !== variantIds.length) {
        const foundIds = validVariants.map(v => v.id);
        const missingIds = variantIds.filter(id => !foundIds.includes(id));

        console.log(`❌ [${requestId}] VARIANT VALIDATION FAILED:`, {
          requestedIds: variantIds,
          foundIds,
          missingIds
        });

        return res.status(400).json({
          success: false,
          error: 'INVALID_VARIANTS',
          message: 'One or more selected variants are invalid',
          requestedVariants: variantIds,
          validVariants: foundIds,
          invalidVariants: missingIds,
          requestId
        });
      }

      // Calculate total duration including variant modifiers
      const totalDurationModifier = validVariants.reduce((sum, variant) => {
        return sum + (variant.durationModifier || 0);
      }, 0);

      calculatedDuration = serviceDoc.baseDuration + totalDurationModifier;

      console.log(`⏱️ [${requestId}] Duration Calculation:`, {
        baseDuration: serviceDoc.baseDuration,
        variantModifiers: validVariants.map(v => v.durationModifier || 0),
        totalModifier: totalDurationModifier,
        calculatedDuration
      });
    } else {
      console.log(`📋 [${requestId}] No variants requested, using base duration: ${calculatedDuration}`);
    }

    console.log(`✅ [${requestId}] Variant validation completed successfully`);
  } catch (variantValidationError) {
    console.error(`💥 [${requestId}] VARIANT VALIDATION ERROR:`, {
      error: variantValidationError.message,
      stack: variantValidationError.stack,
      variantIds
    });

    return res.status(500).json({
      success: false,
      error: 'VARIANT_VALIDATION_ERROR',
      message: 'Error validating service variants',
      requestId
    });
  }

  try {
    console.log(`🕐 [${requestId}] Checking for booking conflicts...`);

    // Check for existing booking at same time
    const existingBooking = await prisma.booking.findFirst({
      where: {
        bookingDate: new Date(finalBookingDate),
        bookingTime: finalBookingTime,
        status: { in: ['pending', 'confirmed'] }
      }
    });

    console.log(`📊 [${requestId}] Conflict Check Result:`, {
      searchDate: finalBookingDate,
      searchTime: finalBookingTime,
      conflictFound: !!existingBooking,
      existingBookingId: existingBooking?.id || 'none'
    });

    if (existingBooking) {
      console.log(`❌ [${requestId}] BOOKING CONFLICT DETECTED:`, {
        existingBookingId: existingBooking.id,
        customerName: existingBooking.customerName,
        status: existingBooking.status
      });

      return res.status(400).json({
        success: false,
        error: 'TIME_SLOT_UNAVAILABLE',
        message: 'Time slot already booked',
        conflictingBooking: {
          id: existingBooking.id,
          customerName: existingBooking.customerName,
          status: existingBooking.status
        },
        requestId
      });
    }

    console.log(`✅ [${requestId}] No booking conflicts found`);
  } catch (conflictCheckError) {
    console.error(`💥 [${requestId}] CONFLICT CHECK ERROR:`, {
      error: conflictCheckError.message,
      stack: conflictCheckError.stack
    });

    return res.status(500).json({
      success: false,
      error: 'CONFLICT_CHECK_ERROR',
      message: 'Error checking for booking conflicts',
      requestId
    });
  }

  // Initialize image variables at broader scope
  let inspirationImages = [];
  let currentHairImages = {};

  try {
    console.log(`🖼️ [${requestId}] Processing uploaded images...`);

    // Process uploaded images (for FormData requests)

    if (req.files) {
      console.log(`📎 [${requestId}] Files detected, processing...`);

      // Process inspiration images
      if (req.files.inspirationImages) {
        console.log(`🖼️ [${requestId}] Processing ${req.files.inspirationImages.length} inspiration images`);
        req.files.inspirationImages.forEach((file, index) => {
          const imagePath = `/uploads/bookings/${file.filename}`;
          inspirationImages.push(imagePath);
          console.log(`  📷 [${requestId}] Inspiration image ${index + 1}: ${imagePath}`);
        });
      }

      // Process current hair images
      ['front', 'back', 'top'].forEach(angle => {
        const fieldName = `currentHair_${angle}`;
        if (req.files[fieldName] && req.files[fieldName][0]) {
          const imagePath = `/uploads/bookings/${req.files[fieldName][0].filename}`;
          currentHairImages[angle] = imagePath;
          console.log(`  💇 [${requestId}] Current hair ${angle}: ${imagePath}`);
        }
      });

      console.log(`📊 [${requestId}] Image Processing Summary:`, {
        inspirationCount: inspirationImages.length,
        currentHairAngles: Object.keys(currentHairImages)
      });
    } else {
      console.log(`📋 [${requestId}] No files uploaded (JSON request)`);
    }

    console.log(`✅ [${requestId}] Image processing completed`);
  } catch (imageProcessingError) {
    console.error(`💥 [${requestId}] IMAGE PROCESSING ERROR:`, {
      error: imageProcessingError.message,
      stack: imageProcessingError.stack
    });

    return res.status(422).json({
      success: false,
      error: 'IMAGE_PROCESSING_ERROR',
      message: 'Error processing uploaded images',
      requestId
    });
  }

  try {
    console.log(`💾 [${requestId}] Starting database transaction...`);

    const bookingData = {
      customerName,
      customerEmail,
      customerPhone,
      serviceId: serviceDoc.id,
      bookingDate: new Date(finalBookingDate),
      bookingTime: finalBookingTime,
      status: 'pending',
      notes: notes || '',
      totalPrice: null, // Will be set by staff when confirming
      totalDuration: null, // Will be set by staff when confirming
      inspirationImages: inspirationImages.length > 0 ? inspirationImages : [],
      currentHairImages: Object.keys(currentHairImages).length > 0 ? currentHairImages : null,
      joinLoyalty: joinLoyalty === 'true' || joinLoyalty === true
    };

    console.log(`📋 [${requestId}] Booking Data to Create:`, {
      ...bookingData,
      bookingDate: bookingData.bookingDate.toISOString(),
      inspirationImagesCount: bookingData.inspirationImages.length,
      currentHairImagesKeys: Object.keys(bookingData.currentHairImages || {}),
      dataSize: JSON.stringify(bookingData).length
    });

    // Start a transaction
    const booking = await prisma.$transaction(async (prisma) => {
      console.log(`🔄 [${requestId}] Creating booking record...`);

      // Create booking
      const newBooking = await prisma.booking.create({
        data: bookingData
      });

      console.log(`✅ [${requestId}] Booking created successfully:`, {
        bookingId: newBooking.id,
        customerName: newBooking.customerName,
        serviceId: newBooking.serviceId,
        bookingDate: newBooking.bookingDate.toISOString(),
        bookingTime: newBooking.bookingTime,
        status: newBooking.status
      });

      // Create booking service variant relationships
      if (variantIds.length > 0) {
        console.log(`🔗 [${requestId}] Creating variant relationships...`);

        const bookingVariants = variantIds.map(variantId => ({
          bookingId: newBooking.id,
          variantId: variantId
        }));

        console.log(`📋 [${requestId}] Variant relationships to create:`, bookingVariants);

        await prisma.bookingServiceVariant.createMany({
          data: bookingVariants
        });

        console.log(`✅ [${requestId}] Created ${bookingVariants.length} variant relationships`);
      } else {
        console.log(`📋 [${requestId}] No variants to link`);
      }

      // Handle loyalty program opt-in if selected
      if (joinLoyalty === 'true' || joinLoyalty === true) {
        console.log(`🎯 [${requestId}] Customer opted for loyalty program:`, { customerName, customerEmail });
        console.log(`✅ [${requestId}] Loyalty program opt-in recorded (implementation pending)`);

        // TODO: Complete loyalty program implementation
        // - Create customer record if needed
        // - Add to loyalty program
        // - Calculate and award points
        // - Record points history
      } else {
        console.log(`📋 [${requestId}] Customer did not opt for loyalty program`);
      }

      console.log(`🎯 [${requestId}] Transaction completed successfully`);
      return newBooking;
    });

    console.log(`✅ [${requestId}] Database transaction completed successfully`);
    console.log(`📧 [${requestId}] Preparing email notification...`);

    // Prepare booking data for email
    const bookingEmailData = {
      customerName,
      customerEmail,
      service: serviceDoc.name,
      appointmentDate: finalBookingDate,
      appointmentTime: finalBookingTime,
      notes: notes || '',
      joinLoyalty: joinLoyalty === 'true' || joinLoyalty === true,
      loyaltyPointsEarned: 0
    };

    // Add loyalty points if applicable
    if (joinLoyalty === 'true' || joinLoyalty === true) {
      try {
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
          where: { isActive: true }
        });

        if (loyaltyProgram) {
          bookingEmailData.loyaltyPointsEarned = loyaltyProgram.pointsPerBooking;
          console.log(`🎁 [${requestId}] Loyalty points to be earned: ${loyaltyProgram.pointsPerBooking}`);
        }
      } catch (loyaltyError) {
        console.error(`⚠️ [${requestId}] Error fetching loyalty program:`, loyaltyError.message);
      }
    }

    // Send confirmation email
    try {
      console.log(`📧 [${requestId}] Sending confirmation email to: ${customerEmail}`);
      await sendBookingConfirmation(bookingEmailData);
      console.log(`✅ [${requestId}] Confirmation email sent successfully`);
    } catch (emailError) {
      console.error(`⚠️ [${requestId}] Error sending confirmation email:`, {
        error: emailError.message,
        customerEmail,
        // Don't fail the booking if email fails
      });
      // Don't fail the booking if email fails
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log(`🎉 [${requestId}] BOOKING CREATION COMPLETED SUCCESSFULLY`);
    console.log(`📊 [${requestId}] Final Summary:`, {
      bookingId: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      serviceName: serviceDoc.name,
      bookingDate: booking.bookingDate.toISOString(),
      bookingTime: booking.bookingTime,
      totalDuration: booking.totalDuration,
      variantCount: variantIds.length,
      inspirationImagesCount: booking.inspirationImages.length,
      currentHairImagesCount: Object.keys(booking.currentHairImages || {}).length,
      joinedLoyalty: booking.joinLoyalty,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking,
      processingTime: `${processingTime}ms`,
      requestId
    });

  } catch (error) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.error(`💥 [${requestId}] BOOKING CREATION FAILED:`, {
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack,
      processingTime: `${processingTime}ms`
    });

    let statusCode = 500;
    let errorType = 'INTERNAL_SERVER_ERROR';
    let userMessage = 'An unexpected error occurred while creating your booking';

    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      statusCode = 400;
      errorType = 'DUPLICATE_BOOKING';
      userMessage = 'A booking with these details already exists';
    } else if (error.code === 'P2003') {
      // Prisma foreign key constraint violation
      statusCode = 400;
      errorType = 'INVALID_REFERENCE';
      userMessage = 'Invalid service or variant reference';
    } else if (error.code === 'P2025') {
      // Prisma record not found
      statusCode = 400;
      errorType = 'RECORD_NOT_FOUND';
      userMessage = 'Required record not found';
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorType = 'VALIDATION_ERROR';
      userMessage = 'Invalid booking data provided';
    }

    res.status(statusCode).json({
      success: false,
      error: errorType,
      message: userMessage,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          originalError: error.message,
          errorCode: error.code,
          processingTime: `${processingTime}ms`
        }
      }),
      requestId
    });
  }
});

// Get all bookings (admin/staff only)
router.get('/', staffAuth, async (req, res) => {
  console.log('🔍 GET /api/bookings - Auth info:', {
    staffId: req.staff?.id,
    staffName: req.staff?.name,
    staffRole: req.staff?.role
  });
  try {
    console.log('📅 GET /api/bookings - Query params:', req.query);
    const { page = 1, limit = 10, status, date, startDate, endDate, stylist } = req.query;

    // Build Prisma where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    // Handle date filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        where.bookingDate = {
          gte: start,
          lte: end
        };
      }
    } else if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.bookingDate = {
        gte: startDate,
        lt: endDate
      };
    }

    if (stylist) {
      where.stylist = stylist;
    }

    // Determine if we should use pagination
    const usePagination = !startDate || !endDate;

    // Get bookings with Prisma
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            baseDuration: true,
            basePrice: true,
            isActive: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { bookingDate: 'asc' },
        { bookingTime: 'asc' }
      ],
      ...(usePagination && {
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      })
    });

    const total = await prisma.booking.count({ where });

    // Transform bookings to map baseDuration to duration and basePrice to price for client compatibility
    const transformedBookings = bookings.map(booking => {
      if (booking.service) {
        return {
          ...booking,
          service: {
            ...booking.service,
            duration: booking.service.baseDuration,
            price: booking.service.basePrice
          }
        };
      }
      return booking;
    });

    // Ensure dates are properly serialized
    const serializedBookings = transformedBookings.map(booking => ({
      ...booking,
      bookingDate: booking.bookingDate.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString()
    }));

    console.log('✅ Bookings query successful - Found:', serializedBookings.length, 'bookings');
    
    res.json({
      success: true,
      bookings: serializedBookings,
      totalPages: usePagination ? Math.ceil(total / parseInt(limit)) : 1,
      currentPage: usePagination ? parseInt(page) : 1,
      total
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Update booking status
router.patch('/:id/status', staffAuth, [
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // If booking is marked as completed, add loyalty points
    if (status === 'completed') {
      try {
        // Check if loyalty program is active
        const loyaltyProgram = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
        
        if (loyaltyProgram) {
          // Find or create customer loyalty record
          let customerLoyalty = await prisma.customerLoyalty.findFirst({ 
            where: { customerEmail: booking.customerEmail.toLowerCase() }
          });
          
          if (!customerLoyalty) {
            // Create new customer loyalty record
            customerLoyalty = await prisma.customerLoyalty.create({
              data: {
                customerEmail: booking.customerEmail.toLowerCase(),
                customerName: booking.customerName,
                customerPhone: booking.customerPhone,
                totalPoints: 0,
                lifetimePoints: 0
              }
            });
          }
          
          // Add points for completed booking
          const pointsToAdd = loyaltyProgram.pointsPerBooking || 10;
          await prisma.customerLoyalty.update({
            where: { id: customerLoyalty.id },
            data: {
              totalPoints: { increment: pointsToAdd },
              lifetimePoints: { increment: pointsToAdd }
            }
          });
        }
      } catch (loyaltyError) {
        console.error('Loyalty program error:', loyaltyError);
        // Don't fail the status update if loyalty program fails
      }
    }

    res.json({ 
      message: 'Booking status updated', 
      booking,
      loyaltyPointsAdded: status === 'completed' ? true : undefined
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking (general update endpoint)
router.patch('/:id', staffAuth, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, bookingDate, bookingTime, notes, status } = req.body;
    
    const updateData = {};
    if (customerName) updateData.customerName = customerName;
    if (customerEmail) updateData.customerEmail = customerEmail;
    if (customerPhone) updateData.customerPhone = customerPhone;
    if (bookingDate) updateData.bookingDate = new Date(bookingDate);
    if (bookingTime) updateData.bookingTime = bookingTime;
    if (notes) updateData.notes = notes;
    if (status) updateData.status = status;
    
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a date
router.get('/availability/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSlots = await prisma.booking.findMany({
      where: {
        bookingDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { in: ['pending', 'confirmed'] }
      },
      select: {
        bookingTime: true
      }
    });

    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    const bookedTimes = bookedSlots.map(slot => slot.bookingTime);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ availableSlots });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a date range
router.get('/availability', async (req, res) => {
  try {
    const { startDate, endDate, serviceId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure valid date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Limit to reasonable date range (14 days max)
    const dayDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (dayDiff > 14) {
      return res.status(400).json({ message: 'Date range too large (max 14 days)' });
    }

    // Get all bookings in the date range
    const where = {
      bookingDate: { gte: start, lte: end },
      status: { in: ['pending', 'confirmed'] }
    };
    
    // Note: staffId filtering removed as bookings no longer have staff assignment
    
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        bookingDate: true,
        bookingTime: true
      }
    });
    
    // Generate all dates in the range
    const dates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Default time slots
    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    // Create availability map
    const availableSlots = {};
    
    // For each date, determine available slots
    for (const date of dates) {
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Skip Sundays (0 = Sunday)
      if (date.getDay() === 0) {
        availableSlots[dateString] = [];
        continue;
      }
      
      // Find bookings for this specific date
      const dayBookings = bookings.filter(booking => 
        booking.bookingDate.toISOString().split('T')[0] === dateString
      );
      
      const bookedTimes = dayBookings.map(booking => booking.bookingTime);
      availableSlots[dateString] = allSlots.filter(slot => !bookedTimes.includes(slot));
    }
    
    res.json({ availableSlots });
  } catch (error) {
    console.error('Get availability range error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a specific date considering service duration
router.get('/available-slots', async (req, res) => {
  try {
    const { date, duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Get all bookings for the requested date
    const existingBookings = await prisma.booking.findMany({
      where: {
        bookingDate: requestedDate,
        status: { in: ['pending', 'confirmed'] }
      },
      select: {
        bookingTime: true,
        totalDuration: true
      }
    });

    // Define business hours (9 AM to 6 PM)
    const businessStart = 9 * 60; // 9:00 AM in minutes
    const businessEnd = 18 * 60;  // 6:00 PM in minutes
    const slotInterval = 30; // 30-minute intervals
    const serviceDuration = parseInt(duration);

    // Generate all possible time slots
    const allSlots = [];
    for (let time = businessStart; time <= businessEnd - serviceDuration; time += slotInterval) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      allSlots.push({
        time: timeString,
        startMinutes: time,
        endMinutes: time + serviceDuration
      });
    }

    // Filter out slots that conflict with existing bookings
    const availableSlots = allSlots.filter(slot => {
      return !existingBookings.some(booking => {
        const bookingStartMinutes = timeStringToMinutes(booking.bookingTime);
        const bookingEndMinutes = bookingStartMinutes + (booking.totalDuration || 60);

        // Check if there's any overlap
        return (
          (slot.startMinutes < bookingEndMinutes) &&
          (slot.endMinutes > bookingStartMinutes)
        );
      });
    });

    res.json({
      success: true,
      slots: availableSlots.map(slot => slot.time),
      date: date,
      duration: serviceDuration
    });

  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available slots',
      error: error.message
    });
  }
});

// Staff: Confirm booking with pricing and duration
router.patch('/:id/confirm', staffAuth, [
  body('totalPrice').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('totalDuration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { totalPrice, totalDuration, notes } = req.body;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            category: true
          }
        },
        serviceVariants: {
          include: {
            variant: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in pending status'
      });
    }

    // Update booking with price, duration and confirm
    const updateData = {
      totalPrice: parseFloat(totalPrice),
      status: 'confirmed',
      notes: notes || booking.notes
    };
    
    // Add duration if provided
    if (totalDuration) {
      updateData.totalDuration = parseInt(totalDuration);
    }
    
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        service: {
          include: {
            category: true
          }
        },
        serviceVariants: {
          include: {
            variant: true
          }
        }
      }
    });

    // Send confirmation email to customer
    try {
      await sendBookingConfirmationEmail(updatedBooking);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error(`💥 [${req.requestId}] ERROR:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    
    // Handle specific error types
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'A booking with this information already exists',
        error: 'DUPLICATE_BOOKING',
        requestId: req.requestId
      });
    } else if (error.code === 'P2003') {
      // Prisma foreign key constraint violation
      return res.status(400).json({
        success: false,
        message: 'Invalid reference to another record (e.g., service ID)',
        error: 'INVALID_REFERENCE',
        requestId: req.requestId
      });
    } else if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message || 'Validation error',
        error: 'VALIDATION_ERROR',
        requestId: req.requestId
      });
    } else {
      // Generic server error
      return res.status(500).json({
        success: false,
        message: 'Server error while creating booking',
        error: error.message || 'UNKNOWN_ERROR',
        requestId: req.requestId
      });
    }
  }
});

// Helper function to send booking confirmation email
async function sendBookingConfirmationEmail(booking) {
  // ... (rest of the code remains the same)

  // Skip email if not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - skipping email notification');
    return;
  }

  // Configure email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Format service variants for email
  const selectedVariants = booking.serviceVariants.map(sv => sv.variant.name).join(', ');

  const emailContent = `
    <h2>Booking Confirmation - Glam Elegance</h2>

    <p>Dear ${booking.customerName},</p>

    <p>Your service request has been confirmed! Here are the details:</p>

    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Service Details</h3>
      <p><strong>Service:</strong> ${booking.service.name}</p>
      <p><strong>Category:</strong> ${booking.service.category.name}</p>
      ${selectedVariants ? `<p><strong>Options:</strong> ${selectedVariants}</p>` : ''}
      <p><strong>Duration:</strong> ${booking.totalDuration} minutes</p>

      <h3>Appointment Details</h3>
      <p><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${booking.bookingTime}</p>

      <h3>Pricing</h3>
      <p><strong>Total Price:</strong> $${booking.totalPrice}</p>

      ${booking.notes ? `<h3>Notes</h3><p>${booking.notes}</p>` : ''}
    </div>

    <p>We look forward to seeing you!</p>

    <p>Best regards,<br>
    The Glam Elegance Team</p>

    <hr>
    <p style="font-size: 12px; color: #666;">
      If you need to make changes to your appointment, please contact us as soon as possible.
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@glamelegance.com',
    to: booking.customerEmail,
    subject: 'Booking Confirmation - Glam Elegance',
    html: emailContent
  };

  await transporter.sendMail(mailOptions);
}

// Helper function to convert time string to minutes
function timeStringToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = router;
