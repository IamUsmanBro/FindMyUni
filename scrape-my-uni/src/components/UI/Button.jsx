import React from 'react';
import '../../styles/ui-enhancements.css';

/**
 * Modern styled button component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant (primary, secondary, outline)
 * @param {boolean} props.fullWidth - Whether the button should take full width
 * @param {string} props.className - Additional class names
 * @param {function} props.onClick - Click handler
 */
const Button = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  onClick,
  ...buttonProps
}) => {
  // Determine the button class based on variant
  const getButtonClass = () => {
    switch (variant) {
      case 'secondary':
        return 'custom-btn-secondary';
      case 'outline':
        return 'custom-btn-outline';
      case 'primary':
      default:
        return 'custom-btn-primary';
    }
  };

  return (
    <button
      className={`custom-btn ${getButtonClass()} ${fullWidth ? 'w-100' : ''} ${className}`}
      onClick={onClick}
      {...buttonProps}
    >
      {children}
    </button>
  );
};

export default Button; 