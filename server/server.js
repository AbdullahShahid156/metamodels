require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api/listings', require('./routes/listings'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/apikeys', require('./routes/apikeys'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ipfs', require('./routes/ipfs'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Periodic task to mark expired api_keys/purchases as inactive
const { supabaseAdmin } = require('./lib/supabaseAdmin');
setInterval(async () => {
    try {
        const now = new Date().toISOString();
        
        // Deactivate expired purchases
        await supabaseAdmin
            .from('purchases')
            .update({ is_active: false })
            .eq('is_active', true)
            .lt('expires_at', now);
            
        // Deactivate expired API keys
        await supabaseAdmin
            .from('api_keys')
            .update({ is_active: false })
            .eq('is_active', true)
            .lt('expiry_date', now);
            
    } catch(err) {
        console.error("Error in expiration cleanup interval", err);
    }
}, 1000 * 60 * 60); // Run every hour

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
