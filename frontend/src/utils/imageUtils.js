// Get the base URL without /api/v1 for image serving
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  // Remove /api/v1 if it exists to get the base URL for static files
  return apiUrl.replace("/api/v1", "");
};

const API_URL = getBaseUrl();

/**
 * Converts a file path to a proper URL for display
 * @param {string} filePath - The file path from the database
 * @param {boolean} forceRefresh - Whether to force cache refresh
 * @returns {string} - The proper URL for the image
 */
export const getImageUrl = (filePath, forceRefresh = false) => {
  if (!filePath) {
    return null;
  }

  // If it's already a full URL (Cloudinary or other external service)
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  let url;
  // If the path already starts with /uploads/, don't add it again
  if (filePath.startsWith("/uploads/")) {
    url = `${API_URL}${filePath}`;
  } else if (
    filePath.startsWith("users/") ||
    filePath.startsWith("verification/")
  ) {
    url = `${API_URL}/uploads/${filePath}`;
  } else {
    // If it's just a filename, assume it's in the uploads directory
    url = `${API_URL}/uploads/${filePath}`;
  }

  // Add timestamp to force cache refresh for newly uploaded images
  if (forceRefresh) {
    url += `?t=${Date.now()}`;
  }

  return url;
};

/**
 * Clears the browser cache for a specific image URL
 * @param {string} imageUrl - The image URL to clear cache for
 */
export const clearImageCache = (imageUrl) => {
  if (!imageUrl) return;

  // Create a new image element to force cache refresh
  const img = new Image();
  img.src = imageUrl + `?t=${Date.now()}`;

  // Remove the image element after a short delay
  setTimeout(() => {
    if (img.parentNode) {
      img.parentNode.removeChild(img);
    }
  }, 100);
};

/**
 * Converts multiple file paths to URLs
 * @param {Array} filePaths - Array of file paths
 * @returns {Array} - Array of URLs
 */
export const getImageUrls = (filePaths) => {
  if (!filePaths || !Array.isArray(filePaths)) {
    return [];
  }

  return filePaths
    .map((filePath) => getImageUrl(filePath))
    .filter((url) => url !== null);
};

/**
 * Checks if a URL is a local file
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a local file
 */
export const isLocalFile = (url) => {
  if (!url) return false;
  return (
    url.includes("/uploads/") ||
    (!url.startsWith("http://") && !url.startsWith("https://"))
  );
};

/**
 * Gets the file extension from a URL or path
 * @param {string} url - The URL or path
 * @returns {string} - The file extension
 */
export const getFileExtension = (url) => {
  if (!url) return "";
  const lastDot = url.lastIndexOf(".");
  return lastDot > -1 ? url.substring(lastDot + 1) : "";
};

/**
 * Checks if a file is an image based on its extension
 * @param {string} url - The URL or path
 * @returns {boolean} - True if it's an image
 */
export const isImageFile = (url) => {
  const ext = getFileExtension(url).toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext);
};

/**
 * Checks if a file is a video based on its extension
 * @param {string} url - The URL or path
 * @returns {boolean} - True if it's a video
 */
export const isVideoFile = (url) => {
  const ext = getFileExtension(url).toLowerCase();
  return ["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(ext);
};

/**
 * Checks if a file is a document based on its extension
 * @param {string} url - The URL or path
 * @returns {boolean} - True if it's a document
 */
export const isDocumentFile = (url) => {
  const ext = getFileExtension(url).toLowerCase();
  return ["pdf", "doc", "docx", "txt", "rtf"].includes(ext);
};
