import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Lock, Mail, Coffee, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError('بيانات الدخول غير صحيحة');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-800 to-stone-900 border-2 border-stone-700 shadow-2xl flex items-center justify-center mx-auto mb-4">
            <Coffee size={36} className="text-amber-400/80" />
          </div>
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
          <p className="text-stone-500 text-sm mt-1">كافيه غلاف</p>
        </div>

        {/* Login Form */}
        <div className="bg-stone-900/80 backdrop-blur-md border border-stone-700/50 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@gelaf.com"
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 pr-11 pl-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-stone-800/60 border border-stone-700/50 rounded-xl py-3 pr-11 pl-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600/50 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  دخول
                  <ArrowRight size={18} className="rotate-180" />
                </>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={() => (window.location.hash = '')}
          className="w-full mt-6 text-stone-500 hover:text-stone-300 text-sm transition-colors"
        >
          العودة للقائمة
        </button>
      </div>
    </div>
  );
}
