// Utility function to fix subscriberId issue
// Run this in browser console: fixSubscriberId()

export const fixSubscriberId = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("❌ No token found");
      return;
    }

    console.log("🔧 Fixing subscriberId...");

    // First, get current user data
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/auth/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    console.log("🔧 Current user data:", data);

    if (!data.user.subscriberId) {
      console.log("🔧 User has no subscriberId, creating one...");

      // Create subscriber via API
      const subscriberResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/create-subscriber`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name:
              `${data.user.firstName || ""} ${
                data.user.lastName || ""
              }`.trim() || data.user.email,
            email: data.user.email,
          }),
        }
      );

      if (subscriberResponse.ok) {
        const subscriberData = await subscriberResponse.json();
        console.log("🔧 Created subscriber:", subscriberData);

        // Refresh user data
        window.location.reload();
      } else {
        console.error("❌ Failed to create subscriber");
      }
    } else {
      console.log("✅ User already has subscriberId:", data.user.subscriberId);
    }
  } catch (error) {
    console.error("❌ Error fixing subscriberId:", error);
  }
};

// Make it available globally
window.fixSubscriberId = fixSubscriberId;
