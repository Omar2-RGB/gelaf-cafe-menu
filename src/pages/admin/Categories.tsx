import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  Upload,
  ArrowUp,
  ArrowDown,
  FolderTree,
} from 'lucide-react';
import {
  supabase,
  type Category,
  type CategoryWithCount,
} from '@/lib/supabase';
import { uploadImage, deleteImage } from '@/lib/upload';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { CategorySkeleton } from '@/components/Skeleton';

export default function Categories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteProductCount, setDeleteProductCount] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_visible: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    const cats = (data as Category[]) || [];

    const withCounts = await Promise.all(
      cats.map(async (cat) => {
        const { count } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', cat.id);
        return { ...cat, product_count: count || 0 };
      })
    );

    setCategories(withCounts);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openAddForm = () => {
    setEditing(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      display_order: categories.length + 1,
      is_visible: true,
    });
    setImageFile(null);
    setImagePreview('');
    setShowForm(true);
  };

  const openEditForm = (cat: Category) => {
    setEditing(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      image_url: cat.image_url || '',
      display_order: cat.display_order,
      is_visible: cat.is_visible,
    });
    setImageFile(null);
    setImagePreview(cat.image_url || '');
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('يرجى إدخال اسم الفئة', 'error');
      return;
    }
    setSaving(true);

    let imageUrl = formData.image_url;

    if (imageFile) {
      const { url, error } = await uploadImage(imageFile, 'categories');
      if (error) {
        showToast('فشل رفع الصورة', 'error');
        setSaving(false);
        return;
      }
      imageUrl = url || '';
      if (editing?.image_url) {
        await deleteImage(editing.image_url);
      }
    }

    if (editing) {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          image_url: imageUrl,
          display_order: formData.display_order,
          is_visible: formData.is_visible,
        })
        .eq('id', editing.id);

      if (error) {
        showToast('فشل تحديث الفئة', 'error');
      } else {
        showToast('تم تعديل الفئة بنجاح', 'success');
        setShowForm(false);
        loadCategories();
      }
    } else {
      const { error } = await supabase.from('categories').insert({
        name: formData.name.trim(),
        description: formData.description.trim(),
        image_url: imageUrl,
        display_order: formData.display_order,
        is_visible: formData.is_visible,
      });

      if (error) {
        showToast('فشل إضافة الفئة', 'error');
      } else {
        showToast('تمت إضافة الفئة بنجاح', 'success');
        setShowForm(false);
        loadCategories();
      }
    }
    setSaving(false);
  };

  const toggleVisibility = async (cat: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_visible: !cat.is_visible })
      .eq('id', cat.id);

    if (error) {
      showToast('فشل تحديث الحالة', 'error');
    } else {
      showToast(cat.is_visible ? 'تم إخفاء الفئة' : 'تم إظهار الفئة', 'success');
      loadCategories();
    }
  };

  const moveOrder = async (cat: Category, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapWith = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1];

    await Promise.all([
      supabase
        .from('categories')
        .update({ display_order: swapWith.display_order })
        .eq('id', cat.id),
      supabase
        .from('categories')
        .update({ display_order: cat.display_order })
        .eq('id', swapWith.id),
    ]);

    loadCategories();
  };

  const handleDeleteClick = async (cat: Category) => {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', cat.id);
    setDeleteProductCount(count || 0);
    setDeleteTarget(cat);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.image_url) {
      await deleteImage(deleteTarget.image_url);
    }
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      showToast('فشل حذف الفئة', 'error');
    } else {
      showToast('تم حذف الفئة بنجاح', 'success');
      loadCategories();
    }
    setDeleteTarget(null);
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">الفئات</h1>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={18} />
          إضافة فئة
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          <FolderTree size={48} className="mx-auto mb-4 opacity-50" />
          <p>لا توجد فئات بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden hover:border-stone-700 transition-colors"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-stone-800">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={32} className="text-stone-600" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => moveOrder(cat, 'up')}
                    disabled={idx === 0}
                    className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveOrder(cat, 'down')}
                    disabled={idx === categories.length - 1}
                    className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  {cat.is_visible ? (
                    <span className="text-xs text-green-400 bg-green-950/60 backdrop-blur-sm px-2 py-1 rounded-full">
                      ظاهر
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400 bg-stone-800/60 backdrop-blur-sm px-2 py-1 rounded-full">
                      مخفي
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold mb-1">{cat.name}</h3>
                {cat.description && (
                  <p className="text-sm text-stone-500 line-clamp-2 mb-2">
                    {cat.description}
                  </p>
                )}
                <p className="text-xs text-stone-600 mb-3">
                  {cat.product_count} صنف
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditForm(cat)}
                    className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Pencil size={14} />
                    تعديل
                  </button>
                  <button
                    onClick={() => toggleVisibility(cat)}
                    className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    {cat.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    {cat.is_visible ? 'إخفاء' : 'إظهار'}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(cat)}
                    className="flex items-center gap-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 size={14} />
                    حذف
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
                {editing ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  صورة الفئة
                </label>
                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
                    <img
                      src={imagePreview}
                      alt="معاينة"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed border-stone-700 rounded-2xl cursor-pointer hover:border-amber-600/50 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-stone-500">
                      <Upload size={28} />
                      <span className="text-sm">اختر صورة للفئة</span>
                      <span className="text-xs text-stone-600">
                        JPG, PNG — أقل من 5 ميجابايت
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  اسم الفئة
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  placeholder="مثال: المشروبات الساخنة"
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  وصف الفئة (اختياري)
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
                  placeholder="وصف مختصر للفئة"
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50 resize-none"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-2">
                  ترتيب الفئة
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

              {/* Visibility */}
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
        title="حذف الفئة"
        message={
          deleteProductCount > 0
            ? `هذه الفئة تحتوي على ${deleteProductCount} صنف. سيتم حذف جميع الأصناف المرتبطة بها. هل أنت متأكد من حذف "${deleteTarget?.name}"؟`
            : `هل أنت متأكد من حذف "${deleteTarget?.name}"؟`
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
