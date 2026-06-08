'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, HelpCircle, ShieldAlert, Award } from 'lucide-react';
import { loginAction } from '@/lib/auth-actions';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const res = await loginAction(null, formData);
      if (res.success) {
        setSuccess(res.message || 'Login sukses!');
        setTimeout(() => {
          router.push(res.role === 'admin' ? '/admin' : '/user');
          router.refresh();
        }, 800);
      } else {
        setError(res.error || 'Login gagal.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  const handleFillBypass = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@kelasmateri.com');
    } else {
      setEmail('user@kelasmateri.com');
    }
    setPassword('palamana');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#070b13] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up z-10">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group cursor-pointer w-fit mx-auto transition-transform hover:scale-105">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:shadow-brand-500/35 transition-all">
            <Award className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            kelas<span className="text-brand-600 font-extrabold">materi</span>
          </span>
        </Link>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-100 dark:shadow-none relative">
          <h1 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">
            Selamat Datang Kembali
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Masuk ke akun Anda untuk melanjutkan simulasi CPNS.
          </p>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-brand-500/10 hover:shadow-lg hover:shadow-brand-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Ke Platform</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Autofill testing links */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-slate-400 text-xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Akses Uji Coba Cepat (Bypass):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFillBypass('admin')}
                className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-left text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="font-semibold text-brand-600 dark:text-brand-400">Admin Account</div>
                <div className="truncate opacity-75">admin@kelasmateri.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillBypass('user')}
                className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-left text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="font-semibold text-accent-500">User Account</div>
                <div className="truncate opacity-75">user@kelasmateri.com</div>
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 text-center">
              Password default untuk bypass: <span className="font-semibold">palamana</span>
            </div>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          Belum punya akun?{' '}
          <Link href="/register" className="text-brand-600 hover:text-brand-500 font-semibold transition-colors">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
