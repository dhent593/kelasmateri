'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, UserProfile, ExamSession, UserSession } from '@/lib/db';
import { getServerSession, logoutAction } from '@/lib/auth-actions';
import ThemeToggle from '@/components/ThemeToggle';

export default function UserDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sessionsList, setSessionsList] = useState<ExamSession[]>([]);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const handleStartManualExam = async () => {
    if (!userProfile) return;
    setGeneratingExam(true);
    setError(null);

    try {
      // 1. Get manual questions from DB and build a 30-question trial package (10 of each category)
      const dbQuestions = await db.getQuestions();
      const dbTwk = dbQuestions.filter(q => q.category === 'TWK');
      const dbTiu = dbQuestions.filter(q => q.category === 'TIU');
      const dbTkp = dbQuestions.filter(q => q.category === 'TKP');

      // Fetch base trial package (10 of each)
      const trialPack = await db.getTrialTryoutPackage();
      const trialTwk = trialPack.filter(q => q.category === 'TWK');
      const trialTiu = trialPack.filter(q => q.category === 'TIU');
      const trialTkp = trialPack.filter(q => q.category === 'TKP');

      // Merge and limit to exactly 10 per category
      const mergedTwk = [...dbTwk, ...trialTwk].slice(0, 10);
      const mergedTiu = [...dbTiu, ...trialTiu].slice(0, 10);
      const mergedTkp = [...dbTkp, ...trialTkp].slice(0, 10);

      const examQuestions = [...mergedTwk, ...mergedTiu, ...mergedTkp];

      // 2. Create session structure
      const newSession = await db.createExamSession({
        user_id: userProfile.id,
        exam_type: 'manual',
        current_question_index: 0,
        saved_answers: {
          answers: {},
          questions: examQuestions // Snapshot 30 questions inside session
        },
        remaining_time_seconds: 30 * 60, // 30 minutes for 30 questions
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              kelas<span className="text-brand-600 font-extrabold">materi</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              User
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{userProfile?.email}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Masa Aktif: Selamanya</div>
            </div>
            
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

        {/* 1. Exam Control Panel */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Resume Exam Banner if exists */}
          {activeSession ? (
            <div className="md:col-span-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ada Ujian Aktif</span>
                </div>
                <h2 className="text-2xl font-bold">Simulasi Anda Sedang Di-Jeda</h2>
                <p className="opacity-90 text-sm max-w-xl">
                  Anda memiliki ujian tipe <span className="font-bold uppercase">{activeSession.exam_type}</span> yang belum selesai. Sisa waktu pengerjaan: {Math.floor(activeSession.remaining_time_seconds / 60)} menit.
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

          {/* Start New Exam Box */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Simulasi Tryout CAT CPNS</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                Pilih metode latihan Anda. Manual menggunakan bank soal terkurasi dari database kami, sedangkan AI menghasilkan simulasi adaptif menggunakan kecerdasan buatan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {/* Manual Button */}
              <button
                onClick={handleStartManualExam}
                disabled={generatingExam}
                className="py-4 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-900 dark:text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {generatingExam ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-brand-500" />
                    <span>Mulai Simulasi Gratis</span>
                  </>
                )}
              </button>

              {/* AI Button with access locks */}
              <div className="relative group">
                <button
                  onClick={handleStartAiExam}
                  disabled={generatingExam || !userProfile?.can_generate_exam}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer
                    ${userProfile?.can_generate_exam 
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-700 hover:to-brand-600 shadow-md shadow-brand-500/10' 
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/50 dark:border-slate-800'
                    }
                  `}
                >
                  {generatingExam ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className={`w-4 h-4 ${userProfile?.can_generate_exam ? 'text-white' : 'text-slate-400'}`} />
                      <span>Kerjakan Simulasi Premium (AI)</span>
                    </>
                  )}
                </button>
                
                {/* Tooltip Locked */}
                {!userProfile?.can_generate_exam && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-[11px] py-2 px-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-center font-semibold border border-slate-800 z-10">
                    Akses dikunci oleh Admin. Minta persetujuan di dashboard admin.
                  </div>
                )}
              </div>
            </div>

            {!userProfile?.can_generate_exam && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs animate-fade-in">
                <div className="text-amber-800 dark:text-amber-400 font-medium text-center sm:text-left leading-relaxed">
                  Modul Simulasi AI masih terkunci. Hubungi Admin via WhatsApp untuk mengaktifkan akses Anda.
                </div>
                <a
                  href={`https://wa.me/6289632321244?text=${encodeURIComponent(`Halo Admin KelasMateri, saya ingin meminta aktivasi akses Simulasi AI untuk akun saya: ${userProfile?.email || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shrink-0 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.73.44 3.36 1.21 4.79L2 22l5.37-1.3c1.37.74 2.93 1.17 4.63 1.17 5.52 0 10-4.48 10-10S17.52 2 12.004 2zM16.8 15.3c-.2.5-.9.9-1.4 1-1 .2-2.2-.2-3.6-1-1.7-.9-3-2.6-3.8-4-.4-.5-.6-1.1-.6-1.7 0-1.1.6-1.6.8-1.9.2-.2.4-.3.6-.3h.4c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .5l-.5.6c-.1.2-.2.4-.1.6.4.7.9 1.4 1.5 2 .6.5 1.2.9 1.9 1.2.2.1.4.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5s0 .9-.3 1.2z" />
                  </svg>
                  <span>Hubungi Admin</span>
                </a>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-4 items-stretch">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Skor Tertinggi</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{highestScore}</span>
                <span className="text-xs text-slate-400">/ 550</span>
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
          </div>
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
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 550]} />
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
                            {s.exam_type} Simulation
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Skor: {s.final_score}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold">{dateStr}</div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Breakdown preview */}
                        <div className="hidden md:flex gap-3 text-[10px] font-bold text-slate-400 uppercase">
                          <span>TIU: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.TIU || 0}</span></span>
                          <span>TWK: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.TWK || 0}</span></span>
                          <span>TKP: <span className="text-slate-700 dark:text-slate-350">{s.category_scores?.TKP || 0}</span></span>
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
