const express = require('express');
const router = express.Router();
const { requireAuth, requireBuyer } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// POST /api/reviews - submit a review for a purchase
router.post('/', requireAuth, requireBuyer, async (req, res) => {
  try {
    const { purchase_id, listing_id, rating, body } = req.body;

    if (!purchase_id || !listing_id || !rating) {
      return res.status(400).json({ error: 'purchase_id, listing_id, and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Verify the purchase belongs to this user
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('id', purchase_id)
      .eq('buyer_id', req.user.id)
      .single();

    if (purchaseError || !purchase) {
      return res.status(404).json({ error: 'Purchase not found or not yours.' });
    }

    // Check if a review already exists for this purchase
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('purchase_id', purchase_id)
      .maybeSingle();

    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this purchase.' });
    }

    // Create review
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert([{
        buyer_id: req.user.id,
        listing_id,
        purchase_id,
        rating: parseInt(rating),
        body: body || null
      }])
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Recalculate listing rating
    const { data: allReviews } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('listing_id', listing_id);

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await supabaseAdmin
      .from('listings')
      .update({ 
        rating: parseFloat(avgRating.toFixed(1)), 
        total_reviews: allReviews.length 
      })
      .eq('id', listing_id);

    res.status(201).json(review);
  } catch (err) {
    console.error('Review submit error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit review' });
  }
});

// GET /api/reviews/:listing_id - get reviews for a listing
router.get('/:listing_id', async (req, res) => {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*, profiles(display_name, avatar_url)')
      .eq('listing_id', req.params.listing_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
