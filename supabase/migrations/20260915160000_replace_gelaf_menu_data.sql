-- كافيه غلاف - استبدال بيانات المنيو الحالية
-- هذه Migration جديدة لأن تعديل Migration قديمة لا يطبق التغييرات على قاعدة بيانات موجودة.
BEGIN;

-- حذف الأصناف أولاً ثم الفئات القديمة.
DELETE FROM products;
DELETE FROM categories;

-- إضافة الفئات الجديدة بدون صور خارجية؛ يمكن رفع صورها لاحقاً من لوحة الإدارة.
INSERT INTO categories (name, description, image_url, display_order, is_visible) VALUES
('القهوة الباردة', 'قهوة ومشروبات باردة منعشة', '', 1, true),
('المشروبات الساخنة', 'تشكيلة من القهوة والمشروبات الساخنة', '', 2, true),
('ميلك شيك', 'ميلك شيك بنكهات متنوعة', '', 3, true),
('الكوكتيلات', 'كوكتيلات منعشة بنكهات متنوعة', '', 4, true),
('موهيتو', 'موهيتو منعش بنكهات متنوعة', '', 5, true),
('العصائر الطبيعية', 'عصائر طازجة وطبيعية', '', 6, true),
('الفراب', 'فراب كريمي بنكهات متنوعة', '', 7, true),
('القهوة المختصة', 'قهوة مختصة محضرة بعناية', '', 8, true),
('الحلويات', 'كريب ووافل وحلويات غلاف', '', 9, true),
('السموزي', 'سموزي فواكه منعش', '', 10, true);

-- إضافة الأصناف الجديدة. الأسعار مؤقتة 25,000 أو 30,000 ل.س ويمكن تعديلها من لوحة الإدارة.

INSERT INTO products (category_id, name, description, price, display_order, is_visible, is_available) VALUES
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس كوفي', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس لاتيه بندق', '', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس لاتيه كراميل', '', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس لاتيه فانيليا', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس سبانش لاتيه', '', 30000, 5, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس لاتيه لوتس', '', 30000, 6, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس لاتيه بستاشيو', '', 30000, 7, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس كراميل ميكاتو', '', 30000, 8, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس موكا', '', 30000, 9, true, true),
((SELECT id FROM categories WHERE name = 'القهوة الباردة' LIMIT 1), 'آيس أمريكانو', '', 25000, 10, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'لاتيه', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'إسبريسو', '', 25000, 2, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'لاتيه بندق', '', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'لاتيه كراميل', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'لاتيه فانيليا', '', 30000, 5, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'سبانش لاتيه', '', 30000, 6, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'لاتيه لوتس', '', 30000, 7, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'لاتيه بستاشيو', '', 30000, 8, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'كابتشينو', '', 30000, 9, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'نسكافيه', '', 25000, 10, true, true),
((SELECT id FROM categories WHERE name = 'المشروبات الساخنة' LIMIT 1), 'هوت شوكليت', '', 30000, 11, true, true),
((SELECT id FROM categories WHERE name = 'ميلك شيك' LIMIT 1), 'ميلك شيك فانيليا', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'ميلك شيك' LIMIT 1), 'ميلك شيك فراولة', '', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'ميلك شيك' LIMIT 1), 'ميلك شيك شوكولا', '', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'ميلك شيك' LIMIT 1), 'ميلك شيك لوتس', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'ميلك شيك' LIMIT 1), 'ميلك شيك بستاشيو', '', 30000, 5, true, true),
((SELECT id FROM categories WHERE name = 'ميلك شيك' LIMIT 1), 'ميلك شيك أوريو', '', 30000, 6, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'كوكتيل فراولة', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'كوكتيل موز وحليب', '', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'كوكتيل أناناس', '', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'كوكتيل غلاف', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'الكوكتيلات' LIMIT 1), 'كوكتيل برتقال', '', 30000, 5, true, true),
((SELECT id FROM categories WHERE name = 'موهيتو' LIMIT 1), 'موهيتو بلو بيري', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'موهيتو' LIMIT 1), 'موهيتو فراولة', '', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'موهيتو' LIMIT 1), 'موهيتو كيوي', '', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'موهيتو' LIMIT 1), 'موهيتو تفاح', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'موهيتو' LIMIT 1), 'موهيتو غلاف', '', 30000, 5, true, true),
((SELECT id FROM categories WHERE name = 'موهيتو' LIMIT 1), 'موهيتو MIX', '', 30000, 6, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير برتقال', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير ليمون', '', 25000, 2, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير ليمون ونعنع', '', 25000, 3, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير منجا', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'العصائر الطبيعية' LIMIT 1), 'عصير فراولة', '', 30000, 5, true, true),
((SELECT id FROM categories WHERE name = 'الفراب' LIMIT 1), 'فراب أوريو', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'الفراب' LIMIT 1), 'فراب فانيليا', '', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'الفراب' LIMIT 1), 'فراب بستاشيو', '', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'الفراب' LIMIT 1), 'فراب لوتس', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'الفراب' LIMIT 1), 'فراب كراميل', '', 30000, 5, true, true),
((SELECT id FROM categories WHERE name = 'القهوة المختصة' LIMIT 1), 'V60 بارد', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'القهوة المختصة' LIMIT 1), 'V60 ساخن', '', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'كريب بنانا لوتس', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'كريب فوتوشيني', '', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'كريب كلاسيك', '', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'كريب فواكه', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'وافل كلاسيك', '', 30000, 5, true, true),
((SELECT id FROM categories WHERE name = 'الحلويات' LIMIT 1), 'وافل غلاف', '', 30000, 6, true, true),
((SELECT id FROM categories WHERE name = 'السموزي' LIMIT 1), 'سموزي فراولة', '', 30000, 1, true, true),
((SELECT id FROM categories WHERE name = 'السموزي' LIMIT 1), 'سموزي غلاف', '', 30000, 2, true, true),
((SELECT id FROM categories WHERE name = 'السموزي' LIMIT 1), 'سموزي بلو بيري', '', 30000, 3, true, true),
((SELECT id FROM categories WHERE name = 'السموزي' LIMIT 1), 'سموزي فواكه', '', 30000, 4, true, true),
((SELECT id FROM categories WHERE name = 'السموزي' LIMIT 1), 'سموزي خوخ', '', 30000, 5, true, true);

COMMIT;

-- المتوقع: 10 فئات و61 صنفاً.