import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Package, ShoppingBag, Calendar } from 'lucide-react';

import { supabase } from '../lib/supabaseClient';

export const UserProfile = () => {
  const { user, profile } = useAuth();

  const [statsData, setStatsData] = useState({ listingsCount: 0, purchasesCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        const [listingsRes, purchasesRes] = await Promise.all([
          fetch(`${apiBase}/listings/mine`, { headers: { 'Authorization': `Bearer ${session.access_token}` } }).catch(() => null),
          fetch(`${apiBase}/purchases/mine`, { headers: { 'Authorization': `Bearer ${session.access_token}` } })
        ]);
        
        let listingsCount = 0;
        let purchasesCount = 0;
        
        if (listingsRes && listingsRes.ok) {
          const lData = await listingsRes.json();
          listingsCount = lData.length;
        }
        
        if (purchasesRes.ok) {
          const pData = await purchasesRes.json();
          purchasesCount = pData.length;
        }
        
        setStatsData({ listingsCount, purchasesCount });
      } catch (err) {
        console.error('Failed to fetch profile stats', err);
      }
    };
    
    if (profile) {
      fetchStats();
      const interval = setInterval(fetchStats, 15000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  if (!profile) return <div className="p-20 text-center text-[#6B7280]">Loading profile...</div>;

  const stats = [
    { icon: <Package size={18} />, label: 'Listings', value: statsData.listingsCount, color: 'from-[#E2B340]/20 to-[#E2B340]/5', iconColor: 'text-[#F0D060]' },
    { icon: <ShoppingBag size={18} />, label: 'Purchases', value: statsData.purchasesCount, color: 'from-[#10b981]/20 to-[#10b981]/5', iconColor: 'text-[#34d399]' },
    { icon: <Calendar size={18} />, label: 'Member Since', value: new Date(profile.created_at).toLocaleDateString(), color: 'from-white/5 to-white/[0.02]', iconColor: 'text-[#64748b]' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <h1 className="text-3xl font-extrabold text-white mb-8 tracking-tight">Profile</h1>
      
      <div className="glass-card-static flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        <Avatar src={profile.avatar_url} alt={profile.display_name} size="xl" />
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{profile.display_name || user.email}</h2>
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <span className="text-[#64748b] text-sm">{user.email}</span>
            <Badge variant="primary" className="capitalize">{profile.role}</Badge>
          </div>
          <p className="text-[#6B7280] max-w-lg">
            {profile.bio || "No bio provided."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-static flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} ${stat.iconColor}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">{stat.label}</div>
              <div className="text-lg font-bold text-white">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
