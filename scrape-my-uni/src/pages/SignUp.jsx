import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

const SignUp = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    educationLevel: '',
    academicInterest: '',
    province: '',
    grades: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      const user = await signup(form.email, form.password, form.name);
      
      if (user) {
        // Store additional user data in Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            educationLevel: form.educationLevel,
            academicInterest: form.academicInterest,
            province: form.province,
            grades: form.grades
          }, { merge: true });
        } catch (profileError) {
          console.error('Error storing additional profile data:', profileError);
        }
        
        setVerificationSent(true);
        // Don't navigate to login immediately
        // Let user see the verification message
      }
    } catch (err) {
      let errorMessage = 'Failed to create account';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-green-100 to-orange-100">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Verify Your Email</h2>
          <p className="text-gray-600 mb-4">
            We've sent a verification email to {form.email}. Please check your inbox and click the verification link to complete your registration.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-semibold transition"
            >
              Go to Login
            </button>
            <p className="text-sm text-gray-500 text-center">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleSubmit}
                className="text-green-600 hover:underline"
              >
                resend verification email
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-green-100 to-orange-100">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden w-full max-w-4xl grid grid-cols-1 md:grid-cols-2">
        {/* Left Side Image */}
        <div className="bg-gradient-to-tr from-green-500 to-yellow-500 p-8 hidden md:flex items-center justify-center">
          <img
            src="/signup-illustration.png"
            alt="Signup Illustration"
            className="w-3/4 h-auto drop-shadow-xl"
          />
        </div>

        {/* Right Side Form */}
        <div className="p-8">
          <h2 className="text-3xl font-bold text-green-600 mb-6 text-center">Create an Account</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:outline-none"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Education Level</label>
              <select
                name="educationLevel"
                value={form.educationLevel}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:outline-none"
                required
              >
                <option value="">Select...</option>
                <option value="Matric">Matric</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Bachelor">Bachelor</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Used to suggest appropriate university levels.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Interest</label>
              <input
                type="text"
                name="academicInterest"
                value={form.academicInterest}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:outline-none"
                placeholder="e.g., Engineering, Medical, Business"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Used to recommend suitable programs/universities.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Province</label>
              <select
                name="province"
                value={form.province}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:outline-none"
                required
              >
                <option value="">Select...</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="KPK">KPK</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Federal">Federal</option>
                <option value="Gilgit Baltistan">Gilgit Baltistan</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">To show province-specific universities.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grades / GPA</label>
              <input
                type="text"
                name="grades"
                value={form.grades}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:outline-none"
                placeholder="e.g., A+, 3.8 GPA"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Used to check your eligibility and give accurate suggestions.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-orange-500 font-semibold hover:underline transition"
            >
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
