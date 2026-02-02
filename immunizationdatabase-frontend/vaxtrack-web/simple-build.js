const fs = require('fs');
const path = require('path');

console.log('=== SIMPLE BUILD SCRIPT ===');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✅ Created dist directory');
}

// Create a simple index.html for testing
const simpleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VaxTrack - Loading...</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 20px; }
        .status { margin: 20px 0; }
        .loading { 
            border: 4px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error { color: #ffcccb; }
        .success { color: #90EE90; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏥 VaxTrack Immunization System</h1>
        <div class="loading"></div>
        <div class="status">Frontend deployment successful!</div>
        <div class="status">Checking backend connection...</div>
        <div id="backend-status">Testing...</div>
        
        <div style="margin-top: 30px;">
            <button onclick="testBackend()" style="padding: 10px 20px; background: white; color: #667eea; border: none; border-radius: 5px; cursor: pointer;">
                Test Backend Connection
            </button>
        </div>
    </div>

    <script>
        console.log('VaxTrack Frontend Loaded Successfully');
        
        async function testBackend() {
            const statusDiv = document.getElementById('backend-status');
            statusDiv.innerHTML = 'Testing backend...';
            
            try {
                const response = await fetch('https://immunizationdb-backend.onrender.com/api/actuator/health');
                if (response.ok) {
                    const data = await response.json();
                    statusDiv.innerHTML = '<span class="success">✅ Backend Connected: ' + data.status + '</span>';
                } else {
                    statusDiv.innerHTML = '<span class="error">❌ Backend Error: ' + response.status + '</span>';
                }
            } catch (error) {
                statusDiv.innerHTML = '<span class="error">❌ Backend Unreachable: ' + error.message + '</span>';
            }
        }
        
        // Auto-test backend on load
        setTimeout(testBackend, 2000);
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), simpleHtml);
console.log('✅ Created index.html');

// Create 404.html
fs.writeFileSync(path.join(distDir, '404.html'), simpleHtml);
console.log('✅ Created 404.html');

// Create _redirects
fs.writeFileSync(path.join(distDir, '_redirects'), '/*    /index.html   200');
console.log('✅ Created _redirects');

console.log('=== BUILD COMPLETE ===');
console.log('Files created in dist/:');
console.log('- index.html');
console.log('- 404.html'); 
console.log('- _redirects');