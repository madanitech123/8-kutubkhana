/**
 * Cloudflare Pages build: copy static assets to dist/ and generate js/config.js from env vars.
 * Set SUPABASE_URL and SUPABASE_ANON_KEY in Cloudflare Pages → Settings → Environment variables.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const itemsToCopy = ['index.html', 'js', 'styles'];
const skipFiles = new Set(['config.js']);

function copyDir(src, dest, { skip = skipFiles } = {}) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (entry.isFile() && skip.has(entry.name)) continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) copyDir(srcPath, destPath, { skip });
        else {
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const item of itemsToCopy) {
    const src = path.join(rootDir, item);
    const dest = path.join(distDir, item);
    if (!fs.existsSync(src)) {
        console.warn(`Warning: ${item} not found`);
        continue;
    }
    if (fs.statSync(src).isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
    console.log(`Copied: ${item}`);
}

fs.writeFileSync(
    path.join(distDir, '_headers'),
    [
        '/*',
        '  X-Frame-Options: DENY',
        '  X-Content-Type-Options: nosniff',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        ''
    ].join('\n'),
    'utf8'
);

process.env.CONFIG_OUT_PATH = path.join(distDir, 'js', 'config.js');
execSync('node scripts/build-config.js', { cwd: rootDir, stdio: 'inherit' });

console.log('\nCloudflare Pages build complete. Output: dist/');
