import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUserCircle, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
import { useTheme } from '@mui/material/styles';

const NavBar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const theme = useTheme(); // Get the current theme
  
  // Get initials for avatar placeholder
  const getInitials = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName.charAt(0).toUpperCase();
    } else if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Track scroll position for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Reset profile image error when user changes
  useEffect(() => {
    setProfileImageError(false);
  }, [currentUser?.uid]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) return;
      
      try {
        // Query the admins collection to check if this user is an admin
        const adminQuery = query(
          collection(db, 'admins'), 
          where('email', '==', currentUser.email.toLowerCase())
        );
        
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };
    
    checkAdminStatus();
  }, [currentUser]);

  const navLinks = [
    { text: 'Home', path: '/' },
    { text: 'Universities', path: '/universities' },
    { text: 'Compare', path: '/compare' },
    { text: 'About', path: '/about' },
    { text: 'Features', path: '/features' },
    { text: 'Contact', path: '/contact' }
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Profile Avatar Component
  const ProfileAvatar = ({ size = 'small', className = '' }) => {
    const dimensions = size === 'small' ? 'w-6 h-6' : 'w-16 h-16';
    const borderStyle = size === 'small' ? '' : 'border-2 border-green-500';
    const fontSize = size === 'small' ? 'text-sm' : 'text-2xl';
    
    if (currentUser?.photoURL && !profileImageError) {
      // Try to use local storage cached version first if available
      const cachedPhotoKey = `profile-photo-${currentUser.uid}`;
      let photoSrc = localStorage.getItem(cachedPhotoKey) || currentUser.photoURL;
      
      // If the URL contains Google's size restriction, modify it
      if (typeof photoSrc === 'string' && photoSrc.includes('=s96-c')) {
        photoSrc = photoSrc.split('=s96-c')[0] + '=s400-c'; // Get larger size
      }
      
      return (
        <div className={`${dimensions} rounded-full overflow-hidden ${className} ${borderStyle}`}>
          <img 
            src={photoSrc}
            alt={currentUser.displayName || 'Profile'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error("Error loading profile image:", e);
              setProfileImageError(true);
              
              // Clear cached photo if it failed
              localStorage.removeItem(cachedPhotoKey);
            }}
            crossOrigin="anonymous"
          />
        </div>
      );
    }
    
    // Fallback to initials avatar
    return (
      <div className={`${dimensions} rounded-full ${theme.palette.mode === 'dark' ? 'bg-green-900' : 'bg-green-100'} flex items-center justify-center ${className} ${borderStyle}`}>
        <span className={`${fontSize} font-medium ${theme.palette.mode === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
          {getInitials()}
        </span>
      </div>
    );
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      theme.palette.mode === 'dark' 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-white text-gray-800'
    } ${
      scrolled ? "shadow-lg py-2" : "shadow-md py-4"
    }`}
    style={{ backgroundColor: theme.palette.background.paper }}
    >
      <div className="max-w-screen-xl mx-auto flex justify-between items-center px-4">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className={`transition-all duration-300 ${
              scrolled ? "w-8 h-8" : "w-10 h-10"
            } hover-grow`} 
          />
          <Link
            to="/"
            className={`font-bold ${
              theme.palette.mode === 'dark' ? 'text-gray-100 hover:text-green-400' : 'text-gray-800 hover:text-green-600'
            } transition-all duration-300 ${
              scrolled ? "text-xl" : "text-2xl"
            } hover-underline`}
          >
            ScrapeMyUni
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-700 hover:text-gray-900 focus:outline-none icon-btn"
          onClick={() => setShowMobileMenu(true)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <nav className="hidden md:flex space-x-6 items-center">
          {navLinks.map((route, index) => (
            <Link
              key={route.text}
              to={route.path}
              className={`text-lg font-medium ${
                theme.palette.mode === 'dark' 
                  ? 'text-gray-300 hover:text-green-400' 
                  : 'text-gray-700 hover:text-green-600'
              } relative overflow-hidden group transition-colors duration-200 hover-underline ${
                location.pathname === route.path
                  ? theme.palette.mode === 'dark' ? "text-green-400" : "text-green-600"
                  : ""
              }`}
            >
              {route.text}
              {location.pathname === route.path && (
                <span className={`absolute bottom-0 left-0 w-full h-0.5 ${
                  theme.palette.mode === 'dark' ? 'bg-green-400' : 'bg-green-500'
                } animate-scaleIn`} />
              )}
            </Link>
          ))}

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-2 ${
                  theme.palette.mode === 'dark' 
                    ? 'bg-green-700 hover:bg-green-600' 
                    : 'bg-green-500 hover:bg-green-600'
                } text-white px-4 py-2 rounded-md transition-all duration-300 hover:shadow-md btn-hover-effect`}
              >
                <ProfileAvatar />
                <span>{currentUser?.displayName || currentUser?.name || 'Profile'}</span>
              </button>
              {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 ${
                  theme.palette.mode === 'dark' 
                    ? 'bg-gray-800' 
                    : 'bg-white'
                } rounded-md shadow-lg w-48 py-1 animate-fadeInDown overflow-hidden z-50`}
                style={{ backgroundColor: theme.palette.background.paper }}
                >
                  <Link
                    to="/dashboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`block px-4 py-2 ${
                      theme.palette.mode === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-green-400' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    } transition-all duration-200 border-l-2 border-transparent hover:border-l-2 hover:border-green-500 group`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Dashboard</span>
                      <FaChevronRight className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-1" size={12} />
                    </div>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className={`block px-4 py-2 ${
                      theme.palette.mode === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-green-400' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    } transition-all duration-200 border-l-2 border-transparent hover:border-l-2 hover:border-green-500 group`}
                  >
                    <div className="flex items-center justify-between">
                      <span>My Profile</span>
                      <FaChevronRight className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-1" size={12} />
                    </div>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className={`block px-4 py-2 font-semibold ${
                        theme.palette.mode === 'dark' 
                          ? 'text-purple-300 hover:bg-purple-900/30 hover:text-purple-200' 
                          : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'
                      } transition-all duration-200 border-l-2 border-transparent hover:border-l-2 hover:border-purple-500 group`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Admin Panel</span>
                        <FaChevronRight className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-1" size={12} />
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className={`block w-full text-left px-4 py-2 ${
                      theme.palette.mode === 'dark' 
                        ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300' 
                        : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                    } transition-all duration-200 border-l-2 border-transparent hover:border-l-2 hover:border-red-500 group`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Logout</span>
                      <FaChevronRight className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-1" size={12} />
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="btn btn-primary hover-grow relative overflow-hidden btn-hover-effect"
            >
              Login
            </button>
          )}
        </nav>

        {/* Mobile menu with improved animation */}
        {showMobileMenu && (
          <div className={`md:hidden fixed inset-0 z-50 ${
            theme.palette.mode === 'dark' ? 'bg-gray-900' : 'bg-white'
          } animate-fadeIn`}
          style={{ backgroundColor: theme.palette.background.paper }}
          >
            <div className="flex justify-end p-4">
              <button
                onClick={() => setShowMobileMenu(false)}
                className={`${
                  theme.palette.mode === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'
                } icon-btn`}
              >
                <svg
                  className="h-6 w-6 hover:rotate-90 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center mt-10 space-y-6">
              {navLinks.map((route, index) => (
                <Link
                  key={route.text}
                  to={route.path}
                  className={`text-lg font-medium ${
                    theme.palette.mode === 'dark' 
                      ? 'text-gray-300 hover:text-green-400' 
                      : 'text-gray-700 hover:text-green-600'
                  } transition-all duration-300 hover-underline animate-fadeInUp ${
                    location.pathname === route.path 
                      ? theme.palette.mode === 'dark' ? "text-green-400" : "text-green-600"
                      : ""
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {route.text}
                </Link>
              ))}
              <div className="pt-6 w-full px-8 animate-fadeInUp" style={{ animationDelay: `${navLinks.length * 50}ms` }}>
                {isAuthenticated ? (
                  <>
                    <div className="flex justify-center mb-4">
                      <ProfileAvatar size="large" />
                    </div>
                    <button
                      onClick={() => {
                        navigate('/dashboard');
                        setShowMobileMenu(false);
                      }}
                      className="w-full mb-3 btn btn-primary hover-grow"
                    >
                      Dashboard
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          navigate('/admin/dashboard');
                          setShowMobileMenu(false);
                        }}
                        className="w-full mb-3 btn btn-secondary hover-grow"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="w-full btn btn-danger-outline hover-grow"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        navigate('/login');
                        setShowMobileMenu(false);
                      }}
                      className="w-full mb-3 btn btn-primary hover-grow"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        navigate('/signup');
                        setShowMobileMenu(false);
                      }}
                      className="w-full btn btn-outline hover-grow"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
