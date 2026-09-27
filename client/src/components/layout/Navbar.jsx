import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Cpu, LogOut, LayoutDashboard, ShoppingBag, Menu, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/marketplace' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-700 ease-out
          ${scrolled
            ? 'bg-[#0C0F1A]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_40px_rgba(0,0,0,0.3)]'
            : 'bg-transparent border-b border-transparent'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="relative">
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      '0 0 0px rgba(226, 179, 64, 0)',
                      '0 0 12px rgba(226, 179, 64, 0.3)',
                      '0 0 0px rgba(226, 179, 64, 0)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E2B340] to-[#F59E0B] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                >
                  <Cpu className="text-[#0C0F1A] h-4.5 w-4.5" />
                </motion.div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#E2B340] to-[#F59E0B] blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Meta<span className="gradient-text">Models</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive(link.path)
                      ? 'text-white'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                    }
                  `}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-[#E2B340] to-[#F59E0B] rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-4">
                  {profile?.is_admin && (
                    <Link
                      to="/admin"
                      className="text-[#E2B340] hover:text-[#F0D060] transition-colors flex items-center space-x-1.5 text-sm font-semibold tooltip-trigger"
                      title="Admin Panel"
                    >
                      <ShieldAlert size={16} />
                      <span>Admin</span>
                    </Link>
                  )}
                  {(!profile?.is_admin && (profile?.role === 'seller' || profile?.role === 'both')) && (
                    <Link
                      to="/seller/dashboard"
                      className="text-[#94A3B8] hover:text-white transition-colors flex items-center space-x-1.5 text-sm font-medium"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </Link>
                  )}
                  {(!profile?.is_admin && (profile?.role === 'buyer' || profile?.role === 'both')) && (
                    <Link
                      to="/purchases"
                      className="text-[#94A3B8] hover:text-white transition-colors flex items-center space-x-1.5 text-sm font-medium"
                    >
                      <ShoppingBag size={16} />
                      <span>Purchases</span>
                    </Link>
                  )}
                  <div className="w-px h-6 bg-white/[0.08]" />
                  <Link to="/profile">
                    <Avatar src={profile?.avatar_url} alt={profile?.display_name || user.email} size="sm" />
                  </Link>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-[#94A3B8] hover:text-[#F87171] transition-colors duration-200 cursor-pointer p-1"
                    aria-label="Sign out"
                  >
                    <LogOut size={18} />
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/auth?mode=login"
                    className="text-[#94A3B8] hover:text-white transition-colors font-medium text-sm px-3 py-2"
                  >
                    Sign in
                  </Link>
                  <Button onClick={() => navigate('/auth?mode=register')} className="text-sm px-4 py-2">
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <motion.button
              onClick={() => setMobileOpen(!mobileOpen)}
              whileTap={{ scale: 0.9 }}
              className="md:hidden text-[#94A3B8] hover:text-white transition-colors cursor-pointer p-2"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X size={22} />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu size={22} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-x-0 top-16 z-40 md:hidden"
          >
            <div className="bg-[#0C0F1A]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl">
              <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      to={link.path}
                      className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${
                        isActive(link.path)
                          ? 'text-white bg-white/[0.04]'
                          : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-4 border-t border-white/[0.06]">
                  {user ? (
                    <div className="space-y-3">
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.04]">
                        <Avatar src={profile?.avatar_url} alt={profile?.display_name || user.email} size="sm" />
                        <span className="text-white font-medium">{profile?.display_name || user.email}</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-xl text-[#F87171] hover:bg-[#F87171]/10 transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link to="/auth?mode=login" className="block px-4 py-3 rounded-xl text-[#94A3B8] hover:text-white transition-colors font-medium">
                        Sign in
                      </Link>
                      <Button onClick={() => navigate('/auth?mode=register')} className="w-full">
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
