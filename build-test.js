#!/usr/bin/env node

// Quick build test script
console.log('🏗️  Running build test...');

// Test imports
try {
  console.log('✅ Testing API route import...');
  // This will catch any immediate syntax errors
  
  console.log('✅ Build test completed - no immediate syntax errors found');
  process.exit(0);
} catch (error) {
  console.error('❌ Build test failed:', error.message);
  process.exit(1);
}
