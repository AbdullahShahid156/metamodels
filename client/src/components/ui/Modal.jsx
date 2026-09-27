import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0C0F1A]/80 backdrop-blur-md z-[100]"
          />
          <div className="fixed inset-0 top-16 flex items-start justify-center p-4 pt-20 z-[110] pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(4px)' }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`
                glass-panel w-full max-w-md rounded-2xl p-6 pointer-events-auto
                border border-white/[0.08]
                ${className}
              `}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-[#6B7280] hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.05]"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
              <div>{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
