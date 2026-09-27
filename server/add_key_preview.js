/**
 * Migration: Add key_preview column to purchases table
 * Run this ONCE to update your Supabase database schema.
 * 
 * Usage: node add_key_preview.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Adding key_preview column to purchases table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS key_preview text;`
  });

  if (error) {
    // If RPC doesn't exist, the column may need to be added via Supabase Dashboard SQL Editor
    console.log('⚠️  Could not run via RPC (this is normal).');
    console.log('');
    console.log('Please run this SQL in your Supabase Dashboard → SQL Editor:');
    console.log('');
    console.log('  ALTER TABLE purchases ADD COLUMN IF NOT EXISTS key_preview text;');
    console.log('');
    console.log('Dashboard URL: https://supabase.com/dashboard/project/xkuwvwoqkjcvqrrxjqxe/sql');
  } else {
    console.log('✅ Migration complete! key_preview column added.');
  }
}

migrate();
