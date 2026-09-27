require('dotenv').config();
const { supabaseAdmin } = require('./lib/supabaseAdmin');

async function clearAll() {
  console.log("Clearing all reviews...");
  await supabaseAdmin.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Clearing all api_keys...");
  await supabaseAdmin.from('api_keys').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Clearing all purchases...");
  await supabaseAdmin.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Clearing all listings...");
  await supabaseAdmin.from('listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Done.");
}

clearAll();
