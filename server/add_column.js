require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumn() {
  // We can't use DDL directly via supabase-js unless we have an RPC like exec_sql.
  // Let's try to fetch if we can execute arbitrary sql.
  const { data, error } = await supabase.rpc('exec_sql', { query: 'ALTER TABLE listings ADD COLUMN IF NOT EXISTS instruction_doc_url TEXT;' });
  console.log("Result:", data, error);
}

addColumn();
