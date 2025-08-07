import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Shield, Check, Crown, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminSignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Admin signup form submitted:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      console.log('Sending admin registration request to backend...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/admin/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Admin registration successful!');
        alert('Admin registered successfully! Please sign in.');
        navigate('/admin/signin');
      } else {
        console.error('Admin registration failed:', data);
        setErrors({ general: data.error || data.message || 'Registration failed. Please try again.' });
      }
    } catch (err) {
      console.error('Admin registration error:', err);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
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
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Already have an account?</span>
            <Link
              to="/admin/signin"
              className="flex items-center space-x-2 bg-white/80 hover:bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-md border border-indigo-200"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Enhanced Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 p-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Crown className="w-10 h-10 text-white fill-white animate-pulse" />
                  <Shield className="w-4 h-4 text-white absolute -top-1 -right-1 animate-bounce" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 rounded-2xl blur-md opacity-30 -z-10"></div>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
              Create Admin Account
            </h1>
            <p className="text-gray-600 text-lg font-medium mb-2">Join the admin team</p>
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600 font-medium">Admin Access Only</span>
            </div>
          </div>

          {/* Enhanced Signup Form */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-indigo-50/30 rounded-3xl"></div>
            
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {/* Enhanced Name Field */}
              <div className="group">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium ${
                      errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    required
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.name}</p>
                )}
              </div>

              {/* Enhanced Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium ${
                      errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Enhanced Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    className={`w-full pl-12 pr-14 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium ${
                      errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Enhanced Confirm Password Field */}
              <div className="group">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={`w-full pl-12 pr-14 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium ${
                      errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Enhanced Terms Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="terms"
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleInputChange}
                    className={`h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors ${
                      errors.terms ? 'border-red-300' : ''
                    }`}
                  />
                  {formData.terms && (
                    <Check className="absolute h-3 w-3 text-white ml-1 mt-1 pointer-events-none" />
                  )}
                </div>
                <div className="text-sm">
                  <label htmlFor="terms" className="text-gray-700 font-medium">
                    I agree to the{' '}
                    <button type="button" className="text-indigo-600 hover:text-indigo-500 font-semibold hover:underline">
                      Admin Terms & Conditions
                    </button>
                    {' '}and{' '}
                    <button type="button" className="text-indigo-600 hover:text-indigo-500 font-semibold hover:underline">
                      Privacy Policy
                    </button>
                  </label>
                </div>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600 font-medium">{errors.terms}</p>
              )}

              {/* Enhanced General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-red-800 text-sm font-medium">{errors.general}</p>
                </div>
              )}

              {/* Enhanced Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-indigo-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isLoading ? (
                  <div className="flex items-center justify-center relative z-10">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Creating Admin Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center relative z-10">
                    <UserPlus className="w-6 h-6 mr-3" />
                    Create Admin Account
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

export default AdminSignUp;
