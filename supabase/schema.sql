-- مكتبة المصباح - Supabase schema
-- Run this in Supabase Dashboard → SQL Editor

-- Books
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  author TEXT DEFAULT '',
  category TEXT DEFAULT '',
  editor TEXT DEFAULT '',
  parts INTEGER DEFAULT 1,
  publisher TEXT DEFAULT '',
  year TEXT DEFAULT '',
  copies INTEGER DEFAULT 1,
  status TEXT DEFAULT 'متاح',
  cabinet TEXT DEFAULT '',
  shelf TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Members
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Loans
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loan_date DATE,
  return_date DATE,
  status TEXT DEFAULT 'معار',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Diary entries
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT (current_date),
  category TEXT DEFAULT 'أخرى',
  details TEXT DEFAULT '',
  images TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories (simple list)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Publishers (simple list)
CREATE TABLE IF NOT EXISTS publishers (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Enable Row Level Security (optional; allow anon read/write for now)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;

-- Policies: allow anon to do everything (for app using anon key)
CREATE POLICY "Allow anon all on books" ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on loans" ON loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on diary_entries" ON diary_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on publishers" ON publishers FOR ALL USING (true) WITH CHECK (true);

-- Seed default categories
INSERT INTO categories (name) VALUES
  ('تفسير'), ('حديث'), ('فقه'), ('عقيدة'), ('سيرة'), ('تاريخ'), ('لغة عربية'), ('أدب'), ('تزكية'), ('عام')
ON CONFLICT (name) DO NOTHING;

-- Seed default publishers
INSERT INTO publishers (name) VALUES
  ('دار السلام'), ('دار الكتب العلمية'), ('مؤسسة الرسالة'), ('دار ابن كثير'), ('دار المعرفة'), ('دار التراث العربي'), ('أخرى')
ON CONFLICT (name) DO NOTHING;
