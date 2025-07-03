import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '@mui/material/styles';

const Login = () => {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(form.email, form.password);
      showToast('Login successful!', 'success');
      // Navigation will be handled by the useEffect
    } catch (err) {
      let errorMessage = 'Failed to login';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (err.code === 'auth/email-not-verified') {
        errorMessage = 'Please verify your email before logging in';
      }
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      // No need to show toast or navigate here as the redirect will happen
      // and the redirect result will be handled in AuthContext
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to login with Google');
      showToast('Failed to login with Google', 'error');
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-yellow-100 via-green-100 to-orange-100'
    }`}>
      <div className={`${
        isDarkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-xl'
      } rounded-lg overflow-hidden w-full max-w-4xl grid grid-cols-1 md:grid-cols-2`}>
        {/* Left Side Image */}
        <div className="bg-gradient-to-tr from-green-500 to-yellow-500 p-8 hidden md:flex items-center justify-center">
          <img
            src="/login-illustration.png"
            alt="Login Illustration"
            className="w-3/4 h-auto drop-shadow-xl"
          />
        </div>

        {/* Right Side Form */}
        <div className="p-8">
          <h2 className={`text-3xl font-bold ${
            isDarkMode ? 'text-green-400' : 'text-green-600'
          } mb-6 text-center`}>Welcome Back</h2>

          {error && (
            <div className={`${
              isDarkMode 
                ? 'bg-red-900/30 border border-red-800 text-red-300' 
                : 'bg-red-100 border border-red-400 text-red-700'
            } px-4 py-2 rounded mb-4 text-sm`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border rounded-md focus:ring-green-500 focus:outline-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-300'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border rounded-md focus:ring-green-500 focus:outline-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-300'
                }`}
                required
                minLength={6}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className={`ml-2 block text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className={`text-sm ${
                  isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:underline'
                }`}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-300'
                }`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${
                  isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                }`}>Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-2 py-2 rounded-md transition disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <img
                src="/google-icon.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Continue with Google</span>
            </button>
          </form>

          <p className={`mt-6 text-center text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              className={`font-semibold hover:underline transition ${
                isDarkMode ? 'text-orange-400' : 'text-orange-500'
              }`}
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
