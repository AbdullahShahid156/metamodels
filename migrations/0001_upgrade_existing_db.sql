-- MetaModels — upgrade script for EXISTING databases
-- Run this once in the Supabase SQL Editor if your database was created
-- before these columns/constraints existed. Fresh installs only need schema.sql.

-- 1. Admin flag (setup_admin.sql also adds this — IF NOT EXISTS keeps it idempotent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Listing metadata columns collected by the Create Listing form
ALTER TABLE listings ADD COLUMN IF NOT EXISTS version text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS training_details text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS supported_framework text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS use_case text;

-- 3. Listing media columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS showcase_images text[] DEFAULT '{}';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS instruction_doc_url text;

-- 4. Allow type = 'other' (server accepts it; old CHECK constraint did not)
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_type_check;
ALTER TABLE listings ADD CONSTRAINT listings_type_check
  CHECK (type IN ('model', 'agent', 'other'));

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings'
  AND column_name IN ('version', 'training_details', 'supported_framework',
                      'use_case', 'showcase_images', 'instruction_doc_url');
