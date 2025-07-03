import React from 'react';
import { 
  School as SchoolIcon, 
  AccessTime as TimeIcon, 
  Search as SearchIcon, 
  CompareArrows as CompareIcon,
  People as TeamIcon,
  Lightbulb as VisionIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const About = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : ''}`}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-24 px-4">
      <div className="max-w-screen-lg mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            About <span className="text-yellow-400">ScrapeMyUni</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Empowering students with the tools they need to make informed decisions about their educational future.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className={`py-20 px-4 ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'}`}>
        <div className="max-w-screen-lg mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-6`}>Our Mission</h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-6 leading-relaxed`}>
                At ScrapeMyUni, we are passionate about bridging the gap between students and universities. Our mission is to provide comprehensive, accurate, and up-to-date information about universities across Pakistan, making higher education more accessible and understandable for everyone.
              </p>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                We believe every student deserves access to quality information to make one of life's most important decisions - choosing the right university. Through innovative technology and user-centered design, we're simplifying this journey.
              </p>
            </div>
            <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'shadow-xl shadow-blue-900/20' : 'shadow-xl'}`}>
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
                alt="University students collaborating"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* What We Offer Section */}
      <div className={`py-20 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-screen-lg mx-auto text-center mb-16">
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-4`}>What We Offer</h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-3xl mx-auto`}>
            ScrapeMyUni provides a comprehensive suite of tools designed to simplify the university selection process.
          </p>
        </div>

        <div className="max-w-screen-lg mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300`}>
            <div className="bg-blue-100 text-blue-800 p-3 rounded-full inline-block mb-4">
              <SearchIcon fontSize="large" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>University Search</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Find universities based on location, programs, and other key criteria with our powerful search functionality.
            </p>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300`}>
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-full inline-block mb-4">
              <CompareIcon fontSize="large" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>University Comparison</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Compare multiple universities side by side to evaluate programs, deadlines, and other essential information.
            </p>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300`}>
            <div className="bg-green-100 text-green-800 p-3 rounded-full inline-block mb-4">
              <TimeIcon fontSize="large" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>Deadline Tracking</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Never miss an application deadline with our tracking system that keeps you informed of important dates.
            </p>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className={`py-20 px-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-screen-lg mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-4`}>Our Values</h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-3xl mx-auto`}>
              The core principles that guide everything we do at ScrapeMyUni.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={`border ${isDarkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'} rounded-lg p-6 transition-colors duration-300`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>Accuracy</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We are committed to providing the most accurate and up-to-date information about universities and their programs.
              </p>
            </div>
            
            <div className={`border ${isDarkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'} rounded-lg p-6 transition-colors duration-300`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>Accessibility</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We believe educational information should be accessible to everyone, regardless of their background or location.
              </p>
            </div>
            
            <div className={`border ${isDarkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'} rounded-lg p-6 transition-colors duration-300`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>Innovation</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                We continuously strive to improve our platform with innovative features that enhance the user experience.
              </p>
            </div>
            
            <div className={`border ${isDarkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'} rounded-lg p-6 transition-colors duration-300`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>Student-Centered</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Everything we do is focused on helping students make better educational decisions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vision & Team Section */}
      <div className="py-20 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-screen-lg mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center mb-6">
                <VisionIcon className="text-yellow-400 mr-3" fontSize="large" />
                <h2 className="text-3xl font-bold">Our Vision</h2>
              </div>
              <p className="text-lg text-blue-100 leading-relaxed">
                We envision a future where every student in Pakistan has access to comprehensive information about higher education opportunities, empowering them to make informed decisions about their academic and professional futures.
              </p>
            </div>
            
            <div>
              <div className="flex items-center mb-6">
                <TeamIcon className="text-yellow-400 mr-3" fontSize="large" />
                <h2 className="text-3xl font-bold">Our Team</h2>
              </div>
              <p className="text-lg text-blue-100 leading-relaxed">
                ScrapeMyUni is powered by a passionate team of educators, technologists, and data specialists who are committed to transforming how students discover and connect with universities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className={`py-16 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} text-center`}>
        <div className="max-w-screen-lg mx-auto">
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-6`}>Join Us on This Journey</h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-2xl mx-auto mb-8`}>
            Whether you're a student, parent, or educator, ScrapeMyUni is here to make the journey of finding the right university effortless.
          </p>
          <a 
            href="/universities" 
            className="inline-block bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
          >
            Explore Universities
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
