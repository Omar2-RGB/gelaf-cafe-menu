import { type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Settings,
  LogOut,
  Coffee,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import { useState } from 'react';

export type AdminPage = 'dashboard' | 'categories' | 'products' | 'settings';

type AdminLayoutProps = {
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  children: ReactNode;
};

export default function AdminLayout({
  currentPage,
  onNavigate,
  children,
}: AdminLayoutProps) {
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { id: AdminPage; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'categories', label: 'الفئات', icon: FolderTree },
    { id: 'products', label: 'الأصناف', icon: Package },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const handleNav = (page: AdminPage) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white flex" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 border-l border-stone-800 fixed h-full z-30">
        <div className="p-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-800 to-stone-800 flex items-center justify-center">
              <Coffee size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="font-bold text-sm">كافيه غلاف</h1>
              <p className="text-xs text-stone-500">لوحة التحكم</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-amber-800/20 text-amber-400 border border-amber-700/30'
                    : 'text-stone-400 hover:bg-stone-800/50 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-3">
          <div className="text-xs text-stone-500 px-4 truncate">
            {user?.email}
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-800 to-stone-800 flex items-center justify-center">
            <Coffee size={16} className="text-amber-400" />
          </div>
          <span className="font-bold text-sm">لوحة التحكم</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-stone-800"
        >
          <MenuIcon size={20} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-stone-900 border-l border-stone-800 flex flex-col animate-slide-in">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-800 to-stone-800 flex items-center justify-center">
                  <Coffee size={20} className="text-amber-400" />
                </div>
                <div>
                  <h1 className="font-bold text-sm">كافيه غلاف</h1>
                  <p className="text-xs text-stone-500">لوحة التحكم</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      currentPage === item.id
                        ? 'bg-amber-800/20 text-amber-400 border border-amber-700/30'
                        : 'text-stone-400 hover:bg-stone-800/50 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-stone-800 space-y-3">
              <div className="text-xs text-stone-500 px-4 truncate">
                {user?.email}
              </div>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={20} />
                تسجيل الخروج
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:mr-64 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
