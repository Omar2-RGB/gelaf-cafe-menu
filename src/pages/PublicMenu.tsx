import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Clock,
  MapPin,
  Phone,
  Instagram,
  Share2,
  ArrowRight,
  X,
  Coffee,
  Navigation,
} from 'lucide-react';
import { supabase, type Category, type Product, type Settings } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { CategorySkeleton, ProductSkeleton } from '@/components/Skeleton';

export default function PublicMenu() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { product: Product; categoryName: string }[]
  >([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, categoriesRes, productsRes] = await Promise.all([
        supabase.from('settings').select('*').maybeSingle(),
        supabase
          .from('categories')
          .select('*')
          .eq('is_visible', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('products')
          .select('*, categories!inner(id, name, is_visible)')
          .eq('is_visible', true),
      ]);

      if (settingsRes.data) setSettings(settingsRes.data as Settings);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);

      if (productsRes.data) {
        const hideUnavailable = settingsRes.data?.hide_unavailable ?? true;
        const filtered = (productsRes.data as (Product & {
          categories: { id: string; name: string; is_visible: boolean };
        })[]).filter((p) => {
          if (!p.categories?.is_visible) return false;
          if (hideUnavailable && !p.is_available) return false;
          return true;
        });
        setAllProducts(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  const openCategory = useCallback(async (cat: Category) => {
    setSelectedCategory(cat);
    setProductsLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', cat.id)
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    const hideUnavailable = settings?.hide_unavailable ?? true;
    const filtered = (data as Product[] | null)?.filter((p) =>
      hideUnavailable ? p.is_available : true
    ) ?? [];
    setCategoryProducts(filtered);
    setProductsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [settings]);

  const backToCategories = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setShowSearch(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Search
  const performSearch = useMemo(() => {
    return (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      const lower = query.trim().toLowerCase();
      const results = allProducts
        .filter((p) => p.name.toLowerCase().includes(lower))
        .map((p) => {
          const cat = categories.find((c) => c.id === p.category_id);
          return { product: p, categoryName: cat?.name || '' };
        })
        .slice(0, 30);
      setSearchResults(results);
    };
  }, [allProducts, categories]);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: settings?.cafe_name || 'كافيه غلاف',
          text: 'تصفح قائمة كافيه غلاف',
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const whatsappNumber = settings?.whatsapp?.replace(/[^0-9]/g, '') || '';
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.startsWith('0') ? '963' + whatsappNumber.slice(1) : whatsappNumber}`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950">
        <div className="h-64 bg-stone-800/40 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 space-y-6 pb-20">
          <div className="h-24 w-24 rounded-full bg-stone-700/60 animate-pulse mx-auto" />
          <div className="h-8 w-48 bg-stone-700/60 rounded-lg animate-pulse mx-auto" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[320px] overflow-hidden">
        {settings?.cover_url ? (
          <img
            src={settings.cover_url}
            alt={settings.cafe_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-stone-800 to-stone-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-stone-950" />
      </div>

      {/* Header Info */}
      <div className="max-w-5xl mx-auto px-4 -mt-32 relative z-10 pb-12">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          {settings?.logo_url ? (
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-stone-800 shadow-2xl bg-stone-900">
              <img
                src={settings.logo_url}
                alt={settings.cafe_name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-800 to-stone-900 border-4 border-stone-800 shadow-2xl flex items-center justify-center">
              <Coffee size={48} className="text-amber-400/80" />
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="text-center text-4xl font-bold text-white tracking-tight mb-2">
          {settings?.cafe_name || 'كافيه غلاف'}
        </h1>

        {/* Description */}
        {settings?.description && (
          <p className="text-center text-stone-400 text-sm leading-relaxed max-w-md mx-auto mb-6">
            {settings.description}
          </p>
        )}

        {/* Info Cards */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {settings?.opening_hours && (
            <div className="flex items-center gap-2 bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-full px-4 py-2">
              <Clock size={16} className="text-amber-500" />
              <span className="text-sm text-stone-300">{settings.opening_hours}</span>
            </div>
          )}
          {settings?.address && (
            <div className="flex items-center gap-2 bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-full px-4 py-2">
              <MapPin size={16} className="text-amber-500" />
              <span className="text-sm text-stone-300">{settings.address}</span>
            </div>
          )}
          {settings?.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-2 bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-full px-4 py-2 hover:border-amber-600/50 transition-colors"
            >
              <Phone size={16} className="text-amber-500" />
              <span className="text-sm text-stone-300">{settings.phone}</span>
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {settings?.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105 shadow-lg"
            >
              <Instagram size={18} />
              {settings?.instagram_username || 'إنستغرام'}
            </a>
          )}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105 shadow-lg"
            >
              <Phone size={18} />
              واتساب
            </a>
          )}
          {settings?.maps_url && (
            <a
              href={settings.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105 shadow-lg"
            >
              <Navigation size={18} />
              الموقع
            </a>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 border border-stone-600/50 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105 shadow-lg"
          >
            <Share2 size={18} />
            شارك المنيو
          </button>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search
              size={20}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              placeholder="ابحث عن صنف..."
              className="w-full bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-2xl py-3.5 pr-12 pl-12 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearch(false);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showSearch && searchQuery.trim() && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-3xl overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-stone-500">
                  لا توجد نتائج للبحث
                </div>
              ) : (
                <div className="divide-y divide-stone-800">
                  {searchResults.map(({ product, categoryName }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 hover:bg-stone-800/50 transition-colors cursor-pointer"
                      onClick={() => {
                        const cat = categories.find(
                          (c) => c.id === product.category_id
                        );
                        if (cat) openCategory(cat);
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm">
                          {product.name}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {categoryName}
                        </p>
                      </div>
                      <span className="text-amber-400 font-bold text-sm">
                        {formatPrice(product.price, settings?.currency || 'ل.س')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories or Products */}
        {!selectedCategory && !showSearch && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">الفئات</h2>
            {categories.length === 0 ? (
              <div className="text-center text-stone-500 py-12">
                لا توجد فئات متاحة حالياً
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => openCategory(cat)}
                    className="group relative rounded-3xl overflow-hidden aspect-[4/3] shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-95"
                  >
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center">
                        <Coffee size={40} className="text-amber-500/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 right-0 left-0 p-4 text-right">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-stone-300 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Products View */}
        {selectedCategory && !showSearch && (
          <div>
            <button
              onClick={backToCategories}
              className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors mb-6 text-sm font-medium"
            >
              <ArrowRight size={20} />
              العودة للفئات
            </button>

            <div className="flex items-center gap-4 mb-8">
              {selectedCategory.image_url && (
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                  <img
                    src={selectedCategory.image_url}
                    alt={selectedCategory.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedCategory.name}
                </h2>
                {selectedCategory.description && (
                  <p className="text-sm text-stone-400 mt-1">
                    {selectedCategory.description}
                  </p>
                )}
              </div>
            </div>

            {productsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="text-center text-stone-500 py-12">
                لا توجد أصناف في هذه الفئة حالياً
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                {categoryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between gap-4 bg-stone-900/60 backdrop-blur-sm border border-stone-800/50 rounded-2xl p-4 hover:border-stone-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base mb-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-stone-400 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                      {!product.is_available && (
                        <span className="inline-block mt-2 text-xs font-medium text-red-400 bg-red-950/40 px-2 py-0.5 rounded-full">
                          غير متوفر
                        </span>
                      )}
                    </div>
                    <div className="text-left flex-shrink-0">
                      <span className="text-amber-400 font-bold text-lg whitespace-nowrap">
                        {formatPrice(product.price, settings?.currency || 'ل.س')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {/* Footer */}
{/* Footer */}
<footer className="border-t border-stone-800/50 py-8 text-center">
  <p className="text-stone-500 text-sm">
    {settings?.cafe_name || 'كافيه غلاف'} — جميع الحقوق محفوظة
  </p>

  <p className="text-stone-600 text-xs mt-2">
    هذا المنيو صُمّم وطُوّر بواسطة المهندس عمر شعلان عبد العزيز © 2026
  </p>

  <p className="text-stone-600 text-xs mt-1" dir="ltr">
    0995339401
  </p>
</footer>
    </div>
  );
}
