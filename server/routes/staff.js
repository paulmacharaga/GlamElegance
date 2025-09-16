const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all staff members
router.get('/', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: {
        name: 'asc'
      },
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
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
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
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
      phone,
      password,
      role = 'staff'
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }
    
    // Check if email already exists
    const existingStaff = await prisma.staff.findUnique({
      where: { email }
    });
    
    if (existingStaff) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new staff member
    const newStaff = await prisma.staff.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
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
      isActive,
      password,
      role
    } = req.body;
    
    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      isActive,
      role
    };
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }
    
    // Find staff member and update
    const updatedStaff = await prisma.staff.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    // Don't send password hash in response
    delete updatedStaff.password;
    
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
