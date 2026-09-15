import { useEffect, useState, useCallback } from 'react';
import {
  Save,
  Upload,
  X,
  Coffee,
  Image as ImageIcon,
  Store,
  Phone,
  MapPin,
  Clock,
  Instagram,
  Palette,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { supabase, type Settings as SettingsType } from '@/lib/supabase';
import { uploadImage, deleteImage } from '@/lib/upload';
import { useToast } from '@/components/Toast';

export default function Settings() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [replacingMenu, setReplacingMenu] = useState(false);

  const gelafMenu = [
    { name: 'القهوة الباردة', description: 'قهوة باردة ومنعشة', products: [
      'آيس كوفي', 'آيس لاتيه بندق', 'آيس لاتيه كراميل', 'آيس لاتيه فانيليا', 'آيس سبانش لاتيه',
      'آيس لاتيه لوتس', 'آيس لاتيه بستاشيو', 'آيس كراميل ميكاتو', 'آيس موكا', 'آيس أمريكانو',
    ]},
    { name: 'المشروبات الساخنة', description: 'قهوة ومشروبات ساخنة', products: [
      'لاتيه', 'إسبريسو', 'لاتيه بندق', 'لاتيه كراميل', 'لاتيه فانيليا', 'سبانش لاتيه',
      'لاتيه لوتس', 'لاتيه بستاشيو', 'كابتشينو', 'نسكافيه', 'هوت شوكليت',
    ]},
    { name: 'ميلك شيك', description: 'ميلك شيك بنكهات متنوعة', products: [
      'ميلك شيك فانيليا', 'ميلك شيك فراولة', 'ميلك شيك شوكولا', 'ميلك شيك لوتس', 'ميلك شيك بستاشيو', 'ميلك شيك أوريو',
    ]},
    { name: 'الكوكتيلات', description: 'كوكتيلات منعشة بنكهات متنوعة', products: [
      'كوكتيل فراولة', 'كوكتيل موز وحليب', 'كوكتيل أناناس', 'كوكتيل غلاف', 'كوكتيل برتقال',
    ]},
    { name: 'موهيتو', description: 'موهيتو منعش بنكهات متنوعة', products: [
      'موهيتو بلو بيري', 'موهيتو فراولة', 'موهيتو كيوي', 'موهيتو تفاح', 'موهيتو غلاف', 'موهيتو MIX',
    ]},
    { name: 'العصائر الطبيعية', description: 'عصائر طازجة وطبيعية', products: [
      'عصير برتقال', 'عصير ليمون', 'عصير ليمون ونعنع', 'عصير منجا', 'عصير فراولة',
    ]},
    { name: 'الفراب', description: 'فراب كريمي بنكهات متنوعة', products: [
      'فراب أوريو', 'فراب فانيليا', 'فراب بستاشيو', 'فراب لوتس', 'فراب كراميل',
    ]},
    { name: 'القهوة المختصة', description: 'قهوة مختصة محضرة بعناية', products: ['V60 بارد', 'V60 ساخن']},
    { name: 'الحلويات', description: 'كريب ووافل وحلويات غلاف', products: [
      'كريب بنانا لوتس', 'كريب فوتوشيني', 'كريب كلاسيك', 'كريب فواكه', 'وافل كلاسيك', 'وافل غلاف',
    ]},
    { name: 'السموزي', description: 'سموزي فواكه منعش', products: [
      'سموزي فراولة', 'سموزي غلاف', 'سموزي بلو بيري', 'سموزي فواكه', 'سموزي خوخ',
    ]},
  ];

  const replaceMenu = async () => {
    if (!window.confirm('سيتم حذف الفئات والأصناف الحالية واستبدالها بمنيو غلاف الجديدة. هل تريد المتابعة؟')) return;
    setReplacingMenu(true);

    try {
      const { error: deleteProductsError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteProductsError) throw deleteProductsError;

      const { error: deleteCategoriesError } = await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteCategoriesError) throw deleteCategoriesError;

      for (let categoryIndex = 0; categoryIndex < gelafMenu.length; categoryIndex++) {
        const category = gelafMenu[categoryIndex];
        const { data: createdCategory, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: category.name,
            description: category.description,
            image_url: '',
            display_order: categoryIndex + 1,
            is_visible: true,
          })
          .select('id')
          .single();

        if (categoryError || !createdCategory) throw categoryError || new Error('فشل إنشاء الفئة');

        const productRows = category.products.map((name, index) => ({
          category_id: createdCategory.id,
          name,
          description: '',
          price: name === 'إسبريسو' || name === 'نسكافيه' || name === 'آيس أمريكانو' || name === 'عصير ليمون' || name === 'عصير ليمون ونعنع' ? 25000 : 30000,
          display_order: index + 1,
          is_visible: true,
          is_available: true,
        }));

        const { error: productsError } = await supabase.from('products').insert(productRows);
        if (productsError) throw productsError;
      }

      showToast('تم استبدال المنيو بنجاح: 10 فئات و61 صنف', 'success');
    } catch (error) {
      console.error('replaceMenu error:', error);
      showToast(error instanceof Error ? `فشل تحديث المنيو: ${error.message}` : 'فشل تحديث المنيو', 'error');
    } finally {
      setReplacingMenu(false);
    }
  };

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*').maybeSingle();
    if (data) {
      setSettings(data as SettingsType);
      setLogoPreview(data.logo_url || '');
      setCoverPreview(data.cover_url || '');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const update = (field: keyof SettingsType, value: string | boolean) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    update('logo_url', '');
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    update('cover_url', '');
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    let logoUrl = settings.logo_url;
    let coverUrl = settings.cover_url;

    if (logoFile) {
      const { url, error } = await uploadImage(logoFile, 'logo');
      if (!error && url) {
        if (settings.logo_url) await deleteImage(settings.logo_url);
        logoUrl = url;
      }
    }

    if (coverFile) {
      const { url, error } = await uploadImage(coverFile, 'cover');
      if (!error && url) {
        if (settings.cover_url) await deleteImage(settings.cover_url);
        coverUrl = url;
      }
    }

    const { error } = await supabase
      .from('settings')
      .update({
        cafe_name: settings.cafe_name,
        description: settings.description,
        logo_url: logoUrl,
        cover_url: coverUrl,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        address: settings.address,
        maps_url: settings.maps_url,
        instagram_url: settings.instagram_url,
        instagram_username: settings.instagram_username,
        opening_hours: settings.opening_hours,
        currency: settings.currency,
        hide_unavailable: settings.hide_unavailable,
        primary_color: settings.primary_color,
      })
      .eq('id', settings.id);

    if (error) {
      showToast('فشل حفظ الإعدادات', 'error');
    } else {
      showToast('تم حفظ الإعدادات بنجاح', 'success');
      setLogoFile(null);
      setCoverFile(null);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={18} />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>

      {/* Branding Section */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette size={20} className="text-amber-400" />
          <h2 className="text-lg font-bold">الهوية والصور</h2>
        </div>

        {/* Logo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-300 mb-3">
            شعار الكافيه
          </label>
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-stone-700 flex-shrink-0">
                <img
                  src={logoPreview}
                  alt="شعار"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors">
                  <Upload size={16} />
                  تغيير الشعار
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={removeLogo}
                  className="flex items-center gap-2 bg-red-950/40 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <X size={16} />
                  حذف الشعار
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-stone-700 cursor-pointer hover:border-amber-600/50 transition-colors">
              <Coffee size={24} className="text-stone-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Cover */}
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-3">
            صورة الغلاف
          </label>
          {coverPreview ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={coverPreview}
                alt="غلاف"
                className="w-full aspect-[16/9] object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <label className="flex items-center gap-2 bg-stone-900/80 backdrop-blur-sm hover:bg-stone-800 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors">
                  <Upload size={16} />
                  تغيير
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={removeCover}
                  className="flex items-center gap-2 bg-red-900/80 backdrop-blur-sm hover:bg-red-800 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <X size={16} />
                  حذف
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-[16/9] border-2 border-dashed border-stone-700 rounded-2xl cursor-pointer hover:border-amber-600/50 transition-colors">
              <div className="flex flex-col items-center gap-2 text-stone-500">
                <ImageIcon size={28} />
                <span className="text-sm">اختر صورة الغلاف</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Café Info Section */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Store size={20} className="text-amber-400" />
          <h2 className="text-lg font-bold">معلومات الكافيه</h2>
        </div>

        <div className="space-y-4">
          {/* Café Name */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              اسم الكافيه
            </label>
            <input
              type="text"
              value={settings?.cafe_name || ''}
              onChange={(e) => update('cafe_name', e.target.value)}
              className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-600/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              وصف الكافيه
            </label>
            <textarea
              value={settings?.description || ''}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-600/50 resize-none"
            />
          </div>

          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                />
                <input
                  type="text"
                  value={settings?.phone || ''}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-amber-600/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                رقم واتساب
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                />
                <input
                  type="text"
                  value={settings?.whatsapp || ''}
                  onChange={(e) => update('whatsapp', e.target.value)}
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-amber-600/50"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              العنوان
            </label>
            <div className="relative">
              <MapPin
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                type="text"
                value={settings?.address || ''}
                onChange={(e) => update('address', e.target.value)}
                className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-amber-600/50"
              />
            </div>
          </div>

          {/* Maps URL */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              رابط Google Maps
            </label>
            <input
              type="url"
              value={settings?.maps_url || ''}
              onChange={(e) => update('maps_url', e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50"
            />
          </div>

          {/* Instagram URL & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                رابط Instagram
              </label>
              <div className="relative">
                <Instagram
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                />
                <input
                  type="url"
                  value={settings?.instagram_url || ''}
                  onChange={(e) => update('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 pr-11 pl-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                اسم مستخدم Instagram
              </label>
              <input
                type="text"
                value={settings?.instagram_username || ''}
                onChange={(e) => update('instagram_username', e.target.value)}
                placeholder="@gelaf_1"
                className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50"
              />
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              أوقات الدوام
            </label>
            <div className="relative">
              <Clock
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                type="text"
                value={settings?.opening_hours || ''}
                onChange={(e) => update('opening_hours', e.target.value)}
                className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 pr-11 pl-4 text-white focus:outline-none focus:border-amber-600/50"
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              العملة
            </label>
            <input
              type="text"
              value={settings?.currency || ''}
              onChange={(e) => update('currency', e.target.value)}
              className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-600/50"
            />
          </div>
        </div>
      </div>

      {/* Menu Data */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={20} className="text-amber-400" />
          <h2 className="text-lg font-bold">بيانات المنيو</h2>
        </div>
        <p className="text-sm text-stone-400 mb-5 leading-7">
          استبدل الفئات والأصناف الحالية بقائمة كافيه غلاف الجديدة. الأسعار مؤقتة ويمكن تعديلها لاحقًا من قسم الأصناف.
        </p>
        <button
          type="button"
          onClick={replaceMenu}
          disabled={replacingMenu}
          className="flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {replacingMenu ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              جاري استبدال المنيو...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              استبدال المنيو بقائمة غلاف الجديدة
            </>
          )}
        </button>
      </div>

      {/* Menu Display Settings */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Eye size={20} className="text-amber-400" />
          <h2 className="text-lg font-bold">إعدادات العرض</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-stone-300">
              إخفاء الأصناف غير المتوفرة من القائمة
            </p>
            <p className="text-xs text-stone-500 mt-1">
              عند التفعيل، لن تظهر الأصناف غير المتوفرة للزبائن
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              update('hide_unavailable', !settings?.hide_unavailable)
            }
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
              settings?.hide_unavailable ? 'bg-amber-600' : 'bg-stone-700'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                settings?.hide_unavailable ? 'right-0.5' : 'right-6'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button at bottom */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-2xl"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={18} />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </div>
  );
}
