// Test the image URL generation
import { getImageUrl } from "./imageUtils.js";

const testUrls = [
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_393.png",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_161.jpeg",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_513.jpeg",
];

console.log("Testing image URL generation:");
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("");

testUrls.forEach((url, index) => {
  const generatedUrl = getImageUrl(url);
  console.log(`${index + 1}. Original: ${url}`);
  console.log(`   Generated: ${generatedUrl}`);
  console.log("");
});

export default testUrls;
