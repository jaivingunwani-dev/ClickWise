#!/usr/bin/env node

/**
 * Verify that the Chrome extension build includes all necessary files
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const distDir = path.resolve(__dirname, '../dist');

// Files that must exist in the build output
const requiredFiles = [
  'manifest.json',
  'index.html',           // Main popup UI
  'sidepanel.html',       // Side panel UI
  'background/index.js',  // Background service worker
  'content/index.js',     // Content script
];

// Files that should exist (optional but good to have)
const optionalFiles = [
  'background/index.js.map',
  'content/index.js.map',
];

console.log('🔍 Verifying Chrome extension build...\n');

let allChecksPassed = true;
const results = [];

// Check required files
console.log('📋 Required Files:');
requiredFiles.forEach((file) => {
  const filePath = path.join(distDir, file);
  const exists = fs.existsSync(filePath);

  if (exists) {
    const stat = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${stat.size} bytes)`);
    results.push({ file, status: 'PASS' });
  } else {
    console.log(`  ❌ ${file} (MISSING)`);
    results.push({ file, status: 'FAIL' });
    allChecksPassed = false;
  }
});

// Check optional files
console.log('\n📦 Optional Files (Source Maps):');
optionalFiles.forEach((file) => {
  const filePath = path.join(distDir, file);
  const exists = fs.existsSync(filePath);

  if (exists) {
    const stat = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${stat.size} bytes)`);
  } else {
    console.log(`  ⚠️  ${file} (not included, but optional)`);
  }
});

// Check for icons directory
console.log('\n🎨 Icons:');
const iconsDir = path.join(distDir, 'icons');
if (fs.existsSync(iconsDir)) {
  const icons = fs.readdirSync(iconsDir);
  console.log(`  ✅ icons/ directory with ${icons.length} files`);
} else {
  console.log(`  ⚠️  icons/ directory not found (optional)`);
}

// Summary
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
  console.log('✅ BUILD VERIFICATION PASSED - Extension is ready!');
  console.log('\nTo load the extension in Chrome:');
  console.log('  1. Open chrome://extensions');
  console.log('  2. Enable "Developer mode"');
  console.log('  3. Click "Load unpacked"');
  console.log(`  4. Select the dist/ folder`);
  process.exit(0);
} else {
  console.log('❌ BUILD VERIFICATION FAILED - Some files are missing');
  console.log('\nFailing files:');
  results
    .filter((r) => r.status === 'FAIL')
    .forEach((r) => console.log(`  - ${r.file}`));
  process.exit(1);
}
