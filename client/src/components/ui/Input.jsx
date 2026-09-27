import React from 'react';

export const Input = React.forwardRef(({ className = '', label, error, ...props }, ref) => {
  return (
    <div className="w-full flex flex-col space-y-2">
      {label && (
        <label className="text-sm font-medium text-[#94A3B8] tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`
          bg-[#141828] border border-white/[0.06] rounded-xl
          px-4 py-3 text-white text-[15px]
          placeholder-[#6B7280]
          focus:outline-none focus:border-[#E2B340]/50
          focus:shadow-[0_0_0_3px_rgba(226,179,64,0.15)]
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-[#F87171] mt-1">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
