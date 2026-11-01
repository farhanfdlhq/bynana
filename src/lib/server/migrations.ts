/** Migrasi database, berurutan. Jangan ubah migrasi yang sudah jalan di server; tambah yang baru. */
export const MIGRATIONS: { version: string; sql: string }[] = [
	{
		version: '001_init',
		sql: `
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE social_accounts (
  id INTEGER PRIMARY KEY,
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE cards (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('promo', 'link', 'video', 'teks')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  button_label TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image TEXT,
  sort INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE CHECK (number > 0),
  name TEXT NOT NULL DEFAULT '',
  price INTEGER CHECK (price IS NULL OR price >= 0),
  image TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX products_status_number ON products(status, number DESC);
CREATE INDEX products_category ON products(category_id);

CREATE TABLE product_links (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store TEXT NOT NULL CHECK (store IN ('shopee', 'tiktok', 'tokopedia', 'lazada', 'lainnya')),
  url TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  UNIQUE (product_id, url)
);
CREATE INDEX product_links_url ON product_links(url);

CREATE TABLE number_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  max_number INTEGER NOT NULL DEFAULT 0
);
INSERT INTO number_counter (id, max_number) VALUES (1, 0);

CREATE TABLE click_daily (
  target_type TEXT NOT NULL CHECK (target_type IN ('link', 'card', 'account')),
  target_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (target_type, target_id, day)
);

CREATE TABLE admin_user (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE login_attempts (
  key TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX login_attempts_key ON login_attempts(key, at);
`
	}
];
