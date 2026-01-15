// Script to replace API URL in environment.prod.ts during Docker build
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:8080/api';
const envFile = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');

console.log(`Setting API URL to: ${API_URL}`);

let content = fs.readFileSync(envFile, 'utf8');
content = content.replace(
  /apiUrl:\s*['"](.*?)['"]/,
  `apiUrl: '${API_URL}'`
);
fs.writeFileSync(envFile, content);

console.log('Environment file updated successfully');

