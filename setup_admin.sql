-- Run this in your Supabase SQL Editor

-- 1. Add the is_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Update your specific email to be an admin
-- Replace 'YOUR_EMAIL@EXAMPLE.COM' with your actual login email
UPDATE profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@metamodels.com');
