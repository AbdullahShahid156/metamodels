import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CheckCircle, Loader2, Shield, ArrowRight, Plus, Minus, Copy, Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const Checkout = () => {
  const { id: slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialType = searchParams.get('type') || 'rent';
  
  const [type, setType] = useState(initialType);
  const [duration, setDuration] = useState(7);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        // Note: the backend route is /api/listings/:slug
        const res = await fetch(`${apiBase}/listings/${slug}`);
        if (!res.ok) throw new Error('Listing not found');
        const data = await res.json();
        setModel(data);
      } catch (err) {
        console.error(err);
        toast.error("Model not found in the Database.");
        navigate('/marketplace');
      } finally {
        setLoadingModel(false);
      }
    };
    if (slug) fetchModel();
  }, [slug, navigate]);

  const total = model ? (type === 'rent' ? model.rent_price * (Number(duration) || 0) : model.buy_price) : 0;

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in to purchase.");

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          listing_id: model.id,
          type: type,
          duration_days: type === 'rent' ? duration : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process purchase');

      setApiKey(data.rawApiKey);
      setSuccess(true);
      toast.success("Purchase completed successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'An error occurred during checkout');
    } finally {
      setProcessing(false);
    }
  };

  const finishCheckout = () => {
    navigate('/purchases');
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  const downloadApiKey = () => {
    const content = `MetaModels API Key\n==================\nListing: ${model.name}\nKey:     ${apiKey}\n\nKeep this file private. The full key is shown only once.\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metamodels-api-key-${model.slug || 'key'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Key file downloaded');
  };

  if (loadingModel) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
         <Loader2 className="animate-spin text-[#E2B340]" size={40} />
      </div>
    );
  }

  if (!model) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto px-4 py-12 w-full"
    >
      <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Checkout</h1>
      <p className="text-[#94a3b8] mb-8">Complete your order to get your API key.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="glass-card-static">
            <h3 className="text-base font-bold text-white mb-5">Order Summary</h3>
            <div className="space-y-3 border-b border-white/[0.04] pb-5 mb-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#94a3b8]">Model</span>
                <span className="text-white font-medium">{model.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#94a3b8]">Purchase Type</span>
                <span className="text-[#F0D060] font-semibold capitalize bg-[#E2B340]/10 border border-[#E2B340]/20 px-2.5 py-0.5 rounded-full text-xs">
                  {type}
                </span>
              </div>
              
              {type === 'rent' && (
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-[#94a3b8]">Duration (Days)</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setDuration(Math.max(1, (Number(duration) || 1) - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.08] text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number"
                      min="1"
                      max="365"
                      value={duration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setDuration(val);
                        } else if (e.target.value === '') {
                          setDuration('');
                        }
                      }}
                      onBlur={(e) => {
                        if (!duration || duration < 1) setDuration(1);
                      }}
                      className="bg-[#141828] border border-white/[0.08] rounded-md px-2 py-1 text-white text-sm text-center w-14 focus:outline-none focus:border-[#E2B340]/40 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                    />
                    <button 
                      onClick={() => setDuration((Number(duration) || 1) + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.08] text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-white">Total</span>
              <span className="text-2xl font-extrabold gradient-text">${total}</span>
            </div>
          </div>

          <div className="glass-card-static">
            <h3 className="text-base font-bold text-white mb-5">Payment Method</h3>
            <div className="p-4 border border-white/[0.06] rounded-xl bg-white/[0.02] text-center mb-5">
              <div className="flex items-center justify-center gap-2 text-[#94a3b8] text-sm">
                <Shield size={14} className="text-[#E2B340]" />
                Test Mode Active — No actual charge will be made.
              </div>
            </div>
            
            <Button 
              className="w-full py-3.5 h-auto text-base group" 
              onClick={handleCheckout} 
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="animate-spin" size={18}/> Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Complete order · ${total}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </div>
        </div>
        
        <div className="hidden md:block">
          <div className="glass-card-static">
            <h3 className="font-semibold text-white mb-4">What happens next?</h3>
            <ul className="space-y-4 text-sm text-[#94a3b8] pt-1">
              <li className="flex gap-3">
                <CheckCircle size={16} className="text-[#E2B340] flex-shrink-0 mt-0.5"/>
                You will instantly receive a secure API key globally replicated via Edge.
              </li>
              <li className="flex gap-3">
                <CheckCircle size={16} className="text-[#E2B340] flex-shrink-0 mt-0.5"/>
                Integration documentation is provided on your dashboard.
              </li>
              {type === 'rent' && (
                <li className="flex gap-3">
                  <CheckCircle size={16} className="text-[#E2B340] flex-shrink-0 mt-0.5"/>
                  Your key will automatically expire after {duration} days.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <Modal isOpen={success} onClose={finishCheckout} title="Order Successful!">
        <div className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-[#10b981]/15 rounded-full flex items-center justify-center text-[#34d399] border border-[#10b981]/20 mb-6">
             <CheckCircle size={32} />
          </div>
          <p className="text-[#e4e4e7] mb-2 font-medium">Your generated API key for <span className="font-bold text-white">{model.name}</span> is ready.</p>
          <p className="text-[#94a3b8] text-sm mb-6">Please securely store this key. It will not be shown in full again.</p>
          
          <div className="bg-[#0C0F1A] border border-white/[0.06] p-4 rounded-xl mb-4 text-left">
             <span className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-bold mb-2 block">Secret API Key</span>
             <div className="font-mono text-[#E2B340] text-sm break-all select-all">{apiKey}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button variant="secondary" className="gap-2" onClick={copyApiKey}>
              <Copy size={15} /> Copy Key
            </Button>
            <Button variant="secondary" className="gap-2" onClick={downloadApiKey}>
              <Download size={15} /> Download .txt
            </Button>
          </div>

          <Button onClick={finishCheckout} className="w-full">
            Go to My Purchases
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
};
