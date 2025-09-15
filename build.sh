#!/bin/bash

# Vercel build script for Glam Elegance
echo "Starting Vercel build process..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server && npm install && cd ..

# Install client dependencies and build
echo "Installing client dependencies and building..."
cd client && npm install && npm run build && cd ..

echo "Build completed successfully!"
