/*
# Create Café Menu System for كافيه غلاف

## Overview
This migration creates a complete electronic menu system for a Syrian café with:
- Categories (with images, ordering, visibility)
- Products (with pricing, availability, visibility, ordering)
- Settings (café info, branding, contact, hours)
- Storage bucket for image uploads
- Row Level Security policies

## New Tables

### categories
- `id` (uuid, PK)
- `name` (text, not null) — category name in Arabic
- `description` (text) — optional short description
- `image_url` (text) — representative category image URL
- `display_order` (int, default 0) — sort order
- `is_visible` (boolean, default true) — visibility on public menu
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### products
- `id` (uuid, PK)
- `category_id` (uuid, FK → categories.id ON DELETE CASCADE)
- `name` (text, not null) — product name in Arabic
- `description` (text) — optional short description
- `price` (numeric(10,2), not null) — price in Syrian Lira
- `display_order` (int, default 0) — sort order within category
- `is_visible` (boolean, default true) — visibility on public menu
- `is_available` (boolean, default true) — availability (in stock)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### settings
- `id` (uuid, PK, default fixed uuid)
- `cafe_name` (text) — café display name
- `description` (text) — café description
- `logo_url` (text) — logo image URL
- `cover_url` (text) — cover/hero image URL
- `phone` (text) — phone number
- `whatsapp` (text) — WhatsApp number
- `address` (text) — physical address
- `maps_url` (text) — Google Maps link
- `instagram_url` (text) — Instagram profile URL
- `opening_hours` (text) — opening hours display text
- `currency` (text) — currency symbol/label
- `hide_unavailable` (boolean, default true) — hide unavailable items from public menu
- `primary_color` (text) — theme primary color hex
- `updated_at` (timestamptz)

## Security
- RLS enabled on all tables
- Public (anon) can SELECT all rows (menu data is intentionally public)
- Only authenticated users (admin) can INSERT/UPDATE/DELETE
- Storage bucket `cafe-images` is public for reads, authenticated for writes

## Seed Data
- Default settings row for كافيه غلاف
- 7 initial categories with representative images
- Initial products with prices in Syrian Lira
*/

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public can read all categories (menu data is intentionally public)
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- Only authenticated admin can write
DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- ============================================================
-- SETTINGS TABLE (single-row)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  cafe_name text NOT NULL DEFAULT 'كافيه غلاف',
  description text NOT NULL DEFAULT 'كافيه غلاف - أجواء دافئة وقهوة مميزة',
  logo_url text DEFAULT '',
  cover_url text DEFAULT '',
  phone text NOT NULL DEFAULT '0995352960',
  whatsapp text NOT NULL DEFAULT '0995352960',
  address text NOT NULL DEFAULT 'درعا / صيدا / طريق الغارية',
  maps_url text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT 'https://www.instagram.com/gelaf_1',
  opening_hours text NOT NULL DEFAULT 'من 11:00 صباحاً حتى 2:00 ليلاً',
  currency text NOT NULL DEFAULT 'ل.س',
  hide_unavailable boolean NOT NULL DEFAULT true,
  primary_color text NOT NULL DEFAULT '#8B5E3C',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_insert_settings" ON settings;
CREATE POLICY "admin_insert_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS categories_updated_at ON categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA: SETTINGS
-- ============================================================
INSERT INTO settings (id, cafe_name, description, logo_url, cover_url, phone, whatsapp, address, maps_url, instagram_url, opening_hours, currency, hide_unavailable, primary_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'كافيه غلاف',
  'كافيه غلاف - أجواء دافئة وقهوة مميزة في قلب درعا',
  '',
  'https://images.pexels.com/photos/35518412/pexels-photo-35518412.jpeg?auto=compress&cs=tinysrgb&w=1600',
  '0995352960',
  '0995352960',
  'درعا / صيدا / طريق الغارية',
  '',
  'https://www.instagram.com/gelaf_1',
  'من 11:00 صباحاً حتى 2:00 ليلاً',
  'ل.س',
  true,
  '#8B5E3C'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED DATA: CATEGORIES
-- ============================================================
INSERT INTO categories (name, description, image_url, display_order, is_visible) VALUES
(
  'المشروبات الساخنة',
  'تشكيلة من القهوة والمشروبات الساخنة',
  'https://images.pexels.com/photos/30146018/pexels-photo-30146018.jpeg?auto=compress&cs=tinysrgb&w=800',
  1, true
),
(
  'المشروبات الباردة',
  'مشروبات باردة ومنعشة',
  'https://images.pexels.com/photos/4869290/pexels-photo-4869290.jpeg?auto=compress&cs=tinysrgb&w=800',
  2, true
),
(
  'العصائر الطبيعية',
  'عصائر طازجة من الفواكه الطبيعية',
  'https://images.pexels.com/photos/6412584/pexels-photo-6412584.jpeg?auto=compress&cs=tinysrgb&w=800',
  3, true
),
(
  'الكوكتيلات',
  'كوكتيلات منعشة بنكهات متنوعة',
  'https://images.pexels.com/photos/36630828/pexels-photo-36630828.jpeg?auto=compress&cs=tinysrgb&w=800',
  4, true
),
(
  'الشاي والمشروبات العشبية',
  'شاي بنكهات مختلفة ومشروبات عشبية',
  'https://images.pexels.com/photos/34835064/pexels-photo-34835064.jpeg?auto=compress&cs=tinysrgb&w=800',
  5, true
),
(
  'الحلويات',
  'تشكيلة من الحلويات الشهية',
  'https://images.pexels.com/photos/39240989/pexels-photo-39240989.jpeg?auto=compress&cs=tinysrgb&w=800',
  6, true
),
(
  'المأكولات الخفيفة',
  'وجبات خفيفة وسندويشات',
  'https://images.pexels.com/photos/18626291/pexels-photo-18626291.jpeg?auto=compress&cs=tinysrgb&w=800',
  7, true
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: PRODUCTS
-- ============================================================
-- Hot Drinks
INSERT INTO products (category_id, name, description, price, display_order, is_visible, is_available) VALUES
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'قهوة', 'قهوة عربية أصيلة', 25000, 1, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'قهوة مرة', 'قهوة مرة على الطريقة العربية', 25000, 2, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'كابتشينو', 'كابتشينو إيطالي كريمي', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'لاتيه', 'لاتيه بالحليب الطازج', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'إسبريسو', 'إسبريسو مركز', 25000, 5, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'قهوة تركية', 'قهوة تركية تقليدية', 30000, 6, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'قهوة فرنسية', 'قهوة فرنسية بنكهة مميزة', 35000, 7, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'شوكولاتة ساخنة', 'شوكولاتة ساخنة غنية', 35000, 8, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'نسكافيه', 'نسكافيه كلاسيكي', 25000, 9, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'فلان', 'فلان بالكراميل', 30000, 10, true, true)
ON CONFLICT DO NOTHING;

-- Cold Drinks
INSERT INTO products (category_id, name, description, price, display_order, is_visible, is_available) VALUES
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'آيس كوفي', 'قهوة باردة منعشة', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'آيس لاتيه', 'لاتيه بارد', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'آيس كابتشينو', 'كابتشينو بارد', 35000, 3, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'آيس أمريكانو', 'أمريكانو بارد', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'موكا بارد', 'موكا بالشوكولاتة الباردة', 35000, 5, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'كوكا كولا', 'مشروب غازي', 15000, 6, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'بيبسي', 'مشروب غازي', 15000, 7, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'سفن أب', 'مشروب غازي ليموني', 15000, 8, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الباردة' LIMIT 1), 'ماء معدني', 'ماء معدني طبيعي', 10000, 9, true, true)
ON CONFLICT DO NOTHING;

-- Juices
INSERT INTO products (category_id, name, description, price, display_order, is_visible, is_available) VALUES
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير برتقال', 'عصير برتقال طازج', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير ليمون', 'عصير ليمون منعش', 25000, 2, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير فراولة', 'عصير فراولة طبيعي', 35000, 3, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير مانجو', 'عصير مانجو استوائي', 35000, 4, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير أفوكادو', 'عصير أفوكادو غني', 40000, 5, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير موز', 'عصير موز طبيعي', 30000, 6, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير بطيخ', 'عصير بطيخ منعش', 30000, 7, true, true)
ON CONFLICT DO NOTHING;

-- Cocktails
INSERT INTO products (category_id, name, description, price, display_order, is_visible, is_available) VALUES
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'بلو لاغون', 'كوكتيل بلو لاغون المنعش', 40000, 1, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'باشن فروت', 'كوكتيل باشن فروت', 40000, 2, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'موهيتو', 'موهيتو بالنعناع الطازج', 40000, 3, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'كوكتيل فواكه', 'كوكتيل فواكه مشكلة', 45000, 4, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'كوكتيل فراولة', 'كوكتيل فراولة كريمي', 40000, 5, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'كوكتيل مانجو', 'كوكتيل مانجو استوائي', 40000, 6, true, true)
ON CONFLICT DO NOTHING;

-- Tea
INSERT INTO products (category_id, name, description, price, display_order, is_visible, is_available) VALUES
((SELECT id FROM categories WHERE name = 'الشاي والمشروبات العشبية' LIMIT 1), 'شاي أحمر', 'شاي أحمر كلاسيكي', 15000, 1, true, true),
((SELECT id FROM categories WHERE name = 'الشاي والمشروبات العشبية' LIMIT 1), 'شاي أخضر', 'شاي أخضر صحي', 15000, 2, true, true),
((SELECT id FROM categories WHERE name = 'الشاي والمشروبات العشبية' LIMIT 1), 'شاي بالنعناع', 'شاي بالنعناع الطازج', 20000, 3, true, true),
((SELECT id FROM categories WHERE name = 'الشاي والمشروبات العشبية' LIMIT 1), 'شاي بالزعتر', 'شاي بالزعتر العطري', 20000, 4, true, true),
((SELECT id FROM categories WHERE name = 'الشاي والمشروبات العشبية' LIMIT 1), 'يانسون', 'مشروب اليانسون الدافئ', 20000, 5, true, true),
((SELECT id FROM categories WHERE name = 'الشاي والمشروبات العشبية' LIMIT 1), 'بابونج', 'مشروب البابونج المهدئ', 20000, 6, true, true),
((SELECT id FROM categories WHERE name = 'الشاي والمشروبات العشبية' LIMIT 1), 'زنجبيل', 'شاي الزنجبيل المنعش', 20000, 7, true, true)
ON CONFLICT DO NOTHING;

-- Desserts
INSERT INTO products (category_id, name, description, price, display_order, is_visible, is_available) VALUES
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'تشيز كيك', 'تشيز كيك كريمي', 40000, 1, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'كيك الشوكولاتة', 'كيك شوكولاتة غني', 35000, 2, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'براونيز', 'براونيز بالشوكولاتة', 35000, 3, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'كنافة', 'كنافة نابلسية', 40000, 4, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'بقلاوة', 'بقلاوة بالفستق', 35000, 5, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'كريب', 'كريب حلو بالنكهات', 35000, 6, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'واافل', 'واافل بالشوكولاتة والفواكه', 40000, 7, true, true)
ON CONFLICT DO NOTHING;

-- Snacks
INSERT INTO products (category_id, name, description, price, display_order, is_visible, is_available) VALUES
((SELECT id FROM categories WHERE name = 'المأكولات الخفيفة' LIMIT 1), 'سندويش جبنة', 'سندويش جبنة مشوي', 25000, 1, true, true),
((SELECT id FROM categories WHERE name = 'المأكولات الخفيفة' LIMIT 1), 'سندويش شاورما', 'سندويش شاورما دجاج', 40000, 2, true, true),
((SELECT id FROM categories WHERE name = 'المأكولات الخفيفة' LIMIT 1), 'سندويش زعتر', 'سندويش زعتر وزيت', 20000, 3, true, true),
((SELECT id FROM categories WHERE name = 'المأكولات الخفيفة' LIMIT 1), 'كرواسون', 'كرواسون بالزبدة', 25000, 4, true, true),
((SELECT id FROM categories WHERE name = 'المأكولات الخفيفة' LIMIT 1), 'فطيرة', 'فطيرة بالجبنة', 25000, 5, true, true),
((SELECT id FROM categories WHERE name = 'المأكولات الخفيفة' LIMIT 1), 'بطاطس مقلية', 'بطاطس مقلية مقرمشة', 20000, 6, true, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cafe-images', 'cafe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "public_read_cafe_images" ON storage.objects;
CREATE POLICY "public_read_cafe_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'cafe-images');

DROP POLICY IF EXISTS "admin_upload_cafe_images" ON storage.objects;
CREATE POLICY "admin_upload_cafe_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'cafe-images');

DROP POLICY IF EXISTS "admin_update_cafe_images" ON storage.objects;
CREATE POLICY "admin_update_cafe_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'cafe-images') WITH CHECK (bucket_id = 'cafe-images');

DROP POLICY IF EXISTS "admin_delete_cafe_images" ON storage.objects;
CREATE POLICY "admin_delete_cafe_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'cafe-images');
