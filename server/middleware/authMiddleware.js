const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create middleware to check JWT token from Authorization header using Supabase
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Initialize an anonymous client to verify the user's specific token
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    
    // optionally fetch profile to attach role
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    req.profile = profile;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error during auth' });
  }
};

const requireSeller = (req, res, next) => {
  if (!req.profile || (req.profile.role !== 'seller' && req.profile.role !== 'both')) {
    return res.status(403).json({ error: 'Forbidden: Requires seller role' });
  }
  next();
};

const requireBuyer = (req, res, next) => {
  if (!req.profile || (req.profile.role !== 'buyer' && req.profile.role !== 'both')) {
    return res.status(403).json({ error: 'Forbidden: Requires buyer role' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.profile || req.profile.is_admin !== true) {
    return res.status(403).json({ error: 'Forbidden: Requires admin privileges' });
  }
  next();
};

module.exports = { requireAuth, requireSeller, requireBuyer, requireAdmin };
