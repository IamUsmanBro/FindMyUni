import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const getToastTypeStyles = () => {
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

  return (
    <div 
      className={`px-4 py-3 rounded-md shadow-md border-l-4 flex items-center justify-between transform transition-all duration-300 animate-slide-in ${getToastTypeStyles()}`}
    >
      <p>{message}</p>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="ml-3 text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Toast; 