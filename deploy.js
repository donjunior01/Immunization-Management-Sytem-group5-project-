const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building VaxTrack Angular App for GitHub Pages deployment...');

// Define paths
const frontendDir = path.join(__dirname, 'immunizationdatabase-frontend', 'vaxtrack-web');
const deployDir = path.join(__dirname);
const distDir = path.join(frontendDir, 'dist', 'vaxtrack-web');

console.log('📁 Frontend directory:', frontendDir);
console.log('📁 Deploy directory:', deployDir);
console.log('📁 Dist directory:', distDir);

// Check if frontend directory exists
if (!fs.existsSync(frontendDir)) {
    console.error('❌ Frontend directory not found:', frontendDir);
    process.exit(1);
}

// Change to frontend directory and build
process.chdir(frontendDir);
console.log('📂 Changed to frontend directory');

try {
    // Install dependencies if node_modules doesn't exist
    if (!fs.existsSync('node_modules')) {
        console.log('📦 Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
    }

    // Build the Angular application for production
    console.log('🔨 Building Angular application for production...');
    execSync('npm run build -- --base-href="/Immunization-Management-Sytem-group5-project-/"', { stdio: 'inherit' });
    
    // Check if build was successful
    if (!fs.existsSync(distDir)) {
        console.error('❌ Build failed - dist directory not found');
        process.exit(1);
    }

    console.log('✅ Angular build completed successfully');

    // Copy built files to deployment directory
    console.log('📋 Copying built files to deployment directory...');
    
    // Get list of files in dist directory
    const distFiles = fs.readdirSync(distDir);
    console.log('📄 Files to copy:', distFiles);

    // Copy each file from dist to root
    distFiles.forEach(file => {
        const srcPath = path.join(distDir, file);
        const destPath = path.join(deployDir, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
            // Copy directory recursively
            copyDirectory(srcPath, destPath);
        } else {
            // Copy file
            fs.copyFileSync(srcPath, destPath);
        }
        console.log(`✅ Copied: ${file}`);
    });

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Helper function to copy directories recursively
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Create 404.html for SPA routing (copy of index.html)
const indexPath = path.join(deployDir, 'index.html');
const notFoundPath = path.join(deployDir, '404.html');

if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
    console.log('✅ Created 404.html for SPA routing');
}

// Create _config.yml for Jekyll (GitHub Pages)
const jekyllConfig = `title: VaxTrack Immunization System
description: Healthcare management system for immunization tracking
baseurl: ""
url: "https://donjunior01.github.io"

# Build settings
markdown: kramdown
highlighter: rouge
theme: minima

# Exclude files
exclude:
  - immunizationdb-backend/
  - immunizationdatabase-frontend/
  - .github/
  - node_modules/
  - "*.md"
  - "*.yml"
  - "*.json"

# Include files
include:
  - _redirects

plugins:
  - jekyll-feed
  - jekyll-sitemap`;

fs.writeFileSync(path.join(deployDir, '_config.yml'), jekyllConfig);
console.log('✅ Created _config.yml for Jekyll');

// Create _redirects for SPA routing
fs.writeFileSync(path.join(deployDir, '_redirects'), '/*    /index.html   200');
console.log('✅ Created _redirects file');

console.log('🎉 Angular application deployed successfully to GitHub Pages!');
console.log('📁 Files deployed from Angular build');
console.log('🚀 Ready for GitHub Pages deployment!');
console.log('🌐 Will be available at: https://donjunior01.github.io/Immunization-Management-System-group5-project-/');