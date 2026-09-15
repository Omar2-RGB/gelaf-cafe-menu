import { supabase } from './supabase';

export async function uploadImage(
  file: File,
  folder: string
): Promise<{ url: string | null; error: string | null }> {
  if (!file) return { url: null, error: 'لم يتم اختيار ملف' };

  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' };
  }

  if (!file.type.startsWith('image/')) {
    return { url: null, error: 'الملف يجب أن يكون صورة' };
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('cafe-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from('cafe-images').getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
}

export async function deleteImage(url: string): Promise<void> {
  if (!url) return;
  try {
    const path = url.split('/cafe-images/')[1];
    if (path) {
      await supabase.storage.from('cafe-images').remove([path]);
    }
  } catch {
    // ignore deletion errors
  }
}
