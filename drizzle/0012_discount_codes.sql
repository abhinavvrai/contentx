ALTER TABLE payment_orders ADD COLUMN subtotal_paise INTEGER;
ALTER TABLE payment_orders ADD COLUMN coupon_code TEXT;
ALTER TABLE payment_orders ADD COLUMN discount_paise INTEGER NOT NULL DEFAULT 0;
ALTER TABLE payment_orders ADD COLUMN affiliate_name TEXT;
ALTER TABLE payment_orders ADD COLUMN affiliate_email TEXT;
ALTER TABLE payment_orders ADD COLUMN commission_percent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE payment_orders ADD COLUMN commission_paise INTEGER NOT NULL DEFAULT 0;

CREATE TABLE discount_codes (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  assigned_customer_email TEXT,
  affiliate_name TEXT,
  affiliate_email TEXT,
  commission_percent INTEGER NOT NULL DEFAULT 0 CHECK (commission_percent BETWEEN 0 AND 100),
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER,
  created_by_email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE discount_redemptions (
  id TEXT PRIMARY KEY NOT NULL,
  discount_code_id TEXT NOT NULL REFERENCES discount_codes(id),
  razorpay_order_id TEXT NOT NULL UNIQUE REFERENCES payment_orders(razorpay_order_id),
  customer_email TEXT NOT NULL,
  discount_paise INTEGER NOT NULL,
  commission_paise INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'earned',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_discount_codes_status ON discount_codes(status, updated_at);
CREATE INDEX idx_discount_redemptions_code ON discount_redemptions(discount_code_id, status, created_at);
