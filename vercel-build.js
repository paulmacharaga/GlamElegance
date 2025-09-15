#!/usr/bin/env node

// Custom build script for Vercel deployment
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

try {
  // Install root dependencies
  console.log('📦 Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });

  // Install server dependencies
  console.log('🔧 Installing server dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'server') });

  // Install client dependencies
  console.log('⚛️ Installing client dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'client') });

  // Build client
  console.log('🏗️ Building React application...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, 'client') });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
