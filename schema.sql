-- NeuralMarket Supabase Schema

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  display_name text,
  avatar_url text,
  bio text,
  role text CHECK (role IN ('buyer', 'seller', 'both')) DEFAULT 'buyer',
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles trigger on auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'avatar_url', COALESCE(new.raw_user_meta_data->>'role', 'buyer'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Listings 
CREATE TABLE listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  type text CHECK (type IN ('model', 'agent')) NOT NULL,
  description text,
  short_description text,
  capabilities text[] DEFAULT '{}',
  sample_input text,
  sample_output text,
  rent_price numeric DEFAULT 0,
  buy_price numeric DEFAULT 0,
  rent_enabled boolean DEFAULT true,
  buy_enabled boolean DEFAULT false,
  status text CHECK (status IN ('pending', 'active', 'paused', 'rejected')) DEFAULT 'pending',
  ownership_proof_url text,
  model_card_url text,
  architecture_notes text,
  api_endpoint text,
  rating numeric DEFAULT 0,
  total_reviews int DEFAULT 0,
  total_sales int DEFAULT 0,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Purchases
CREATE TABLE purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid REFERENCES profiles(id) NOT NULL,
  listing_id uuid REFERENCES listings(id) NOT NULL,
  type text CHECK (type IN ('rent', 'buy')) NOT NULL,
  price_paid numeric NOT NULL,
  duration_days int,
  expires_at timestamp WITH TIME ZONE,
  api_key text,
  key_preview text,
  is_active boolean DEFAULT true,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- API Keys
CREATE TABLE api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES profiles(id) NOT NULL,
  listing_id uuid REFERENCES listings(id) NOT NULL,
  key_hash text NOT NULL,
  key_preview text NOT NULL,
  expiry_date timestamp WITH TIME ZONE,
  usage_limit int,
  usage_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reviews
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid REFERENCES profiles(id) NOT NULL,
  listing_id uuid REFERENCES listings(id) NOT NULL,
  purchase_id uuid REFERENCES purchases(id) NOT NULL,
  rating int CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  body text,
  created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS setup (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Listings Policies
CREATE POLICY "Listings are viewable by everyone."
  ON listings FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id);

CREATE POLICY "Sellers can manage their own listings."
  ON listings FOR ALL
  USING (auth.uid() = seller_id);

-- Purchases Policies
CREATE POLICY "Buyers can view their own purchases or active rentals."
  ON purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view purchases for their listings."
  ON purchases FOR SELECT
  USING (auth.uid() IN (SELECT seller_id FROM listings WHERE id = purchases.listing_id));

-- Note: Insert and Update of purchases handled by server

-- Api Keys Policies
CREATE POLICY "Sellers can view api_keys for their listings"
  ON api_keys FOR SELECT
  USING (auth.uid() = seller_id);

-- RLS bypass for the server
-- Note: the Node.js backend using service_role will bypass RLS.
