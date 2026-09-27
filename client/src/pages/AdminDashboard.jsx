import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { DollarSign, Package, Users, CheckCircle, XCircle, ShieldAlert, Loader2, Eye } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AdminDashboard = () => {
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingListings, setPendingListings] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [confirmAction, setConfirmAction] = useState({ isOpen: false, id: null, action: null });

  useEffect(() => {
    fetchStats();
    fetchPendingListings();
    
    const interval = setInterval(() => {
      fetchStats();
      fetchPendingListings();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${apiBase}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch admin stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingListings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${apiBase}/admin/pending-listings`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setPendingListings(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch pending listings');
    } finally {
      setLoadingListings(false);
    }
  };

  const handleAction = (id, action) => {
    setConfirmAction({ isOpen: true, id, action });
  };

  const executeAction = async () => {
    const { id, action } = confirmAction;
    setConfirmAction({ isOpen: false, id: null, action: null });
    
    setActionLoading(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${apiBase}/admin/listings/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        toast.success(`Listing ${action}d successfully`);
        setPendingListings(prev => prev.filter(l => l.id !== id));
        fetchStats(); // Update counters
      } else {
        const errData = await res.json();
        toast.error(errData.error || `Failed to ${action} listing`);
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
    >
      <div className="flex flex-col mb-10 gap-2">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
          <ShieldAlert className="text-[#E2B340]" size={32} /> Admin Panel
        </h1>
        <p className="text-[#64748b]">Platform oversight, revenue tracking, and model approvals.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard 
          icon={<DollarSign size={22} />} 
          label="Total Platform Revenue" 
          value={loadingStats ? '...' : `$${(stats?.totalRevenue || 0).toLocaleString()}`} 
          color="from-[#10b981]/20 to-[#10b981]/5" 
          iconColor="text-[#34d399]" 
        />
        <StatCard 
          icon={<Package size={22} />} 
          label="Active Models Listed" 
          value={loadingStats ? '...' : stats?.activeListingsCount || 0} 
          color="from-[#E2B340]/20 to-[#E2B340]/5" 
          iconColor="text-[#F0D060]" 
        />
        <StatCard 
          icon={<Users size={22} />} 
          label="Registered Users" 
          value={loadingStats ? '...' : stats?.usersCount || 0} 
          color="from-[#8B8CF8]/20 to-[#8B8CF8]/5" 
          iconColor="text-[#A78BFA]" 
        />
        <StatCard 
          icon={<ShieldAlert size={22} />} 
          label="Pending Approvals" 
          value={loadingStats ? '...' : stats?.pendingListingsCount || 0} 
          color="from-[#f59e0b]/20 to-[#f59e0b]/5" 
          iconColor="text-[#fbbf24]" 
        />
      </div>

      {/* Pending Approvals Table */}
      <div className="glass-card-static overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.04] bg-white/[0.01]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Pending Model Approvals
            <Badge variant="warning" className="ml-2">{pendingListings.length}</Badge>
          </h2>
        </div>
        
        {loadingListings ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-[#E2B340]" size={28} />
          </div>
        ) : pendingListings.length === 0 ? (
          <div className="p-12 text-center text-[#6B7280]">
            No pending models waiting for approval.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Model / Agent</th>
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Seller</th>
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Pricing</th>
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingListings.map(item => (
                  <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-xs text-[#6B7280] mt-0.5 line-clamp-1 max-w-[300px]">{item.short_description || item.description}</div>
                      <Badge variant="secondary" className="mt-2 !text-[10px]">{item.category}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <img src={item.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seller_id}`} className="w-6 h-6 rounded-full bg-white/10" alt="seller" />
                        <span className="text-sm text-white">{item.profiles?.display_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        {item.rent_price > 0 && (
                          <span className="text-[#fbbf24]">${item.rent_price}<span className="text-[#6B7280] text-xs">/day</span></span>
                        )}
                        {item.buy_price > 0 && (
                          <span className="text-[#34d399]">${item.buy_price}<span className="text-[#6B7280] text-xs"> buy</span></span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="bg-[#1C2035] hover:bg-white/[0.05] border border-white/[0.08] text-white py-1.5 px-3 h-auto"
                          onClick={() => setSelectedListing(item)}
                        >
                          <Eye size={14} className="mr-1.5" /> View Details
                        </Button>
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 py-1.5 px-3 h-auto"
                          onClick={() => handleAction(item.id, 'reject')}
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} className="mr-1.5" />} Reject
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-[#10b981] hover:bg-[#059669] text-white py-1.5 px-3 h-auto shadow-none"
                          onClick={() => handleAction(item.id, 'approve')}
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} className="mr-1.5" />} Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!selectedListing} 
        onClose={() => setSelectedListing(null)}
        title="Listing Verification Details"
        className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        {selectedListing && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E2B340]/20 to-[#F59E0B]/10 border border-[#E2B340]/10 flex items-center justify-center text-[#E2B340]">
                   <Package size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedListing.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="!text-[10px] uppercase">{selectedListing.type}</Badge>
                    <Badge variant="secondary" className="!text-[10px] uppercase">{selectedListing.category}</Badge>
                    <span className="text-xs text-[#64748b]">v{selectedListing.version}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#94a3b8] mb-2">Description</h4>
              <p className="text-sm text-white bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 leading-relaxed">
                {selectedListing.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#94a3b8] mb-1">Pricing Configuration</h4>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#64748b]">Rent Price:</span>
                    <span className="text-sm font-medium text-[#fbbf24]">{selectedListing.rent_price > 0 ? `$${selectedListing.rent_price}/day` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#64748b]">Buy Price:</span>
                    <span className="text-sm font-medium text-[#34d399]">{selectedListing.buy_price > 0 ? `$${selectedListing.buy_price}` : 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[#94a3b8] mb-1">Seller Identity</h4>
                <div className="flex items-center gap-2 mt-2">
                  <img src={selectedListing.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedListing.seller_id}`} className="w-8 h-8 rounded-full bg-white/10" alt="seller" />
                  <div>
                    <div className="text-sm font-medium text-white">{selectedListing.profiles?.display_name || 'Unknown User'}</div>
                    <div className="text-[10px] text-[#64748b] truncate max-w-[120px]">{selectedListing.seller_id}</div>
                  </div>
                </div>
              </div>
            </div>

            {selectedListing.capabilities && selectedListing.capabilities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#94a3b8] mb-2">Declared Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.capabilities.map((cap, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#8B8CF8]/10 text-[#A78BFA] border border-[#8B8CF8]/20">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-[#94a3b8] mb-2">Technical Hashes</h4>
              <div className="space-y-2">
                <div className="bg-black/40 border border-white/[0.04] rounded-lg p-3 flex justify-between items-center gap-4">
                  <span className="text-xs text-[#64748b] shrink-0">Model File IPFS</span>
                  <span className="text-xs text-[#F0D060] font-mono truncate">{selectedListing.model_card_url}</span>
                </div>
                {selectedListing.architecture_notes && (
                  <div className="bg-black/40 border border-white/[0.04] rounded-lg p-3 flex justify-between items-center gap-4">
                    <span className="text-xs text-[#64748b] shrink-0">Docs File IPFS</span>
                    <span className="text-xs text-[#A78BFA] font-mono truncate">{selectedListing.architecture_notes}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedListing.showcase_images && selectedListing.showcase_images.length > 0 && (
               <div>
                 <h4 className="text-sm font-semibold text-[#94a3b8] mb-2">Showcase Media ({selectedListing.showcase_images.length})</h4>
                 <div className="grid grid-cols-2 gap-2">
                   {selectedListing.showcase_images.map((img, i) => (
                     <img key={i} src={img} alt="Showcase" className="w-full aspect-video object-cover rounded-lg border border-white/[0.08]" />
                   ))}
                 </div>
               </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-white/[0.04]">
              <Button 
                variant="secondary"
                className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                onClick={() => { handleAction(selectedListing.id, 'reject'); setSelectedListing(null); }}
              >
                Reject Listing
              </Button>
              <Button 
                className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white shadow-none"
                onClick={() => { handleAction(selectedListing.id, 'approve'); setSelectedListing(null); }}
              >
                Approve & Publish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ isOpen: false, id: null, action: null })}
        title="Confirm Action"
      >
        <div className="py-2">
          <p className="text-[#94a3b8] mb-6">
            Are you sure you want to <span className="text-white font-bold">{confirmAction.action}</span> this listing? 
            This will notify the seller.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setConfirmAction({ isOpen: false, id: null, action: null })}
            >
              Cancel
            </Button>
            <Button 
              className={`flex-1 text-white shadow-none ${confirmAction.action === 'approve' ? 'bg-[#10b981] hover:bg-[#059669]' : 'bg-red-500 hover:bg-red-600'}`}
              onClick={executeAction}
            >
              Yes, {confirmAction.action}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, color, iconColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card-static flex items-center p-5"
  >
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mr-4 ${iconColor}`}>
      {icon}
    </div>
    <div>
      <div className="text-[#6B7280] text-[11px] font-bold mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-extrabold text-white">{value}</div>
    </div>
  </motion.div>
);
