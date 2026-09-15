import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  storageKey: 'gelaf-admin-auth',
  },
});

export type Category = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  display_order: number;
  is_visible: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type Settings = {
  id: string;
  cafe_name: string;
  description: string;
  logo_url: string;
  cover_url: string;
  phone: string;
  whatsapp: string;
  address: string;
  maps_url: string;
  instagram_url: string;
  instagram_username: string;
  opening_hours: string;
  currency: string;
  hide_unavailable: boolean;
  primary_color: string;
  updated_at: string;
};

export type ProductWithCategory = Product & {
  categories?: Category;
};

export type CategoryWithCount = Category & {
  product_count?: number;
};
