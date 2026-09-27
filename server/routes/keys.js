const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const { supabaseAdmin } = require('../lib/supabaseAdmin');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

// Extract the raw API key from x-api-key or Authorization headers
const extractKey = (req) => {
  const headerKey = req.get('x-api-key');
  if (headerKey) return headerKey.trim();
  const auth = req.get('authorization') || '';
  if (auth.toLowerCase().startsWith('apikey ')) return auth.slice(7).trim();
  if (auth.toLowerCase().startsWith('bearer ') && auth.slice(7).trim().startsWith('mm_')) {
    return auth.slice(7).trim();
  }
  return (req.body && req.body.api_key) || '';
};

// Resolve a raw key to an active purchase + its listing
const resolveKey = async (rawKey) => {
  if (!rawKey) return { status: 400, error: 'Missing API key. Send it in the x-api-key header.' };

  const { data: purchase, error } = await supabaseAdmin
    .from('purchases')
    .select('id, buyer_id, type, expires_at, is_active, listing_id, key_preview, listings(id, name, slug, type, status, api_endpoint)')
    .eq('api_key', sha256(rawKey))
    .maybeSingle();

  if (error) throw error;
  if (!purchase) return { status: 401, error: 'Invalid API key.' };
  if (!purchase.is_active) return { status: 401, error: 'This API key has been revoked.' };
  if (purchase.type === 'rent' && purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
    return { status: 401, error: 'This rental has expired. Renew the asset to keep using its key.' };
  }
  if (!purchase.listings) return { status: 404, error: 'The listing for this key no longer exists.' };

  return { purchase };
};

// POST /api/keys/verify — check whether a key is valid (no session auth required)
// Body: { api_key }  or header: x-api-key: mm_...
router.post('/verify', async (req, res) => {
  try {
    const rawKey = extractKey(req);
    const result = await resolveKey(rawKey);
    if (result.error) return res.status(result.status).json({ valid: false, error: result.error });

    const { purchase } = result;
    res.json({
      valid: true,
      key_preview: purchase.key_preview,
      purchase: {
        id: purchase.id,
        type: purchase.type,
        expires_at: purchase.expires_at
      },
      listing: {
        id: purchase.listings.id,
        name: purchase.listings.name,
        slug: purchase.listings.slug,
        type: purchase.listings.type,
        status: purchase.listings.status
      }
    });
  } catch (err) {
    console.error('Key verify error:', err);
    res.status(500).json({ valid: false, error: 'Key verification failed' });
  }
});

// POST /api/keys/invoke — authenticate with the key, then proxy the request
// body to the listing's configured api_endpoint
router.post('/invoke', async (req, res) => {
  try {
    const rawKey = extractKey(req);
    const result = await resolveKey(rawKey);
    if (result.error) return res.status(result.status).json({ valid: false, error: result.error });

    const listing = result.purchase.listings;

    if (!listing.api_endpoint) {
      return res.status(501).json({
        error: `"${listing.name}" has no API endpoint configured yet. The seller must set api_endpoint on the listing.`
      });
    }
    if (listing.status !== 'active') {
      return res.status(409).json({ error: 'This listing is currently unavailable.' });
    }

    try {
      const upstream = await axios.post(
        listing.api_endpoint,
        { input: (req.body && req.body.input !== undefined) ? req.body.input : req.body },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': rawKey,
            'x-meta-listing': listing.slug
          }
        }
      );
      res.status(upstream.status).json(upstream.data);
    } catch (upstreamErr) {
      if (upstreamErr.response) {
        // Forward the upstream service's own error payload
        return res.status(upstreamErr.response.status).json(upstreamErr.response.data);
      }
      console.error('Invoke upstream error:', upstreamErr.message);
      res.status(502).json({ error: 'Upstream model service is unreachable.' });
    }
  } catch (err) {
    console.error('Key invoke error:', err);
    res.status(500).json({ error: 'Invocation failed' });
  }
});

module.exports = router;
