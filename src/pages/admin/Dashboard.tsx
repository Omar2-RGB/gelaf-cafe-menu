import { useEffect, useState } from 'react';
import {
  FolderTree,
  Package,
  Eye,
  EyeOff,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { supabase, type Category, type Product } from '@/lib/supabase';
import { StatSkeleton } from '@/components/Skeleton';
import type { AdminPage } from './AdminLayout';

type DashboardProps = {
  onNavigate: (page: AdminPage) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    visible: 0,
    hidden: 0,
    unavailable: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentCategories, setRecentCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('products').select('*'),
      ]);

      const cats = (catRes.data as Category[]) || [];
      const prods = (prodRes.data as Product[]) || [];

      setStats({
        categories: cats.length,
        products: prods.length,
        visible: prods.filter((p) => p.is_visible).length,
        hidden: prods.filter((p) => !p.is_visible).length,
        unavailable: prods.filter((p) => !p.is_available).length,
      });

      setRecentCategories(
        cats.sort((a, b) => b.display_order - a.display_order).slice(0, 5)
      );
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'عدد الفئات',
      value: stats.categories,
      icon: FolderTree,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40',
      page: 'categories' as AdminPage,
    },
    {
      label: 'عدد الأصناف',
      value: stats.products,
      icon: Package,
      color: 'text-blue-400',
      bg: 'bg-blue-950/40',
      page: 'products' as AdminPage,
    },
    {
      label: 'الأصناف الظاهرة',
      value: stats.visible,
      icon: Eye,
      color: 'text-green-400',
      bg: 'bg-green-950/40',
      page: 'products' as AdminPage,
    },
    {
      label: 'الأصناف المخفية',
      value: stats.hidden,
      icon: EyeOff,
      color: 'text-stone-400',
      bg: 'bg-stone-800/40',
      page: 'products' as AdminPage,
    },
    {
      label: 'الأصناف غير المتوفرة',
      value: stats.unavailable,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-950/40',
      page: 'products' as AdminPage,
    },
  ];

  return (
    <div dir="rtl">
      <h1 className="text-2xl font-bold mb-6">الرئيسية</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <button
                  key={stat.label}
                  onClick={() => onNavigate(stat.page)}
                  className="bg-stone-900 border border-stone-800 rounded-3xl p-5 text-right hover:border-stone-700 transition-colors group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}
                  >
                    <Icon size={20} className={stat.color} />
                  </div>
                  <p className="text-stone-500 text-xs mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </button>
              );
            })}
      </div>

      {/* Quick Actions */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">إجراءات سريعة</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('categories')}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <FolderTree size={18} />
            إدارة الفئات
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Package size={18} />
            إدارة الأصناف
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <TrendingUp size={18} />
            إعدادات الكافيه
          </button>
        </div>
      </div>

      {/* Recent Categories */}
      {!loading && recentCategories.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">الفئات الحالية</h2>
          <div className="space-y-2">
            {recentCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between bg-stone-800/50 rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  {cat.image_url ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-stone-700 flex items-center justify-center">
                      <FolderTree size={18} className="text-stone-500" />
                    </div>
                  )}
                  <span className="font-medium text-sm">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {cat.is_visible ? (
                    <span className="text-xs text-green-400 bg-green-950/40 px-2 py-1 rounded-full">
                      ظاهر
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400 bg-stone-700/40 px-2 py-1 rounded-full">
                      مخفي
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
