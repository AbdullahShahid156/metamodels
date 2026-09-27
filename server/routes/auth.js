const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../lib/supabaseAdmin');

// POST /api/auth/register
// Creates the user WITHOUT auto-confirming email.
// Supabase will send a 6-digit OTP code to the user's email.
router.post('/register', async (req, res) => {
  const { email, password, displayName, role } = req.body;

  try {
    // Create user with email_confirm: false so Supabase sends a confirmation OTP
    const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // Do NOT auto-confirm — user must verify via OTP
      user_metadata: {
        display_name: displayName,
        role: role
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
      }
      throw error;
    }

    // Now generate the OTP by calling the signUp endpoint.
    // Since user was already created via admin, we use the OTP generation endpoint.
    const { error: otpError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
    });

    // Even if generateLink has an issue, the user is created. 
    // We can also resend OTP from the client side.

    res.status(201).json({
      message: 'User registered. Please check your email for a verification code.',
      requiresVerification: true
    });
  } catch (err) {
    console.error('Registration admin error:', err);
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// POST /api/auth/resend-otp
// Resend the verification OTP to the user's email
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) throw error;
    res.json({ message: 'Verification code resent successfully.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: err.message || 'Failed to resend verification code' });
  }
});

// POST /api/auth/verify-otp
// Verify the 6-digit OTP and confirm the user's email
router.post('/verify-otp', async (req, res) => {
  const { email, token } = req.body;

  try {
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email: email,
      token: token,
      type: 'signup'
    });

    if (error) throw error;

    res.json({ message: 'Email verified successfully!', data });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(400).json({ error: err.message || 'Invalid or expired verification code' });
  }
});

module.exports = router;
