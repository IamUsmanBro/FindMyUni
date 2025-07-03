import React from 'react';
import '../../styles/ui-enhancements.css';

/**
 * Modern styled card component
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Optional subtitle
 * @param {string} props.imageSrc - Optional image source
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.footer - Optional footer content
 * @param {string} props.className - Additional class names
 * @param {Object} props.cardProps - Additional props for the card
 */
const Card = ({
  title,
  subtitle,
  imageSrc,
  children,
  footer,
  className = '',
  ...cardProps
}) => {
  return (
    <div className={`custom-card ${className}`} {...cardProps}>
      {imageSrc && (
        <img 
          src={imageSrc} 
          alt={title || 'Card image'} 
          className="custom-card-img-top" 
        />
      )}
      
      {(title || subtitle) && (
        <div className="custom-card-header">
          {title && <h3 className="m-0 text-primary-custom">{title}</h3>}
          {subtitle && <div className="text-secondary-custom mt-1">{subtitle}</div>}
        </div>
      )}
      
      <div className="custom-card-body">
        {children}
      </div>
      
      {footer && (
        <div className="custom-card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 