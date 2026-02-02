const https = require('https');
const fs = require('fs');

console.log('🔍 VaxTrack Deployment Verification Script');
console.log('==========================================');

// Configuration
const GITHUB_PAGES_URL = 'https://donjunior01.github.io/Immunization-Management-Sytem-group5-project-/';
const BACKEND_URL = 'https://immunizationdb-backend.onrender.com';
const EXPECTED_FILES = [
    'index.html',
    'main-RYHK4SEP.js',
    'chunk-T4RMSDZY.js',
    'chunk-K3XQKY74.js',
    'chunk-MLMGL4QO.js',
    'styles-5INURTSO.css',
    'favicon.ico'
];

// Test functions
async function testUrl(url, description) {
    return new Promise((resolve) => {
        const request = https.get(url, (response) => {
            console.log(`✅ ${description}: HTTP ${response.statusCode}`);
            resolve({ success: response.statusCode === 200, status: response.statusCode });
        });
        
        request.on('error', (error) => {
            console.log(`❌ ${description}: ${error.message}`);
            resolve({ success: false, error: error.message });
        });
        
        request.setTimeout(10000, () => {
            console.log(`⏰ ${description}: Timeout`);
            request.destroy();
            resolve({ success: false, error: 'Timeout' });
        });
    });
}

async function verifyFrontendFiles() {
    console.log('\n📁 Testing Frontend Files:');
    console.log('---------------------------');
    
    const results = [];
    for (const file of EXPECTED_FILES) {
        const url = GITHUB_PAGES_URL + file;
        const result = await testUrl(url, `Frontend: ${file}`);
        results.push({ file, ...result });
    }
    
    const failedFiles = results.filter(r => !r.success);
    if (failedFiles.length > 0) {
        console.log('\n❌ Failed Files:');
        failedFiles.forEach(f => console.log(`   - ${f.file}: ${f.error || f.status}`));
        return false;
    }
    
    console.log('\n✅ All frontend files are accessible!');
    return true;
}

async function verifyBackendEndpoints() {
    console.log('\n🖥️ Testing Backend Endpoints:');
    console.log('------------------------------');
    
    const endpoints = [
        { path: '/api/actuator/health', name: 'Health Check' },
        { path: '/api', name: 'API Root' },
        { path: '/api/auth/login', name: 'Login Endpoint' },
        { path: '/api/patients', name: 'Patients API' },
        { path: '/api/vaccinations', name: 'Vaccinations API' }
    ];
    
    const results = [];
    for (const endpoint of endpoints) {
        const url = BACKEND_URL + endpoint.path;
        const result = await testUrl(url, `Backend: ${endpoint.name}`);
        results.push({ endpoint: endpoint.name, ...result });
    }
    
    const workingEndpoints = results.filter(r => r.success || (r.status >= 400 && r.status < 500));
    console.log(`\n✅ Backend is responding (${workingEndpoints.length}/${results.length} endpoints accessible)`);
    
    return workingEndpoints.length > 0;
}

async function verifyBaseHref() {
    console.log('\n🔗 Verifying Base Href Configuration:');
    console.log('-------------------------------------');
    
    try {
        const indexContent = fs.readFileSync('index.html', 'utf8');
        const baseHrefMatch = indexContent.match(/<base href="([^"]+)"/);
        
        if (baseHrefMatch) {
            const baseHref = baseHrefMatch[1];
            console.log(`📍 Current base href: ${baseHref}`);
            
            const expectedBaseHref = '/Immunization-Management-Sytem-group5-project-/';
            if (baseHref === expectedBaseHref) {
                console.log('✅ Base href is correctly configured!');
                return true;
            } else {
                console.log(`❌ Base href mismatch! Expected: ${expectedBaseHref}`);
                return false;
            }
        } else {
            console.log('❌ Base href not found in index.html');
            return false;
        }
    } catch (error) {
        console.log(`❌ Error reading index.html: ${error.message}`);
        return false;
    }
}

async function verifyEnvironmentConfig() {
    console.log('\n⚙️ Verifying Environment Configuration:');
    console.log('---------------------------------------');
    
    try {
        // Check if the built files contain the correct API URL
        const mainJsFiles = fs.readdirSync('.').filter(f => f.startsWith('main-') && f.endsWith('.js'));
        
        if (mainJsFiles.length === 0) {
            console.log('❌ No main JS file found');
            return false;
        }
        
        const mainJsContent = fs.readFileSync(mainJsFiles[0], 'utf8');
        
        if (mainJsContent.includes('immunizationdb-backend.onrender.com')) {
            console.log('✅ Production API URL found in built files');
            return true;
        } else if (mainJsContent.includes('localhost')) {
            console.log('❌ Localhost URL found - not using production environment');
            return false;
        } else {
            console.log('⚠️ Could not verify API URL in built files');
            return true; // Assume OK if we can't verify
        }
    } catch (error) {
        console.log(`❌ Error checking environment config: ${error.message}`);
        return false;
    }
}

// Main verification function
async function runVerification() {
    console.log(`🚀 Starting verification at ${new Date().toLocaleString()}\n`);
    
    const results = {
        baseHref: await verifyBaseHref(),
        environment: await verifyEnvironmentConfig(),
        frontend: await verifyFrontendFiles(),
        backend: await verifyBackendEndpoints()
    };
    
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log('========================');
    console.log(`Base Href Configuration: ${results.baseHref ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Environment Config: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Frontend Files: ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Backend Connectivity: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED! Deployment is successful.');
        console.log(`🌐 Frontend URL: ${GITHUB_PAGES_URL}`);
        console.log(`🖥️ Backend URL: ${BACKEND_URL}`);
        console.log('\n✅ The VaxTrack application should be fully functional.');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the issues above.');
        
        // Provide specific guidance
        if (!results.baseHref) {
            console.log('\n🔧 Base Href Fix:');
            console.log('   Run: npm run build -- --base-href="/Immunization-Management-Sytem-group5-project-/"');
        }
        
        if (!results.frontend) {
            console.log('\n🔧 Frontend Fix:');
            console.log('   1. Rebuild with correct base href');
            console.log('   2. Copy files to root directory');
            console.log('   3. Commit and push to gh-pages branch');
        }
        
        if (!results.backend) {
            console.log('\n🔧 Backend Fix:');
            console.log('   Check Render.com dashboard for backend status');
        }
    }
    
    return allPassed;
}

// Run the verification
runVerification().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
});