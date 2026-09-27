const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPurchase() {
  try {
    // Get a buyer
    const { data: users } = await supabaseAdmin.from('profiles').select('id').limit(1);
    const buyer_id = users[0].id;

    // Get a listing
    const { data: listings } = await supabaseAdmin.from('listings').select('id, rent_price').limit(1);
    const listing = listings[0];

    const purchaseData = {
      buyer_id,
      listing_id: listing.id,
      type: 'rent',
      price_paid: listing.rent_price,
      duration_days: 7,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      api_key: 'testhash',
      key_preview: 'testprev...',
      is_active: true
    };

    const { data, error } = await supabaseAdmin
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single();

    if (error) {
      console.log('SUPABASE ERROR:', error);
    } else {
      console.log('SUCCESS:', data);
    }
  } catch (err) {
    console.error('JS ERROR:', err);
  }
}

testPurchase();
