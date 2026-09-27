const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { supabaseAdmin } = require('../lib/supabaseAdmin');

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*, listings(count), purchases(count)')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { display_name, bio, avatar_url } = req.body;
    
    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update({ display_name, bio, avatar_url })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/upgrade-seller', requireAuth, async (req, res) => {
  try {
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (fetchError) throw fetchError;

    let newRole = 'seller';
    if (profile.role === 'buyer') newRole = 'both';
    else if (profile.role === 'seller' || profile.role === 'both') {
      return res.status(400).json({ error: 'User is already a seller' });
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Upgraded to seller successfully', profile: updatedProfile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upgrade to seller' });
  }
});

module.exports = router;
