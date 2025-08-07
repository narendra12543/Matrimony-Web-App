// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// App Configuration
export const APP_CONFIG = {
  name: "ES Matrimonial",
  version: "1.0.0",
  description: "A modern matrimonial platform",
};

// Feature Flags
export const FEATURE_FLAGS = {
  enableAadhaarVerification: true,
  enablePhoneVerification: true,
  enableEmailVerification: true,
  enableAdminVerification: true,
};
