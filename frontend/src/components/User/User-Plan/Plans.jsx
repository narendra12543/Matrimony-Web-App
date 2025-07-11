import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, Zap, Crown, Star, Heart, MessageCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPlans, createOrder, verifyPayment } from '../../../services/subscriptionService';
import axios from 'axios';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getPlans();
        if (Array.isArray(data)) {
          setPlans(data.sort((a, b) => a.price - b.price));
        } else if (data && Array.isArray(data.plans)) {
          setPlans(data.plans.sort((a, b) => a.price - b.price));
        } else {
          setError("Failed to load plans. Please try again later.");
          console.error("Unexpected plans response:", data);
        }
      } catch (err) {
        setError("Failed to load plans. Please try again later.");
        console.error("Fetch plans error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/api/v1/auth/me`,
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
      navigate('/profile');
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
            const token = localStorage.getItem('token');
            if (token) {
              const res = await axios.get(
                `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/api/v1/auth/me`,
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
          }
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-pink-200 rounded-full mb-4"></div>
          <div className="h-4 bg-pink-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-pink-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
            <p className="text-gray-700 mb-6">Your subscription is now active.</p>
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
          className="flex items-center text-pink-600 hover:text-pink-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </header>

      {/* User Subscription Details */}
      {userSubscription?.isActive && (
        <section className="max-w-4xl mx-auto px-4 py-4 text-center">
          <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-xl mb-2 font-semibold">
            <span>Current Plan: </span>
            <span className="font-bold">{userSubscription.planName || 'N/A'}</span>
            {userSubscription.activatedAt && (
              <span className="ml-4">Activated: {new Date(userSubscription.activatedAt).toLocaleDateString()}</span>
            )}
            {userSubscription.expiresAt && (
              <span className="ml-4">Expires: {new Date(userSubscription.expiresAt).toLocaleDateString()}</span>
            )}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center px-4 py-12 sm:py-16">
        <div className="inline-flex items-center bg-pink-100 text-pink-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
          <Zap className="w-4 h-4 mr-2" />
          Premium Membership
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Find Your Perfect Match Faster
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock powerful features to boost your profile and connect with compatible matches
        </p>
      </section>

      {/* Plans Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Plan Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {plans.map((plan, idx) => {
              const isCurrent = userSubscription?.plan === plan._id && userSubscription?.isActive;
              return (
                <div 
                  key={plan._id} 
                  className={`p-8 ${idx === 1 ? 'bg-pink-50 relative' : ''}`}
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
                        {plan.name === 'Premium' ? (
                          <Crown className="w-8 h-8 text-amber-500" />
                        ) : plan.name === 'Standard' ? (
                          <Star className="w-8 h-8 text-blue-500" />
                        ) : (
                          <Heart className="w-8 h-8 text-pink-500" />
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-center text-gray-900 mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-gray-500 text-center mb-6">
                        {plan.description || 'Perfect for getting started'}
                      </p>
                      <div className="text-center">
                        <span className="text-4xl font-bold text-gray-900">
                          ₹{plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-gray-500">/month</span>
                        )}
                      </div>
                    </div>
                    {/* Features */}
                    <div className="flex-grow mb-8">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* CTA Button or Current Plan */}
                    {isCurrent ? (
                      <div className="block mt-4 text-green-600 font-bold">
                        Your Current Plan
                        {userSubscription.expiresAt && (
                          <div className="text-xs text-gray-500 mt-1">Expires: {new Date(userSubscription.expiresAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyNow(plan)}
                        className={`w-full py-3 px-6 rounded-xl font-bold transition-all ${
                          idx === 1 
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:-translate-y-1'
                            : 'bg-white border-2 border-pink-500 text-pink-600 hover:bg-pink-50'
                        }`}
                        disabled={processingPayment}
                      >
                        {plan.price === 0 ? 'Continue Free' : 'Get Started'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Success Stories from Our Members
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "Found my life partner within a month of upgrading!",
              name: "Rahul & Priya",
              icon: <Heart className="w-8 h-8 text-pink-500 mx-auto" />
            },
            {
              quote: "The premium features helped me stand out and get noticed.",
              name: "Ananya",
              icon: <Eye className="w-8 h-8 text-blue-500 mx-auto" />
            },
            {
              quote: "Direct messaging made all the difference in our connection.",
              name: "Vikram & Neha",
              icon: <MessageCircle className="w-8 h-8 text-purple-500 mx-auto" />
            }
          ].map((testimonial, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                {testimonial.icon}
              </div>
              <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
              <p className="font-medium text-gray-900">{testimonial.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              question: "How does billing work?",
              answer: "Your subscription will automatically renew each month. You can cancel anytime."
            },
            {
              question: "Can I switch plans later?",
              answer: "Yes, you can upgrade or downgrade your plan at any time."
            },
            {
              question: "Is my payment information secure?",
              answer: "We use industry-standard encryption and never store your payment details."
            }
          ].map((faq, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Match?</h2>
          <p className="text-xl mb-8">Join thousands of happy couples who found love through our platform</p>
          <button 
            onClick={() => handleBuyNow(plans.find(p => p.name === 'Premium') || plans[1])}
            className="bg-white text-pink-600 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Your Journey Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Matrimony Hub. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Plans;