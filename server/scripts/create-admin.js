#!/usr/bin/env node

// Script to create admin user for Glam Elegance
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'paul@ioi.co.zw' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email: paul@ioi.co.zw');
      console.log('🔄 Updating password...');

      // Update password (let the model handle hashing)
      existingAdmin.password = 'Letmein99x!';
      await existingAdmin.save();
      
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('👤 Creating new admin user...');

      // Create admin user (let the model handle password hashing)
      const adminUser = new User({
        username: 'paul',
        name: 'Paul Macharaga',
        email: 'paul@ioi.co.zw',
        password: 'Letmein99x!',
        role: 'admin',
        isActive: true,
        createdAt: new Date()
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎯 Admin Login Credentials:');
    console.log('📧 Email: paul@ioi.co.zw');
    console.log('🔑 Password: Letmein99x!');
    console.log('👑 Role: admin');
    
    console.log('\n🚀 You can now login to the admin dashboard!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
createAdminUser();
