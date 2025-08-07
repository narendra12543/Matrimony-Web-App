import React, { useState, useEffect } from "react";
import axios from "axios";
import { couponAPI } from "../../../services/couponService";
import LoadingSpinner from "../../LoadingSpinner";

const SubscriptionTab = ({}) => {
  const [userProfile, setUserProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);

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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [profileRes, plansRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/subscription/plans`),
        ]);
        setUserProfile(profileRes.data.user);
        let plansData = plansRes.data;
        if (Array.isArray(plansData)) {
          setPlans(plansData.sort((a, b) => a.price - b.price));
        } else if (plansData && Array.isArray(plansData.plans)) {
          setPlans(plansData.plans.sort((a, b) => a.price - b.price));
        } else {
          setPlansError("Failed to load plans. Please try again later.");
        }
        setPlansLoading(false);
      } catch (err) {
        setPlansError("Failed to load plans. Please try again later.");
        setPlansLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Razorpay logic
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Payment with/without coupon
  const handleBuyNow = async (plan) => {
    if (plan.price === 0) return;
    setProcessingPayment(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) throw new Error("Payment system failed to load");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");
      const orderRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/subscription/payment/order`,
        { planId: plan._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const orderRaw = orderRes.data.order || orderRes.data;
      const order = { ...orderRaw, id: orderRaw.id || orderRaw.orderId };
      if (!order || !order.amount || !order.id) {
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
              `${import.meta.env.VITE_API_URL}/api/v1/subscription/payment/verify`,
              { ...response, planId: plan._id },
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
          name: `${userProfile?.firstName || "User"} ${userProfile?.lastName || ""}`,
          email: userProfile?.email || "user@example.com",
        },
        theme: { color: "#ec4899" },
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

  // Coupons logic
  const fetchApplicableCoupons = async (planId, plan) => {
    try {
      // Always fetch all coupons, then filter on frontend for robust matching
      const res = await couponAPI.getCoupons();
      const allCoupons = res.data.coupons || [];
      // Only show coupons where applicablePlans includes planId (plan._id or string)
      const applicable = allCoupons.filter((c) => {
        // If applicablePlans is empty or "all", treat as applicable to all plans
        if (
          !c.applicablePlans ||
          (Array.isArray(c.applicablePlans) && c.applicablePlans.length === 0) ||
          (Array.isArray(c.applicablePlans) && c.applicablePlans.includes("all")) ||
          c.applicablePlans === "all"
        ) {
          return c.isActive && new Date(c.expiresAt) > new Date();
        }
        // If applicablePlans is array of objects (populated), match by _id
        if (
          Array.isArray(c.applicablePlans) &&
          typeof c.applicablePlans[0] === "object" &&
          c.applicablePlans[0]._id
        ) {
          return (
            c.applicablePlans.some(
              (p) =>
                p._id === planId ||
                p._id?.toString() === planId?.toString() ||
                p.id === planId ||
                p.id?.toString() === planId?.toString()
            ) &&
            c.isActive &&
            new Date(c.expiresAt) > new Date()
          );
        }
        // Otherwise, match by string or ObjectId
        return (
          (Array.isArray(c.applicablePlans)
            ? c.applicablePlans.includes(planId) ||
              c.applicablePlans.includes(planId?.toString())
            : c.applicablePlans === planId || c.applicablePlans === planId?.toString()) &&
          c.isActive &&
          new Date(c.expiresAt) > new Date()
        );
      });
      setCoupons(applicable);
    } catch {
      setCoupons([]);
    }
  };

  // Open checkout modal
  const handleOpenCheckout = async (plan) => {
    setSelectedPlan(plan);
    setSelectedCoupon(null);
    setDiscountAmount(0);
    setFinalAmount(Number(plan.price)); // Ensure number
    await fetchApplicableCoupons(plan._id, plan);
    setShowCheckout(true);
  };

  // Apply coupon
  const handleApplyCoupon = async (coupon) => {
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
      // Use selectedPlan._id for coupon application
      const res = await couponAPI.applyCoupon({
        code: coupon.code,
        planId: selectedPlan._id,
        originalAmount: selectedPlan.price,
      });
      if (res.data && res.data.valid) {
        setSelectedCoupon(coupon);
        setDiscountAmount(res.data.discountAmount);
        setFinalAmount(Number(res.data.finalAmount)); // Ensure number

        // Check if this is a 100% discount (free upgrade)
        const isFreeUpgrade = res.data.finalAmount === 0;

        if (isFreeUpgrade) {
          // For 100% coupons, immediately close checkout modal and process free upgrade
          setShowCheckout(false);
          setCouponSuccessMsg("🎉 Congratulations! Your plan has been upgraded for free! No payment required.");
          setShowCouponSuccessModal(true);
          // Process the free upgrade immediately
          await handleFreeUpgrade(coupon, selectedPlan._id);
        } else {
          // For partial discounts, show normal success message
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

  // Free upgrade logic
  const handleFreeUpgrade = async (coupon, planId) => {
    try {
      const userToken = localStorage.getItem("token");
      if (!userToken) throw new Error("User not authenticated");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/subscription/free-upgrade`,
        { planId, couponCode: coupon.code },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      const profileRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/me`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setUserProfile(profileRes.data.user);
      return true;
    } catch {
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
      // Always use finalAmount for payment order creation
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
              `${import.meta.env.VITE_API_URL}/api/v1/subscription/payment/verify`,
              { ...response, planId: selectedPlan._id },
              { headers: { Authorization: `Bearer ${userToken}` } }
            );
            if (selectedCoupon && selectedCoupon.code) {
              await couponAPI.redeemCoupon({
                code: selectedCoupon.code,
                planId: selectedPlan._id,
                originalAmount: selectedPlan.price,
                paymentId: response.razorpay_payment_id,
              });
            }
            setShowSuccess(true);
            setShowCheckout(false);
            const profileRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/v1/auth/me`,
              { headers: { Authorization: `Bearer ${userToken}` } }
            );
            setUserProfile(profileRes.data.user);
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: `${userProfile?.firstName || "User"} ${userProfile?.lastName || ""}`,
          email: userProfile?.email || "user@example.com",
        },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => setProcessingPayment(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      alert("Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // UI rendering
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-sm text-center">
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Your subscription is now active.
            </p>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => setShowSuccess(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Subscription Plans
      </h2>
      {/* Current Plan */}
      {userProfile && (
        <div className="mb-8 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Current Plan
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userProfile.subscription.planName}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Expires on{" "}
                {userProfile.subscription?.expiresAt
                  ? new Date(userProfile.subscription.expiresAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <button
              onClick={() => setShowManagePlanModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
            >
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage Subscription
            </button>
          </div>
        </div>
      )}
      {/* Plans */}
      {plansLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col items-center">
            <LoadingSpinner size="lg" color="blue" text="Loading plans..." />
          </div>
        </div>
      ) : plansError ? (
        <div className="text-red-500 dark:text-red-400 text-lg text-center py-8">
          {plansError}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan =
              plan._id === userProfile?.subscription?.plan ||
              plan.name === userProfile?.subscription?.planName;
            return (
              <div
                key={plan._id}
                className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
                  isCurrentPlan
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {plan.price}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    per {plan.duration}
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
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
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <div className="w-full py-3 rounded-lg font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900 text-center cursor-default">
                    Your Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      plan.price === 0
                        ? null
                        : handleOpenCheckout({
                            ...plan,
                            id: plan.name?.toLowerCase().includes("elite")
                              ? "elite vip-999"
                              : plan.name?.toLowerCase().includes("premium")
                              ? "premium-499"
                              : "regular-free",
                          })
                    }
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 flex items-center justify-center`}
                    disabled={processingPayment}
                  >
                    {processingPayment && <LoadingSpinner />}
                    {processingPayment
                      ? "Processing..."
                      : plan.price === 0
                      ? "Continue Free"
                      : "Upgrade Now"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Coupon Success Modal */}
      {showCouponSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border-4 border-green-500 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
              onClick={() => setShowCouponSuccessModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              {finalAmount === 0 ? (
                // Special UI for 100% discount (free upgrade)
                <>
                  <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-6">
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
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      🎉 Congratulations! You've successfully applied a 100% discount coupon!
                    </p>
                    <div className="space-y-2 text-left">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Your subscription has been upgraded to <strong>{selectedPlan?.name}</strong></span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300"><strong>No payment required</strong> - it's completely free!</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">All premium features are now active</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">Valid for 30 days from today</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    You can start enjoying all the premium features immediately. If you don't see the changes right away, please refresh the page.
                  </p>
                  <button
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                    onClick={() => setShowCouponSuccessModal(false)}
                  >
                    Awesome! Continue
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
                  <p className="text-gray-700 dark:text-gray-300 mb-4 font-semibold">
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

      {/* Checkout Modal - Only show if not a free upgrade */}
      {showCheckout && selectedPlan && !showCouponSuccessModal && finalAmount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-0 max-w-xl w-full overflow-hidden animate-fadeInUp border-4 border-blue-500">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-white tracking-wide">
                Checkout - {selectedPlan.name}
              </h2>
              <button
                className="text-white text-3xl font-bold hover:text-blue-200 transition-colors focus:outline-none"
                onClick={() => setShowCheckout(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            {/* Modal Content */}
            <div
              className="px-8 py-8 custom-scrollbar"
              style={{
                maxHeight: "70vh",
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: "#2563eb #e0e7ff",
              }}
            >
              {/* Plan Summary */}
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="flex-shrink-0">
                  <svg
                    className="w-10 h-10 text-blue-500"
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
                      d="M12 8v4l3 3"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedPlan.name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-300 text-sm">
                    {selectedPlan.description || "Perfect for getting started"}
                  </div>
                </div>
                <div className="ml-auto text-2xl font-extrabold text-blue-600 dark:text-blue-300">
                  ₹{selectedPlan.price}
                </div>
              </div>
              {/* Price Details */}
              <div className="mb-6">
                <div className="flex justify-between mb-2 text-base">
                  <span className="text-gray-700 dark:text-gray-200">
                    Plan Price:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{selectedPlan.price}
                  </span>
                </div>
                <div className="flex justify-between mb-2 text-base">
                  <span className="text-gray-700 dark:text-gray-200">
                    Coupon Discount:
                  </span>
                  <span className="text-green-600 font-semibold">
                    -₹{discountAmount}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                  <span className="text-gray-900 dark:text-white">
                    Final Price:
                  </span>
                  <span className="text-blue-600 dark:text-blue-300">
                    ₹{finalAmount}
                  </span>
                </div>
              </div>
              {/* Coupons */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-blue-600 dark:text-blue-300 text-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01"
                    />
                  </svg>
                  Available Coupons
                </h3>
                {coupons.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 italic">
                    No coupons available for this plan.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {coupons.map((coupon) => (
                      <li
                        key={coupon._id}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 shadow-sm border-2 ${
                          selectedCoupon?.code === coupon.code
                            ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                            : "border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-blue-700 dark:text-blue-300 tracking-wider">
                            {coupon.code}
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-300">
                            {coupon.type === "percentage"
                              ? `${coupon.value}% OFF`
                              : `₹${coupon.value} OFF`}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">
                            (Expires:{" "}
                            {new Date(coupon.expiresAt).toLocaleDateString()})
                          </span>
                        </div>
                        <button
                          className={`px-4 py-1.5 rounded-lg font-semibold shadow transition-all duration-150 ${
                            selectedCoupon?.code === coupon.code
                              ? "bg-green-600 text-white"
                              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                          } disabled:opacity-50`}
                          disabled={applyingCoupon}
                          onClick={() => handleApplyCoupon(coupon)}
                        >
                          {selectedCoupon?.code === coupon.code
                            ? "Applied"
                            : "Apply"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Pay Button */}
              {Number(finalAmount) === 0 && (
                <div className="mb-3 text-center">
                  <span className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg text-sm font-semibold shadow">
                    🎉 No need to pay! Your plan is already unlocked with this coupon.
                  </span>
                </div>
              )}
              <button
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-150"
                disabled={processingPayment || Number(finalAmount) === 0}
                onClick={handleCheckoutPayment}
                title={Number(finalAmount) === 0 ? "No need to pay. Your plan is already unlocked!" : ""}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" color="white" />
                    Processing...
                  </span>
                ) : (
                  <>Pay ₹{finalAmount}</>
                )}
              </button>
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
            {/* Modal Content */}
            <div className="px-4 sm:px-8 py-6 sm:py-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Current Plan Info */}
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
                        ? new Date(userProfile.subscription.expiresAt).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Price:
                    </span>
                    <span className="text-gray-900 dark:text-white font-semibold">
                      {(() => {
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
              {/* Available Plans for Upgrade */}
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
                    const currentPlanPrice = userProfile?.subscription?.price || 0;
                    const upgradePlans = plans.filter((plan) => {
                      if (plan.price === 0) return false;
                      const isCurrentPlan =
                        plan._id === userProfile?.subscription?.plan ||
                        plan.name === userProfile?.subscription?.planName;
                      if (isCurrentPlan) return false;
                      return plan.price > currentPlanPrice;
                    });

                    if (upgradePlans.length === 0) {
                      return (
                        <div className="col-span-full text-center py-8">
                          <div className="text-gray-500 dark:text-gray-400">
                            You're already on the highest plan available!
                          </div>
                        </div>
                      );
                    }

                    return upgradePlans.map((plan) => (
                      <div
                        key={plan._id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
                      >
                        <h4 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base mb-2">
                          {plan.name}
                        </h4>
                        <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                          ₹{plan.price}
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal ml-1">
                            /{plan.duration}
                          </span>
                        </div>
                        <ul className="space-y-1 mb-4 text-xs sm:text-sm">
                          {plan.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center">
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
                  onClick={() => setShowManagePlanModal(false)}
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm"
                >
                  View All Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Spinner */}
      {processingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col items-center">
            <LoadingSpinner size="lg" color="blue" text="Preparing payment..." />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;
