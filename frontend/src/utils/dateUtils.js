/**
 * Format date for HTML date input (yyyy-MM-dd format)
 * @param {string} dateString - ISO date string or date object
 * @returns {string} Date in yyyy-MM-dd format
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return "";
    }
    return date.toISOString().split("T")[0]; // Returns "yyyy-MM-dd" format
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Format date for display (MM/DD/YYYY format)
 * @param {string} dateString - ISO date string or date object
 * @returns {string} Date in MM/DD/YYYY format
 */
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date for display:", error);
    return "";
  }
};

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date of birth string
 * @returns {number} Age in years
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return 0;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return 0;
  }
};
