const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning debug calls from TypeScript files...');

// Function to recursively find all TypeScript files
function findTsFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.angular')) {
            findTsFiles(fullPath, files);
        } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Function to clean debug calls from a file
function cleanDebugCalls(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Remove entire agent log regions
        const agentLogRegex = /\s*\/\/ #region agent log[\s\S]*?\/\/ #endregion\s*/g;
        const matches = content.match(agentLogRegex);
        if (matches && matches.length > 0) {
            content = content.replace(agentLogRegex, '\n');
            modified = true;
            console.log(`  - Removed ${matches.length} agent log regions`);
        }
        
        // Remove standalone fetch calls to localhost:7243
        const fetchRegex = /\s*fetch\('http:\/\/127\.0\.0\.1:7243\/[^']+',\{[^}]+\}\)\.catch\(\(\)=>\{\}\);\s*/g;
        const fetchMatches = content.match(fetchRegex);
        if (fetchMatches && fetchMatches.length > 0) {
            content = content.replace(fetchRegex, '\n');
            modified = true;
            console.log(`  - Removed ${fetchMatches.length} standalone fetch calls`);
        }
        
        // Clean up multiple empty lines
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Cleaned: ${path.relative(process.cwd(), filePath)}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error cleaning ${filePath}:`, error.message);
        return false;
    }
}

// Main execution
const frontendDir = path.join(__dirname, 'immunizationdatabase-frontend', 'vaxtrack-web', 'src');

if (!fs.existsSync(frontendDir)) {
    console.error('❌ Frontend source directory not found:', frontendDir);
    process.exit(1);
}

const tsFiles = findTsFiles(frontendDir);
console.log(`📁 Found ${tsFiles.length} TypeScript files`);

let cleanedCount = 0;
for (const file of tsFiles) {
    if (cleanDebugCalls(file)) {
        cleanedCount++;
    }
}

console.log(`\n🎉 Cleaning completed!`);
console.log(`📊 Files processed: ${tsFiles.length}`);
console.log(`🧹 Files cleaned: ${cleanedCount}`);

if (cleanedCount > 0) {
    console.log('\n🔨 Debug calls removed. You should rebuild the application:');
    console.log('   cd immunizationdatabase-frontend/vaxtrack-web');
    console.log('   npm run build -- --base-href="/Immunization-Management-Sytem-group5-project-/"');
} else {
    console.log('\n✅ No debug calls found to clean.');
}