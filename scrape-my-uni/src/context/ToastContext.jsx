import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now().toString();
    
    // Add new toast to the array
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    
    // Remove the toast after duration
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, duration);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const getToastTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-500';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-500';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-500';
    }
  };

  const value = {
    showToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`px-4 py-3 rounded-md shadow-md border-l-4 flex items-center justify-between transform transition-all duration-300 animate-slide-in ${getToastTypeStyles(toast.type)}`}
          >
            <p>{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider; 