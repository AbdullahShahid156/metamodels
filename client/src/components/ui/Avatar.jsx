import React from 'react';

export const Avatar = ({ src, alt = "Avatar", size = "md", className = "" }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  return (
    <div className={`relative rounded-full overflow-hidden border border-white/[0.08] bg-[#1C2035] flex-shrink-0 ${sizes[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-semibold text-[#94A3B8] bg-gradient-to-br from-[#1C2035] to-[#141828]">
          {alt?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
};
