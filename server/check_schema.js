require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_schema');
  // Alternatively, just query one row to see all columns
  const { data: row, error: rowError } = await supabase.from('listings').select('*').limit(1);
  if (row && row.length > 0) {
    console.log("Columns:", Object.keys(row[0]));
  } else {
    console.log("No rows, cannot infer schema this way.");
  }
}

checkSchema();
