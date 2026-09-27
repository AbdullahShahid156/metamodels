const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { requireAuth, requireSeller } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// GET /api/apikeys/:listingId - seller views keys for a listing
router.get('/:listingId', requireAuth, requireSeller, async (req, res) => {
  try {
    const { listingId } = req.params;
    
    // Check ownership
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('seller_id')
      .eq('id', listingId)
      .single();

    if (listingError || listing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this listing' });
    }

    const { data: keys, error: keysError } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (keysError) throw keysError;
    res.json(keys);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// POST /api/apikeys/generate - seller generates specialized key
router.post('/generate', requireAuth, requireSeller, async (req, res) => {
  try {
    const { listing_id, expiry_days, usage_limit } = req.body;

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('seller_id')
      .eq('id', listing_id)
      .single();

    if (!listing || listing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const rawApiKey = 'nm_sel_' + crypto.randomBytes(24).toString('hex');
    const keyPreview = rawApiKey.slice(0, 15) + '...';
    
    const keyData = {
      seller_id: req.user.id,
      listing_id,
      key_hash: rawApiKey, // Mock hash
      key_preview: keyPreview,
      expiry_date: expiry_days ? new Date(Date.now() + expiry_days * 24 * 60 * 60 * 1000).toISOString() : null,
      usage_limit: usage_limit || null,
      is_active: true
    };

    const { data: apiKey, error } = await supabaseAdmin
      .from('api_keys')
      .insert([keyData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ apiKey, rawApiKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// DELETE /api/apikeys/:id - revoke key
router.delete('/:id', requireAuth, requireSeller, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('api_keys')
            .update({ is_active: false })
            .match({ id: id, seller_id: req.user.id });
        
        if (error) throw error;
        res.json({ success: true });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to revoke key' });
    }
});

module.exports = router;
