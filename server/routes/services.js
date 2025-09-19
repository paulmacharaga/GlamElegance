const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const staffAuth = require('../middleware/staffAuth');

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: [
        { name: 'asc' }
      ],
      where: {
        isActive: true
      }
    });
    
    // Map baseDuration to duration and basePrice to price for client compatibility
    const transformedServices = services.map(service => ({
      ...service,
      duration: service.baseDuration,
      price: service.basePrice
    }));
    
    res.json(transformedServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single service
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id }
    });
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Map baseDuration to duration and basePrice to price for client compatibility
    const transformedService = {
      ...service,
      duration: service.baseDuration,
      price: service.basePrice
    };
    
    res.json(transformedService);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new service (admin only)
router.post('/', staffAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.staff.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { name, description, duration, price, category } = req.body;
    
    // Validate required fields
    if (!name || !duration || !price) {
      return res.status(400).json({ message: 'Please provide name, duration, and price' });
    }
    
    // Create new service
    const newService = await prisma.service.create({
      data: {
        name,
        description,
        baseDuration: duration, // Map duration to baseDuration for database
        basePrice: price // Map price to basePrice for database
      }
    });
    
    // Map baseDuration to duration and basePrice to price for client compatibility
    const transformedService = {
      ...newService,
      duration: newService.baseDuration,
      price: newService.basePrice
    };
    
    res.status(201).json(transformedService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a service (admin only)
router.put('/:id', staffAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.staff.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { name, description, duration, price, category, isActive } = req.body;
    
    // Find service and update
    const updatedService = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        name, 
        description, 
        baseDuration: duration, // Map duration to baseDuration for database
        basePrice: price, // Map price to basePrice for database
        isActive
      }
    });
    
    // Map baseDuration to duration and basePrice to price for client compatibility
    const transformedService = {
      ...updatedService,
      duration: updatedService.baseDuration,
      price: updatedService.basePrice
    };
    
    res.json(transformedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a service (admin only)
router.delete('/:id', staffAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.staff.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const service = await prisma.service.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
