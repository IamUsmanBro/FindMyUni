import React from 'react';
import { Link } from 'react-router-dom';
import { 
  School as SchoolIcon,
  Email as EmailIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  LocationOn as LocationIcon,
  Copyright as CopyrightIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { withScrollAnimation } from '../utils/scrollAnimationObserver';

const Footer = () => {
  const scrollAnimation = withScrollAnimation('bottom');
  const theme = useTheme();

  return (
    <footer className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white relative">
      {/* Top wave decoration - adjust color based on theme */}
      <div className="w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 90" className="w-full -mt-1">
          <path 
            fill={theme.palette.mode === 'dark' ? theme.palette.background.paper : '#ffffff'} 
            fillOpacity="1" 
            d="M0,64L48,64C96,64,192,64,288,53.3C384,43,480,21,576,21.3C672,21,768,43,864,58.7C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z">
          </path>
        </svg>
      </div>
      
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand section */}
          <div className={`space-y-4 ${scrollAnimation}`}>
            <div className="flex items-center space-x-2 hover-grow">
              <SchoolIcon className="text-yellow-400 text-3xl animate-bounce" style={{ animationDuration: '3s' }} />
              <h3 className="text-2xl font-bold tracking-wider text-white">ScrapeMyUni</h3>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">
              Helping students find and apply to their dream universities worldwide. We simplify the university search and application process.
            </p>
            <div className="pt-4">
              <div className="flex space-x-4">
                <a href="#" className="bg-white p-2 rounded-full text-blue-800 hover:bg-yellow-400 transition-all duration-300 hover-float" aria-label="Facebook">
                  <FacebookIcon fontSize="small" />
                </a>
                <a href="#" className="bg-white p-2 rounded-full text-blue-800 hover:bg-yellow-400 transition-all duration-300 hover-float" aria-label="Twitter">
                  <TwitterIcon fontSize="small" />
                </a>
                <a href="#" className="bg-white p-2 rounded-full text-blue-800 hover:bg-yellow-400 transition-all duration-300 hover-float" aria-label="LinkedIn">
                  <LinkedInIcon fontSize="small" />
                </a>
                <a href="#" className="bg-white p-2 rounded-full text-blue-800 hover:bg-yellow-400 transition-all duration-300 hover-float" aria-label="Instagram">
                  <InstagramIcon fontSize="small" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className={`${withScrollAnimation('bottom', 200)}`}>
            <h4 className="text-xl font-bold mb-6 text-yellow-400 hover-underline inline-block">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-blue-100 hover:text-yellow-400 flex items-center transition-all duration-300 group">
                  <ArrowIcon className="mr-2 text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative overflow-hidden">
                    <span className="relative z-10 text-blue-100 group-hover:text-yellow-400">Home</span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/universities" className="text-blue-100 hover:text-yellow-400 flex items-center transition-all duration-300 group">
                  <ArrowIcon className="mr-2 text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative overflow-hidden">
                    <span className="relative z-10 text-blue-100 group-hover:text-yellow-400">Universities</span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-blue-100 hover:text-yellow-400 flex items-center transition-all duration-300 group">
                  <ArrowIcon className="mr-2 text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative overflow-hidden">
                    <span className="relative z-10 text-blue-100 group-hover:text-yellow-400">Dashboard</span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-blue-100 hover:text-yellow-400 flex items-center transition-all duration-300 group">
                  <ArrowIcon className="mr-2 text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative overflow-hidden">
                    <span className="relative z-10 text-blue-100 group-hover:text-yellow-400">Compare</span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div className={`${withScrollAnimation('bottom', 400)}`}>
            <h4 className="text-xl font-bold mb-6 text-yellow-400 hover-underline inline-block">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-blue-100 hover:text-yellow-400 flex items-center transition-all duration-300 group">
                  <ArrowIcon className="mr-2 text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative overflow-hidden">
                    <span className="relative z-10 text-blue-100 group-hover:text-yellow-400">About Us</span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-blue-100 hover:text-yellow-400 flex items-center transition-all duration-300 group">
                  <ArrowIcon className="mr-2 text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative overflow-hidden">
                    <span className="relative z-10 text-blue-100 group-hover:text-yellow-400">Contact</span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-blue-100 hover:text-yellow-400 flex items-center transition-all duration-300 group">
                  <ArrowIcon className="mr-2 text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative overflow-hidden">
                    <span className="relative z-10 text-blue-100 group-hover:text-yellow-400">Features</span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
              <li>
                <Link to="#" className="text-blue-100 hover:text-yellow-400 flex items-center transition-all duration-300 group">
                  <ArrowIcon className="mr-2 text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  <span className="relative overflow-hidden">
                    <span className="relative z-10 text-blue-100 group-hover:text-yellow-400">FAQ</span>
                    <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-yellow-400 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className={`${withScrollAnimation('bottom', 600)}`}>
            <h4 className="text-xl font-bold mb-6 text-yellow-400 hover-underline inline-block">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group hover-float">
                <EmailIcon className="text-yellow-400 mt-1 transition-all duration-300 group-hover:scale-110" />
                <div>
                  <p className="font-medium text-white">Email</p>
                  <a href="mailto:support@scrapemyuni.com" className="text-blue-100 hover:text-yellow-400 transition-colors duration-300 hover-underline">support@scrapemyuni.com</a>
                </div>
              </div>
              <div className="flex items-start space-x-3 group hover-float">
                <LocationIcon className="text-yellow-400 mt-1 transition-all duration-300 group-hover:scale-110" />
                <div>
                  <p className="font-medium text-white">Address</p>
                  <p className="text-blue-100">Islamabad, Pakistan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section with line and copyright */}
        <div className="border-t border-blue-700/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-blue-100 text-sm flex items-center">
            <CopyrightIcon fontSize="small" className="mr-1 animate-pulse" style={{ animationDuration: '4s' }} />
            <span>{new Date().getFullYear()} ScrapeMyUni. All rights reserved.</span>
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-blue-100 text-sm hover:text-yellow-400 transition-colors duration-300 hover-underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-blue-100 text-sm hover:text-yellow-400 transition-colors duration-300 hover-underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-yellow-400/10"
            style={{
              width: `${Math.random() * 20 + 5}px`,
              height: `${Math.random() * 20 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.5 + 0.3
            }}
          />
        ))}
      </div>
    </footer>
  );
};

export default Footer; 