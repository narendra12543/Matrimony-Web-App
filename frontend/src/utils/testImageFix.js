// Test the image URL generation after fix
import { getImageUrl } from "./imageUtils.js";

const testUrls = [
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_393.png",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_161.jpeg",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_513.jpeg",
];

console.log("🧪 Testing Image URL Generation After Fix:");
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("");

testUrls.forEach((url, index) => {
  const generatedUrl = getImageUrl(url);
  console.log(`${index + 1}. Original: ${url}`);
  console.log(`   Generated: ${generatedUrl}`);
  console.log(`   Should be: http://localhost:5000${url}`);
  console.log(
    `   ✅ Correct: ${generatedUrl === `http://localhost:5000${url}`}`
  );
  console.log("");
});

// Test the incorrect URL that was causing issues
const incorrectUrl =
  "http://localhost:5000/api/v1/uploads/users/MM1002/profile/photos/MM1002_profile_photo_393.png";
console.log("❌ Incorrect URL (should return 404):", incorrectUrl);
console.log(
  "✅ Correct URL (should return 200):",
  getImageUrl(
    "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_393.png"
  )
);

export default testUrls;
