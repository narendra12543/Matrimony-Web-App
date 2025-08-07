// Verification script for image loading fix
import { getImageUrl } from "./imageUtils.js";

console.log("🔍 Verifying Image Loading Fix...");
console.log("=====================================");

// Test 1: Check URL generation
const testUrls = [
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_393.png",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_161.jpeg",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_513.jpeg",
];

console.log("📋 Test 1: URL Generation");
testUrls.forEach((url, index) => {
  const generatedUrl = getImageUrl(url);
  const expectedUrl = `http://localhost:5000${url}`;
  const isCorrect = generatedUrl === expectedUrl;

  console.log(`${index + 1}. ${isCorrect ? "✅" : "❌"} ${url}`);
  console.log(`   Generated: ${generatedUrl}`);
  console.log(`   Expected:  ${expectedUrl}`);
  console.log("");
});

// Test 2: Check environment variables
console.log("📋 Test 2: Environment Variables");
console.log(`VITE_API_URL: ${import.meta.env.VITE_API_URL}`);
console.log(
  `Base URL: ${
    import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
    "http://localhost:5000"
  }`
);
console.log("");

// Test 3: Test actual image loading
console.log("📋 Test 3: Image Loading Test");
const testImageLoading = async () => {
  for (let i = 0; i < testUrls.length; i++) {
    const url = getImageUrl(testUrls[i]);
    try {
      const response = await fetch(url, { method: "HEAD" });
      const status = response.ok ? "✅ SUCCESS" : "❌ FAILED";
      console.log(`Image ${i + 1}: ${status} (${response.status}) - ${url}`);
    } catch (error) {
      console.log(`Image ${i + 1}: ❌ ERROR - ${error.message}`);
    }
  }
};

testImageLoading().then(() => {
  console.log("");
  console.log("🎯 Summary:");
  console.log("If you see ✅ SUCCESS for all images, the fix is working!");
  console.log("If you see ❌ FAILED, there might be a server issue.");
  console.log("");
  console.log("💡 Next Steps:");
  console.log("1. Clear your browser cache");
  console.log("2. Restart the frontend development server");
  console.log("3. Test the images in your browser");
});

export default testUrls;
