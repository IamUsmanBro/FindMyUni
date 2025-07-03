import React, { useState } from 'react';
import { 
  Email as EmailIcon, 
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Send as SendIcon,
  QuestionAnswer as FAQIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally send the form data to a server
    console.log('Form submitted:', formData);
    setSubmitted(true);
    
    // Reset form after submission
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "You can create an account by clicking the 'Sign Up' button in the top navigation menu. Fill in your details and verify your email to get started."
    },
    {
      question: "Can I compare multiple universities?",
      answer: "Yes! Our comparison tool allows you to compare up to 4 universities side by side to help you make informed decisions."
    },
    {
      question: "How often is university information updated?",
      answer: "We update our university information regularly to ensure you have access to the most current data about programs, deadlines, and requirements."
    },
    {
      question: "Is ScrapeMyUni free to use?",
      answer: "Yes, ScrapeMyUni is completely free for students. We're committed to making higher education information accessible to everyone."
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : ''}`}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-24 px-4">
        <div className="max-w-screen-lg mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Get In <span className="text-yellow-400">Touch</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </div>
      </div>

      {/* Contact Form & Info Section */}
      <div className={`py-20 px-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-screen-lg mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8 order-2 lg:order-1`}>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-6`}>Send Us a Message</h2>
              
              {submitted ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  Thank you for your message! We'll get back to you soon.
                </div>
              ) : null}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="subject" className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter subject"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className={`w-full px-4 py-2 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter your message"
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center"
                >
                  <SendIcon className="mr-2" />
                  Send Message
                </button>
              </form>
            </div>
            
            {/* Contact Info */}
            <div className="order-1 lg:order-2">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-6`}>Contact Information</h2>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-800 mr-4">
                    <EmailIcon />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Email</h3>
                    <a href="mailto:support@scrapemyuni.com" className="text-blue-600 hover:text-blue-800 transition-colors duration-300">
                      support@scrapemyuni.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full text-green-800 mr-4">
                    <PhoneIcon />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Phone</h3>
                    <a href="tel:+923001234567" className="text-blue-600 hover:text-blue-800 transition-colors duration-300">
                      +92 300 123 4567
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-3 rounded-full text-yellow-800 mr-4">
                    <LocationIcon />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Address</h3>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      123 Education Street<br />
                      Islamabad, Pakistan
                    </p>
                  </div>
                </div>
              </div>
              
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-4`}>Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 transition-colors duration-300">
                  <FacebookIcon />
                </a>
                <a href="#" className="bg-blue-400 p-2 rounded-full text-white hover:bg-blue-500 transition-colors duration-300">
                  <TwitterIcon />
                </a>
                <a href="#" className="bg-pink-600 p-2 rounded-full text-white hover:bg-pink-700 transition-colors duration-300">
                  <InstagramIcon />
                </a>
                <a href="#" className="bg-blue-800 p-2 rounded-full text-white hover:bg-blue-900 transition-colors duration-300">
                  <LinkedInIcon />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className={`py-20 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-screen-lg mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <FAQIcon className={`${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`} fontSize="large" />
            </div>
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-4`}>Frequently Asked Questions</h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-3xl mx-auto`}>
              Find quick answers to common questions about ScrapeMyUni.
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300`}>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-3`}>{faq.question}</h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{faq.answer}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
              Can't find the answer you're looking for?
            </p>
            <a 
              href="mailto:support@scrapemyuni.com" 
              className="inline-block bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300"
            >
              Email Our Support Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
