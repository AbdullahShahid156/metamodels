import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ArrowUpRight, DollarSign, Key, Package, Settings, Users, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export const SellerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalRevenue: 0,
    activeRentals: 0,
    activeListings: 0,
    totalSales: 0,
    recentTransactions: [],
    chartData: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Fetch stats
        const statsRes = await fetch(`${apiBase}/purchases/seller-stats`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          cache: 'no-store'
        });
        
        // Fetch listings to get active count and total sales count
        const listingsRes = await fetch(`${apiBase}/listings/mine`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          cache: 'no-store'
        });

        if (statsRes.ok && listingsRes.ok) {
          const sData = await statsRes.json();
          const lData = await listingsRes.json();
          
          const activeListingsCount = lData.filter(l => l.status === 'active').length;
          const totalSalesCount = lData.reduce((sum, l) => sum + (l.total_sales || 0), 0);

          setStatsData({
            totalRevenue: sData.totalRevenue,
            activeRentals: sData.activeRentals,
            recentTransactions: sData.recentTransactions || [],
            activeListings: activeListingsCount,
            totalSales: totalSalesCount,
            chartData: sData.chartData || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch seller stats', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);


  const stats = [
    { icon: <DollarSign size={22} />, label: 'Total Revenue', value: `$${statsData.totalRevenue.toFixed(2)}`, color: 'from-[#10b981]/20 to-[#10b981]/5', iconColor: 'text-[#34d399]' },
    { icon: <Package size={22} />, label: 'Active Listings', value: statsData.activeListings, color: 'from-[#E2B340]/20 to-[#E2B340]/5', iconColor: 'text-[#F0D060]' },
    { icon: <Key size={22} />, label: 'Active Rentals', value: statsData.activeRentals, color: 'from-[#f59e0b]/20 to-[#f59e0b]/5', iconColor: 'text-[#fbbf24]' },
    { icon: <Users size={22} />, label: 'Total Sales', value: statsData.totalSales, color: 'from-[#8B8CF8]/20 to-[#8B8CF8]/5', iconColor: 'text-[#A78BFA]' },
  ];



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Seller Dashboard</h1>
          <p className="text-[#64748b]">Overview of your models' performance.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/seller/create"><Button className="text-sm">New Listing</Button></Link>
          <Link to="/seller/listings">
            <Button variant="secondary" className="flex items-center gap-2 text-sm">
              <Settings size={14}/> Manage Listings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-static flex items-center"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mr-4 ${stat.iconColor}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-[#6B7280] text-xs font-semibold mb-1 uppercase tracking-wider">{stat.label}</div>
              <div className="text-xl font-extrabold text-white">{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card-static lg:col-span-2">
          <h3 className="text-base font-bold text-white mb-6">Revenue (30 Days)</h3>
          <div className="h-72 w-full flex items-center justify-center bg-white/[0.01] rounded-xl border border-white/[0.05] border-dashed">
            {statsData.chartData && statsData.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statsData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E2B340" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#E2B340" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} dx={-10} tickFormatter={val => `$${val}`}/>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1C2035', 
                      borderColor: 'rgba(255,255,255,0.06)', 
                      borderRadius: '12px', 
                      color: '#fff',
                      fontSize: '13px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }}
                    itemStyle={{ color: '#F0D060' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#E2B340" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[#6B7280] text-sm text-center">
                <p>No revenue data yet.</p>
                <p className="text-xs mt-1">Sales will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card-static">
           <h3 className="text-base font-bold text-white mb-6">Recent Sales</h3>
           <div className="space-y-3">
             {loading ? (
               <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[#E2B340]" size={24} /></div>
             ) : statsData.recentTransactions.length > 0 ? (
               statsData.recentTransactions.map(tx => (
                 <div key={tx.id} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-xl">
                   <div>
                     <div className="font-semibold text-white text-sm mb-1">{tx.model}</div>
                     <div className="text-xs text-[#6B7280] flex items-center gap-1.5">
                       <span>{tx.buyer}</span> · <span>{tx.date}</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-[#34d399] text-sm">+${tx.amount}</div>
                     <Badge variant={tx.type === 'Rent' ? 'warning' : 'success'} className="mt-1 !text-[10px]">
                       {tx.type}
                     </Badge>
                   </div>
                 </div>
               ))
             ) : (
               <div className="py-8 text-center bg-white/[0.01] rounded-xl border border-white/[0.05] border-dashed">
                 <p className="text-[#6B7280] text-sm">No recent sales</p>
               </div>
             )}
           </div>
           <Button variant="ghost" className="w-full mt-4 text-sm">View full history</Button>
        </div>
      </div>
    </motion.div>
  );
};
