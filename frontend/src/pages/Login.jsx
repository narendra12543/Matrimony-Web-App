import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Heart,
  Sparkles,
  Shield,
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/Chat/AuthContext";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [socialLoginWarning, setSocialLoginWarning] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [showCaptchaError, setShowCaptchaError] = useState(false);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  // Redirect to dashboard if already logged in (token exists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setRedirecting(true);
      // Optionally, you can verify the token by calling /auth/me
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            navigate("/dashboard", { replace: true });
          } else {
            setRedirecting(false);
          }
        })
        .catch(() => setRedirecting(false));
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const success = params.get("success");
    const errorParam = params.get("error");
    const messageParam = params.get("message");
    // Show disabled modal if Google login failed due to disabled account
    if (errorParam === "account_disabled") {
      // Use AuthContext modal
      window.setTimeout(() => {
        // Use a custom event to trigger modal in AuthContext
        window.dispatchEvent(
          new CustomEvent("showDisabledModal", {
            detail: {
              message:
                messageParam ||
                "Your account has been disabled by admin. You cannot login. Please contact support.",
            },
          })
        );
      }, 100);
      return;
    }
    if (token && success) {
      // Save token, fetch user info, set context, and redirect
      localStorage.setItem("token", token);
      // Optionally, fetch user info from backend
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            // If accountStatus is active and was just enabled, show modal
            if (data.user.accountStatus === "active") {
              localStorage.setItem("showAccountEnabledModal", "true");
            }
            login(null, null, data.user, token); // Update context

            // Check if user needs to complete essential profile (same logic as regular login)
            if (!data.user.essentialProfileComplete) {
              console.log(
                "Google OAuth user needs to complete essential profile"
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
              console.log("Google OAuth user redirecting to /dashboard");
              navigate("/dashboard", { replace: true });
            }
          } else {
            setError("Google login failed. Please try again.");
          }
        })
        .catch(() => setError("Google login failed. Please try again."));
    }
  }, [location.search, login, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (socialLoginWarning) setSocialLoginWarning("");
  };

  const handleSubmit = async (e) => {
    // console.log("Submitting login form"); // DEBUG
    e.preventDefault();
    setSocialLoginWarning("");
    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    // reCaptcha check
    if (!recaptchaToken) {
      setShowCaptchaError(true);
      return;
    }
    setIsLoading(true);
    setError("");

    // Clear the reCAPTCHA token to prevent reuse
    const currentToken = recaptchaToken;
    setRecaptchaToken("");

    try {
      console.log("🌐 API URL:", import.meta.env.VITE_API_URL);
      console.log("📤 Sending login request with data:", {
        email: formData.email,
        password: formData.password ? "Password provided" : "No password",
        recaptchaToken: currentToken ? "Token provided" : "No token",
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, recaptchaToken: currentToken }),
        }
      );
      const data = await response.json();
      console.log("Login API response:", data); // DEBUG
      if (response.ok) {
        if (!data.user || !data.token) {
          throw new Error("Invalid response from server");
        }
        if (data.user.socialMediaLogin) {
          setSocialLoginWarning(
            "This account was created with Google. Please use Google to log in."
          );
          return;
        }

        // Use the AuthContext login function with the data we already have
        await login(null, null, data.user, data.token);
        console.log("User after login:", data.user); // DEBUG

        // Check if user needs to complete essential profile
        if (!data.user.essentialProfileComplete) {
          console.log("User needs to complete essential profile");
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
          console.log("Redirecting to /dashboard"); // DEBUG
          navigate("/dashboard", { replace: true });
        }
      } else {
        if (data.socialMediaLogin) {
          setSocialLoginWarning(
            "This account was created with Google. Please use Google to log in."
          );
        } else {
          setError(data.error || "Login failed. Please try again.");
          if (data.recaptchaError) {
            resetReCAPTCHA(); // Reset reCAPTCHA on reCAPTCHA error
          }
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      resetReCAPTCHA(); // Reset reCAPTCHA on network error
    } finally {
      setIsLoading(false);
      // Add a small delay to prevent rapid resubmission
      setTimeout(() => {
        resetReCAPTCHA();
      }, 1000);
    }
  };

  const handleSignupClick = () => {
    navigate("/signup");
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL?.replace("/api/v1", "");
    const redirectUrl = encodeURIComponent(window.location.origin + "/login");
    window.location.href = `${backendUrl}/api/v1/auth/google?redirect=${redirectUrl}`;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setForgotMessage("Password reset instructions sent to your email.");
      } else {
        setForgotMessage(data.error || "Failed to send reset email.");
      }
    } catch (err) {
      setForgotMessage("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const onReCAPTCHAChange = (token) => {
    console.log(
      "🔍 reCAPTCHA token received:",
      token ? "Token present" : "No token"
    );
    console.log(
      "🔑 reCAPTCHA site key:",
      import.meta.env.VITE_RECAPTCHA_SITE_KEY ? "Site key set" : "No site key"
    );
    console.log(
      "🔑 Site key (first 10 chars):",
      import.meta.env.VITE_RECAPTCHA_SITE_KEY
        ? import.meta.env.VITE_RECAPTCHA_SITE_KEY.substring(0, 10) + "..."
        : "No site key"
    );
    setRecaptchaToken(token);
    setShowCaptchaError(false);
  };

  const resetReCAPTCHA = () => {
    recaptchaRef.current.reset();
    setRecaptchaToken("");
    setShowCaptchaError(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
      {redirecting && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      )}
      {/* Forgot Password Popup */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Forgot Password?
            </h2>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border rounded mb-4 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold w-full"
                disabled={forgotLoading}
              >
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            {forgotMessage && (
              <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                {forgotMessage}
              </div>
            )}
            <button
              className="mt-6 text-blue-600 hover:underline font-semibold"
              onClick={() => setShowForgotPassword(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-auto-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Enhanced Logo and Header */}
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
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
            Sign in to your HeartConnect account
          </p>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Secure & Trusted
            </span>
          </div>
        </div>

        {/* Enhanced Login Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/20 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-blue-50/30 dark:from-gray-700/50 dark:to-gray-800/30 rounded-3xl"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Enhanced Email Field */}
            <div className="group">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
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
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Enhanced Password Field */}
            <div className="group">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
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
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-14 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-gray-900 dark:text-white"
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
            </div>

            {/* Enhanced Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center group">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500 font-semibold hover:underline transition-all"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>

            {/* Enhanced Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}
            {socialLoginWarning && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm mt-2">
                <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
                  {socialLoginWarning}
                </p>
              </div>
            )}
            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={onReCAPTCHAChange}
                onExpired={() => setRecaptchaToken("")}
                onErrored={() => setRecaptchaToken("")}
              />
            </div>
            {showCaptchaError && (
              <p className="mt-2 text-sm text-red-600 font-medium text-center">
                Please verify you are human
              </p>
            )}

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-600 hover:via-blue-500 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {isLoading ? (
                <div className="flex items-center justify-center relative z-10">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center relative z-10">
                  <LogIn className="w-6 h-6 mr-3" />
                  Sign In
                </div>
              )}
            </button>
          </form>

          {/* Enhanced Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium rounded-full">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Social Login */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full inline-flex sm:ml-[100px] ml-[80px] justify-center py-3 px-4 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            </button>
          </div>

          {/* Enhanced Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-bold text-transparent bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text hover:from-blue-700 hover:to-blue-500 transition-all duration-300 hover:underline"
                style={{ position: "relative", zIndex: 9999 }} // Add these styles
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
