/**
 * Token utility functions for authentication
 */

/**
 * Get the current token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Check if token exists and is valid format
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  
  // Check if it's a valid JWT format (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Check if all parts are base64 encoded
  try {
    parts.forEach(part => {
      if (part) {
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      }
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Decode JWT token payload (without verification)
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get token info for debugging
 */
export const getTokenInfo = (token) => {
  if (!token) return { exists: false };
  
  const decoded = decodeToken(token);
  const expired = isTokenExpired(token);
  const valid = isTokenValid(token);
  
  return {
    exists: true,
    valid,
    expired,
    decoded,
    length: token.length,
    startsWith: token.substring(0, 20) + "..."
  };
}; 