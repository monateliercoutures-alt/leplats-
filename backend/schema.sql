-- TonMenu shared API — run once in the Neon SQL Editor before deploying the API.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'maquis',
  cuisine text NOT NULL DEFAULT 'Cuisine ivoirienne',
  description text NOT NULL DEFAULT '',
  phone text NOT NULL,
  email text,
  commune text NOT NULL,
  address text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  image text NOT NULL DEFAULT 'story-meal.webp',
  rating numeric(2,1) NOT NULL DEFAULT 0,
  eta integer NOT NULL DEFAULT 25,
  delivery_fee integer NOT NULL DEFAULT 800,
  free_delivery boolean NOT NULL DEFAULT false,
  is_open boolean NOT NULL DEFAULT false,
  approval_status text NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft','pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','manager','kitchen')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Maquis',
  description text NOT NULL DEFAULT '',
  price integer NOT NULL CHECK (price >= 0),
  image text NOT NULL DEFAULT 'plats-sauce.webp',
  available boolean NOT NULL DEFAULT true,
  popular boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dishes_restaurant_available_idx ON dishes(restaurant_id, available);

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  detail text NOT NULL DEFAULT '',
  starts_at date,
  ends_at date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, code)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigserial UNIQUE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  mode text NOT NULL DEFAULT 'Livraison TonMenu Express',
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending_verification' CHECK (payment_status IN ('pending_verification','paid','cash_due','not_received')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','preparing','ready','delivery','done','cancelled')),
  items jsonb NOT NULL,
  total integer NOT NULL CHECK (total >= 0),
  note text NOT NULL DEFAULT '',
  prep_minutes integer,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_restaurant_created_idx ON orders(restaurant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  partner_reply text,
  created_at timestamptz NOT NULL DEFAULT now()
);
