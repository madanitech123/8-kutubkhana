const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const wwwDir = path.join(rootDir, 'www');

// Create www directory if it doesn't exist
if (!fs.existsSync(wwwDir)) {
    fs.mkdirSync(wwwDir, { recursive: true });
}

// Files and folders to copy
const itemsToCopy = [
    'index.html',
    'js',
    'styles'
];

// Ensure config.js is included (if it exists)
const configSrc = path.join(rootDir, 'js', 'config.js');
if (!fs.existsSync(configSrc)) {
    console.warn('\n⚠️  Warning: js/config.js not found!');
    console.warn('   The app needs Supabase credentials to work.');
    console.warn('   Copy js/config.example.js to js/config.js and add your keys.\n');
}

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy each item
itemsToCopy.forEach(item => {
    const src = path.join(rootDir, item);
    const dest = path.join(wwwDir, item);
    
    if (fs.existsSync(src)) {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            copyDir(src, dest);
            console.log(`Copied folder: ${item}`);
        } else {
            // Ensure parent directory exists
            const parentDir = path.dirname(dest);
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true });
            }
            fs.copyFileSync(src, dest);
            console.log(`Copied file: ${item}`);
        }
    } else {
        console.warn(`Warning: ${item} not found`);
    }
});

console.log('\n✅ Build complete! Files copied to www/');
