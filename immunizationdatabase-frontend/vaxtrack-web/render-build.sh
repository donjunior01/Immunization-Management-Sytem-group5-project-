#!/bin/bash

echo "Starting Render build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Set API URL
echo "Setting API URL..."
export API_URL="https://immunizationdb-backend.onrender.com"
node build-env.js

# Build the application
echo "Building Angular application..."
npm run build

# List the contents of dist directory
echo "Build output:"
ls -la dist/

# Check if index.html exists
if [ -f "dist/index.html" ]; then
    echo "✅ index.html found in dist/"
elif [ -f "dist/vaxtrack-web/index.html" ]; then
    echo "✅ index.html found in dist/vaxtrack-web/"
else
    echo "❌ index.html not found!"
    echo "Contents of dist:"
    find dist -name "*.html" 2>/dev/null || echo "No HTML files found"
fi

echo "Build process completed."