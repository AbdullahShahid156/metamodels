import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const ref = useRef(null);

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background btn-ripple';
  
  const variants = {
    primary: `
      bg-gradient-to-r from-[#E2B340] via-[#C9982E] to-[#F59E0B]
      bg-[length:200%_auto]
      text-[#0C0F1A] font-semibold
      px-5 py-2.5
      hover:bg-[right_center]
      hover:shadow-[0_0_30px_rgba(226,179,64,0.4),0_0_60px_rgba(245,158,11,0.15)]
      active:scale-[0.98]
    `,
    secondary: `
      bg-white/[0.04] border border-white/10
      text-white font-medium
      px-5 py-2.5
      hover:bg-white/[0.08] hover:border-white/20
      hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-[#94A3B8]
      px-4 py-2
      hover:text-white hover:bg-white/[0.05]
    `,
    danger: `
      bg-[#F87171]/10 text-[#F87171]
      border border-[#F87171]/20
      px-5 py-2.5
      hover:bg-[#F87171]/20 hover:border-[#F87171]/40
    `
  };

  const handleRipple = (e) => {
    const button = ref.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const circle = document.createElement('span');
    circle.classList.add('ripple-circle');
    circle.style.left = `${e.clientX - rect.left - 10}px`;
    circle.style.top = `${e.clientY - rect.top - 10}px`;
    button.appendChild(circle);
    
    setTimeout(() => circle.remove(), 600);
  };

  return (
    <motion.button 
      ref={ref}
      whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      whileTap={{ scale: 0.96, transition: { type: 'spring', stiffness: 500, damping: 15 } }}
      onPointerDown={handleRipple}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
