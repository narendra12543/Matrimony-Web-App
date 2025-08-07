import React, { useState, useRef, useEffect } from "react";

import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  Heart,
  Sparkles,
  Shield,
  Check,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/Chat/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    terms: false,
  });
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const recaptchaRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  // Handle Google OAuth callback for signup
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const success = params.get("success");
    if (token && success) {
      console.log(
        "🔑 OAuth callback - Token received:",
        token ? "Token exists" : "No token"
      );
      console.log(
        "🔑 OAuth callback - Token value:",
        token ? token.substring(0, 20) + "..." : "No token"
      );

      // Save token, fetch user info, set context, and redirect
      localStorage.setItem("token", token);
      console.log("💾 Token saved to localStorage");

      // Fetch user info from backend
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            login(null, null, data.user, token); // Update context

            // Check if user needs to complete essential profile
            if (!data.user.essentialProfileComplete) {
              console.log(
                "Google OAuth signup user needs to complete essential profile"
              );
              console.log(
                "🔑 Token before navigation:",
                localStorage.getItem("token") ? "Token exists" : "No token"
              );
              navigate("/essential-profile-setup", { replace: true });
            } else if (
              data.user.approvalStatus === "pending" ||
              !data.user.isVerified
            ) {
              navigate("/dashboard", { replace: true });
            } else if (
              data.user.approvalStatus === "approved" &&
              data.user.isVerified
            ) {
              console.log("Google OAuth signup user redirecting to /dashboard");
              navigate("/dashboard", { replace: true });
            }
          } else {
            console.error("Google signup failed - no user data received");
          }
        })
        .catch((err) => {
          console.error("Google signup error:", err);
        });
    }
  }, [location.search, login, navigate]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: registeredEmail }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setResendMessage("Verification email sent successfully!");
      } else {
        setResendMessage(data.error || "Failed to send verification email.");
      }
    } catch (err) {
      setResendMessage("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name] || errors.captcha) {
      setErrors((prev) => ({ ...prev, [name]: "", general: "", captcha: "" }));
    }
  };

  const handleRecaptchaChange = (token) => {
    console.log(
      "🔍 reCAPTCHA token received:",
      token ? "Token present" : "No token"
    );
    setRecaptchaToken(token || "");
    if (errors.captcha) {
      setErrors((prev) => ({ ...prev, captcha: "" }));
    }
  };

  const resetRecaptcha = () => {
    setRecaptchaToken("");
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    else if (formData.firstName.trim().length < 2)
      newErrors.firstName = "First name must be at least 2 characters";

    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    else if (formData.lastName.trim().length < 2)
      newErrors.lastName = "Last name must be at least 2 characters";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid email";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone))
      newErrors.phone = "Phone number must be exactly 10 digits";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!formData.terms)
      newErrors.terms = "You must accept the terms and conditions";

    if (!recaptchaToken) {
      newErrors.captcha = "Please verify you are human";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Signup form submitted:", formData);

    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    // Prevent rapid form submissions
    if (isLoading) {
      console.log("Form submission already in progress");
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log("Sending registration request to backend...");
      console.log("🌐 API URL:", import.meta.env.VITE_API_URL);
      console.log("📤 Sending signup request with data:", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password ? "Password provided" : "No password",
        recaptchaToken: recaptchaToken ? "Token provided" : "No token",
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            recaptchaToken,
          }),
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        if (!data.user || !data.token) {
          throw new Error("Invalid response from server");
        }

        console.log(
          "Registration successful! Using AuthContext login method with:",
          data.user
        );

        // Use AuthContext login method
        await login(null, null, data.user, data.token);

        console.log(
          "Registration successful! Showing email verification modal..."
        );

        // Show email verification modal instead of redirecting
        setRegisteredEmail(data.user.email);
        setShowEmailVerificationModal(true);
      } else {
        console.error("Registration failed:", data);
        setErrors({
          general:
            data.error ||
            data.message ||
            "Registration failed. Please try again.",
        });
        if (data.recaptchaError) {
          resetRecaptcha();
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({
        general: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const backendUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
      "https://matromatch.com";
    const redirectUrl = encodeURIComponent(window.location.origin + "/signup");
    window.location.href = `${backendUrl}/api/v1/auth/google?redirect=${redirectUrl}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
      {/* Email Verification Modal */}
      {showEmailVerificationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                We've sent a verification link to:
              </p>
              <p className="text-blue-600 dark:text-blue-400 font-semibold mt-1">
                {registeredEmail}
              </p>
            </div>

            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p>
                Please check your email and click the verification link to
                activate your account.
              </p>
              <p>
                You must verify your email before you can access your dashboard.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => {
                  setShowEmailVerificationModal(false);
                  navigate("/essential-profile-setup");
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
              >
                Complete Profile Setup
              </button>

              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </button>

              {resendMessage && (
                <div
                  className={`text-sm p-3 rounded-lg ${
                    resendMessage.includes("successfully")
                      ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                  }`}
                >
                  {resendMessage}
                </div>
              )}

              <button
                onClick={() => setShowEmailVerificationModal(false)}
                className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 p-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
                <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 rounded-2xl blur-md opacity-30 -z-10"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-blue-900 bg-clip-text text-transparent dark:from-white dark:via-gray-200 dark:to-gray-400 mb-3">
            Join HeartConnect
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">
            Create your account and find your perfect match
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Safe & Secure Platform
            </span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-purple-50/30 dark:from-gray-700/50 dark:to-gray-800/30 rounded-3xl"></div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Input fields for first name, last name, email, phone, password */}
            <div className="group">
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white ${
                    errors.firstName
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  required
                />
              </div>
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.firstName}
                </p>
              )}
            </div>
            <div className="group">
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white ${
                    errors.lastName
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  required
                />
              </div>
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.lastName}
                </p>
              )}
            </div>
            <div className="group">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white ${
                    errors.email
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.email}
                </p>
              )}
            </div>
            <div className="group">
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white ${
                    errors.phone
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  required
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.phone}
                </p>
              )}
            </div>
            <div className="group">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  className={`w-full pl-12 pr-14 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-xl transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-purple-100 dark:border-gray-600">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="terms"
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleInputChange}
                  className={`h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500 rounded transition-colors ${
                    errors.terms ? "border-red-300" : ""
                  }`}
                />
                {formData.terms && (
                  <Check className="absolute h-3 w-3 text-white ml-1 mt-1 pointer-events-none" />
                )}
              </div>
              <div className="text-sm">
                <label
                  htmlFor="terms"
                  className="text-gray-700 dark:text-gray-300 font-medium"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500 font-semibold hover:underline"
                  >
                    Terms & Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500 font-semibold hover:underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600 font-medium">{errors.terms}</p>
            )}

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={handleRecaptchaChange}
                onExpired={() => setRecaptchaToken("")}
                onErrored={() => setRecaptchaToken("")}
                ref={recaptchaRef}
              />
            </div>
            {errors.captcha && (
              <p className="mt-2 text-sm text-red-600 font-medium text-center">
                {errors.captcha}
              </p>
            )}

            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                  {errors.general}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-600 hover:via-blue-500 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {isLoading ? (
                <div className="flex items-center justify-center relative z-10">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center relative z-10">
                  <UserPlus className="w-6 h-6 mr-3" />
                  Create Account
                </div>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium rounded-full">
                  Or sign up with
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full inline-flex justify-center py-3 px-4 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-transparent bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text hover:from-blue-700 hover:to-blue-500 transition-all duration-300 hover:underline"
              >
                Sign in now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
