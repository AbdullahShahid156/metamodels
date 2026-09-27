import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Key, Copy, CheckCircle, ExternalLink, Activity, Loader2, Rocket, ArrowRight, Clock, ShieldAlert, Eye, EyeOff, Download, Star } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const MyPurchases = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('rentals');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [revealedKeys, setRevealedKeys] = useState({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingPurchase, setRatingPurchase] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingBody, setRatingBody] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    fetchPurchases();
    const interval = setInterval(fetchPurchases, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/purchases/mine`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch purchases');
      const data = await res.json();
      setPurchases(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load your purchases.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('API Key copied to clipboard');
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/users/upgrade-seller`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) throw new Error('Upgrade failed');
      
      toast.success("Successfully upgraded to Seller!");
      
      // Use window.location to force a hard refresh so the AuthContext fetches the new seller role
      if (selectedPurchase) {
        const params = new URLSearchParams();
        params.set('name', selectedPurchase.listings?.name || '');
        params.set('description', selectedPurchase.listings?.description || '');
        params.set('category', selectedPurchase.listings?.category || '');
        params.set('type', selectedPurchase.listings?.type || 'model');
        
        setTimeout(() => {
           window.location.href = `/seller/create?${params.toString()}`;
        }, 800);
      } else {
        // Refresh auth state by re-fetching profile
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpgrading(false);
      setShowUpgradeModal(false);
    }
  };

  const handleRentOutClick = (purchase) => {
    if (profile?.role === 'buyer') {
      setSelectedPurchase(purchase);
      setShowUpgradeModal(true);
    } else {
      const params = new URLSearchParams();
      params.set('name', purchase.listings?.name || '');
      params.set('description', purchase.listings?.description || '');
      params.set('category', purchase.listings?.category || '');
      params.set('type', purchase.listings?.type || 'model');
      navigate(`/seller/create?${params.toString()}`);
    }
  };

  const getExpiryText = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expiring soon';
  };

  const submitRating = async () => {
    if (!ratingPurchase || ratingValue < 1 || ratingValue > 5) return;
    setIsSubmittingRating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const res = await fetch(`${apiBase}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          purchase_id: ratingPurchase.id,
          listing_id: ratingPurchase.listing_id,
          rating: ratingValue,
          body: ratingBody
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setShowRatingModal(false);
      setRatingPurchase(null);
      setRatingValue(5);
      setRatingBody('');
      fetchPurchases(); // Refresh the list
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const rentals = purchases.filter(p => p.type === 'rent' && p.is_active && new Date(p.expires_at) > new Date());
  const owned = purchases.filter(p => p.type === 'buy');

  const renderKeyCard = (purchase) => (
    <motion.div
      key={purchase.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card-static relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#E2B340] to-[#8B8CF8]" />
        
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-5 pl-3">
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-white text-lg tracking-tight">{purchase.listings?.name || 'Unknown Model'}</h3>
              <Badge variant={purchase.listings?.category === 'LLM' ? 'primary' : 'success'}>
                {purchase.listings?.category || 'Model'}
              </Badge>
            </div>
            
            <div className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
              {purchase.type === 'rent' ? (
                <span className="flex items-center text-[#fbbf24] gap-1.5 font-medium">
                   <Clock size={13}/> {getExpiryText(purchase.expires_at)}
                </span>
              ) : (
                <span className="flex items-center text-[#34d399] gap-1.5 font-medium">
                   <CheckCircle size={13}/> Owned Asset
                </span>
              )}
              <span className="text-[#3f3f46]">·</span>
              <span className="text-[#94a3b8]">
                {purchase.type === 'rent' 
                   ? `Active Rental` 
                   : `Purchased on ${new Date(purchase.created_at).toLocaleDateString()}`
                }
              </span>
            </div>

             {purchase.type === 'buy' && (
              <div className="flex flex-wrap gap-3 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-[#E2B340]/30 text-[#F0D060] hover:bg-[#E2B340]/10"
                  onClick={() => handleRentOutClick(purchase)}
                >
                  <Rocket size={14}/> Rent Out this Asset
                </Button>
                
                <button 
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer
                    bg-gradient-to-r from-[#10b981]/15 to-[#8B8CF8]/15
                    border border-[#10b981]/30
                    text-[#34d399] hover:text-white
                    hover:from-[#10b981]/25 hover:to-[#8B8CF8]/25
                    hover:border-[#10b981]/50
                    hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]
                    active:scale-[0.97]"
                  onClick={() => {
                    const url = purchase.listings?.model_card_url;
                    if (!url) {
                      toast.error('No IPFS file attached to this model.');
                      return;
                    }
                    // Handle both raw CID and full URLs
                    const downloadUrl = url.startsWith('http') 
                      ? url 
                      : `https://gateway.pinata.cloud/ipfs/${url}`;
                    window.open(downloadUrl, '_blank');
                  }}
                >
                  <Download size={14}/> Download from IPFS
                </button>
              </div>
            )}
            
            {/* Show Rate button if no review exists AND it's a rental */}
            {purchase.type === 'rent' && (!purchase.reviews || purchase.reviews.length === 0) && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 gap-2 border-[#E2B340]/30 text-[#F0D060] hover:bg-[#E2B340]/10"
                onClick={() => {
                  setRatingPurchase(purchase);
                  setShowRatingModal(true);
                }}
              >
                <Star size={14} className="text-[#fbbf24]" /> Rate this Asset
              </Button>
            )}
            {purchase.reviews && purchase.reviews.length > 0 && (
              <div className="mt-3 text-xs text-[#94a3b8] flex items-center gap-1">
                <CheckCircle size={12} className="text-[#E2B340]" /> You rated this {purchase.reviews[0].rating}/5
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-full md:min-w-[300px]">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#64748b] pl-1">API Key</div>
            <div className="flex">
              <div className="bg-[#0C0F1A] border border-white/[0.06] rounded-l-xl px-4 py-2.5 font-mono text-sm text-[#F0D060]/80 flex-grow border-r-0 truncate select-all">
                {revealedKeys[purchase.id] 
                  ? (purchase.api_key || 'Key not available')
                  : (purchase.key_preview || purchase.api_key?.slice(0, 10) + '...' || '••••••••••...')
                }
              </div>
              <button 
                onClick={() => setRevealedKeys(prev => ({ ...prev, [purchase.id]: !prev[purchase.id] }))}
                className="bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-[#64748b] hover:text-white px-3 py-2.5 transition-colors flex items-center justify-center cursor-pointer border-r-0"
                title={revealedKeys[purchase.id] ? 'Hide key' : 'Reveal key'}
              >
                {revealedKeys[purchase.id] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button 
                onClick={() => handleCopy(purchase.api_key)}
                className="bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white px-4 py-2.5 rounded-r-xl transition-colors flex items-center justify-center cursor-pointer"
                title="Copy to clipboard"
              >
                <Copy size={14} />
              </button>
            </div>
            {purchase.listings?.architecture_notes && (
              <Button 
                variant="ghost" 
                className="self-end text-xs flex items-center gap-1 mt-0.5 text-[#64748b] hover:text-[#F0D060] hover:bg-[#E2B340]/10 transition-colors"
                onClick={() => {
                  const url = purchase.listings.architecture_notes;
                  const downloadUrl = url.startsWith('http') 
                    ? url 
                    : `https://gateway.pinata.cloud/ipfs/${url}`;
                  window.open(downloadUrl, '_blank');
                }}
              >
                 <ExternalLink size={11}/> View Docs
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
     return (
        <div className="h-[70vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#E2B340]" size={40} />
        </div>
     );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">My Purchases</h1>
          <p className="text-[#94a3b8]">Manage your active API keys and owned models.</p>
        </div>
      </div>

      <div className="border-b border-white/[0.06] mb-8 flex gap-1">
        {[
          { id: 'rentals', label: `Active Rentals (${rentals.length})` },
          { id: 'owned', label: `Owned Models (${owned.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3.5 px-4 text-sm font-medium transition-all relative cursor-pointer ${
              activeTab === tab.id ? 'text-white' : 'text-[#64748b] hover:text-[#94a3b8]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="purchaseTab"
                className="absolute bottom-0 left-1 right-1 h-[2px] bg-gradient-to-r from-[#E2B340] to-[#8B8CF8] rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'rentals' ? (
          rentals.length > 0 ? rentals.map(renderKeyCard) : <div className="text-[#64748b] py-8 bg-white/[0.02] border border-dashed border-white/[0.06] rounded-2xl text-center">No active rentals found.</div>
        ) : (
          owned.length > 0 ? owned.map(renderKeyCard) : <div className="text-[#64748b] py-8 bg-white/[0.02] border border-dashed border-white/[0.06] rounded-2xl text-center">No owned models found.</div>
        )}
      </div>

      <Modal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        title="Become a Seller"
      >
        <div className="text-center p-2">
          <div className="w-16 h-16 rounded-full bg-[#E2B340]/15 flex items-center justify-center text-[#F0D060] mx-auto mb-6 border border-[#E2B340]/20">
            <Rocket size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-3">Upgrade to Seller Account</h3>
          <div className="text-sm text-[#94a3b8] mb-8 leading-relaxed space-y-4 px-2">
            <p>
              You are currently registered as a buyer. To list and rent out your assets, you need to enable seller features on your account. 
            </p>
            <p>
              This will give you access to the <strong className="text-white">Seller Dashboard</strong> while keeping your buyer features intact.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full h-12 text-base font-bold gap-2"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <><Loader2 className="animate-spin" size={18}/> Upgrading...</>
              ) : (
                <>Register as Seller & Continue <ArrowRight size={18}/></>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-12 text-[#64748b] hover:text-white"
              onClick={() => setShowUpgradeModal(false)}
              disabled={isUpgrading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showRatingModal} 
        onClose={() => setShowRatingModal(false)} 
        title="Rate Asset"
      >
        <div className="text-center p-2">
          <div className="w-16 h-16 rounded-full bg-[#fbbf24]/15 flex items-center justify-center text-[#fbbf24] mx-auto mb-4 border border-[#fbbf24]/20">
            <Star size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">How was your experience?</h3>
          <p className="text-[#94a3b8] mb-6 text-sm">
            Please rate your experience with <strong>{ratingPurchase?.listings?.name}</strong>.
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none"
                onClick={() => setRatingValue(star)}
              >
                <Star 
                  size={32} 
                  fill={star <= ratingValue ? '#fbbf24' : 'transparent'} 
                  className={star <= ratingValue ? 'text-[#fbbf24]' : 'text-[#6B7280] hover:text-[#94a3b8] transition-colors'} 
                />
              </button>
            ))}
          </div>

          <textarea
            className="w-full bg-[#141828] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm mb-6 focus:outline-none focus:border-[#E2B340]/40"
            rows="3"
            placeholder="Write a brief review (optional)..."
            value={ratingBody}
            onChange={(e) => setRatingBody(e.target.value)}
          />

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full h-12 text-base font-bold"
              onClick={submitRating}
              disabled={isSubmittingRating}
            >
              {isSubmittingRating ? (
                <><Loader2 className="animate-spin mr-2" size={18}/> Submitting...</>
              ) : (
                'Submit Rating'
              )}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-12 text-[#64748b] hover:text-white"
              onClick={() => setShowRatingModal(false)}
              disabled={isSubmittingRating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
