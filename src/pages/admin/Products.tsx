import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Package,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  supabase,
  type Category,
  type Product,
} from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ProductSkeleton } from '@/components/Skeleton';

export default function Products() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    display_order: 0,
    is_visible: true,
    is_available: true,
  });
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*').order('display_order', {
        ascending: true,
      }),
      supabase.from('categories').select('*').order('display_order', {
        ascending: true,
      }),
    ]);

    setProducts((prodRes.data as Product[]) || []);
    setCategories((catRes.data as Category[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openAddForm = () => {
    setEditing(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: categories[0]?.id || '',
      display_order: 0,
      is_visible: true,
      is_available: true,
    });
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditing(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      category_id: product.category_id,
      display_order: product.display_order,
      is_visible: product.is_visible,
      is_available: product.is_available,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('يرجى إدخال اسم الصنف', 'error');
      return;
    }
    if (!formData.category_id) {
      showToast('يرجى اختيار الفئة', 'error');
      return;
    }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      showToast('يرجى إدخال سعر صحيح', 'error');
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      category_id: formData.category_id,
      display_order: formData.display_order,
      is_visible: formData.is_visible,
      is_available: formData.is_available,
    };

    if (editing) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editing.id);
      if (error) {
        showToast('فشل تحديث الصنف', 'error');
      } else {
        showToast('تم تعديل الصنف بنجاح', 'success');
        setShowForm(false);
        loadProducts();
      }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) {
        showToast('فشل إضافة الصنف', 'error');
      } else {
        showToast('تمت إضافة الصنف بنجاح', 'success');
        setShowForm(false);
        loadProducts();
      }
    }
    setSaving(false);
  };

  const toggleVisibility = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_visible: !product.is_visible })
      .eq('id', product.id);
    if (error) {
      showToast('فشل تحديث الحالة', 'error');
    } else {
      showToast(
        product.is_visible ? 'تم إخفاء الصنف' : 'تم إظهار الصنف',
        'success'
      );
      loadProducts();
    }
  };

  const toggleAvailability = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);
    if (error) {
      showToast('فشل تحديث الحالة', 'error');
    } else {
      showToast(
        product.is_available
          ? 'تم تعليم الصنف كغير متوفر'
          : 'تم تعليم الصنف كمتوفر',
        'success'
      );
      loadProducts();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', deleteTarget.id);
    if (error) {
      showToast('فشل حذف الصنف', 'error');
    } else {
      showToast('تم حذف الصنف بنجاح', 'success');
      loadProducts();
    }
    setDeleteTarget(null);
  };

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || 'غير مصنف';

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (filterCategory !== 'all' && p.category_id !== filterCategory)
      return false;
    if (filterStatus === 'visible' && !p.is_visible) return false;
    if (filterStatus === 'hidden' && p.is_visible) return false;
    if (filterStatus === 'unavailable' && p.is_available) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !getCategoryName(p.category_id).toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">الأصناف</h1>
        <button
          onClick={openAddForm}
          disabled={categories.length === 0}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          إضافة صنف
        </button>
      </div>

      {categories.length === 0 && (
        <div className="bg-amber-950/30 border border-amber-800/30 rounded-2xl p-4 text-sm text-amber-400 mb-6">
          يجب إضافة فئة أولاً قبل إضافة الأصناف
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن صنف..."
            className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2.5 pr-11 pl-4 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-600/50"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-stone-900 border border-stone-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-amber-600/50"
        >
          <option value="all">كل الفئات</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-stone-900 border border-stone-800 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-amber-600/50"
        >
          <option value="all">كل الحالات</option>
          <option value="visible">ظاهر</option>
          <option value="hidden">مخفي</option>
          <option value="unavailable">غير متوفر</option>
        </select>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>لا توجد أصناف</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-stone-900 border border-stone-800 rounded-2xl p-4 hover:border-stone-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white">{product.name}</h3>
                    <span className="text-xs text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full">
                      {getCategoryName(product.category_id)}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-sm text-stone-500 mb-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-amber-400 font-bold">
                      {formatPrice(product.price, 'ل.س')}
                    </span>
                    {product.is_visible ? (
                      <span className="text-xs text-green-400 bg-green-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Eye size={12} />
                        ظاهر
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <EyeOff size={12} />
                        مخفي
                      </span>
                    )}
                    {product.is_available ? (
                      <span className="text-xs text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        متوفر
                      </span>
                    ) : (
                      <span className="text-xs text-red-400 bg-red-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle size={12} />
                        غير متوفر
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openEditForm(product)}
                    className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors"
                    title="تعديل"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => toggleVisibility(product)}
                    className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors"
                    title={product.is_visible ? 'إخفاء' : 'إظهار'}
                  >
                    {product.is_visible ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => toggleAvailability(product)}
                    className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors"
                    title={
                      product.is_available ? 'تعليم كغير متوفر' : 'تعليم كمتوفر'
                    }
                  >
                    {product.is_available ? (
                      <XCircle size={16} className="text-stone-400" />
                    ) : (
                      <CheckCircle2 size={16} className="text-blue-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(product)}
                    className="w-9 h-9 rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-400 flex items-center justify-center transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-stone-900 border border-stone-700/50 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-stone-800 sticky top-0 bg-stone-900 z-10">
              <h2 className="text-xl font-bold">
                {editing ? 'تعديل الصنف' : 'إضافة صنف جديد'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  اسم الصنف
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  placeholder="مثال: قهوة"
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  وصف الصنف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="وصف مختصر للصنف"
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50 resize-none"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    السعر (ل.س)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: e.target.value }))
                    }
                    required
                    min={0}
                    step={1000}
                    placeholder="25000"
                    className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    الفئة
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
                    required
                    className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-600/50"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  ترتيب الصنف
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-amber-600/50"
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      is_visible: !prev.is_visible,
                    }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.is_visible ? 'bg-amber-600' : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.is_visible ? 'right-0.5' : 'right-6'
                    }`}
                  />
                </button>
                <span className="text-sm text-stone-300">
                  {formData.is_visible ? 'ظاهر في القائمة' : 'مخفي من القائمة'}
                </span>
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      is_available: !prev.is_available,
                    }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.is_available ? 'bg-blue-600' : 'bg-stone-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.is_available ? 'right-0.5' : 'right-6'
                    }`}
                  />
                </button>
                <span className="text-sm text-stone-300">
                  {formData.is_available ? 'متوفر' : 'غير متوفر'}
                </span>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : editing ? (
                    'حفظ التعديلات'
                  ) : (
                    'إضافة'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الصنف"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
