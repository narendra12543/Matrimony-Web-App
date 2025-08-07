// Test the URL generation fix
import { getImageUrl } from './imageUtils.js';

console.log('🧪 Testing URL Generation Fix...');
console.log('=====================================');

// Test cases
const testCases = [
  '/uploads/users/MM1002/profile/photos/MM1002_profile_photo_161.jpeg',
  '/uploads/users/MM1002/profile/photos/MM1002_profile_photo_393.png',
  'users/MM1002/profile/photos/MM1002_profile_photo_161.jpeg',
  'verification/MM1002/aadhaar.pdf'
];

console.log('📋 Test Cases:');
testCases.forEach((path, index) => {
  const generatedUrl = getImageUrl(path);
  const expectedUrl = `http://localhost:5000${path.startsWith('/') ? path : `/uploads/${path}`}`;
  
  console.log(`${index + 1}. Input: ${path}`);
  console.log(`   Generated: ${generatedUrl}`);
  console.log(`   Expected:  ${expectedUrl}`);
  console.log(`   ✅ Correct: ${generatedUrl === expectedUrl}`);
  console.log('');
});

// Test the specific problematic URL
const problematicPath = '/uploads/users/MM1002/profile/photos/MM1002_profile_photo_161.jpeg';
const fixedUrl = getImageUrl(problematicPath);
console.log('🔧 Fixed URL Test:');
console.log(`Original: ${problematicPath}`);
console.log(`Fixed:    ${fixedUrl}`);
console.log(`Should be: http://localhost:5000${problematicPath}`);
console.log(`✅ Correct: ${fixedUrl === `http://localhost:5000${problematicPath}`}`);

export default testCases; 