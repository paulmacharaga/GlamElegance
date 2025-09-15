#!/usr/bin/env node

// Script to verify and create admin user in production database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use production environment variables
const MONGODB_URI = 'mongodb+srv://Vercel-Admin-Glamelagance:mfg5D58Xk8EQktJa@glamelagance.ymezrea.mongodb.net/glam-elegance-booking?retryWrites=true&w=majority';

// Import User model
const User = require('../models/User');

const verifyAndCreateAdmin = async () => {
  try {
    console.log('🔗 Connecting to Production MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to Production MongoDB Atlas');

    // Check if admin user exists
    console.log('🔍 Searching for admin user...');
    const existingAdmin = await User.findOne({ email: 'paul@ioi.co.zw' });
    
    if (existingAdmin) {
      console.log('👤 Admin user found:');
      console.log(`   📧 Email: ${existingAdmin.email}`);
      console.log(`   👤 Name: ${existingAdmin.name}`);
      console.log(`   🔑 Username: ${existingAdmin.username}`);
      console.log(`   👑 Role: ${existingAdmin.role}`);
      console.log(`   ✅ Active: ${existingAdmin.isActive}`);
      
      // Test password
      console.log('🔐 Testing password...');
      const isPasswordValid = await existingAdmin.comparePassword('Letmein99x!');
      
      if (isPasswordValid) {
        console.log('✅ Password verification successful!');
      } else {
        console.log('❌ Password verification failed! Updating password...');
        
        // Update password
        existingAdmin.password = 'Letmein99x!';
        await existingAdmin.save();
        console.log('✅ Password updated successfully!');
      }
    } else {
      console.log('❌ Admin user not found! Creating new admin user...');
      
      // Create admin user
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

    // Final verification
    console.log('\n🔍 Final verification...');
    const finalUser = await User.findOne({ email: 'paul@ioi.co.zw' });
    const finalPasswordTest = await finalUser.comparePassword('Letmein99x!');
    
    console.log('\n🎯 Production Admin Status:');
    console.log(`   📧 Email: ${finalUser.email}`);
    console.log(`   🔑 Username: ${finalUser.username}`);
    console.log(`   👤 Name: ${finalUser.name}`);
    console.log(`   👑 Role: ${finalUser.role}`);
    console.log(`   ✅ Active: ${finalUser.isActive}`);
    console.log(`   🔐 Password Valid: ${finalPasswordTest ? '✅ YES' : '❌ NO'}`);
    
    if (finalPasswordTest) {
      console.log('\n🚀 READY FOR LOGIN!');
      console.log('   Login URL: https://glam-elegance.vercel.app/admin');
      console.log('   Username: paul@ioi.co.zw (use as username field)');
      console.log('   Password: Letmein99x!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
verifyAndCreateAdmin();
