import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Settings, Trash2, Edit2, Play, Pause, Plus, ShoppingBag, Loader2, X, ImagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ManageListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });

  useEffect(() => {
    fetchMyListings();
    const interval = setInterval(fetchMyListings, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyListings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${apiBase}/listings/mine`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        // Filter out sold items (status paused + both rent and buy disabled = sold)
        const manageable = data.filter(l => !(l.status === 'paused' && !l.rent_enabled && !l.buy_enabled));
        setListings(manageable);
      } else {
        toast.error(data.error || 'Failed to fetch listings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${apiBase}/listings/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setListings(prev => prev.map(l => l.id === item.id ? { ...l, status: newStatus } : l));
        toast.success(`${item.name} is now ${newStatus}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const removeListing = (id, name) => {
    setConfirmDelete({ isOpen: true, id, name });
  };

  const executeDelete = async () => {
    const { id, name } = confirmDelete;
    setConfirmDelete({ isOpen: false, id: null, name: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${apiBase}/listings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        setListings(prev => prev.filter(item => item.id !== id));
        toast.success(`${name} has been removed.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Delete failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleEditClick = (item) => {
    setEditingListing({ ...item, showcase_images: item.showcase_images || [] });
    setIsEditModalOpen(true);
  };

  const handleShowcaseImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const imgFile = files[i];
        if (!imgFile.type.startsWith('image/')) {
          toast.error(`${imgFile.name} is not an image file`);
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', imgFile);

        const response = await fetch(`${apiBase}/ipfs/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formDataUpload
        });

        const data = await response.json();
        if (response.ok) {
          const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.ipfsHash}`;
          setEditingListing(prev => ({
            ...prev,
            showcase_images: [...(prev.showcase_images || []), imageUrl]
          }));
        } else {
          toast.error(`Failed to upload ${imgFile.name}`);
        }
      }
      toast.success('Images uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Image upload failed');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeShowcaseImage = (index) => {
    setEditingListing(prev => ({
      ...prev,
      showcase_images: prev.showcase_images.filter((_, i) => i !== index)
    }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${apiBase}/listings/${editingListing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: editingListing.name,
          description: editingListing.description,
          rent_price: parseFloat(editingListing.rent_price) || 0,
          buy_price: parseFloat(editingListing.buy_price) || 0,
          showcase_images: editingListing.showcase_images || []
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setListings(prev => prev.map(l => l.id === updated.id ? updated : l));
        toast.success('Listing updated successfully');
        setIsEditModalOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Update failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Manage Listings</h1>
          <p className="text-[#64748b]">Edit, remove, or toggle the active state of your models and agents.</p>
        </div>
        <Link to="/seller/create">
          <Button className="gap-2">
            <Plus size={18} /> New Listing
          </Button>
        </Link>
      </div>

      <div className="glass-card-static overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-[#E2B340]" size={28} />
          </div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center text-[#6B7280]">
            You have no listings. <Link to="/seller/create" className="text-[#E2B340] hover:underline">Create one</Link> to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Asset Name</th>
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Price</th>
                  <th className="p-4 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(item => (
                  <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-xs text-[#6B7280] mt-0.5">{item.total_sales || 0} sales</div>
                    </td>
                    <td className="p-4">
                      <Badge variant={item.type === 'model' ? 'default' : 'secondary'}>{item.type}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={
                        item.status === 'active' ? 'success' : 
                        item.status === 'pending' ? 'warning' : 
                        item.status === 'paused' ? 'secondary' : 'danger'
                      }>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        {item.rent_price > 0 && (
                          <span className="text-[#fbbf24]">${item.rent_price}<span className="text-[#6B7280] text-xs">/day</span></span>
                        )}
                        {item.buy_price > 0 && (
                          <span className="text-[#34d399]">${item.buy_price}<span className="text-[#6B7280] text-xs"> buy</span></span>
                        )}
                        {!item.rent_price && !item.buy_price && (
                          <span className="text-[#6B7280]">Free</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleStatus(item)}
                          disabled={item.status === 'pending' || item.status === 'rejected'}
                          className={`p-1.5 rounded-lg transition-colors tooltip-trigger ${
                            item.status === 'pending' || item.status === 'rejected' 
                              ? 'bg-white/[0.02] text-[#475569] cursor-not-allowed'
                              : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white cursor-pointer'
                          }`}
                          title={
                            item.status === 'pending' ? 'Pending Approval' :
                            item.status === 'rejected' ? 'Rejected by Admin' :
                            item.status === 'active' ? 'Deactivate' : 'Activate'
                          }
                        >
                          {item.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors tooltip-trigger"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => removeListing(item.id, item.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors tooltip-trigger"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Listing"
      >
        {editingListing && (
          <form onSubmit={handleEditSave} className="space-y-4">
            <Input 
              label="Name" 
              value={editingListing.name} 
              onChange={e => setEditingListing({...editingListing, name: e.target.value})}
              required
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#94a3b8]">Description</label>
              <textarea 
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#E2B340]/50 transition-all min-h-[100px]"
                value={editingListing.description} 
                onChange={e => setEditingListing({...editingListing, description: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Rent Price ($)" 
                type="number"
                value={editingListing.rent_price} 
                onChange={e => setEditingListing({...editingListing, rent_price: e.target.value})}
              />
              <Input 
                label="Buy Price ($)" 
                type="number"
                value={editingListing.buy_price} 
                onChange={e => setEditingListing({...editingListing, buy_price: e.target.value})}
              />
            </div>
            
            {/* ── Showcase Images Upload ── */}
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-3">
                Showcase Images
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {editingListing.showcase_images?.map((url, index) => (
                  <div
                    key={index}
                    className="relative group aspect-video rounded-xl overflow-hidden border border-white/[0.08] bg-[#141828]"
                  >
                    <img 
                      src={url} 
                      alt={`Showcase ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeShowcaseImage(index)}
                        className="p-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/40 transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add Image Button */}
                <label className="aspect-video rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] hover:border-[#E2B340]/30 hover:bg-[#E2B340]/[0.03] transition-all flex flex-col items-center justify-center cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleShowcaseImageUpload}
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <Loader2 size={24} className="text-[#E2B340] animate-spin" />
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-[#6B7280] group-hover:text-[#F0D060] transition-colors mb-1.5" />
                      <span className="text-xs text-[#6B7280] group-hover:text-[#64748b] transition-colors">Add Images</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button  
                type="button" 
                variant="secondary" 
                className="flex-1" 
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        title="Delete Listing"
      >
        <div className="py-2 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5 border border-red-500/20 text-red-400">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Are you sure?</h3>
          <p className="text-[#94a3b8] mb-6">
            Do you really want to remove <span className="text-white font-medium">{confirmDelete.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-none"
              onClick={executeDelete}
            >
              Yes, Delete It
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
