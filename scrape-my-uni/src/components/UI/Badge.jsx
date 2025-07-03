import React from 'react';
import '../../styles/ui-enhancements.css';

/**
 * Modern styled badge component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.variant - Badge variant (primary, secondary, success, warning)
 * @param {string} props.className - Additional class names
 */
const Badge = ({
  children,
  variant = 'primary',
  className = '',
  ...badgeProps
}) => {
  // Determine the badge class based on variant
  const getBadgeClass = () => {
    switch (variant) {
      case 'secondary':
        return 'custom-badge-secondary';
      case 'success':
        return 'custom-badge-success';
      case 'warning':
        return 'custom-badge-warning';
      case 'primary':
      default:
        return 'custom-badge-primary';
    }
  };

  return (
    <span
      className={`custom-badge ${getBadgeClass()} ${className}`}
      {...badgeProps}
    >
      {children}
    </span>
  );
};

export default Badge; 