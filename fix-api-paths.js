const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing double API paths in service files...');

// Function to recursively find all TypeScript service files
function findServiceFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.angular')) {
            findServiceFiles(fullPath, files);
        } else if (item.endsWith('.service.ts')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

// Function to fix API paths in a file
function fixApiPaths(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Fix double API paths: ${this.apiUrl}/api/ -> ${this.apiUrl}/
        const doubleApiRegex = /\$\{[^}]*apiUrl\}\/api\//g;
        const matches = content.match(doubleApiRegex);
        
        if (matches && matches.length > 0) {
            content = content.replace(doubleApiRegex, (match) => {
                return match.replace('/api/', '/');
            });
            modified = true;
            console.log(`  - Fixed ${matches.length} double API paths`);
        }
        
        // Also fix cases where apiUrl is used directly in template literals
        const templateApiRegex = /`\$\{[^}]*apiUrl\}\/api\//g;
        const templateMatches = content.match(templateApiRegex);
        
        if (templateMatches && templateMatches.length > 0) {
            content = content.replace(templateApiRegex, (match) => {
                return match.replace('/api/', '/');
            });
            modified = true;
            console.log(`  - Fixed ${templateMatches.length} template API paths`);
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return false;
    }
}

// Main execution
const frontendDir = path.join(__dirname, 'immunizationdatabase-frontend', 'vaxtrack-web', 'src');

if (!fs.existsSync(frontendDir)) {
    console.error('❌ Frontend source directory not found:', frontendDir);
    process.exit(1);
}

const serviceFiles = findServiceFiles(frontendDir);
console.log(`📁 Found ${serviceFiles.length} service files`);

let fixedCount = 0;
for (const file of serviceFiles) {
    if (fixApiPaths(file)) {
        fixedCount++;
    }
}

console.log(`\n🎉 API path fixing completed!`);
console.log(`📊 Files processed: ${serviceFiles.length}`);
console.log(`🔧 Files fixed: ${fixedCount}`);

if (fixedCount > 0) {
    console.log('\n🔨 API paths fixed. You should rebuild the application:');
    console.log('   cd immunizationdatabase-frontend/vaxtrack-web');
    console.log('   npm run build -- --base-href="/Immunization-Management-Sytem-group5-project-/"');
} else {
    console.log('\n✅ No API path issues found to fix.');
}