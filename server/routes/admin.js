const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// GET /api/admin/stats
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Total revenue
    const { data: purchases, error: pError } = await supabaseAdmin
      .from('purchases')
      .select('price_paid');
    
    if (pError) throw pError;
    const totalRevenue = purchases.reduce((sum, p) => sum + parseFloat(p.price_paid || 0), 0);

    // Total active listings
    const { count: activeListingsCount, error: lError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
      
    if (lError) throw lError;

    // Total pending listings
    const { count: pendingCount, error: pendingError } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    // Total users
    const { count: usersCount, error: uError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (uError) throw uError;

    res.json({
      totalRevenue,
      activeListingsCount,
      pendingListingsCount: pendingCount,
      usersCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/pending-listings
router.get('/pending-listings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('*, profiles(display_name, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending listings' });
  }
});

// PATCH /api/admin/listings/:id/approve
router.patch('/listings/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('listings')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Listing approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve listing' });
  }
});

// PATCH /api/admin/listings/:id/reject
router.patch('/listings/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('listings')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Listing rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject listing' });
  }
});

module.exports = router;
