require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDb() {
  const tables = ['profiles', 'listings', 'purchases', 'api_keys', 'reviews'];
  let allGood = true;

  for (const table of tables) {
    // Try to select a single row to see if the table exists
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table missing or error on '${table}':`, error.message);
      allGood = false;
    } else {
      console.log(`✅ Table '${table}' exists and is accessible.`);
    }
  }

  if (allGood) {
    console.log("SUCCESS: All required tables are present!");
  } else {
    console.log("FAILED: Some tables are missing. Please run schema.sql in Supabase.");
  }
}

checkDb();
