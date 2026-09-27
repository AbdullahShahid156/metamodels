import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Search, SlidersHorizontal, Star, ArrowUpRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

/* ─── 3D Tilt Card for Marketplace ─── */
const MarketplaceCard = ({ item }) => {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (y - 0.5) * -6, y: (x - 0.5) * 6 });
    setGlowPos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlowPos({ x: 50, y: 50 });
  };

  return (
    <Link to={`/model/${item.slug}`} className="block h-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
        className="glass-card h-full flex flex-col relative overflow-hidden group cursor-pointer border-shimmer"
      >
        {/* Cursor-following glow */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at ${glowPos.x}% ${glowPos.y}%, rgba(226, 179, 64, 0.08), transparent 60%)`
          }}
        />

        <div className="relative z-10 flex flex-col h-full" style={{ transform: 'translateZ(20px)' }}>
          <div className="flex justify-between items-start mb-4">
            <Badge variant={item.type === 'model' ? 'primary' : 'success'}>
              {item.category}
            </Badge>
            <div className="flex items-center gap-1 text-[#fbbf24] text-xs font-semibold">
              <Star size={12} className="fill-[#fbbf24]" /> {item.rating}
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{item.name}</h3>
          <p className="text-sm text-[#94A3B8] line-clamp-2 flex-grow mb-5 leading-relaxed">
            {item.short_description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <Avatar src={item.profiles?.avatar_url} alt={item.profiles?.display_name} size="sm" />
              <span className="text-sm font-medium text-[#94A3B8]">{item.profiles?.display_name}</span>
            </div>
            <div className="text-sm font-bold text-white">
              ${item.rent_price}<span className="text-[#6B7280] font-normal">/day</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};



export const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize filters from URL search params if present
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'All',
    type: searchParams.get('type') || ''
  });

  const categories = ['All', 'LLM', 'Vision', 'Audio', 'Tools', 'Other'];

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category !== 'All') params.append('category', filters.category);
        if (filters.type) params.append('type', filters.type);

        const apiBase = API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiBase}/listings?${params.toString()}`);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        
        const mappedData = data.map(item => ({
          ...item,
          short_description: item.description,
          rating: item.rating || 0
        }));
        
        setListings(mappedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filters]);

  const filteredListings = listings.filter(item => {
    if (filters.category !== 'All' && item.category !== filters.category) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">Explore Marketplace</h1>
        <p className="text-[#94A3B8] text-base">Discover and deploy AI agents and models for any task.</p>
      </motion.div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden lg:block w-56 flex-shrink-0"
        >
          <div className="sticky top-24 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 tracking-wide">
                <SlidersHorizontal size={16} className="text-[#94A3B8]" /> Filters
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3 block">Type</label>
                {['All', 'model', 'agent'].map(t => (
                  <label key={t} className="flex items-center gap-3 cursor-pointer py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <input
                      type="radio"
                      name="type"
                      checked={filters.type === (t === 'All' ? '' : t)}
                      onChange={() => setFilters({ ...filters, type: t === 'All' ? '' : t })}
                      className="accent-[#E2B340]"
                    />
                    <span className="text-sm capitalize text-[#94A3B8]">{t === 'All' ? 'All Types' : t + 's'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search & Category Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5 mb-8"
          >
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within:text-[#E2B340] transition-colors" size={18} />
              <input
                placeholder="Search models and agents..."
                className="
                  block w-full pl-12 pr-4 py-3.5
                  bg-[#141828] border border-white/[0.08]
                  rounded-xl text-base text-white
                  placeholder-[#6B7280]
                  focus:outline-none focus:border-[#E2B340]/40
                  focus:shadow-[0_0_0_3px_rgba(226,179,64,0.1),0_0_20px_rgba(226,179,64,0.06)]
                  transition-all duration-400
                "
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <motion.button
                  key={cat}
                  onClick={() => setFilters({ ...filters, category: cat })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 text-sm font-medium cursor-pointer relative
                    ${filters.category === cat
                      ? 'bg-gradient-to-r from-[#E2B340] to-[#F59E0B] text-[#0C0F1A] shadow-[0_0_20px_rgba(226,179,64,0.2)]'
                      : 'bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white hover:border-white/[0.12] hover:bg-white/[0.06]'
                    }
                  `}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Result count */}
          {!loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-[#94A3B8] mb-4"
            >
              {filteredListings.length} {filteredListings.length === 1 ? 'result' : 'results'}
              {filters.search && <span> for "<span className="text-white">{filters.search}</span>"</span>}
              {filters.category !== 'All' && <span> in <span className="text-white">{filters.category}</span></span>}
            </motion.div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass-card-static h-[280px] overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 w-20 bg-white/[0.05] rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-8 w-3/4 bg-white/[0.05] rounded-lg" />
                      <div className="h-4 w-full bg-white/[0.05] rounded-lg" />
                      <div className="h-4 w-5/6 bg-white/[0.05] rounded-lg" />
                    </div>
                    <div className="pt-4 border-t border-white/[0.04] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-white/[0.05]" />
                        <div className="h-4 w-20 bg-white/[0.05] rounded-lg" />
                      </div>
                      <div className="h-6 w-16 bg-white/[0.05] rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredListings.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.06,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    layout
                  >
                    <MarketplaceCard item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center"
            >
              <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
              <p className="text-[#94A3B8]">Try adjusting your filters or search terms.</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
