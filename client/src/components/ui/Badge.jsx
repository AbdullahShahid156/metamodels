import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/[0.04] text-[#94A3B8] border border-white/[0.06]',
    primary: 'bg-[#E2B340]/10 text-[#F0D060] border border-[#E2B340]/20',
    success: 'bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/20',
    warning: 'bg-[#f59e0b]/10 text-[#fbbf24] border border-[#f59e0b]/20',
    danger: 'bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20',
    secondary: 'bg-[#8B8CF8]/10 text-[#A78BFA] border border-[#8B8CF8]/20',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
