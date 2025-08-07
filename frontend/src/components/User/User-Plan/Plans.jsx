import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Zap,
  Crown,
  Star,
  Heart,
  MessageCircle,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getPlans,
  createOrder,
  verifyPayment,
} from "../../../services/subscriptionService";
import { couponAPI } from "../../../services/couponService";
import axios from "axios";
import toast from "react-hot-toast";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getPlans();
        let plansArr = [];
        if (Array.isArray(data)) {
          plansArr = data;
        } else if (data && Array.isArray(data.plans)) {
          plansArr = data.plans;
        } else {
          setError("Failed to load plans. Please try again later.");
          console.error("Unexpected plans response:", data);
          setLoading(false);
          return;
        }
        // Map plans to correct IDs
        const mappedPlans = plansArr.map((plan) => {
          // Map by name or price
          if (plan.name?.toLowerCase().includes("elite")) {
            return { ...plan, id: "elite vip-999", price: 999 };
          }
          if (plan.name?.toLowerCase().includes("premium")) {
            return { ...plan, id: "premium-499", price: 499 };
          }
          // Default to regular-free
          return { ...plan, id: "regular-free", price: 0 };
        });
        setPlans(mappedPlans.sort((a, b) => a.price - b.price));
        setLoading(false);
      } catch (err) {
        setError("Failed to load plans. Please try again later.");
        console.error("Fetch plans error:", err);
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL.replace(
            "/api/v1",
            ""
          )}/api/v1/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserSubscription(res.data.user.subscription);
      } catch (err) {
        // ignore
      }
    };

    fetchPlans();
    fetchUser();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyNow = async (plan) => {
    if (plan.price === 0) {
      navigate("/profile");
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error("Payment system failed to load");
      }

      const order = await createOrder(plan._id);
      console.log("Order response:", order);
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
        description: `${plan.name} Plan Subscription`,
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
            });
            setShowSuccess(true);
            // Refresh user subscription after payment
            const token = localStorage.getItem("token");
            if (token) {
              const res = await axios.get(
                `${import.meta.env.VITE_API_URL.replace(
                  "/api/v1",
                  ""
                )}/api/v1/auth/me`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setUserSubscription(res.data.user.subscription);
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "User Name",
          email: "user@example.com",
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

  // Fetch coupons for selected plan
  const fetchApplicableCoupons = async (planId) => {
    try {
      // Pass planId to backend for filtering
      const res = await couponAPI.getCoupons({ planId });
      const allCoupons = res.data.coupons || [];
      // Only coupons applicable to this plan and not expired
      const applicable = allCoupons.filter(
        (c) =>
          c.applicablePlans.includes(planId) &&
          c.isActive &&
          new Date(c.expiresAt) > new Date()
      );
      setCoupons(applicable);
    } catch (err) {
      setCoupons([]);
    }
  };

  // Open checkout modal
  const handleOpenCheckout = async (plan) => {
    setSelectedPlan(plan);
    setSelectedCoupon(null);
    setDiscountAmount(0);
    setFinalAmount(plan.price);
    // Use plan.id for coupon matching
    await fetchApplicableCoupons(plan.id);
    setShowCheckout(true);
  };

  // Apply coupon
  const handleApplyCoupon = async (coupon) => {
    setApplyingCoupon(true);
    try {
      const userToken = localStorage.getItem("token");
      if (!userToken) {
        toast.error("Please login to apply a coupon.");
        setApplyingCoupon(false);
        return;
      }
      // Defensive: ensure selectedPlan and coupon are not null
      if (!selectedPlan || !selectedPlan.id || !coupon || !coupon.code) {
        toast.error("Invalid plan or coupon selection.");
        setApplyingCoupon(false);
        return;
      }
      const res = await couponAPI.applyCoupon({
        code: coupon.code,
        planId: selectedPlan.id,
        originalAmount: selectedPlan.price,
      });
      if (res.data && res.data.valid) {
        setSelectedCoupon(coupon);
        setDiscountAmount(res.data.discountAmount);
        setFinalAmount(res.data.finalAmount);
        toast.success("Coupon applied!");
      } else {
        toast.error(res.data?.error || "Invalid coupon");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to apply coupon");
    } finally {
      setApplyingCoupon(false);
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
      const order = await createOrder(selectedPlan._id, finalAmount);
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
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: selectedPlan._id,
            });
            // Redeem coupon after payment
            if (selectedCoupon && selectedCoupon.code) {
              await couponAPI.redeemCoupon({
                code: selectedCoupon.code,
                planId: selectedPlan.id,
                originalAmount: selectedPlan.price,
                paymentId: response.razorpay_payment_id,
              });
            }
            setShowSuccess(true);
            setShowCheckout(false);
            // Refresh user subscription
            const token = localStorage.getItem("token");
            if (token) {
              const res = await axios.get(
                `${import.meta.env.VITE_API_URL.replace(
                  "/api/v1",
                  ""
                )}/api/v1/auth/me`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setUserSubscription(res.data.user.subscription);
            }
          } catch (err) {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "User Name",
          email: "user@example.com",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-pink-200 dark:bg-gray-700 rounded-full mb-4"></div>
          <div className="h-4 bg-pink-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-pink-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 dark:bg-gray-900">
        <div className="text-red-500 dark:text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800">
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
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </header>

      {/* User Subscription Details */}
      {userSubscription?.isActive && (
        <section className="max-w-4xl mx-auto px-4 py-4 text-center">
          <div className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-2 rounded-xl mb-2 font-semibold">
            <span>Current Plan: </span>
            <span className="font-bold">
              {userSubscription.planName || "N/A"}
            </span>
            {userSubscription.activatedAt && (
              <span className="ml-4">
                Activated:{" "}
                {new Date(userSubscription.activatedAt).toLocaleDateString()}
              </span>
            )}
            {userSubscription.expiresAt && (
              <span className="ml-4">
                Expires:{" "}
                {new Date(userSubscription.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center px-4 py-12 sm:py-16">
        <div className="inline-flex items-center bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-4 py-1 rounded-full text-sm font-medium mb-4">
          <Zap className="w-4 h-4 mr-2" />
          Premium Membership
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Find Your Perfect Match Faster
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Unlock powerful features to boost your profile and connect with
          compatible matches
        </p>
      </section>

      {/* Plans Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
          {/* Plan Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
            {plans.map((plan, idx) => {
              const isCurrent =
                userSubscription?.plan === plan._id &&
                userSubscription?.isActive;
              return (
                <div
                  key={plan._id}
                  className={`p-6 sm:p-8 ${
                    idx === 1 ? "bg-pink-50 dark:bg-pink-900/20 relative" : ""
                  }`}
                >
                  {idx === 1 && (
                    <div className="absolute top-0 right-0 bg-pink-600 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="flex flex-col h-full">
                    {/* Plan Header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-center mb-4">
                        {plan.name === "Premium" ? (
                          <Crown className="w-8 h-8 text-amber-500" />
                        ) : plan.name === "Standard" ? (
                          <Star className="w-8 h-8 text-blue-500" />
                        ) : (
                          <Heart className="w-8 h-8 text-pink-500" />
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                        {plan.description || "Perfect for getting started"}
                      </p>
                      <div className="text-center">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          ₹{plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-500 dark:text-gray-400">
                            /month
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Features */}
                    <div className="flex-grow mb-8">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* CTA Button or Current Plan */}
                    {isCurrent ? (
                      <div className="block mt-4 text-green-600 dark:text-green-400 font-bold">
                        Your Current Plan
                        {userSubscription.expiresAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Expires:{" "}
                            {new Date(
                              userSubscription.expiresAt
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          plan.price === 0
                            ? navigate("/profile")
                            : handleOpenCheckout(plan)
                        }
                        className={`w-full py-3 px-6 rounded-xl font-bold transition-all ${
                          idx === 1
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:-translate-y-1"
                            : "bg-white dark:bg-gray-800 border-2 border-pink-500 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-gray-700"
                        }`}
                        disabled={processingPayment}
                      >
                        {plan.price === 0 ? "Continue Free" : "Get Started"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {showCheckout && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-0 max-w-xl w-full overflow-hidden animate-fadeInUp">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-white tracking-wide">
                Checkout - {selectedPlan.name}
              </h2>
              <button
                className="text-white text-3xl font-bold hover:text-pink-200 transition-colors focus:outline-none"
                onClick={() => setShowCheckout(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            {/* Modal Content */}
            <div className="px-8 py-8">
              {/* Plan Summary */}
              <div className="mb-6 bg-pink-50 dark:bg-pink-900/30 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="flex-shrink-0">
                  {selectedPlan.name === "Premium" ? (
                    <Crown className="w-10 h-10 text-amber-500" />
                  ) : selectedPlan.name === "Standard" ? (
                    <Star className="w-10 h-10 text-blue-500" />
                  ) : (
                    <Heart className="w-10 h-10 text-pink-500" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedPlan.name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-300 text-sm">
                    {selectedPlan.description || "Perfect for getting started"}
                  </div>
                </div>
                <div className="ml-auto text-2xl font-extrabold text-pink-600 dark:text-pink-300">
                  ₹{selectedPlan.price}
                </div>
              </div>
              {/* Price Details */}
              <div className="mb-6">
                <div className="flex justify-between mb-2 text-base">
                  <span className="text-gray-700 dark:text-gray-200">Plan Price:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{selectedPlan.price}</span>
                </div>
                <div className="flex justify-between mb-2 text-base">
                  <span className="text-gray-700 dark:text-gray-200">Coupon Discount:</span>
                  <span className="text-green-600 font-semibold">
                    -₹{discountAmount}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                  <span className="text-gray-900 dark:text-white">Final Price:</span>
                  <span className="text-pink-600 dark:text-pink-300">₹{finalAmount}</span>
                </div>
              </div>
              {/* Coupons */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-pink-600 dark:text-pink-300 text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Available Coupons
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
                            : "border-pink-200 dark:border-pink-800 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-purple-700 dark:text-purple-300 tracking-wider">
                            {coupon.code}
                          </span>
                          <span className="ml-2 text-gray-600 dark:text-gray-300">
                            {coupon.type === "percentage"
                              ? `${coupon.value}% OFF`
                              : `₹${coupon.value} OFF`}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">
                            (Expires: {new Date(coupon.expiresAt).toLocaleDateString()})
                          </span>
                        </div>
                        <button
                          className={`px-4 py-1.5 rounded-lg font-semibold shadow transition-all duration-150 ${
                            selectedCoupon?.code === coupon.code
                              ? "bg-green-600 text-white"
                              : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                          } disabled:opacity-50`}
                          disabled={applyingCoupon}
                          onClick={() => handleApplyCoupon(coupon)}
                        >
                          {selectedCoupon?.code === coupon.code ? "Applied" : "Apply"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Pay Button */}
              <button
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-150"
                disabled={processingPayment}
                onClick={handleCheckoutPayment}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
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

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Success Stories from Our Members
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "Found my life partner within a month of upgrading!",
              name: "Rahul & Priya",
              icon: <Heart className="w-8 h-8 text-pink-500 mx-auto" />,
            },
            {
              quote:
                "The premium features helped me stand out and get noticed.",
              name: "Ananya",
              icon: <Eye className="w-8 h-8 text-blue-500 mx-auto" />,
            },
            {
              quote:
                "Direct messaging made all the difference in our connection.",
              name: "Vikram & Neha",
              icon: (
                <MessageCircle className="w-8 h-8 text-purple-500 mx-auto" />
              ),
            },
          ].map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">{testimonial.icon}</div>
              <p className="text-gray-600 dark:text-gray-300 italic mb-4">
                "{testimonial.quote}"
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {testimonial.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              question: "How does billing work?",
              answer:
                "Your subscription will automatically renew each month. You can cancel anytime.",
            },
            {
              question: "Can I switch plans later?",
              answer:
                "Yes, you can upgrade or downgrade your plan at any time.",
            },
            {
              question: "Is my payment information secure?",
              answer:
                "We use industry-standard encryption and never store your payment details.",
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm"
            >
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of happy couples who found love through our platform
          </p>
          <button
            onClick={() =>
              handleBuyNow(plans.find((p) => p.name === "Premium") || plans[1])
            }
            className="bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg"
          >
            Start Your Journey Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} Matrimony Hub. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Plans;

