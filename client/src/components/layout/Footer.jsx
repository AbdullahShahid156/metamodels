import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Globe, ExternalLink, Code2 } from 'lucide-react';

export const Footer = () => {
  const footerLinks = {
    Product: [
      { label: 'Explore Agents', path: '/marketplace' },
      { label: 'List Your Agent', path: '/auth?mode=register' },
      { label: 'Seller Dashboard', path: '/seller/dashboard' },
    ],
    Resources: [
      { label: 'Marketplace', path: '/marketplace' },
      { label: 'My Purchases', path: '/purchases' },
      { label: 'My Profile', path: '/profile' },
    ],
    Company: [
      { label: 'Home', path: '/' },
      { label: 'Sign In', path: '/auth?mode=login' },
      { label: 'Get Started', path: '/auth?mode=register' },
    ],
  };

  return (
    <footer className="relative mt-24">
      {/* Gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#E2B340]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center space-x-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E2B340] to-[#F59E0B] flex items-center justify-center">
                <Cpu className="text-[#0C0F1A] h-4 w-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Meta<span className="gradient-text">Models</span>
              </span>
            </Link>
            <p className="text-[#94A3B8] text-sm leading-relaxed max-w-xs mb-6">
              The premier marketplace for AI agents and models. 
              Discover, deploy, and monetize AI with zero friction.
            </p>
            <div className="flex space-x-3">
              {[
                { icon: <ExternalLink size={16} />, href: '#', label: 'Twitter' },
                { icon: <Code2 size={16} />, href: '#', label: 'GitHub' },
                { icon: <Globe size={16} />, href: '#', label: 'Website' },
              ].map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#94A3B8] hover:text-[#E2B340] hover:bg-white/[0.08] hover:border-[#E2B340]/20 transition-all duration-200 cursor-pointer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm text-[#6B7280] hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#6B7280]">
            &copy; {new Date().getFullYear()} MetaModels. All rights reserved.
          </p>
          <div className="flex space-x-6">
            {['Privacy', 'Terms', 'Cookies'].map(item => (
              <a key={item} href="#" className="text-xs text-[#6B7280] hover:text-white transition-colors cursor-pointer">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
