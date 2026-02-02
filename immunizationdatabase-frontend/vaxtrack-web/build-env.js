// Script to replace API URL in environment.prod.ts during build
const fs = require('fs');
const path = require('path');

// Use RENDER_EXTERNAL_URL for backend service or fallback to API_URL
const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || 'https://immunizationdb-backend.onrender.com';
const API_URL = `${BACKEND_URL}/api`;
const envFile = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');

console.log(`Setting API URL to: ${API_URL}`);

let content = fs.readFileSync(envFile, 'utf8');
content = content.replace(
  /apiUrl:\s*['"](.*?)['"]/,
  `apiUrl: '${API_URL}'`
);
fs.writeFileSync(envFile, content);

console.log('Environment file updated successfully');

