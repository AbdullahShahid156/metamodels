import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hover = false, glow = false, ...props }) => {
  return (
    <motion.div 
      className={`
        glass-card
        ${hover ? 'cursor-pointer' : 'glass-card-static'}
        ${glow ? 'animate-pulse-glow' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </motion.div>
  );
};
