const express = require('express');
const router = express.Router();
const { requireAuth, requireSeller } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// Whitelist of allowed fields for listing creation
const ALLOWED_CREATE_FIELDS = [
  'name', 'type', 'description', 'short_description', 'category',
  'capabilities', 'sample_input', 'sample_output',
  'version', 'training_details', 'supported_framework', 'use_case',
  'rent_price', 'buy_price', 'rent_enabled', 'buy_enabled',
  'ownership_proof_url', 'model_card_url', 'instruction_doc_url', 'architecture_notes', 'api_endpoint',
  'showcase_images'
];

// Whitelist of allowed fields for listing updates
const ALLOWED_UPDATE_FIELDS = [
  'name', 'description', 'short_description',
  'capabilities', 'sample_input', 'sample_output',
  'version', 'training_details', 'supported_framework', 'use_case',
  'rent_price', 'buy_price', 'rent_enabled', 'buy_enabled',
  'ownership_proof_url', 'model_card_url', 'instruction_doc_url', 'architecture_notes', 'api_endpoint',
  'status', 'showcase_images'
];

// Client sends camelCase metadata; database columns are snake_case
const FIELD_ALIASES = {
  trainingDetails: 'training_details',
  supportedFramework: 'supported_framework',
  useCase: 'use_case'
};

const normalizeFields = (body) => {
  const normalized = {};
  for (const [key, value] of Object.entries(body || {})) {
    normalized[FIELD_ALIASES[key] || key] = value;
  }
  return normalized;
};

// Helper to pick only allowed fields from an object
const pickFields = (obj, allowedFields) => {
  const result = {};
  for (const key of allowedFields) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

// GET /api/listings - public, paginated, filterable
router.get('/', async (req, res) => {
  try {
    const { category, type, minPrice, maxPrice, search } = req.query;
    
    let query = supabaseAdmin
      .from('listings')
      .select('*, profiles(display_name, avatar_url)')
      .eq('status', 'active');

    if (category && category !== 'All') query = query.eq('category', category);
    if (type) query = query.eq('type', type);
    if (search) query = query.ilike('name', `%${search}%`);
    
    const { data: listings, error } = await query;
    if (error) throw error;
    
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// GET /api/listings/mine - seller's own listings
router.get('/mine', requireAuth, requireSeller, async (req, res) => {
  try {
    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// GET /api/listings/:slug - single detail
router.get('/:slug', async (req, res) => {
  try {
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select('*, profiles(display_name, avatar_url)')
      .eq('slug', req.params.slug)
      .single();

    if (error || !listing) return res.status(404).json({ error: 'Listing not found' });
    
    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/listings - create listing (fields whitelisted)
router.post('/', requireAuth, requireSeller, async (req, res) => {
  try {
    // Validate required fields
    const { name, type, category } = req.body;
    if (!name || !type || !category) {
      return res.status(400).json({ error: 'Name, type, and category are required.' });
    }
    if (!['model', 'agent', 'other'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "model", "agent", or "other".' });
    }

    // Only pick allowed fields — prevents injection of rating, total_sales, status, etc.
    const safeData = pickFields(normalizeFields(req.body), ALLOWED_CREATE_FIELDS);

    const listingData = {
      ...safeData,
      seller_id: req.user.id,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
      status: 'pending', // Requires admin approval
      rating: 0,
      total_reviews: 0,
      total_sales: 0
    };
    
    const { data, error } = await supabaseAdmin
      .from('listings')
      .insert([listingData])
      .select()
      .single();

    if (error) {
      console.error('Listing insert error:', error);
      return res.status(400).json({ error: error.message || 'Invalid listing data' });
    }
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// PATCH /api/listings/:id - update listing (fields whitelisted)
router.patch('/:id', requireAuth, requireSeller, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure the listing belongs to the user
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Listing not found' });
    if (existing.seller_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    // Only pick allowed fields — prevents injection of rating, total_sales, seller_id, etc.
    const safeData = pickFields(normalizeFields(req.body), ALLOWED_UPDATE_FIELDS);

    // Validate status if being changed (sellers can only pause/activate their own)
    if (safeData.status && !['active', 'paused'].includes(safeData.status)) {
      return res.status(400).json({ error: 'Status can only be set to "active" or "paused".' });
    }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update(safeData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// DELETE /api/listings/:id - delete listing (cascades dependent records)
router.delete('/:id', requireAuth, requireSeller, async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure the listing belongs to the user
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Listing not found' });
    if (existing.seller_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    // Delete dependent records in correct order (FK constraints)
    // 1. Reviews (references both purchases AND listings)
    await supabaseAdmin.from('reviews').delete().eq('listing_id', id);
    
    // 2. API Keys (references listings)
    await supabaseAdmin.from('api_keys').delete().eq('listing_id', id);
    
    // 3. Purchases (references listings)
    await supabaseAdmin.from('purchases').delete().eq('listing_id', id);
    
    // 4. Finally delete the listing itself
    const { error } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

module.exports = router;
