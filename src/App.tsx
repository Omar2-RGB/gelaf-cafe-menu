import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';
import PublicMenu from '@/pages/PublicMenu';
import AdminLogin from '@/pages/AdminLogin';
import AdminLayout, { type AdminPage } from '@/pages/admin/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import Categories from '@/pages/admin/Categories';
import Products from '@/pages/admin/Products';
import Settings from '@/pages/admin/Settings';

function AdminApp() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<AdminPage>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  return (
    <AdminLayout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'categories' && <Categories />}
      {page === 'products' && <Products />}
      {page === 'settings' && <Settings />}
    </AdminLayout>
  );
}

function Router() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const isAdmin = hash.startsWith('#/admin') || hash === '#admin';

  if (isAdmin) {
    return (
      <AuthProvider>
        <AdminApp />
      </AuthProvider>
    );
  }

  return <PublicMenu />;
}

export default function App() {
  return (
    <ToastProvider>
      <Router />
    </ToastProvider>
  );
}
