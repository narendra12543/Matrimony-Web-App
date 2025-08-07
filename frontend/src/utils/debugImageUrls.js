import { getImageUrl } from "./imageUtils.js";

// Test the image URL generation
const testUrls = [
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_393.png",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_161.jpeg",
  "/uploads/users/MM1002/profile/photos/MM1002_profile_photo_513.jpeg",
];

console.log("Testing image URL generation:");
testUrls.forEach((url, index) => {
  const generatedUrl = getImageUrl(url);
  console.log(`${index + 1}. Original: ${url}`);
  console.log(`   Generated: ${generatedUrl}`);
  console.log("");
});

export default testUrls;
