#!/usr/bin/env node

// Script to test admin login credentials
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const testAdminLogin = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');

    // Find admin user
    const adminUser = await User.findOne({ email: 'paul@ioi.co.zw' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('👤 Admin user found:');
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   👤 Name: ${adminUser.name}`);
    console.log(`   🔑 Username: ${adminUser.username}`);
    console.log(`   👑 Role: ${adminUser.role}`);
    console.log(`   ✅ Active: ${adminUser.isActive}`);

    // Test password
    const isPasswordValid = await adminUser.comparePassword('Letmein99x!');
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('\n🎯 Login Test Results:');
      console.log('   📧 Email: paul@ioi.co.zw');
      console.log('   🔑 Password: Letmein99x!');
      console.log('   ✅ Status: READY FOR LOGIN');
    } else {
      console.log('❌ Password verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the test
testAdminLogin();
