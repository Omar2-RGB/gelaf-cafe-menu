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
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
} from 'lucide-react';

import {
  supabase,
  type Category,
  type Product,
  type Settings,
} from '@/lib/supabase';

import { formatPrice } from '@/lib/format';
import { CategorySkeleton, ProductSkeleton } from '@/components/Skeleton';

type CartItem = Product & {
  quantity: number;
};

export default function PublicMenu() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [categoryProducts, setCategoryProducts] =
    useState<Product[]>([]);

  const [productsLoading, setProductsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [searchResults, setSearchResults] = useState<
    { product: Product; categoryName: string }[]
  >([]);

  const [showSearch, setShowSearch] = useState(false);

  // عداد الزيارات
  const [menuViews, setMenuViews] = useState<number | null>(null);

  // =========================
  // السلة
  // =========================

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    loadData();

    // تسجيل زيارة جديدة
    const recordVisit = async () => {
      const { data, error } = await supabase.rpc(
        'increment_menu_views'
      );

      if (!error && data !== null) {
        setMenuViews(Number(data));
      }
    };

    recordVisit();
  }, []);

  const loadData = async () => {
    try {
      const [settingsRes, categoriesRes, productsRes] =
        await Promise.all([
          supabase
            .from('settings')
            .select('*')
            .maybeSingle(),

          supabase
            .from('categories')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', {
              ascending: true,
            }),

          supabase
            .from('products')
            .select(
              '*, categories!inner(id, name, is_visible)'
            )
            .eq('is_visible', true),
        ]);

      if (settingsRes.data) {
        setSettings(settingsRes.data as Settings);
      }

      if (categoriesRes.data) {
        setCategories(
          categoriesRes.data as Category[]
        );
      }

      if (productsRes.data) {
        const hideUnavailable =
          settingsRes.data?.hide_unavailable ?? true;

        const filtered = (
          productsRes.data as (Product & {
            categories: {
              id: string;
              name: string;
              is_visible: boolean;
            };
          })[]
        ).filter((p) => {
          if (!p.categories?.is_visible) {
            return false;
          }

          if (
            hideUnavailable &&
            !p.is_available
          ) {
            return false;
          }

          return true;
        });

        setAllProducts(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // فتح الفئة
  // =========================

  const openCategory = useCallback(
    async (cat: Category) => {
      setSelectedCategory(cat);
      setProductsLoading(true);

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', cat.id)
        .eq('is_visible', true)
        .order('display_order', {
          ascending: true,
        });

      const hideUnavailable =
        settings?.hide_unavailable ?? true;

      const filtered =
        (data as Product[] | null)?.filter((p) =>
          hideUnavailable
            ? p.is_available
            : true
        ) ?? [];

      setCategoryProducts(filtered);
      setProductsLoading(false);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    },
    [settings]
  );

  const backToCategories = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setShowSearch(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // =========================
  // البحث
  // =========================

  const performSearch = useMemo(() => {
    return (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const lower = query
        .trim()
        .toLowerCase();

      const results = allProducts
        .filter((p) =>
          p.name
            .toLowerCase()
            .includes(lower)
        )
        .map((p) => {
          const cat = categories.find(
            (c) => c.id === p.category_id
          );

          return {
            product: p,
            categoryName: cat?.name || '',
          };
        })
        .slice(0, 30);

      setSearchResults(results);
    };
  }, [allProducts, categories]);

  useEffect(() => {
    const timer = setTimeout(
      () => performSearch(searchQuery),
      200
    );

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // =========================
  // مشاركة المنيو
  // =========================

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title:
            settings?.cafe_name ||
            'كافيه غلاف',

          text: 'تصفح قائمة كافيه غلاف',

          url: window.location.href,
        });
      } catch {
        // المستخدم ألغى المشاركة
      }
    } else {
      navigator.clipboard.writeText(
        window.location.href
      );
    }
  };

  // =========================
  // واتساب
  // =========================

  const whatsappRaw =
    settings?.whatsapp ||
    settings?.phone ||
    '';

  const whatsappNumber =
    whatsappRaw.replace(/[^0-9]/g, '');

  const whatsappLink = whatsappNumber
    ? `https://wa.me/${
        whatsappNumber.startsWith('0')
          ? '963' +
            whatsappNumber.slice(1)
          : whatsappNumber
      }`
    : '';

  // =========================
  // إضافة للسلة
  // =========================

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setShowCart(true);
  };

  // =========================
  // تعديل كمية
  // =========================

  const updateCartQuantity = (
    id: string,
    delta: number
  ) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity + delta,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  // =========================
  // حذف من السلة
  // =========================

  const removeFromCart = (id: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  // =========================
  // حسابات السلة
  // =========================

  const cartCount = cart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum +
      item.price * item.quantity,
    0
  );

  // =========================
  // إرسال الطلب واتساب
  // =========================

  const handleWhatsAppOrder = () => {
    if (!cart.length) return;

    if (!whatsappNumber) {
      alert(
        'رقم واتساب المحل غير مضاف في إعدادات المنيو.'
      );

      return;
    }

    const cafeName =
      settings?.cafe_name ||
      'كافيه غلاف';

    let message =
      `طلب جديد من ${cafeName}\n\n`;

    message += `الطلب:\n`;

    cart.forEach((item, index) => {
      const itemTotal =
        item.price * item.quantity;

      message +=
        `${index + 1}. ${item.name} × ${item.quantity} = ${formatPrice(
          itemTotal,
          settings?.currency || 'ل.س'
        )}\n`;
    });

    message += `\n--------------------\n`;

    message += `الإجمالي: ${formatPrice(
      cartTotal,
      settings?.currency || 'ل.س'
    )}\n`;

    if (customerName.trim()) {
      message += `\nاسم الزبون: ${customerName.trim()}`;
    }

    if (orderNotes.trim()) {
      message += `\nملاحظات: ${orderNotes.trim()}`;
    }

    message +=
      '\n\nتم إرسال الطلب من المنيو الإلكتروني.';

    const encodedMessage =
      encodeURIComponent(message);

    const url = `https://wa.me/${whatsappNumber.startsWith('0')
      ? '963' + whatsappNumber.slice(1)
      : whatsappNumber
    }?text=${encodedMessage}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950">
        <div className="h-64 bg-stone-800/40 animate-pulse" />

        <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 space-y-6 pb-20">
          <div className="h-24 w-24 rounded-full bg-stone-700/60 animate-pulse mx-auto" />

          <div className="h-8 w-48 bg-stone-700/60 rounded-lg animate-pulse mx-auto" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({
              length: 8,
            }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* =========================
          Hero Section
      ========================= */}

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

      {/* =========================
          Header Info
      ========================= */}

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
              <Coffee
                size={48}
                className="text-amber-400/80"
              />
            </div>
          )}
        </div>

        {/* Name */}

        <h1 className="text-center text-4xl font-bold text-white tracking-tight mb-2">
          {settings?.cafe_name ||
            'كافيه غلاف'}
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
              <Clock
                size={16}
                className="text-amber-500"
              />

              <span className="text-sm text-stone-300">
                {settings.opening_hours}
              </span>
            </div>
          )}

          {settings?.address && (
            <div className="flex items-center gap-2 bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-full px-4 py-2">
              <MapPin
                size={16}
                className="text-amber-500"
              />

              <span className="text-sm text-stone-300">
                {settings.address}
              </span>
            </div>
          )}

          {settings?.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-2 bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-full px-4 py-2 hover:border-amber-600/50 transition-colors"
            >
              <Phone
                size={16}
                className="text-amber-500"
              />

              <span className="text-sm text-stone-300">
                {settings.phone}
              </span>
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

              {settings?.instagram_username ||
                'إنستغرام'}
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

        {/* =========================
            Search
        ========================= */}

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
                setSearchQuery(
                  e.target.value
                );
                setShowSearch(true);
              }}
              onFocus={() =>
                setShowSearch(true)
              }
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

        {/* =========================
            Search Results
        ========================= */}

        {showSearch &&
          searchQuery.trim() && (
            <div className="max-w-2xl mx-auto mb-8">

              <div className="bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-3xl overflow-hidden">

                {searchResults.length === 0 ? (
                  <div className="p-8 text-center text-stone-500">
                    لا توجد نتائج للبحث
                  </div>
                ) : (
                  <div className="divide-y divide-stone-800">

                    {searchResults.map(
                      ({
                        product,
                        categoryName,
                      }) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-4 hover:bg-stone-800/50 transition-colors cursor-pointer"
                          onClick={() => {
                            const cat =
                              categories.find(
                                (c) =>
                                  c.id ===
                                  product.category_id
                              );

                            if (cat) {
                              openCategory(cat);
                            }

                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex-1 min-w-0">

                            <h4 className="font-semibold text-white text-sm">
                              {product.name}
                            </h4>

                            <p className="text-xs text-stone-500 mt-0.5">
                              {categoryName}
                            </p>

                          </div>

                          <div className="flex flex-col items-end gap-2">

                            <span className="text-amber-400 font-bold text-sm">
                              {formatPrice(
                                product.price,
                                settings?.currency ||
                                  'ل.س'
                              )}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                            >
                              <Plus size={14} />
                              طلب
                            </button>

                          </div>
                        </div>
                      )
                    )}

                  </div>
                )}

              </div>
            </div>
          )}

        {/* =========================
            Categories
        ========================= */}

        {!selectedCategory &&
          !showSearch && (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">
                الفئات
              </h2>

              {categories.length === 0 ? (
                <div className="text-center text-stone-500 py-12">
                  لا توجد فئات متاحة حالياً
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        openCategory(cat)
                      }
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
                          <Coffee
                            size={40}
                            className="text-amber-500/50"
                          />
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

        {/* =========================
            Products
        ========================= */}

        {selectedCategory &&
          !showSearch && (
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
                      src={
                        selectedCategory.image_url
                      }
                      alt={
                        selectedCategory.name
                      }
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
                      {
                        selectedCategory.description
                      }
                    </p>
                  )}
                </div>
              </div>

              {productsLoading ? (
                <div className="space-y-3">
                  {Array.from({
                    length: 5,
                  }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center text-stone-500 py-12">
                  لا توجد أصناف في هذه الفئة حالياً
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">

                  {categoryProducts.map(
                    (product) => (
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
                              {
                                product.description
                              }
                            </p>
                          )}

                          {!product.is_available && (
                            <span className="inline-block mt-2 text-xs font-medium text-red-400 bg-red-950/40 px-2 py-0.5 rounded-full">
                              غير متوفر
                            </span>
                          )}

                        </div>

                        <div className="text-left flex-shrink-0 flex flex-col items-end gap-2">

                          <span className="text-amber-400 font-bold text-lg whitespace-nowrap">
                            {formatPrice(
                              product.price,
                              settings?.currency ||
                                'ل.س'
                            )}
                          </span>

                          <button
                            onClick={() =>
                              addToCart(product)
                            }
                            className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-amber-900/20"
                          >
                            <Plus size={16} />
                            طلب
                          </button>

                        </div>
                      </div>
                    )
                  )}

                </div>
              )}
            </div>
          )}
      </div>

      {/* =========================
          Floating Cart Button
      ========================= */}

      {cartCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-5 left-4 z-50 flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-3.5 rounded-full shadow-2xl shadow-black/40 font-bold transition-all active:scale-95"
        >
          <ShoppingBag size={21} />

          <span>
            السلة
          </span>

          <span className="min-w-6 h-6 px-1.5 rounded-full bg-white text-amber-700 flex items-center justify-center text-xs font-black">
            {cartCount}
          </span>
        </button>
      )}

      {/* =========================
          Cart Modal
      ========================= */}

      {showCart && (
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={() =>
            setShowCart(false)
          }
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-stone-950 border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl"
          >

            {/* Cart Header */}

            <div className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 px-5 py-4 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-amber-600/15 flex items-center justify-center">
                  <ShoppingBag
                    size={21}
                    className="text-amber-500"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    سلة الطلب
                  </h2>

                  <p className="text-xs text-stone-500">
                    {cartCount} صنف
                  </p>
                </div>

              </div>

              <button
                onClick={() =>
                  setShowCart(false)
                }
                className="w-10 h-10 rounded-full bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-5">

              {/* Cart Items */}

              <div className="space-y-3">

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-stone-900 border border-stone-800 rounded-2xl p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex-1 min-w-0">

                        <h3 className="font-bold text-white">
                          {item.name}
                        </h3>

                        <p className="text-sm text-amber-400 mt-1 font-bold">
                          {formatPrice(
                            item.price,
                            settings?.currency ||
                              'ل.س'
                          )}
                        </p>

                      </div>

                      <button
                        onClick={() =>
                          removeFromCart(
                            item.id
                          )
                        }
                        className="text-stone-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                    <div className="flex items-center justify-between mt-4">

                      <span className="text-xs text-stone-500">
                        المجموع
                      </span>

                      <span className="text-sm font-bold text-white">
                        {formatPrice(
                          item.price *
                            item.quantity,
                          settings?.currency ||
                            'ل.س'
                        )}
                      </span>

                      <div className="flex items-center gap-2 bg-stone-800 rounded-xl p-1">

                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.id,
                              -1
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-stone-700 hover:bg-stone-600 flex items-center justify-center transition-colors"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="w-7 text-center font-bold">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.id,
                              1
                            )
                          }
                          className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-500 flex items-center justify-center transition-colors"
                        >
                          <Plus size={15} />
                        </button>

                      </div>

                    </div>

                  </div>
                ))}

              </div>

              {/* Customer Name */}

              <div className="mt-6">

                <label className="block text-sm font-medium text-stone-300 mb-2">
                  اسم الزبون
                  <span className="text-stone-600 font-normal">
                    {' '}
                    (اختياري)
                  </span>
                </label>

                <input
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  placeholder="مثلاً: أحمد"
                  className="w-full bg-stone-900 border border-stone-800 focus:border-amber-600 rounded-xl px-4 py-3 text-white placeholder-stone-600 outline-none transition-colors"
                />

              </div>

              {/* Notes */}

              <div className="mt-4">

                <label className="block text-sm font-medium text-stone-300 mb-2">
                  ملاحظات الطلب
                  <span className="text-stone-600 font-normal">
                    {' '}
                    (اختياري)
                  </span>
                </label>

                <textarea
                  value={orderNotes}
                  onChange={(e) =>
                    setOrderNotes(
                      e.target.value
                    )
                  }
                  placeholder="مثلاً: بدون سكر، أو أي ملاحظة..."
                  rows={3}
                  className="w-full bg-stone-900 border border-stone-800 focus:border-amber-600 rounded-xl px-4 py-3 text-white placeholder-stone-600 outline-none transition-colors resize-none"
                />

              </div>

              {/* Total */}

              <div className="mt-6 bg-stone-900 border border-stone-800 rounded-2xl p-4">

                <div className="flex items-center justify-between">

                  <span className="text-stone-400">
                    الإجمالي
                  </span>

                  <span className="text-2xl font-black text-amber-400">
                    {formatPrice(
                      cartTotal,
                      settings?.currency ||
                        'ل.س'
                    )}
                  </span>

                </div>

              </div>

              {/* WhatsApp Button */}

              <button
                onClick={
                  handleWhatsAppOrder
                }
                disabled={!cart.length}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-lg shadow-green-950/20"
              >
                <MessageCircle
                  size={21}
                />

                إرسال الطلب عبر واتساب
              </button>

              <p className="text-center text-xs text-stone-600 mt-3">
                سيتم فتح واتساب وإرسال الطلب مباشرة إلى المحل
              </p>

            </div>
          </div>
        </div>
      )}

      {/* =========================
          Footer
      ========================= */}

      <footer className="border-t border-stone-800/50 py-8 text-center">

        <p className="text-stone-500 text-sm">
          {settings?.cafe_name ||
            'كافيه غلاف'}{' '}
          — جميع الحقوق محفوظة
        </p>

        <p className="text-stone-600 text-xs mt-2">
          هذا المنيو صُمّم وطُوّر بواسطة المهندس عمر شعلان عبد العزيز © 2026
        </p>

        <p
          className="text-stone-600 text-xs mt-1"
          dir="ltr"
        >
          0995339401
        </p>

        {/* رقم عداد الزيارات */}

        {menuViews !== null && (
          <p
            className="text-stone-700 text-xs mt-1"
            dir="ltr"
          >
            {menuViews.toLocaleString(
              'en-US'
            )}
          </p>
        )}

      </footer>
    </div>
  );
}
