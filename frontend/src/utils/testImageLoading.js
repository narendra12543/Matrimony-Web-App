// Test image loading functionality
import { getImageUrl } from "./imageUtils.js";

// Test URLs
const testUrls = [
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_393.png",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_161.jpeg",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_513.jpeg",
];

console.log("🧪 Testing Image Loading System:");
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("");

// Test URL generation
testUrls.forEach((url, index) => {
  const generatedUrl = getImageUrl(url);
  const expectedUrl = `http://localhost:5000${url}`;

  console.log(`${index + 1}. Original: ${url}`);
  console.log(`   Generated: ${generatedUrl}`);
  console.log(`   Expected: ${expectedUrl}`);
  console.log(`   ✅ Correct: ${generatedUrl === expectedUrl}`);
  console.log("");
});

// Test image loading
const testImageLoading = async () => {
  console.log("🖼️ Testing actual image loading...");

  for (let i = 0; i < testUrls.length; i++) {
    const url = getImageUrl(testUrls[i]);
    try {
      const response = await fetch(url, { method: "HEAD" });
      console.log(
        `Image ${i + 1}: ${response.ok ? "✅ Loaded" : "❌ Failed"} (${
          response.status
        })`
      );
    } catch (error) {
      console.log(`Image ${i + 1}: ❌ Error - ${error.message}`);
    }
  }
};

// Run the test
testImageLoading();

export default testUrls;
