const express = require('express');
const router = express.Router();
const { requireAuth, requireBuyer, requireSeller } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const crypto = require('crypto');

// GET /api/purchases/mine - buyer's purchases (includes model_card_url + review status)
router.get('/mine', requireAuth, requireBuyer, async (req, res) => {
  try {
    const { data: purchases, error } = await supabaseAdmin
      .from('purchases')
      .select('*, listings(name, category, model_card_url, architecture_notes, type), reviews(id, rating)')
      .eq('buyer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// GET /api/purchases/seller-stats - aggregated stats for seller dashboard
router.get('/seller-stats', requireAuth, requireSeller, async (req, res) => {
  try {
    // Get seller's listing IDs
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, name')
      .eq('seller_id', req.user.id);

    if (listingsError) throw listingsError;
    if (!listings || listings.length === 0) {
      // Return empty chart data
      const emptyChart = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        emptyChart.push({ name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0 });
      }
      return res.json({ totalRevenue: 0, activeRentals: 0, recentTransactions: [], chartData: emptyChart });
    }

    const listingIds = listings.map(l => l.id);

    // Get all purchases for those listings (join buyer profiles for display name)
    const { data: purchases, error: purchasesError } = await supabaseAdmin
      .from('purchases')
      .select('*, listings(name), profiles!purchases_buyer_id_fkey(display_name)')
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });

    if (purchasesError) throw purchasesError;

    const totalRevenue = (purchases || []).reduce((sum, p) => sum + parseFloat(p.price_paid || 0), 0);
    const activeRentals = (purchases || []).filter(p => 
      p.type === 'rent' && p.is_active && p.expires_at && new Date(p.expires_at) > new Date()
    ).length;

    // Recent transactions (last 5)
    const recentTransactions = (purchases || []).slice(0, 5).map(p => ({
      id: p.id,
      model: p.listings?.name || 'Unknown',
      amount: parseFloat(p.price_paid || 0),
      type: p.type === 'rent' ? 'Rent' : 'Buy',
      date: new Date(p.created_at).toLocaleDateString(),
      buyer: p.profiles?.display_name || 'Anonymous'
    }));

    // Generate 30 days chart data
    const chartDataMap = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartDataMap[dateStr] = 0;
    }

    (purchases || []).forEach(p => {
      const d = new Date(p.created_at);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (chartDataMap[dateStr] !== undefined) {
        chartDataMap[dateStr] += parseFloat(p.price_paid || 0);
      }
    });

    const chartData = Object.keys(chartDataMap).map(key => ({
      name: key,
      revenue: chartDataMap[key]
    }));

    res.json({ totalRevenue, activeRentals, recentTransactions, chartData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seller stats' });
  }
});

// POST /api/purchases - mock payment & generate api key
router.post('/', requireAuth, requireBuyer, async (req, res) => {
  try {
    const { listing_id, type, duration_days } = req.body;

    // Validate input
    if (!listing_id || !type) {
      return res.status(400).json({ error: 'listing_id and type are required.' });
    }
    if (!['rent', 'buy'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "rent" or "buy".' });
    }
    
    // Fetch listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) return res.status(404).json({ error: 'Listing not found' });
    
    const price_paid = type === 'rent' ? listing.rent_price : listing.buy_price;
    const expires_at = type === 'rent' && duration_days ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString() : null;
    
    // Generate an API Key safely
    const rawApiKey = 'mm_' + crypto.randomBytes(24).toString('hex');
    const keyPreview = rawApiKey.slice(0, 10) + '...';
    
    // Hash the key before storing (security best practice)
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const purchaseData = {
      buyer_id: req.user.id,
      listing_id,
      type,
      price_paid,
      duration_days: duration_days || null,
      expires_at,
      api_key: keyHash,       // Store the HASH, not the raw key
      key_preview: keyPreview, // Store a short preview for display
      is_active: true
    };

    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single();

    if (purchaseError) throw purchaseError;
    
    // Update listing sales count and unlist if bought
    const { data: currentListing } = await supabaseAdmin
      .from('listings')
      .select('total_sales')
      .eq('id', listing_id)
      .single();

    const updatePayload = { total_sales: (currentListing?.total_sales || 0) + 1 };
    
    if (type === 'buy') {
      updatePayload.status = 'paused';
      updatePayload.buy_enabled = false;
      updatePayload.rent_enabled = false;
    }

    await supabaseAdmin
      .from('listings')
      .update(updatePayload)
      .eq('id', listing_id);
    
    // Return the raw key ONLY in this response — user will never see it again
    res.status(201).json({ purchase, rawApiKey });
  } catch (err) {
    console.error('Purchase Error:', err);
    res.status(500).json({ error: err.message || 'Purchase failed' });
  }
});

module.exports = router;
