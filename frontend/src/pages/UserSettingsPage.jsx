import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ProfileTab from "../components/User/UserSettings/ProfileTab";
import SecurityTab from "../components/User/UserSettings/SecurityTab";
import SubscriptionTab from "../components/User/UserSettings/SubscriptionTab";
import PrivacyTab from "../components/User/UserSettings/PrivacyTab";
import NotificationsTab from "../components/User/UserSettings/NotificationsTab";
import SupportTab from "../components/User/UserSettings/SupportTab";
import VerificationTab from "../components/User/UserSettings/VerificationTab";
import CouponsTab from "../components/User/UserSettings/CouponsTab";
import axios from "axios";
import { couponAPI } from "../services/couponService";
import { useAuth } from "../contexts/Chat/AuthContext";

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [userProfile, setUserProfile] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManagePlan, setShowManagePlan] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Coupon/checkout modal state
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");
  const [showCouponSuccessModal, setShowCouponSuccessModal] = useState(false);
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [allCoupons, setAllCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState(null);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [showPlanUpgradeSuccess, setShowPlanUpgradeSuccess] = useState(false);
  const [isFullDiscountCoupon, setIsFullDiscountCoupon] = useState(false); // Track if 100% coupon applied
  const [justUpgradedPlanId, setJustUpgradedPlanId] = useState(null); // Track plan upgraded for free
  console.log("selectedPlan", selectedPlan);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const [profileRes, plansRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, config),
          axios.get(
            `${import.meta.env.VITE_API_URL}/api/v1/subscription/plans`
          ),
        ]);
        setUserProfile(profileRes.data.user);
        // Use the same plan sorting as Plans.jsx
        let plansData = plansRes.data;
        if (Array.isArray(plansData)) {
          setPlans(plansData.sort((a, b) => a.price - b.price));
        } else if (plansData && Array.isArray(plansData.plans)) {
          setPlans(plansData.plans.sort((a, b) => a.price - b.price));
        } else {
          setPlansError("Failed to load plans. Please try again later.");
        }
        setPlansLoading(false);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch settings");
        setPlansError("Failed to load plans. Please try again later.");
        setPlansLoading(false);
        setLoading(false);
      }
    };
    fetchSettings();
  }, [navigate]);

  // On mount, check for ?tab=... in the URL and set the active tab accordingly
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const validTabs = [
      "profile",
      "security",
      "subscription",
      "privacy",
      "notifications",
      "support",
      "verification",
      "coupons", // <-- Add this
    ];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    if (activeTab === "coupons") {
      setCouponsLoading(true);
      setCouponsError(null);
      couponAPI
        .getCoupons({})
        .then((res) => {
          setAllCoupons(res.data.coupons || []);
        })
        .catch(() => {
          setAllCoupons([]);
          setCouponsError("Failed to load coupons. Please try again later.");
        })
        .finally(() => setCouponsLoading(false));

      // Fetch all plans for mapping coupon applicablePlans to plan names
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/v1/subscription/plans`)
        .then((res) => {
          let plansData = res.data;
          if (Array.isArray(plansData)) {
            setAllPlans(plansData);
          } else if (plansData && Array.isArray(plansData.plans)) {
            setAllPlans(plansData.plans);
          } else {
            setAllPlans([]);
          }
        })
        .catch(() => setAllPlans([]));
    }
  }, [activeTab]);

  // Helper to get plan names from IDs
  const getPlanNames = (applicablePlans) => {
    // If applicablePlans is empty, null, or not an array, treat as "All"
    if (
      !applicablePlans ||
      (Array.isArray(applicablePlans) && applicablePlans.length === 0)
    ) {
      return ["All"];
    }
    // If backend sends "all" or similar, treat as "All"
    if (
      applicablePlans === "all" ||
      (Array.isArray(applicablePlans) && applicablePlans.includes("all"))
    ) {
      return ["All"];
    }
    // If applicablePlans is array of objects (as in admin dashboard), map by .name
    if (
      Array.isArray(applicablePlans) &&
      applicablePlans.length > 0 &&
      typeof applicablePlans[0] === "object" &&
      applicablePlans[0].name
    ) {
      return applicablePlans.map((plan) => plan.name);
    }
    // Otherwise, map IDs to plan names
    if (!Array.isArray(applicablePlans) || allPlans.length === 0) return [];
    return applicablePlans
      .map((id) => {
        // Try to match by _id, id, or string id (like 'premium-499')
        const plan = allPlans.find(
          (p) =>
            p._id === id ||
            p.id === id ||
            p._id?.toString() === id ||
            p.id?.toString() === id ||
            (p.name?.toLowerCase().includes("premium") &&
              id === "premium-499") ||
            (p.name?.toLowerCase().includes("elite") &&
              id === "elite vip-999") ||
            (p.name?.toLowerCase().includes("regular") && id === "regular-free")
        );
        return plan ? plan.name : null;
      })
      .filter(Boolean);
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 1500);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/change-password`,
        passwordData,
        config
      );
      alert("Password changed successfully");
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to change password");
    }
  };

  // Razorpay logic from Plans.jsx
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        resolve(true);
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleBuyNow = async (plan) => {
    console.log("handleBuyNow called with plan:", plan);
    if (plan.price === 0) {
      setActiveTab("profile");
      return;
    }
    setProcessingPayment(true);
    try {
      console.log("Loading Razorpay script...");
      const res = await loadRazorpayScript();
      console.log("Razorpay script loaded:", res);
      if (!res) {
        console.error("Razorpay script failed to load");
        throw new Error("Payment system failed to load");
      }
      const token = localStorage.getItem("token");
      console.log("Token:", token);
      if (!token) {
        console.error("No token found in localStorage");
        throw new Error("User not authenticated");
      }
      const orderRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/subscription/payment/order`,
        { planId: plan._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("orderRes.data:", orderRes.data);
      // Patch: Map orderId to id if needed
      const orderRaw = orderRes.data.order || orderRes.data;
      const order = {
        ...orderRaw,
        id: orderRaw.id || orderRaw.orderId,
      };
      if (!order || !order.amount || !order.id) {
        console.error("Order object missing fields:", order);
        alert("Failed to initiate payment. Please try again later.");
        setProcessingPayment(false);
        return;
      }
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Matrimony Hub",
        description: `${plan.name} Plan Subscription`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await axios.post(
              `${
                import.meta.env.VITE_API_URL
              }/api/v1/subscription/payment/verify`,
              {
                ...response,
                planId: plan._id,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowSuccess(true);
            // Refresh user profile after payment
            const profileRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/v1/auth/me`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setUserProfile(profileRes.data.user);
          } catch (err) {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: `${userProfile?.firstName || "User"} ${
            userProfile?.lastName || ""
          }`,
          email: userProfile?.email || "user@example.com",
        },
        theme: {
          color: "#ec4899",
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePlanUpgrade = async (planId) => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/subscription/payment/order`,
        { planId },
        config
      );
      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "ESMatrimonial",
        description: `Upgrade to ${data.plan.name}`,
        order_id: data.order.id,
        handler: async (response) => {
          await axios.post(
            `${import.meta.env.VITE_API_URL}api/v1/subscription/payment/verify`,
            response,
            config
          );
          alert("Plan upgraded successfully");
          // Refresh user profile
          const profileRes = await axios.get("/api/v1/users/me", config);
          setUserProfile(profileRes.data.user);
        },
        prefill: {
          name: `${userProfile.firstName} ${userProfile.lastName}`,
          email: userProfile.email,
          contact: userProfile.phone,
        },
        theme: {
          color: "#3399cc",
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to upgrade plan");
    }
  };

  const handleSave = async (section) => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      let url = "";
      let data = {};

      switch (section) {
        case "privacy":
          url = `${import.meta.env.VITE_API_URL}/api/v1/privacy/settings`; // <-- fixed endpoint
          data = userProfile.privacy;
          break;
        case "notifications":
         url = `${import.meta.env.VITE_API_URL}/api/v1/notifications/settings`;
         console.log("Sending notification settings:", userProfile.notificationSettings);    
         data = userProfile.notificationSettings;
          break;
        default:
          return;
      }

      await axios.put(url, data, config);
      // Show instant feedback for privacy changes
      if (section === "privacy") {
        // You can use a toast/snackbar here if you have one
        // For now, use alert (or remove for silent save)
        // alert("Privacy settings saved");
      }
    } catch (err) {
      alert(err.response?.data?.error || `Failed to save ${section} settings`);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action is irreversible."
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/v1/users/delete-account`,
          config
        );
        alert("Account deleted successfully");
        logout();
        navigate("/signup");
      } catch (err) {
        alert(err.response?.data?.error || "Failed to delete account");
      }
    }
  };

  // Fetch coupons for selected plan
  const fetchApplicableCoupons = async (planId, plan) => {
    try {
      console.log("Fetching coupons for planId:", planId);

      // Try to get all coupons first, then filter on frontend
      let res;
      try {
        // First try with planId filter
        res = await couponAPI.getCoupons({ planId });
        console.log("Coupon API response with planId filter:", res.data);
      } catch (err) {
        console.log("PlanId filter failed, trying without filter:", err);
        // If planId filter fails, get all coupons and filter on frontend
        res = await couponAPI.getCoupons();
        console.log("Coupon API response without filter:", res.data);
      }

      const allCoupons = res.data.coupons || [];
      console.log("All coupons:", allCoupons);

      const applicable = allCoupons.filter((c) => {
        console.log(
          "Checking coupon:",
          c.code,
          "applicablePlans:",
          c.applicablePlans,
          "planId:",
          planId
        );

        // Check if planId is in applicablePlans (handle both string and array)
        // Also check for plan name/identifier matches
        const planName = plan.name?.toLowerCase();
        const planIdentifier =
          plan.id || plan.name?.toLowerCase().replace(/\s+/g, "-");

        const isApplicable = Array.isArray(c.applicablePlans)
          ? c.applicablePlans.includes(planId) ||
            c.applicablePlans.includes(planId.toString()) ||
            c.applicablePlans.includes(planName) ||
            c.applicablePlans.includes(planIdentifier) ||
            c.applicablePlans.some((ap) => ap.toLowerCase().includes(planName))
          : c.applicablePlans === planId ||
            c.applicablePlans === planId.toString() ||
            c.applicablePlans === planName ||
            c.applicablePlans === planIdentifier ||
            c.applicablePlans.toLowerCase().includes(planName);

        const isActive = c.isActive;
        const isNotExpired = new Date(c.expiresAt) > new Date();

        console.log("Coupon check results:", {
          code: c.code,
          isApplicable,
          isActive,
          isNotExpired,
          willInclude: isApplicable && isActive && isNotExpired,
        });

        return isApplicable && isActive && isNotExpired;
      });

      console.log("Applicable coupons:", applicable);
      setCoupons(applicable);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setCoupons([]);
    }
  };

  // Open checkout modal
  const handleOpenCheckout = async (plan) => {
    // Prevent opening checkout if just upgraded this plan for free
    if (justUpgradedPlanId && (plan._id === justUpgradedPlanId || plan.id === justUpgradedPlanId)) {
      // Optionally show a toast/snackbar here: "You already upgraded to this plan for free!"
      return;
    }
    setSelectedPlan(plan);
    setSelectedCoupon(null);
    setDiscountAmount(0);
    setFinalAmount(plan.price);
    setIsFullDiscountCoupon(false); // Reset for new plan
    // Always allow opening checkout, but it will be forcibly closed if 100% coupon is applied
    await fetchApplicableCoupons(plan._id, plan);
    setShowCheckout(true);
  };

 const handleApplyCoupon = async (coupon) => {
  console.log("=== APPLYING COUPON ===");
  console.log("Coupon:", coupon);
  console.log("Selected Plan:", selectedPlan);
  console.log("Selected Plan ID:", selectedPlan?.id || selectedPlan?._id);

  setApplyingCoupon(true);
  setCouponSuccessMsg("");
  try {
    const userToken = localStorage.getItem("token");
    if (!userToken) {
      alert("Please login to apply a coupon.");
      setApplyingCoupon(false);
      return;
    }
    if (!selectedPlan || (!selectedPlan.id && !selectedPlan._id) || !coupon || !coupon.code) {
      alert("Invalid plan or coupon selection.");
      setApplyingCoupon(false);
      return;
    }

    const planIdentifier = selectedPlan.name?.toLowerCase().includes("elite")
      ? "elite vip-999"
      : selectedPlan.name?.toLowerCase().includes("premium")
      ? "premium-499"
      : "regular-free";

    console.log("Sending planId to backend:", planIdentifier);

    const res = await couponAPI.applyCoupon({
      code: coupon.code,
      planId: planIdentifier,
      originalAmount: selectedPlan.price,
    });

    if (res.data && res.data.valid) {
      setSelectedCoupon(coupon);
      setDiscountAmount(res.data.discountAmount);
      setFinalAmount(res.data.finalAmount);

      const isFullDiscount = res.data.finalAmount === 0;
      setIsFullDiscountCoupon(isFullDiscount);

      if (isFullDiscount) {
        // For 100% coupons: Close checkout, show success modal, process upgrade
        setShowCheckout(false);
        setCouponSuccessMsg("🎉 Congratulations! Your plan has been upgraded for FREE! No payment required.");
        setShowCouponSuccessModal(true);
        
        // Process the free upgrade
        const upgraded = await handleFreeUpgrade(coupon, planIdentifier);
        if (upgraded) {
          setJustUpgradedPlanId(selectedPlan._id);
        }
      } else {
        // For partial discounts: Show normal success, keep checkout open
        setCouponSuccessMsg("🎉 Coupon applied successfully!");
        setShowCouponSuccessModal(true);
      }
    } else {
      alert(res.data?.error || "Invalid coupon");
    }
  } catch (err) {
    alert(err.response?.data?.error || "Failed to apply coupon");
  } finally {
    setApplyingCoupon(false);
  }
};

 const handleFreeUpgrade = async (coupon, planIdentifier) => {
  try {
    const userToken = localStorage.getItem("token");
    if (!userToken) {
      throw new Error("User not authenticated");
    }

    // First redeem the coupon
    const redeemRes = await couponAPI.redeemCoupon({
      code: coupon.code,
      planId: planIdentifier,
      originalAmount: selectedPlan.price,
      paymentId: "FREE_UPGRADE_" + Date.now(), // Special identifier for free upgrades
    });

    // Then update the user's subscription
    const updateRes = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/v1/subscription/free-upgrade`,
      { 
        planId: selectedPlan._id,
        couponCode: coupon.code 
      },
      { 
        headers: { Authorization: `Bearer ${userToken}` } 
      }
    );

    // Refresh user profile
    const profileRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/v1/auth/me`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    setUserProfile(profileRes.data.user);
    setShowCheckout(false);
    return true;
  } catch (err) {
    console.error("Free upgrade failed:", err);
    alert("Failed to process free upgrade. Please contact support.");
    return false;
  }
};

  // Payment logic with coupon
  const handleCheckoutPayment = async () => {
    setProcessingPayment(true);
    try {
      const userToken = localStorage.getItem("token");
      if (!userToken) {
        alert("Please login to proceed with payment.");
        setProcessingPayment(false);
        return;
      }
      const res = await loadRazorpayScript();
      if (!res) throw new Error("Payment system failed to load");

      // Use selectedPlan._id for payment order creation
      const orderRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/subscription/payment/order`,
        { planId: selectedPlan._id, amount: finalAmount },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      const order = orderRes.data;
      if (!order || !order.amount || !order.orderId) {
        alert("Failed to initiate payment. Please try again later.");
        setProcessingPayment(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Matrimony Hub",
        description: `${selectedPlan.name} Plan Subscription`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await axios.post(
              `${
                import.meta.env.VITE_API_URL
              }/api/v1/subscription/payment/verify`,
              {
                ...response,
                planId: selectedPlan._id,
              },
              { headers: { Authorization: `Bearer ${userToken}` } }
            );
            // Redeem coupon after payment
            if (selectedCoupon && selectedCoupon.code) {
              const planIdentifier = selectedPlan.name
                ?.toLowerCase()
                .includes("elite")
                ? "elite vip-999"
                : selectedPlan.name?.toLowerCase().includes("premium")
                ? "premium-499"
                : "regular-free";

              await couponAPI.redeemCoupon({
                code: selectedCoupon.code,
                planId: planIdentifier,
                originalAmount: selectedPlan.price,
                paymentId: response.razorpay_payment_id,
              });
            }
            setShowSuccess(true);
            setShowCheckout(false);
            // Refresh user profile
            const profileRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/v1/auth/me`,
              { headers: { Authorization: `Bearer ${userToken}` } }
            );
            setUserProfile(profileRes.data.user);
          } catch (err) {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: `${userProfile?.firstName || "User"} ${
            userProfile?.lastName || ""
          }`,
          email: userProfile?.email || "user@example.com",
        },
        theme: { color: "#2563eb" }, // blue
        modal: { ondismiss: () => setProcessingPayment(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Tab Button Component
  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full px-4 py-3 text-left rounded-lg transition-all duration-300 ${
        activeTab === id
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
          : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-500 mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div
      className={`min-h-screen py-8 transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-blue-50"
      }`}
    >
      {/* Plan Upgrade Success Modal */}
      {showPlanUpgradeSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border-4 border-blue-500 relative animate-fadeInUp">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
              onClick={() => setShowPlanUpgradeSuccess(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              <svg
                className="w-20 h-20 text-blue-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4"
                />
              </svg>
              <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-300 mb-2">
                Plan Upgraded!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4 font-semibold text-lg">
                Congratulations! Your subscription plan has been upgraded for free.<br />
                Enjoy all the premium features!
              </p>
              <button
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-700 transition-all"
                onClick={() => setShowPlanUpgradeSuccess(false)}
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Coupon Success Modal */}
      {showCouponSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border-4 ${isFullDiscountCoupon ? "border-blue-500" : "border-green-500"} relative`}>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
              onClick={() => {
                setShowCouponSuccessModal(false);
                // For 100% coupons, ensure checkout stays closed
                if (isFullDiscountCoupon) {
                  setShowCheckout(false);
                }
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              {isFullDiscountCoupon ? (
                // Enhanced UI for 100% discount (free upgrade)
                <>
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-4">
                    Plan Upgraded for FREE!
                  </h2>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl p-6 mb-6 border-2 border-green-200 dark:border-green-700">
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                      🎉 Congratulations! You've successfully applied a 100% discount coupon!
                    </p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Your subscription has been upgraded to <strong className="text-blue-600 dark:text-blue-400">{selectedPlan?.name}</strong></span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300"><strong className="text-green-600 dark:text-green-400">No payment required</strong> - it's completely free!</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">All premium features are now <strong className="text-blue-600 dark:text-blue-400">instantly active</strong></span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Valid for <strong className="text-purple-600 dark:text-purple-400">30 days</strong> from today</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-6">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      💡 <strong>Tip:</strong> If you don't see the changes immediately, please refresh the page to view your updated subscription.
                    </p>
                  </div>
                  <button
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                    onClick={() => {
                      setShowCouponSuccessModal(false);
                      setShowCheckout(false);
                      // Optionally refresh the page to show updated subscription
                      window.location.reload();
                    }}
                  >
                    Awesome! Let's Go
                  </button>
                </>
              ) : (
                // Normal coupon applied UI
                <>
                  <svg
                    className="w-16 h-16 text-green-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path stroke="currentColor" strokeWidth="2" d="M9 12l2 2 4-4" />
                  </svg>
                  <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                    Coupon Applied!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {couponSuccessMsg}
                  </p>
                  <button
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
                    onClick={() => setShowCouponSuccessModal(false)}
                  >
                    Continue
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Subscription Modal */}
      {showManagePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-0 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeInUp border-4 border-blue-500">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
                Manage Subscription
              </h2>
              <button
                className="text-white text-2xl sm:text-3xl font-bold hover:text-blue-200 transition-colors focus:outline-none"
                onClick={() => setShowManagePlanModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="px-4 sm:px-8 py-6 sm:py-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Current Plan Info - Prominent Display */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 shadow-lg">
                <h3 className="text-lg sm:text-xl font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Your Current Plan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Plan:
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                      {userProfile?.subscription?.planName || "Free Plan"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Status:
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-semibold">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Expires:
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {userProfile?.subscription?.expiresAt
                        ? new Date(
                            userProfile.subscription.expiresAt
                          ).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Price:
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {(() => {
                        // Find the current plan in the plans array to get the correct price
                        const currentPlan = plans.find(
                          (plan) =>
                            plan._id === userProfile?.subscription?.plan ||
                            plan.name === userProfile?.subscription?.planName
                        );

                        if (
                          userProfile?.subscription?.planName === "Free Plan" ||
                          !currentPlan
                        ) {
                          return "Free";
                        }

                        return `₹${currentPlan.price}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Available Plans for Upgrade - Hide Free Plan */}
              <div className="mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Upgrade Your Plan
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(() => {
                    // Get current plan price for comparison
                    const currentPlanPrice =
                      userProfile?.subscription?.price || 0;
                    const currentPlanName =
                      userProfile?.subscription?.planName || "Free Plan";

                    // Filter plans based on current subscription level
                    const upgradePlans = plans.filter((plan) => {
                      // Hide free plans
                      if (plan.price === 0) return false;

                      // Hide current plan
                      const isCurrentPlan =
                        plan._id === userProfile?.subscription?.plan ||
                        plan.name === userProfile?.subscription?.planName;
                      if (isCurrentPlan) return false;

                      // Show only higher tier plans (upgrades)
                      return plan.price > currentPlanPrice;
                    });

                    // If no upgrade plans available, show message
                    if (upgradePlans.length === 0) {
                      return (
                        <div className="col-span-full text-center py-8">
                          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-6">
                            <svg
                              className="w-16 h-16 text-green-500 mx-auto mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                              You're at the Top Level!
                            </h3>
                            <p className="text-green-700 dark:text-green-300">
                              You're already subscribed to our highest tier
                              plan. Enjoy all premium features!
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return upgradePlans.map((plan) => (
                      <div
                        key={plan._id}
                        className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-300 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md"
                      >
                        <div className="text-center mb-4">
                          <h4 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-2">
                            {plan.name}
                          </h4>
                          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            ₹{plan.price}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            per {plan.duration}
                          </p>
                        </div>
                        <ul className="space-y-2 mb-4 text-xs sm:text-sm">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-center text-gray-700 dark:text-gray-300"
                            >
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={async () => {
                            setShowManagePlanModal(false);
                            // Use the same coupon-enabled checkout flow
                            await handleOpenCheckout(plan);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-xs sm:text-sm"
                        >
                          Upgrade to {plan.name}
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowManagePlanModal(false)}
                  className="px-4 sm:px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowManagePlanModal(false);
                    setActiveTab("subscription");
                  }}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm"
                >
                  View All Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom scrollbar styles */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            background: #e0e7ff;
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2563eb;
            border-radius: 8px;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #2563eb #e0e7ff;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your profile, subscription, and privacy settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <nav className="space-y-2">
                <TabButton
                  id="profile"
                  label="Profile Settings"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                />
                <TabButton
                  id="security"
                  label="Security"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  }
                />
                <TabButton
                  id="subscription"
                  label="Subscription"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  }
                />
                <TabButton
                  id="verification"
                  label="Verification"
                  icon={
                    // Use a shield/check icon for verification
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3l8 4v5c0 5.25-3.5 10-8 12-4.5-2-8-6.75-8-12V7l8-4z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4"
                      />
                    </svg>
                  }
                />
                <TabButton
                  id="coupons"
                  label="Coupons"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="3"
                        y="7"
                        width="18"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="7" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="17" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                  }
                />
                <TabButton
                  id="privacy"
                  label="Privacy"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  }
                />
                <TabButton
                  id="notifications"
                  label="Notifications"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  }
                />
                <TabButton
                  id="support"
                  label="Support"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                />
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <ProfileTab 
                userProfile={userProfile} 
                setUserProfile={setUserProfile}
              />
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <SecurityTab
                showChangePassword={showChangePassword}
                setShowChangePassword={setShowChangePassword}
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                handlePasswordChange={handlePasswordChange}
                handlePasswordSubmit={handlePasswordSubmit}
              />
            )}

            {/* Subscription Plans */}
            {activeTab === "subscription" && (
              <SubscriptionTab />
            )}

            {/* Privacy Settings */}
            {activeTab === "privacy" && (
              <PrivacyTab
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                handleSave={handleSave}
                handleDeleteAccount={handleDeleteAccount}
              />
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <NotificationsTab
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                handleSave={handleSave}
              />
            )}

            {/* Support */}
            {activeTab === "support" && <SupportTab />}

            {/* Verification Tab */}
            {activeTab === "verification" && <VerificationTab />}

            {/* Coupons Tab */}
            {activeTab === "coupons" && (
              <CouponsTab
                allCoupons={allCoupons}
                couponsLoading={couponsLoading}
                couponsError={couponsError}
                copiedCoupon={copiedCoupon}
                handleCopyCoupon={handleCopyCoupon}
                getPlanNames={getPlanNames}
              />
            )}
          </div>
        </div>
      </div>
      {processingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-500 mb-4"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              ></path>
            </svg>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              Preparing payment...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

