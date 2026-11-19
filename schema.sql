CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (
    category IN (
      'Peralatan Rumah Tangga',
      'Buku',
      'Perlengkapan Kamar',
      'Barang Elektronik',
      'Lainnya'
    )
  ),
  condition INT NOT NULL CHECK (condition >= 1 AND condition <= 5),
  price INT NOT NULL DEFAULT 0 CHECK (price >= 0),
  estimated_weight_kg NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (estimated_weight_kg > 0),
  fallback_plan TEXT NOT NULL CHECK (
    fallback_plan IN ('Akan dibuang', 'Disimpan di kos', 'Lainnya')
  ),
  location TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  is_itb BOOLEAN NOT NULL DEFAULT FALSE,
  seller_wa TEXT NOT NULL,
  pin TEXT NOT NULL CHECK (char_length(pin) = 4),
  status TEXT NOT NULL DEFAULT 'Tersedia' CHECK (
    status IN ('Tersedia', 'Dalam Proses', 'Sudah Tersalurkan')
  ),
  buyer_name TEXT,
  buyer_wa TEXT,
  image_data TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);