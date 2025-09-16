const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// Get all staff members
router.get('/', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: {
        name: 'asc'
      },
      where: {
        isActive: true
      }
    });
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single staff member
router.get('/:id', async (req, res) => {
  try {
    const staffMember = await prisma.staff.findUnique({
      where: { id: req.params.id }
    });
    
    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    res.json(staffMember);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new staff member (admin only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { 
      name, 
      email, 
      phone
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Please provide name' });
    }
    
    // Create new staff member
    const newStaff = await prisma.staff.create({
      data: {
        name,
        email,
        phone
      }
    });
    
    res.status(201).json(newStaff);
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a staff member (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const { 
      name, 
      email, 
      phone,
      isActive 
    } = req.body;
    
    // Find staff member and update
    const updatedStaff = await prisma.staff.update({
      where: { id: req.params.id },
      data: {
        name, 
        email, 
        phone,
        isActive
      }
    });
    
    res.json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a staff member (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const staffMember = await prisma.staff.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
