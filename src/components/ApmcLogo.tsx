import React from 'react';

interface ApmcLogoProps {
  className?: string;
  size?: number;
}

export const ApmcLogo: React.FC<ApmcLogoProps> = ({
  className = 'w-10 h-10',
  size,
}) => {
  return (
    <img
      src="/apmc-logo.png"
      alt="Navi Mumbai APMC Vashi Emblem"
      className={`object-contain ${className}`}
      style={size ? { width: size, height: size } : undefined}
      onError={(e) => {
        // Fallback to original image if transparent variant has any display quirk
        (e.target as HTMLImageElement).src = '/apmc-logo-original.png';
      }}
    />
  );
};

export default ApmcLogo;
