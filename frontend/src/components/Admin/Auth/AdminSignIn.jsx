import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Crown,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const AdminSignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Sending admin login request to backend...");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/admin/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        if (!data.admin || !data.token) {
          throw new Error("Invalid response from server");
        }

        console.log("Admin login successful!");

        // Store admin token in localStorage
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminData", JSON.stringify(data.admin));

        console.log("Admin login successful! Redirecting to dashboard...");

        // Redirect to admin dashboard immediately
        navigate("/admin/dashboard", { replace: true });
      } else {
        console.error("Admin login failed:", data);
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 flex flex-col relative overflow-x-hidden">
      {/* Navigation Header */}
      <header className="w-full p-4 sm:p-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 p-2 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
          </div>
          {/* <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Don't have an account?
            </span>
            <Link
              to="/admin/signup"
              className="flex items-center space-x-2 bg-white/80 hover:bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-md border border-indigo-200"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div> */}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Enhanced Logo and Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 p-3 sm:p-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white animate-pulse" />
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white absolute -top-1 -right-1 animate-bounce" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 rounded-2xl blur-md opacity-30 -z-10"></div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-base sm:text-lg lg:text-xl font-medium">
              Sign in to your admin dashboard
            </p>
            <div className="flex items-center justify-center mt-2 space-x-2">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
              <span className="text-xs sm:text-sm text-blue-600 font-medium">
                Admin Access Only
              </span>
            </div>
          </div>

          {/* Enhanced Login Form */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-indigo-50/30 rounded-2xl sm:rounded-3xl"></div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 sm:space-y-6 relative z-10"
            >
              {/* Enhanced Email Field */}
              <div className="group">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your admin email"
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Enhanced Password Field */}
              <div className="group">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced Remember Me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center group">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-xs sm:text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors"
                  >
                    Remember me
                  </label>
                </div>
              </div>

              {/* Enhanced Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                  <p className="text-red-800 text-xs sm:text-sm font-medium break-words">
                    {error}
                  </p>
                </div>
              )}

              {/* Enhanced Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 text-white py-3 sm:py-4 px-6 rounded-xl font-bold text-base sm:text-lg hover:from-indigo-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isLoading ? (
                  <div className="flex items-center justify-center relative z-10">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center relative z-10">
                    <LogIn className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    Sign In to Admin Panel
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignIn;
