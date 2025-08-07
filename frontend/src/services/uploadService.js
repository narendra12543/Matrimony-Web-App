import axios from "axios";
import toast from "react-hot-toast";
import { getTokenInfo } from "../utils/tokenUtils";
import { getImageUrl } from "../utils/imageUtils";

const API_URL = import.meta.env.VITE_API_URL;

// Create a dedicated axios instance for uploads
const uploadAxios = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for uploads
});

// Add request interceptor to include auth token
uploadAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class UploadService {
  constructor() {
    // Don't store token statically, get it dynamically
  }

  // Get current token from localStorage
  getToken() {
    return localStorage.getItem("token");
  }

  // Generic upload function with progress tracking
  async uploadFile(endpoint, file, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Debug: Log token and headers
      const token = this.getToken();
      const tokenInfo = getTokenInfo(token);
      console.log("🔑 Upload token info:", tokenInfo);

      const response = await uploadAxios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
        // Clear token and redirect to login
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        toast.error(error.response?.data?.message || "Failed to upload file");
      }
      throw error;
    }
  }

  // Profile photo upload
  async uploadProfilePhoto(file, onProgress = null) {
    return await this.uploadFile(
      "/api/v1/upload/profile/photo",
      file,
      onProgress
    );
  }

  // Profile document upload
  async uploadProfileDocument(file, onProgress = null) {
    return await this.uploadFile(
      "/api/v1/upload/profile/document",
      file,
      onProgress
    );
  }

  // Chat file uploads
  async uploadChatImage(file, onProgress = null) {
    return await this.uploadFile("/api/v1/upload/chat/image", file, onProgress);
  }

  async uploadChatVideo(file, onProgress = null) {
    return await this.uploadFile("/api/v1/upload/chat/video", file, onProgress);
  }

  async uploadChatDocument(file, onProgress = null) {
    return await this.uploadFile(
      "/api/v1/upload/chat/document",
      file,
      onProgress
    );
  }

  // Verification document uploads
  async uploadVerificationDocument(
    file,
    documentType,
    side = "front",
    onProgress = null
  ) {
    // Map document types to backend endpoints
    const documentTypeMap = {
      "aadhaar-card": "aadhaar",
      "aadhaar card": "aadhaar",
      aadhaar: "aadhaar",
      passport: "passport",
      "driver-license": "driver-license",
      "driver license": "driver-license",
      driver_license: "driver-license",
      "drivers-license": "driver-license",
      "drivers license": "driver-license",
    };

    const mappedType =
      documentTypeMap[documentType.toLowerCase()] ||
      documentType.toLowerCase().replace(" ", "-");
    const endpoint = `/api/v1/upload/verification/${mappedType}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("side", side);

    try {
      const response = await uploadAxios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (error) {
      console.error("Verification upload error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(
          error.response?.data?.message ||
            "Failed to upload verification document"
        );
      }
      throw error;
    }
  }

  // Legacy upload (for backward compatibility)
  async uploadLegacy(file, onProgress = null) {
    return await this.uploadFile("/api/v1/upload", file, onProgress);
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      console.log("🗑️ Attempting to delete file:", filePath);
      console.log("🗑️ Delete request data:", { filePath });

      const response = await uploadAxios.delete("/api/v1/upload/file", {
        data: { filePath },
      });

      console.log("✅ Delete successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Delete file error:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      toast.error("Failed to delete file");
      throw error;
    }
  }

  // Get storage stats
  async getStorageStats() {
    try {
      const response = await uploadAxios.get("/api/v1/upload/storage/stats");
      return response.data;
    } catch (error) {
      console.error("Get storage stats error:", error);
      throw error;
    }
  }

  // Get file URL for preview
  getFileUrl(filePath) {
    return getImageUrl(filePath);
  }

  // Create preview URL for images/videos
  createPreviewUrl(file) {
    return URL.createObjectURL(file);
  }

  // Revoke preview URL to free memory
  revokePreviewUrl(url) {
    if (url && url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn("Error revoking blob URL:", error);
      }
    }
  }
}

export default new UploadService();
