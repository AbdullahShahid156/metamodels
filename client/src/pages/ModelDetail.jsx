import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Star, CheckCircle, Clock, ArrowRight, Zap, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const ModelDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedType, setSelectedType] = useState('rent');
  const [model, setModel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiBase}/listings/${slug}`);
        if (!res.ok) throw new Error('Listing not found');
        const data = await res.json();
        
        const enrichedModel = {
            ...data,
            rating: data.rating || 0,
            total_reviews: data.total_reviews || 0,
            capabilities: data.capabilities || [],
            showcase_images: data.showcase_images || [],
            profiles: {
                display_name: data.profiles?.display_name || 'Verified Creator',
                verified: true,
                avatar_url: data.profiles?.avatar_url || null
            }
        };
        setModel(enrichedModel);

        // Fetch reviews
        if (data.id) {
          const reviewsRes = await fetch(`${apiBase}/reviews/${data.id}`);
          if (reviewsRes.ok) {
            setReviews(await reviewsRes.json());
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Model details restricted or not found.");
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchModel();
  }, [slug, navigate]);

  const tabs = ['overview', 'capabilities', 'pricing', 'reviews'];

  const nextImage = () => {
    if (model?.showcase_images?.length > 0) {
      setActiveImage((prev) => (prev + 1) % model.showcase_images.length);
    }
  };

  const prevImage = () => {
    if (model?.showcase_images?.length > 0) {
      setActiveImage((prev) => (prev - 1 + model.showcase_images.length) % model.showcase_images.length);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
         <Loader2 className="animate-spin text-[#E2B340]" size={40} />
      </div>
    );
  }

  if (!model) return null;

  const hasImages = model.showcase_images && model.showcase_images.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row gap-10 mb-8">
        <div className="flex-1 space-y-5">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <Badge variant={model.type === 'model' ? 'primary' : 'success'}>{model.category}</Badge>
            <div className="flex items-center gap-1.5 text-[#fbbf24] font-semibold text-sm">
              <Star size={14} className="fill-[#fbbf24]" /> {model.rating}
              <span className="text-[#6B7280] font-normal">({model.total_reviews} reviews)</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white"
          >{model.name}</motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex items-center gap-3 pt-1"
          >
            <Avatar src={model.profiles.avatar_url} alt={model.profiles.display_name} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{model.profiles.display_name}</span>
                {model.profiles.verified && <CheckCircle size={14} className="text-[#E2B340]" />}
              </div>
              <div className="text-sm text-[#6B7280]">Verified Creator</div>
            </div>
          </motion.div>

          {/* ── Showcase Image Gallery ── */}
          {hasImages && (
            <div className="pt-6 max-w-2xl">
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#0C0F1A]">
                {/* Main Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      src={model.showcase_images[activeImage]}
                      alt={`${model.name} showcase ${activeImage + 1}`}
                      className="max-w-full max-h-full object-contain"
                      initial={{ opacity: 0, scale: 1.01 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.99 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </AnimatePresence>
                  
                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C0F1A]/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Navigation arrows */}
                  {model.showcase_images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/70 transition-all cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/70 transition-all cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                  
                  {/* Image counter */}
                  {model.showcase_images.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 text-[10px] font-medium">
                      {activeImage + 1} / {model.showcase_images.length}
                    </div>
                  )}
                </div>
                
                {/* Thumbnail strip */}
                {model.showcase_images.length > 1 && (
                  <div className="flex gap-2 p-3 bg-[#141828]/80 backdrop-blur-md border-t border-white/[0.06] overflow-x-auto scrollbar-hide">
                    {model.showcase_images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                          i === activeImage 
                            ? 'border-[#E2B340] shadow-[0_0_15px_rgba(226,179,64,0.4)] opacity-100 scale-105' 
                            : 'border-transparent opacity-40 hover:opacity-100 hover:border-white/20'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Purchase Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hidden lg:block w-80 flex-shrink-0"
        >
          <div className="glass-card-static sticky top-24 border-[#E2B340]/10">
            <h3 className="text-lg font-bold text-white mb-5">Start Using Today</h3>
            <div className="space-y-3 mb-6">
              <motion.div 
                onClick={() => setSelectedType('rent')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`cursor-pointer flex justify-between items-center p-3.5 rounded-xl border transition-all duration-300 ${
                  selectedType === 'rent' 
                    ? 'bg-[#E2B340]/10 border-[#E2B340]/40 shadow-[0_0_15px_rgba(226,179,64,0.15)]' 
                    : 'bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <div className={`${selectedType === 'rent' ? 'text-[#F0D060]' : 'text-[#94A3B8]'} text-sm flex items-center gap-2 font-medium transition-colors`}>
                  <Clock size={14}/> 1 Day Rent
                </div>
                <div className={`font-bold transition-colors ${selectedType === 'rent' ? 'text-white' : 'text-[#94A3B8]'}`}>
                  ${model.rent_price}
                </div>
              </motion.div>

              <motion.div 
                onClick={() => setSelectedType('buy')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`cursor-pointer flex justify-between items-center p-3.5 rounded-xl border transition-all duration-300 ${
                  selectedType === 'buy' 
                    ? 'bg-[#8B8CF8]/10 border-[#8B8CF8]/40 shadow-[0_0_15px_rgba(139,140,248,0.15)]' 
                    : 'bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <div className={`${selectedType === 'buy' ? 'text-[#A78BFA]' : 'text-[#94A3B8]'} text-sm flex items-center gap-2 font-medium transition-colors`}>
                  <Zap size={14}/> Buy Outright
                </div>
                <div className={`font-bold transition-colors ${selectedType === 'buy' ? 'text-white' : 'text-[#94A3B8]'}`}>
                  ${model.buy_price}
                </div>
              </motion.div>
            </div>
            <Link to={`/checkout/${slug}?type=${selectedType}`}>
              <Button className="w-full text-base py-3 group">
                Get API Key
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>



      {/* Tabs */}
      <div className="border-b border-white/[0.06] mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                pb-3.5 px-4 text-sm font-medium capitalize tracking-wide transition-all relative whitespace-nowrap cursor-pointer
                ${activeTab === tab ? 'text-white' : 'text-[#6B7280] hover:text-[#94A3B8]'}
              `}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="detailTab" 
                  className="absolute bottom-0 left-1 right-1 h-[2px] bg-gradient-to-r from-[#E2B340] to-[#F59E0B] rounded-full" 
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="lg:w-2/3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Description</h3>
                  <p className="text-[#94A3B8] leading-relaxed">{model.description}</p>
                </div>
              </div>
            )}

            {activeTab === 'capabilities' && (
              <div>
                <h3 className="text-lg font-bold text-white mb-6">Capabilities</h3>
                {model.capabilities && model.capabilities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {model.capabilities.map((cap, i) => (
                      <motion.div
                        key={cap}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] group hover:border-[#E2B340]/20 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#E2B340]/10 flex items-center justify-center text-[#E2B340] flex-shrink-0 group-hover:bg-[#E2B340]/15 transition-colors">
                          <Sparkles size={14} />
                        </div>
                        <span className="text-sm font-medium text-[#e4e4e7]">{cap}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white/[0.01] rounded-xl border border-white/[0.05] border-dashed">
                    <p className="text-[#6B7280] text-sm">No capabilities listed yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="glass-card-static flex flex-col h-full border-white/[0.06]">
                  <h3 className="text-xl font-bold text-white mb-2">Rent Access</h3>
                  <p className="text-[#94A3B8] text-sm mb-6">Perfect for testing, prototyping, or temporary needs.</p>
                  <div className="text-3xl font-extrabold text-white mb-6">
                    ${model.rent_price} <span className="text-base text-[#6B7280] font-medium">/ day</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-[#94A3B8] flex-grow">
                    <li className="flex items-center gap-2.5"><CheckCircle size={15} className="text-[#E2B340] flex-shrink-0"/> Dedicated inference endpoint</li>
                    <li className="flex items-center gap-2.5"><CheckCircle size={15} className="text-[#E2B340] flex-shrink-0"/> 1M tokens / day limit</li>
                    <li className="flex items-center gap-2.5"><CheckCircle size={15} className="text-[#E2B340] flex-shrink-0"/> Auto-scales on demand</li>
                  </ul>
                  <Link to={`/checkout/${slug}?type=rent`} className="w-full">
                    <Button variant="secondary" className="w-full">Rent Now</Button>
                  </Link>
                </div>

                <div className="glass-card-static flex flex-col h-full gradient-border">
                  <h3 className="text-xl font-bold text-white mb-2">Buy Outright</h3>
                  <p className="text-[#94A3B8] text-sm mb-6">Own the weights and run on your own infrastructure.</p>
                  <div className="text-3xl font-extrabold text-white mb-6">
                    ${model.buy_price} <span className="text-base text-[#6B7280] font-medium">one-time</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-[#94A3B8] flex-grow">
                    <li className="flex items-center gap-2.5"><CheckCircle size={15} className="text-[#E2B340] flex-shrink-0"/> Full model weights (Safetensors)</li>
                    <li className="flex items-center gap-2.5"><CheckCircle size={15} className="text-[#E2B340] flex-shrink-0"/> Commercial use allowed</li>
                    <li className="flex items-center gap-2.5"><CheckCircle size={15} className="text-[#E2B340] flex-shrink-0"/> Unlimited inferences</li>
                  </ul>
                  <Link to={`/checkout/${slug}?type=buy`} className="w-full">
                    <Button className="w-full">Buy Now</Button>
                  </Link>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center gap-5 py-6 border-b border-white/[0.06]">
                  <div className="text-5xl font-extrabold text-white">{model.rating}</div>
                  <div>
                    <div className="flex text-[#fbbf24] mb-1.5">
                      {[...Array(5)].map((_,i) => <Star key={i} size={16} fill={i < Math.floor(model.rating) ? 'currentColor' : 'none'}/>)}
                    </div>
                    <div className="text-sm text-[#6B7280]">Based on {model.total_reviews} reviews</div>
                  </div>
                </div>
                <div className="py-4 space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <div key={review.id} className="border-b border-white/[0.06] pb-4 mb-4 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={review.profiles?.avatar_url} alt={review.profiles?.display_name} size="sm" />
                            <div>
                              <span className="font-semibold text-white text-sm">{review.profiles?.display_name || 'User'}</span>
                              <div className="flex text-[#fbbf24] mt-0.5">
                                {[...Array(5)].map((_,i) => <Star key={i} size={10} fill={i < review.rating ? 'currentColor' : 'none'}/>)}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-[#6B7280]">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        {review.body && <p className="text-sm text-[#94A3B8] leading-relaxed">{review.body}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#6B7280] text-sm">No reviews yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-20">
         <Link to={`/checkout/${slug}?type=${selectedType}`}>
          <Button className="w-full text-base py-4 shadow-[0_-10px_40px_rgba(226,179,64,0.3)]">
            Get API Key · From ${model.rent_price}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};
