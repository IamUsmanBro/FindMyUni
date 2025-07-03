import React from 'react';
import { 
  Search as SearchIcon,
  Compare as CompareIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Language as LanguageIcon,
  School as SchoolIcon,
  DeviceHub as DeviceHubIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const FeatureCard = ({ icon, title, description, color, isDarkMode }) => {
  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
      <div className={`h-2 ${color}`}></div>
      <div className="p-6">
        <div className={`${color.replace('bg-', 'text-')} mb-4`}>
          {icon}
        </div>
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>{title}</h3>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
      </div>
    </div>
  );
};

const Features = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const features = [
    {
      icon: <SearchIcon fontSize="large" />,
      title: "Advanced University Search",
      description: "Find the perfect university with our powerful search tools that filter by location, programs, and admission requirements.",
      color: "bg-blue-500"
    },
    {
      icon: <CompareIcon fontSize="large" />,
      title: "Side-by-Side Comparison",
      description: "Compare multiple universities at once to evaluate programs, deadlines, and other essential information side by side.",
      color: "bg-green-500"
    },
    {
      icon: <NotificationsIcon fontSize="large" />,
      title: "Deadline Alerts",
      description: "Never miss an important application deadline with our automated notification system that keeps you on track.",
      color: "bg-yellow-500"
    },
    {
      icon: <SchoolIcon fontSize="large" />,
      title: "Comprehensive Program Database",
      description: "Access detailed information about thousands of academic programs across all major universities in Pakistan.",
      color: "bg-red-500"
    },
    {
      icon: <DashboardIcon fontSize="large" />,
      title: "Personal Dashboard",
      description: "Track your favorite universities, applications, and deadlines in one centralized, easy-to-use dashboard.",
      color: "bg-purple-500"
    },
    {
      icon: <LanguageIcon fontSize="large" />,
      title: "University Profiles",
      description: "Explore in-depth profiles of universities including locations, available programs, and application requirements.",
      color: "bg-indigo-500"
    },
    {
      icon: <DeviceHubIcon fontSize="large" />,
      title: "Multi-device Experience",
      description: "Access ScrapeMyUni seamlessly across desktop, tablet, and mobile devices with our responsive design.",
      color: "bg-pink-500"
    },
    {
      icon: <SpeedIcon fontSize="large" />,
      title: "Real-time Data Updates",
      description: "Stay informed with the latest information about universities, thanks to our real-time data collection system.",
      color: "bg-teal-500"
    }
  ];

  return (
    <div className={isDarkMode ? 'bg-gray-900' : ''}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 py-24 px-4">
        <div className="max-w-screen-lg mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            Powerful <span className="text-yellow-400">Features</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Discover the tools that make ScrapeMyUni the ultimate platform for finding and comparing universities in Pakistan.
          </p>
        </div>
      </div>

      {/* Main Features Section */}
      <div className={`py-20 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.slice(0, 6).map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Highlighted Feature */}
      <div className={`py-20 px-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-screen-lg mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-6`}>University Comparison Tool</h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
                Our most popular feature allows you to compare universities side by side, helping you make informed decisions about where to apply.
              </p>
              <ul className="space-y-3">
                {[
                  "Compare up to 4 universities at once",
                  "View program offerings side by side",
                  "Check application deadlines across institutions",
                  "Compare locations and other key information",
                  "Make decisions with confidence based on accurate data"
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <a 
                  href="/compare" 
                  className="inline-block bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
                >
                  Try Comparison Tool
                </a>
              </div>
            </div>
            <div className={`rounded-lg overflow-hidden shadow-xl ${isDarkMode ? 'shadow-blue-900/20' : ''}`}>
              <img 
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80" 
                alt="University comparison"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className={`py-20 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-screen-xl mx-auto">
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} text-center mb-16`}>Additional Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.slice(6).map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-center">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Find Your Perfect University?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Start using ScrapeMyUni today and discover how our features can simplify your university search.
          </p>
          <div className="space-x-4">
            <a 
              href="/universities" 
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 px-8 rounded-full transition-colors duration-300"
            >
              Explore Universities
            </a>
            <a 
              href="/signup" 
              className="inline-block bg-transparent hover:bg-blue-800 text-white border border-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
            >
              Sign Up Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
