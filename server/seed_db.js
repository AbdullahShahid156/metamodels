require('dotenv').config();
const { supabaseAdmin } = require('./lib/supabaseAdmin');

async function seed() {
  console.log("Starting seeding of remaining models...");
  
  const { data: users } = await supabaseAdmin.from('profiles').select('id').limit(1);
  if (!users || users.length === 0) {
    console.log("No seller users found!");
    return;
  }
  const sellerId = users[0].id;

  const remainingModels = [
    {
      seller_id: sellerId,
      name: 'Echo Voice Synthesis',
      slug: 'echo-voice',
      description: 'High-fidelity voice cloning from 3 seconds of audio. Supports 29 languages with emotion control and pacing adjustments perfect for dynamic character dialogue.',
      category: 'Audio',
      type: 'model',
      rent_price: 10,
      buy_price: 800,
      status: 'active'
    },
    {
      seller_id: sellerId,
      name: 'CodePilot Agent',
      slug: 'code-pilot',
      description: 'Autonomous coding agent that can write, test, and deploy fullstack applications. Includes deep repository contextualization and auto-refactoring.',
      category: 'Agents',
      type: 'agent',
      rent_price: 30,
      buy_price: 2500,
      status: 'active'
    },
    {
      seller_id: sellerId,
      name: 'DataSage Analytics',
      slug: 'data-sage',
      description: 'Automated data analysis tool that generates insights from raw datasets in seconds. Automatically outputs interactive charts and pivot summaries.',
      category: 'Tools',
      type: 'model',
      rent_price: 20,
      buy_price: 1200,
      status: 'active'
    },
    {
      seller_id: sellerId,
      name: 'MultiModal X',
      slug: 'multimodal-x',
      description: 'Multi-modal AI model handling text, images, and audio in a unified pipeline. The absolute cutting edge in general reasoning capabilities.',
      category: 'LLM',
      type: 'model',
      rent_price: 35,
      buy_price: 3000,
      status: 'active'
    }
  ];

  const slugsToInsert = remainingModels.map(m => m.slug);
  const { data: existing } = await supabaseAdmin.from('listings').select('slug').in('slug', slugsToInsert);
  
  const existingSlugs = existing ? existing.map(e => e.slug) : [];
  const modelsToInsert = remainingModels.filter(m => !existingSlugs.includes(m.slug));

  if (modelsToInsert.length === 0) {
    console.log("All remaining listings already exist, skipping seed.");
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin.from('listings').insert(modelsToInsert).select();
    if (insertError) {
      console.error("Error inserting:", insertError);
    } else {
      console.log("Successfully inserted remaining mock listings:", inserted.length);
    }
  }
}

seed();
