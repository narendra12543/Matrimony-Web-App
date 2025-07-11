import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Heart, Sparkles, Shield } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/Chat/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [socialLoginWarning, setSocialLoginWarning] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const success = params.get('success');
    if (token && success) {
      // Save token, fetch user info, set context, and redirect
      localStorage.setItem('token', token);
      // Optionally, fetch user info from backend
      fetch('http://localhost:5000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            login('', '', data.user, token); // or just login(data.user, token) depending on your context
            navigate('/dashboard', { replace: true });
          } else {
            setError('Google login failed. Please try again.');
          }
        })
        .catch(() => setError('Google login failed. Please try again.'));
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (socialLoginWarning) setSocialLoginWarning('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSocialLoginWarning('');
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        if (!data.user || !data.token) {
          throw new Error('Invalid response from server');
        }
        if (data.user.socialMediaLogin) {
          setSocialLoginWarning('This account was created with Google. Please use Google to log in.');
          return;
        }
        await login('', '', data.user, data.token);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        if (data.socialMediaLogin) {
          setSocialLoginWarning('This account was created with Google. Please use Google to log in.');
        } else {
          setError(data.error || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/v1/auth/google`;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setForgotMessage('Password reset instructions sent to your email.');
      } else {
        setForgotMessage(data.error || 'Failed to send reset email.');
      }
    } catch (err) {
      setForgotMessage('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Forgot Password Popup */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Forgot Password?</h2>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border rounded mb-4"
                required
              />
              <button
                type="submit"
                className="bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold w-full"
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            {forgotMessage && <div className="mt-4 text-sm text-gray-700">{forgotMessage}</div>}
            <button
              className="mt-6 text-pink-600 hover:underline font-semibold"
              onClick={() => setShowForgotPassword(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-auto-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Enhanced Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 p-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Heart className="w-10 h-10 text-white fill-white animate-pulse" />
                <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 rounded-2xl blur-md opacity-30 -z-10"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg font-medium">Sign in to your HeartConnect account</p>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 font-medium">Secure & Trusted</span>
          </div>
        </div>

        {/* Enhanced Login Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-purple-50/30 rounded-3xl"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Enhanced Email Field */}
            <div className="group">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium"
                  required
                />
              </div>
            </div>

            {/* Enhanced Password Field */}
            <div className="group">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-14 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md font-medium"
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
            </div>

            {/* Enhanced Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center group">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                  Remember me
                </label>
              </div>
              <button type="button" className="text-sm text-pink-600 hover:text-pink-500 font-semibold hover:underline transition-all" onClick={() => setShowForgotPassword(true)}>
                Forgot password?
              </button>
            </div>

            {/* Enhanced Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}
            {socialLoginWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 backdrop-blur-sm mt-2">
                <p className="text-yellow-800 text-sm font-medium">{socialLoginWarning}</p>
              </div>
            )}

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-pink-600 hover:via-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl relative overflow-hidden group"
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
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium rounded-full">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Enhanced Social Login */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full inline-flex ml-[100px] justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white/70 backdrop-blur-sm text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            
          </div>

          {/* Enhanced Sign Up Link */}
          <div className="mt-8 text-center">
  <p className="text-sm text-gray-600 font-medium">
    Don't have an account?{' '}
    <Link
      to="/signup"
      className="font-bold text-transparent bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text hover:from-pink-700 hover:to-purple-700 transition-all duration-300 hover:underline"
      style={{ position: 'relative', zIndex: 9999 }} // Add these styles
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
