/**
 * Migration: Add showcase_images column to listings table
 * Run this ONCE to update your Supabase database schema.
 * 
 * Usage: node add_showcase_images.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Adding showcase_images column to listings table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE listings ADD COLUMN IF NOT EXISTS showcase_images text[] DEFAULT '{}';`
  });

  if (error) {
    console.log('⚠️  Could not run via RPC (this is normal).');
    console.log('');
    console.log('Please run this SQL in your Supabase Dashboard → SQL Editor:');
    console.log('');
    console.log("  ALTER TABLE listings ADD COLUMN IF NOT EXISTS showcase_images text[] DEFAULT '{}';");
    console.log('');
    console.log('Dashboard URL: https://supabase.com/dashboard/project/xkuwvwoqkjcvqrrxjqxe/sql');
  } else {
    console.log('✅ Migration complete! showcase_images column added.');
  }
}

migrate();
