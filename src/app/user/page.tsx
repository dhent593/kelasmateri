'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Award, 
  BookOpen, 
  Play, 
  HelpCircle, 
  LogOut, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  Clock,
  MessageCircle,
  Trash2,
  Languages,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, UserProfile, ExamSession, UserSession, Package } from '@/lib/db';
import { getServerSession, logoutAction, changePasswordAction } from '@/lib/auth-actions';
import ThemeToggle from '@/components/ThemeToggle';

export default function UserDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionsList, setSessionsList] = useState<ExamSession[]>([]);
  const [packagesList, setPackagesList] = useState<Package[]>([]);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [generatingToefl, setGeneratingToefl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [retypePasswordBaru, setRetypePasswordBaru] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeSessionData = await getServerSession();
      if (!activeSessionData) {
        router.push('/login');
        return;
      }
      setSession(activeSessionData);

      // Fetch fresh profile details
      const profile = await db.getUserById(activeSessionData.id);
      setUserProfile(profile);

      // Fetch packages
      const pkgs = await db.getPackages();
      setPackagesList(pkgs);

      if (profile) {
        // Fetch sessions
        const userSessions = await db.getUserSessions(profile.id);
        setSessionsList(userSessions);

        // Check if there is an in-progress session
        const activeSess = await db.getLatestSession(profile.id, 'in_progress');
        setActiveSession(activeSess);
      }
    } catch (e: any) {
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  const getPackageName = (packageId?: string) => {
    switch (packageId) {
      case 'pkg-platinum': return 'Paket Platinum AI';
      case 'pkg-premium': return 'Paket Premium CAT';
      case 'pkg-basic':
      default: return 'Paket Basic (Uji Coba)';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    
    if (passwordBaru !== retypePasswordBaru) {
      setChangePasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }
    
    setUpdatingPassword(true);
    try {
      const res = await changePasswordAction(userProfile.id, passwordLama, passwordBaru, retypePasswordBaru);
      if (res.success) {
        setChangePasswordSuccess(res.message || 'Password berhasil diubah.');
        setPasswordLama('');
        setPasswordBaru('');
        setRetypePasswordBaru('');
      } else {
        setChangePasswordError(res.error || 'Gagal mengubah password.');
      }
    } catch (err: any) {
      setChangePasswordError(err.message || 'Terjadi kesalahan saat mengubah password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus riwayat simulasi ini? Tindakan ini akan menghapusnya secara permanen.')) {
      return;
    }
    setError(null);
    try {
      const success = await db.deleteExamSession(sessionId);
      if (success) {
        setSessionsList(prev => prev.filter(s => s.id !== sessionId));
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
        }
      } else {
        setError('Gagal menghapus riwayat simulasi.');
      }
    } catch (e) {
      setError('Terjadi kesalahan saat menghapus riwayat.');
    }
  };

  const handleStartPackageExam = async (pkg: Package) => {
    if (!userProfile) return;
    setGeneratingExam(true);
    setError(null);

    try {
      // 1. Get manual questions from DB and filter those linked to this package
      const dbQuestions = await db.getQuestions();
      const pkgQuestions = dbQuestions.filter(q => q.package_ids && q.package_ids.includes(pkg.id));

      let examQuestions: any[] = [];

      if (pkg.id === 'pkg-basic') {
        // Fallback for basic package
        const trialPack = await db.getTrialTryoutPackage();
        const merged = [...pkgQuestions, ...trialPack];
        
        // Ensure unique question IDs
        const seenIds = new Set();
        const unique = merged.filter(q => {
          if (seenIds.has(q.id)) return false;
          seenIds.add(q.id);
          return true;
        });

        // Split by category
        const twk = unique.filter(q => q.category === 'TWK');
        const tiu = unique.filter(q => q.category === 'TIU');
        const tkp = unique.filter(q => q.category === 'TKP');

        const mergedTwk = twk.slice(0, 10);
        const mergedTiu = tiu.slice(0, 10);
        const mergedTkp = tkp.slice(0, 10);
        examQuestions = [...mergedTwk, ...mergedTiu, ...mergedTkp];
      } else if (pkg.id === 'pkg-premium') {
        // Fallback for premium package
        const fullPack = await db.getFullTryoutPackage();
        const merged = [...pkgQuestions, ...fullPack];

        const seenIds = new Set();
        const unique = merged.filter(q => {
          if (seenIds.has(q.id)) return false;
          seenIds.add(q.id);
          return true;
        });

        const twk = unique.filter(q => q.category === 'TWK');
        const tiu = unique.filter(q => q.category === 'TIU');
        const tkp = unique.filter(q => q.category === 'TKP');

        const mergedTwk = twk.slice(0, 30);
        const mergedTiu = tiu.slice(0, 35);
        const mergedTkp = tkp.slice(0, 45);
        examQuestions = [...mergedTwk, ...mergedTiu, ...mergedTkp];
      } else {
        // For custom package or Platinum manual exam
        if (pkgQuestions.length === 0) {
          // Fallback to basic tryout questions to prevent crash
          const trialPack = await db.getTrialTryoutPackage();
          examQuestions = trialPack.slice(0, pkg.total_questions);
        } else {
          examQuestions = pkgQuestions.slice(0, pkg.total_questions);
        }
      }

      // 2. Create session structure
      const newSession = await db.createExamSession({
        user_id: userProfile.id,
        exam_type: 'manual',
        current_question_index: 0,
        saved_answers: {
          answers: {},
          questions: examQuestions
        },
        remaining_time_seconds: pkg.duration_minutes * 60,
        status: 'in_progress'
      });

      router.push(`/exam?id=${newSession.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal memulai simulasi.');
      setGeneratingExam(false);
    }
  };

  const handleStartAiExam = async () => {
    if (!userProfile) return;
    if (!userProfile.can_generate_exam) return;
    setGeneratingExam(true);
    setError(null);

    try {
      // Fetch dynamic questions from Gemini API endpoint
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userProfile.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menghubungi generator AI.');
      }

      const data = await response.json();
      const generatedQuestions = data.questions;

      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error('Tidak ada soal yang dihasilkan oleh AI.');
      }

      // Create session structure
      const newSession = await db.createExamSession({
        user_id: userProfile.id,
        exam_type: 'ai',
        current_question_index: 0,
        saved_answers: {
          answers: {},
          questions: generatedQuestions // Snapshot AI questions inside session
        },
        remaining_time_seconds: 100 * 60, // 100 minutes (standard CPNS duration)
        status: 'in_progress'
      });

      router.push(`/exam?id=${newSession.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat simulasi AI. Silakan coba kembali.');
      setGeneratingExam(false);
    }
  };

  const handleStartToeflExam = async () => {
    if (!userProfile) return;
    if (userProfile.package_id !== 'pkg-platinum') return;
    setGeneratingToefl(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-toefl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userProfile.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menghubungi generator TOEFL AI.');
      }

      const data = await response.json();
      const generatedQuestions = data.questions;

      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error('Tidak ada soal yang dihasilkan oleh AI.');
      }

      const newSession = await db.createExamSession({
        user_id: userProfile.id,
        exam_type: 'ai',
        subject: 'toefl',
        current_question_index: 0,
        saved_answers: {
          answers: {},
          questions: generatedQuestions
        },
        remaining_time_seconds: 30 * 60, // 30 minutes for 30 questions
        status: 'in_progress'
      });

      router.push(`/exam?id=${newSession.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat simulasi TOEFL AI. Silakan coba kembali.');
      setGeneratingToefl(false);
    }
  };

  // Calculations for dashboard indicators
  const completedSessions = sessionsList.filter(s => s.status === 'completed');
  const totalCompleted = completedSessions.length;
  
  const highestScore = totalCompleted 
    ? Math.max(...completedSessions.map(s => s.final_score || 0)) 
    : 0;

  const averageScore = totalCompleted 
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.final_score || 0), 0) / totalCompleted)
    : 0;

  // Breakdown score per category (TIU, TWK, TKP)
  const getCategoryAverages = () => {
    let tiuSum = 0, twkSum = 0, tkpSum = 0;
    let count = 0;

    completedSessions.forEach(s => {
      if (s.category_scores) {
        tiuSum += s.category_scores.TIU || 0;
        twkSum += s.category_scores.TWK || 0;
        tkpSum += s.category_scores.TKP || 0;
        count++;
      }
    });

    return {
      TIU: count ? Math.round(tiuSum / count) : 0,
      TWK: count ? Math.round(twkSum / count) : 0,
      TKP: count ? Math.round(tkpSum / count) : 0
    };
  };

  const categoryAverages = getCategoryAverages();

  // Passing Grades (Ambang Batas) CPNS
  const PASSING_GRADES = {
    TIU: 80,
    TWK: 65,
    TKP: 166
  };

  // Recharts score history mapping
  const chartData = completedSessions.map((s, idx) => ({
    name: `Ujian ${idx + 1}`,
    Skor: s.final_score,
    TIU: s.category_scores?.TIU || 0,
    TWK: s.category_scores?.TWK || 0,
    TKP: s.category_scores?.TKP || 0,
    date: new Date(s.completed_at || s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }));

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b13]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Memuat dashboard Anda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#070b13]">
      {/* Dashboard Header */}
      <header className="glass-premium border-b border-slate-200/50 dark:border-slate-800/40 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Kelas<span className="text-brand-600 font-extrabold">Materi</span>
              </span>
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              User
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 text-right cursor-pointer hover:opacity-85 transition-opacity focus:outline-none"
              title="Info Profil & Ubah Password"
            >
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{userProfile?.email}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Masa Aktif: Selamanya</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white font-extrabold text-xs shadow-md border border-brand-400/20">
                {userProfile?.email ? userProfile.email[0].toUpperCase() : 'U'}
              </div>
            </button>
            
            <ThemeToggle />
            <button
              onClick={handleLogoutClick}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full space-y-8 flex-1">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Pemberitahuan:</span> {error}
            </div>
          </div>
        )}

        {/* Resume Exam Banner if exists */}
        {activeSession ? (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in w-full">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" />
                <span>Ada Ujian Aktif</span>
              </div>
              <h2 className="text-2xl font-bold">Simulasi Anda Sedang Di-Jeda</h2>
              <p className="opacity-90 text-sm max-w-xl">
                Anda memiliki ujian tipe <span className="font-bold uppercase">{activeSession.exam_type}</span> ({activeSession.subject || 'cpns'}) yang belum selesai. Sisa waktu pengerjaan: {Math.floor(activeSession.remaining_time_seconds / 60)} menit.
              </p>
            </div>
            <button
              onClick={() => router.push(`/exam?id=${activeSession.id}`)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-orange-600 hover:bg-slate-50 font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 cursor-pointer scale-105"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Lanjutkan Ujian</span>
            </button>
          </div>
        ) : null}

        {/* 1. Quick Stats Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Skor Tertinggi</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{highestScore}</span>
              <span className="text-xs text-slate-400">Poin</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Simulasi Diikuti</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalCompleted}</span>
              <span className="text-xs text-slate-400">paket ujian</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Rata-rata Skor</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-brand-600 dark:text-brand-400 tracking-tight">{averageScore}</span>
              <span className="text-xs text-slate-400">Poin</span>
            </div>
          </div>
        </section>

        {/* 2. Exam Control Panel Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {packagesList.map((pkg) => {
            const isUnlocked = userProfile?.unlocked_packages?.includes(pkg.id);
            const isPlatinum = pkg.id === 'pkg-platinum';
            
            return (
              <div 
                key={pkg.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                {/* Background glow effects */}
                <div className={`absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-3xl pointer-events-none ${
                  isPlatinum 
                    ? 'bg-purple-500/5' 
                    : pkg.id === 'pkg-premium' 
                      ? 'bg-brand-500/5' 
                      : 'bg-slate-500/5'
                }`} />
                
                {/* Overlay Locked */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-base">Akses Terkunci</h4>
                      <p className="text-xs text-slate-300 font-semibold">{pkg.name}</p>
                      <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed">
                        Aktifkan paket seharga <span className="font-bold text-brand-400">Rp {pkg.price.toLocaleString('id-ID')}</span> untuk membuka akses simulasi ini.
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/6289632321244?text=${encodeURIComponent(`Halo Admin KelasMateri, saya ingin mengaktifkan akses ${pkg.name} untuk akun saya: ${userProfile?.email || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                        <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.73.44 3.36 1.21 4.79L2 22l5.37-1.3c1.37.74 2.93 1.17 4.63 1.17 5.52 0 10-4.48 10-10S17.52 2 12.004 2zM16.8 15.3c-.2.5-.9.9-1.4 1-1 .2-2.2-.2-3.6-1-1.7-.9-3-2.6-3.8-4-.4-.5-.6-1.1-.6-1.7 0-1.1.6-1.6.8-1.9.2-.2.4-.3.6-.3h.4c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .5l-.5.6c-.1.2-.2.4-.1.6.4.7.9 1.4 1.5 2 .6.5 1.2.9 1.9 1.2.2.1.4.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5s0 .9-.3 1.2z" />
                      </svg>
                      <span>Aktivasi via WhatsApp</span>
                    </a>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isPlatinum 
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                      : pkg.id === 'pkg-premium' 
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isPlatinum ? (
                      <Sparkles className="w-6 h-6" />
                    ) : pkg.id === 'pkg-premium' ? (
                      <Award className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{pkg.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {pkg.duration_minutes} Menit
                      </span>
                      <span className="text-slate-350 dark:text-slate-700">•</span>
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        {pkg.total_questions} Soal
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[48px]">
                    {pkg.description || 'Simulasi Tryout dengan bank soal pilihan.'}
                  </p>
                  
                  {/* Features List */}
                  <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                    {pkg.features?.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-xs">
                        <span className="text-brand-500 font-bold mt-0.5">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-6 space-y-3">
                  {/* Primary Tryout Button */}
                  <button
                    onClick={() => handleStartPackageExam(pkg)}
                    disabled={generatingExam || generatingToefl}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer
                      ${isPlatinum 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-750 hover:to-purple-650' 
                        : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-750'
                      }
                    `}
                  >
                    {generatingExam ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Mulai Ujian Manual</span>
                      </>
                    )}
                  </button>
                  
                  {/* Additional buttons for Platinum */}
                  {isPlatinum && (
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                      <button
                        onClick={handleStartAiExam}
                        disabled={generatingExam || generatingToefl}
                        className="w-full py-2.5 px-4 rounded-xl border border-purple-500/30 dark:border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {generatingExam ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>Mulai Simulasi AI CPNS</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleStartToeflExam}
                        disabled={generatingExam || generatingToefl}
                        className="w-full py-2.5 px-4 rounded-xl border border-indigo-500/30 dark:border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {generatingToefl ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Languages className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Mulai Simulasi TOEFL AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* 2. Recharts Line Chart */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                <span>Analisis Riwayat Skor</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Grafik pengerjaan simulasi completed berurutan dari pertama hingga terbaru.
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 700]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                  />
                  <Line type="monotone" dataKey="Skor" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="TIU" stroke="#ec4899" strokeWidth={1.5} dot={false} opacity={0.6} />
                  <Line type="monotone" dataKey="TWK" stroke="#10b981" strokeWidth={1.5} dot={false} opacity={0.6} />
                  <Line type="monotone" dataKey="TKP" stroke="#f59e0b" strokeWidth={1.5} dot={false} opacity={0.6} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 gap-2 text-center p-6">
                <Activity className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-semibold">Belum Ada Data Skor</span>
                <span className="text-[10px] max-w-[200px]">Selesaikan simulasi tryout pertama Anda untuk melihat grafik analisis perkembangan nilai.</span>
              </div>
            )}
          </div>
        </section>

        {/* 3. Passing Grades Card Breakdown */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-accent-500" />
            <span>Rata-Rata Sub-Materi vs Ambang Batas</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* TIU */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">TIU (Inteligensia Umum)</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">Target 80+</span>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{categoryAverages.TIU}</span>
                  <span className="text-xs text-slate-400">/ 175</span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${categoryAverages.TIU >= PASSING_GRADES.TIU ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((categoryAverages.TIU / 175) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold mt-2">
                  <span className={categoryAverages.TIU >= PASSING_GRADES.TIU ? 'text-emerald-500' : 'text-red-500'}>
                    {categoryAverages.TIU >= PASSING_GRADES.TIU ? 'Lulus Passing Grade' : 'Di Bawah Passing Grade'}
                  </span>
                  <span className="text-slate-400">{Math.round((categoryAverages.TIU / 175) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* TWK */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">TWK (Wawasan Kebangsaan)</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">Target 65+</span>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{categoryAverages.TWK}</span>
                  <span className="text-xs text-slate-400">/ 150</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${categoryAverages.TWK >= PASSING_GRADES.TWK ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((categoryAverages.TWK / 150) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold mt-2">
                  <span className={categoryAverages.TWK >= PASSING_GRADES.TWK ? 'text-emerald-500' : 'text-red-500'}>
                    {categoryAverages.TWK >= PASSING_GRADES.TWK ? 'Lulus Passing Grade' : 'Di Bawah Passing Grade'}
                  </span>
                  <span className="text-slate-400">{Math.round((categoryAverages.TWK / 150) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* TKP */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">TKP (Karakteristik Pribadi)</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">Target 166+</span>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{categoryAverages.TKP}</span>
                  <span className="text-xs text-slate-400">/ 225</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${categoryAverages.TKP >= PASSING_GRADES.TKP ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((categoryAverages.TKP / 225) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold mt-2">
                  <span className={categoryAverages.TKP >= PASSING_GRADES.TKP ? 'text-emerald-500' : 'text-red-500'}>
                    {categoryAverages.TKP >= PASSING_GRADES.TKP ? 'Lulus Passing Grade' : 'Di Bawah Passing Grade'}
                  </span>
                  <span className="text-slate-400">{Math.round((categoryAverages.TKP / 225) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. History Tryout List */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              <span>Riwayat Simulasi Tryout</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Daftar paket ujian yang telah Anda selesaikan. Klik "Lihat Pembahasan" untuk meninjau kunci jawaban dan penjelasan rinci.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {completedSessions.length > 0 ? (
              completedSessions
                .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
                .map((s) => {
                  const dateStr = new Date(s.completed_at || s.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return (
                    <div key={s.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${
                            s.exam_type === 'ai'
                              ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30'
                              : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30'
                          }`}>
                            {s.exam_type} Simulation ({s.subject || 'cpns'})
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Skor: {s.final_score} {s.subject === 'toefl' ? '(TOEFL)' : ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold">{dateStr}</div>
                      </div>
 
                      <div className="flex items-center gap-4">
                        {/* Breakdown preview */}
                        <div className="hidden md:flex gap-3 text-[10px] font-bold text-slate-400 uppercase">
                          {s.subject === 'toefl' ? (
                            <>
                              <span>Listening: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.Listening || 0}</span></span>
                              <span>Structure: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.Structure || 0}</span></span>
                              <span>Reading: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.Reading || 0}</span></span>
                            </>
                          ) : (
                            <>
                              <span>TIU: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.TIU || 0}</span></span>
                              <span>TWK: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.TWK || 0}</span></span>
                              <span>TKP: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.TKP || 0}</span></span>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => router.push(`/exam/review?id=${s.id}`)}
                          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 text-brand-600 dark:text-brand-400 transition-colors cursor-pointer"
                        >
                          Lihat Pembahasan
                        </button>

                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                          title="Hapus Riwayat Ujian"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                Belum ada simulasi yang diselesaikan.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Keluar dari Akun?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin keluar dari sesi saat ini? Anda harus masuk kembali untuk melanjutkan simulasi.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shadow-md shadow-red-500/15 cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile & Change Password Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Profil Pengguna</h3>
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setChangePasswordError(null);
                  setChangePasswordSuccess(null);
                  setPasswordLama('');
                  setPasswordBaru('');
                  setRetypePasswordBaru('');
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-850/60 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Email</span>
                <span className="font-bold text-slate-900 dark:text-white">{userProfile?.email}</span>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Paket Aktif</span>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {userProfile?.unlocked_packages && userProfile.unlocked_packages.length > 0 ? (
                    userProfile.unlocked_packages.map(pkgId => (
                      <span key={pkgId} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        pkgId === 'pkg-platinum' 
                          ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                          : pkgId === 'pkg-premium'
                            ? 'bg-brand-100 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {getPackageName(pkgId)}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">Tidak ada paket</span>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Ubah Password</h4>
                
                {changePasswordError && (
                  <div className="mb-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold animate-fade-in">
                    {changePasswordError}
                  </div>
                )}
                
                {changePasswordSuccess && (
                  <div className="mb-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade-in">
                    {changePasswordSuccess}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label htmlFor="old-pass" className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Password Lama
                    </label>
                    <input
                      id="old-pass"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordLama}
                      onChange={(e) => setPasswordLama(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="new-pass" className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Password Baru
                    </label>
                    <input
                      id="new-pass"
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={passwordBaru}
                      onChange={(e) => setPasswordBaru(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="retype-new-pass" className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Ulangi Password Baru
                    </label>
                    <input
                      id="retype-new-pass"
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={retypePasswordBaru}
                      onChange={(e) => setRetypePasswordBaru(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-950 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setChangePasswordError(null);
                    setChangePasswordSuccess(null);
                    setPasswordLama('');
                    setPasswordBaru('');
                    setRetypePasswordBaru('');
                  }}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold text-xs hover:from-brand-700 hover:to-brand-600 transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {updatingPassword ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Ubah Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Contact Button */}
      <a
        href={`https://wa.me/6289632321244?text=${encodeURIComponent(`Halo Admin KelasMateri, saya ingin berkonsultasi mengenai akses tryout/simulasi yang terkunci.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        title="Hubungi Admin"
      >
        <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
          <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.73.44 3.36 1.21 4.79L2 22l5.37-1.3c1.37.74 2.93 1.17 4.63 1.17 5.52 0 10-4.48 10-10S17.52 2 12.004 2zM16.8 15.3c-.2.5-.9.9-1.4 1-1 .2-2.2-.2-3.6-1-1.7-.9-3-2.6-3.8-4-.4-.5-.6-1.1-.6-1.7 0-1.1.6-1.6.8-1.9.2-.2.4-.3.6-.3h.4c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .5l-.5.6c-.1.2-.2.4-.1.6.4.7.9 1.4 1.5 2 .6.5 1.2.9 1.9 1.2.2.1.4.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5s0 .9-.3 1.2z" />
        </svg>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-700 ease-in-out whitespace-nowrap text-sm font-bold">
          Hubungi Admin
        </span>
      </a>
    </div>
  );
}
