import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[80vh] flex items-center justify-center px-4"
    >
      <div className="text-center max-w-lg">
        {/* Animated 404 number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative mb-8"
        >
          <span className="text-[160px] sm:text-[200px] font-black leading-none gradient-text select-none">
            404
          </span>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0C0F1A] pointer-events-none" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight"
        >
          Page not found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-[#64748b] mb-10 text-base leading-relaxed max-w-md mx-auto"
        >
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link to="/">
            <Button className="text-sm px-6 py-3 gap-2 w-full sm:w-auto">
              <Home size={16} /> Back to Home
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="secondary" className="text-sm px-6 py-3 gap-2 w-full sm:w-auto">
              <Search size={16} /> Explore Marketplace
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};
