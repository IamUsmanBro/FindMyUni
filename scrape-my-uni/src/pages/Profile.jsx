import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../firebase.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext.jsx';
import { useTheme } from '@mui/material/styles';

const Profile = () => {
  const { currentUser, updateUserProfile, updateUserPassword } = useAuth();
  const { showToast } = useToast();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState({});
  const [activeTab, setActiveTab] = useState('personal');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [profileImageError, setProfileImageError] = useState(false);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (!currentUser?.uid) return;

        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            phoneNumber: currentUser.phoneNumber || '',
            photoURL: currentUser.photoURL || '',
            ...userSnap.data()
          });
        } else {
          // Create default user data if not exists
          setUserData({
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            phoneNumber: '',
            photoURL: currentUser.photoURL || '',
            educationLevel: '',
            academicInterest: '',
            province: '',
            grades: '',
            bio: '',
            address: '',
            city: '',
            dateOfBirth: '',
            gender: '',
            notifications: {
              email: true,
              application: true,
              deadline: true,
              news: false
            }
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        showToast('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setUserData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [name]: checked
        }
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get a proper profile photo URL
  const getProfilePhotoURL = () => {
    if (!userData.photoURL || profileImageError) return null;
    
    let photoURL = userData.photoURL;
    
    // If it's a Google photo with size restrictions, modify it
    if (photoURL.includes('=s96-c')) {
      photoURL = photoURL.split('=s96-c')[0] + '=s400-c';
    }
    
    return photoURL;
  };
  
  // Get initials for avatar placeholder
  const getInitials = () => {
    if (userData.displayName) {
      return userData.displayName.charAt(0).toUpperCase();
    } else if (userData.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Validate profile data
  const validateProfileData = () => {
    const errors = {};
    
    if (!userData.displayName?.trim()) {
      errors.displayName = 'Name is required';
    }
    
    if (userData.phoneNumber && !/^\+?[0-9]{10,15}$/.test(userData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password data
  const validatePasswordData = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update profile data
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!validateProfileData()) return;
    
    try {
      setUpdating(true);
      
      // Update displayName in Firebase Auth
      if (userData.displayName !== currentUser.displayName) {
        await updateUserProfile(userData.displayName, userData.photoURL || null);
      }
      
      // Update user data in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber || '',
        educationLevel: userData.educationLevel || '',
        academicInterest: userData.academicInterest || '',
        province: userData.province || '',
        grades: userData.grades || '',
        bio: userData.bio || '',
        address: userData.address || '',
        city: userData.city || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        notifications: userData.notifications || {},
        updatedAt: new Date().toISOString()
      });
      
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile: ' + error.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordData()) return;
    
    try {
      setUpdating(true);
      await updateUserPassword(passwordData.newPassword);
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showToast('Password updated successfully', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      showToast('Failed to update password: ' + error.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center overflow-hidden ${isDarkMode ? 'border-4 border-green-800' : 'border-4 border-green-100'}`}>
                {getProfilePhotoURL() ? (
                  <img 
                    src={getProfilePhotoURL()} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Error loading profile image:", e);
                      setProfileImageError(true);
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="text-4xl text-green-500">
                    {getInitials()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{userData.displayName || 'User'}</h1>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{userData.email}</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                {userData.bio || 'Complete your profile to help us provide better university recommendations.'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Navigation Tabs */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
          <div className={`flex overflow-x-auto ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
            <button
              className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors ${
                activeTab === 'personal'
                  ? `text-green-500 border-b-2 border-green-500`
                  : `${isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'}`
              }`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Information
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors ${
                activeTab === 'education'
                  ? `text-green-500 border-b-2 border-green-500`
                  : `${isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'}`
              }`}
              onClick={() => setActiveTab('education')}
            >
              Education Details
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors ${
                activeTab === 'preferences'
                  ? `text-green-500 border-b-2 border-green-500`
                  : `${isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'}`
              }`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm focus:outline-none transition-colors ${
                activeTab === 'security'
                  ? `text-green-500 border-b-2 border-green-500`
                  : `${isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'}`
              }`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={userData.displayName || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        validationErrors.displayName ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.displayName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.displayName}</p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userData.email || ''}
                      disabled
                      className={`w-full px-3 py-2 border rounded-md cursor-not-allowed ${
                        isDarkMode ? 'bg-gray-600 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Email cannot be changed</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={userData.phoneNumber || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        validationErrors.phoneNumber ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                      placeholder="+923001234567"
                    />
                    {validationErrors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={userData.dateOfBirth || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={userData.gender || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={userData.city || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Lahore"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={userData.address || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                      placeholder="Your full address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={userData.bio || ''}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                      placeholder="Tell us a bit about yourself..."
                    ></textarea>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Education Details Tab */}
            {activeTab === 'education' && (
              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Education Level
                    </label>
                    <select
                      name="educationLevel"
                      value={userData.educationLevel || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Education Level</option>
                      <option value="Matric">Matric</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Bachelor">Bachelor</option>
                      <option value="Master">Master</option>
                      <option value="MPhil">MPhil</option>
                      <option value="PhD">PhD</option>
                    </select>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Used to suggest appropriate university levels</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Grades / GPA
                    </label>
                    <input
                      type="text"
                      name="grades"
                      value={userData.grades || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                      placeholder="e.g., A+, 3.8 GPA"
                    />
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>To check eligibility for programs</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Academic Interest
                    </label>
                    <input
                      type="text"
                      name="academicInterest"
                      value={userData.academicInterest || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Engineering, Medical, Business"
                    />
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>For recommending suitable programs</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Province
                    </label>
                    <select
                      name="province"
                      value={userData.province || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                        isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Province</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Sindh">Sindh</option>
                      <option value="KPK">KPK</option>
                      <option value="Balochistan">Balochistan</option>
                      <option value="Federal">Federal</option>
                      <option value="Gilgit Baltistan">Gilgit Baltistan</option>
                      <option value="AJK">AJK</option>
                    </select>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>To show province-specific universities</p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <form onSubmit={handleUpdateProfile}>
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Notification Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="email"
                          name="email"
                          checked={userData.notifications?.email ?? true}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="email" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Email Notifications
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Receive updates via email</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="application"
                          name="application"
                          checked={userData.notifications?.application ?? true}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="application" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Application Updates
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get notified about your application status changes</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="deadline"
                          name="deadline"
                          checked={userData.notifications?.deadline ?? true}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="deadline" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Deadline Reminders
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Receive notifications when application deadlines are approaching</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="news"
                          name="news"
                          checked={userData.notifications?.news ?? false}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="news" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          News & Updates
                        </label>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Get updates about universities, new programs, and educational news
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handleUpdatePassword}>
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                          validationErrors.currentPassword ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.currentPassword && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.currentPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                          validationErrors.newPassword ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.newPassword && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.newPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 border rounded-md form-input focus:ring-2 focus:ring-green-300 ${
                          validationErrors.confirmPassword ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 