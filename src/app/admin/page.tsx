'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  Users, 
  BookOpen, 
  Trash2, 
  Edit3, 
  Plus, 
  ShieldAlert, 
  LogOut, 
  Check, 
  Search, 
  Sparkles,
  Save,
  X
} from 'lucide-react';
import { db, UserProfile, Question, UserSession, Package } from '@/lib/db';
import { getServerSession, logoutAction } from '@/lib/auth-actions';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'questions' | 'packages'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  // Questions State
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [questionFilter, setQuestionFilter] = useState<'All' | 'TIU' | 'TWK' | 'TKP'>('All');
  
  // Question Form State (Add / Edit)
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<'TIU' | 'TWK' | 'TKP'>('TWK');
  const [formQuestionText, setFormQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [optionE, setOptionE] = useState('');
  const [formCorrectOption, setFormCorrectOption] = useState('A'); // for TIU/TWK
  const [formExplanation, setFormExplanation] = useState('');
  
  // TKP Score States
  const [tkpScoreA, setTkpScoreA] = useState(5);
  const [tkpScoreB, setTkpScoreB] = useState(4);
  const [tkpScoreC, setTkpScoreC] = useState(3);
  const [tkpScoreD, setTkpScoreD] = useState(2);
  const [tkpScoreE, setTkpScoreE] = useState(1);

  // Packages State
  const [packagesList, setPackagesList] = useState<Package[]>([]);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [formPackageName, setFormPackageName] = useState('');
  const [formPackagePrice, setFormPackagePrice] = useState(0);
  const [formPackageDescription, setFormPackageDescription] = useState('');
  const [formPackageFeaturesText, setFormPackageFeaturesText] = useState('');

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  const fetchSessionAndData = async () => {
    setLoading(true);
    try {
      const activeSessionData = await getServerSession();
      if (!activeSessionData || activeSessionData.role !== 'admin') {
        router.push('/login');
        return;
      }
      setSession(activeSessionData);
      
      // Load initial lists
      const users = await db.getUsers();
      setUsersList(users);

      const questions = await db.getQuestions();
      setQuestionsList(questions);

      const packages = await db.getPackages();
      setPackagesList(packages);
    } catch (e: any) {
      setError('Gagal memuat data administrasi.');
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

  // --- USER CONTROLLERS ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const email = newUserEmail.trim().toLowerCase();
    const password = newUserPassword.trim();

    if (!email || !password) {
      setError('Email dan Password wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal terdiri dari 6 karakter.');
      return;
    }

    try {
      const existing = await db.getUserByEmail(email);
      if (existing) {
        setError('Email tersebut sudah terdaftar.');
        return;
      }

      await db.createUser(email, newUserRole, undefined, password);
      setNewUserEmail('');
      setNewUserPassword('');
      setSuccess('Pengguna baru berhasil ditambahkan.');
      
      // Reload users list
      const users = await db.getUsers();
      setUsersList(users);
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan pengguna.');
    }
  };

  const handleToggleCanGenerateExam = async (userId: string, currentStatus: boolean) => {
    setError(null);
    setSuccess(null);
    try {
      await db.updateUser(userId, { can_generate_exam: !currentStatus });
      setSuccess('Hak akses ujian AI berhasil diperbarui.');
      // Refresh list
      const users = await db.getUsers();
      setUsersList(users);
    } catch (err: any) {
      setError('Gagal mengubah hak akses.');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    setError(null);
    setSuccess(null);
    // Prevent self-demotion
    if (userId === session?.id) {
      setError('Anda tidak bisa mendemosi akun admin Anda sendiri.');
      return;
    }

    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await db.updateUser(userId, { role: newRole });
      setSuccess('Role pengguna berhasil diubah.');
      const users = await db.getUsers();
      setUsersList(users);
    } catch (err: any) {
      setError('Gagal mengubah role.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setError(null);
    setSuccess(null);
    if (userId === session?.id) {
      setError('Anda tidak bisa menghapus akun Anda sendiri.');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini? Semua riwayat ujian mereka akan ikut terhapus.')) {
      return;
    }

    try {
      await db.deleteUser(userId);
      setSuccess('Pengguna berhasil dihapus.');
      const users = await db.getUsers();
      setUsersList(users);
    } catch (err: any) {
      setError('Gagal menghapus pengguna.');
    }
  };

  // --- QUESTION BANK CONTROLLERS ---
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formQuestionText.trim() || !optionA || !optionB || !optionC || !optionD || !optionE) {
      setError('Semua input soal dan kelima pilihan jawaban wajib diisi.');
      return;
    }

    // Format options as strings with labels A, B, C, D, E for UI consistency
    const optionsArray = [
      `A. ${optionA.trim()}`,
      `B. ${optionB.trim()}`,
      `C. ${optionC.trim()}`,
      `D. ${optionD.trim()}`,
      `E. ${optionE.trim()}`,
    ];

    let correctAnswerString = '';
    if (formCategory === 'TKP') {
      const scoreObj = {
        A: Number(tkpScoreA),
        B: Number(tkpScoreB),
        C: Number(tkpScoreC),
        D: Number(tkpScoreD),
        E: Number(tkpScoreE)
      };
      correctAnswerString = JSON.stringify(scoreObj);
    } else {
      correctAnswerString = formCorrectOption;
    }

    try {
      if (isEditingQuestion && editingQuestionId) {
        await db.updateQuestion(editingQuestionId, {
          category: formCategory,
          question_text: formQuestionText,
          options: optionsArray,
          correct_answer: correctAnswerString,
          explanation: formExplanation.trim() || undefined
        });
        setSuccess('Soal berhasil diperbarui.');
      } else {
        await db.createQuestion({
          category: formCategory,
          question_text: formQuestionText,
          options: optionsArray,
          correct_answer: correctAnswerString,
          explanation: formExplanation.trim() || undefined
        });
        setSuccess('Soal baru berhasil disimpan ke database.');
      }

      resetQuestionForm();
      const list = await db.getQuestions();
      setQuestionsList(list);
    } catch (err: any) {
      setError('Gagal menyimpan soal.');
    }
  };

  const handleEditQuestionClick = (q: Question) => {
    setIsEditingQuestion(true);
    setEditingQuestionId(q.id);
    setFormCategory(q.category);
    setFormQuestionText(q.question_text);
    
    // Parse choices (Strip "A. ", "B. ", etc)
    const getCleanOption = (idx: number) => {
      const opt = q.options[idx] || '';
      return opt.startsWith('A. ') || opt.startsWith('B. ') || opt.startsWith('C. ') || opt.startsWith('D. ') || opt.startsWith('E. ') 
        ? opt.substring(3) 
        : opt;
    };
    
    setOptionA(getCleanOption(0));
    setOptionB(getCleanOption(1));
    setOptionC(getCleanOption(2));
    setOptionD(getCleanOption(3));
    setOptionE(getCleanOption(4));
    setFormExplanation(q.explanation || '');
 
    if (q.category === 'TKP') {
      try {
        const scores = JSON.parse(q.correct_answer);
        setTkpScoreA(scores.A ?? 5);
        setTkpScoreB(scores.B ?? 4);
        setTkpScoreC(scores.C ?? 3);
        setTkpScoreD(scores.D ?? 2);
        setTkpScoreE(scores.E ?? 1);
      } catch (e) {
        // Fallback default
        setTkpScoreA(5); setTkpScoreB(4); setTkpScoreC(3); setTkpScoreD(2); setTkpScoreE(1);
      }
    } else {
      setFormCorrectOption(q.correct_answer);
    }
     
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    setError(null);
    setSuccess(null);
    try {
      await db.deleteQuestion(id);
      setSuccess('Soal berhasil dihapus.');
      const list = await db.getQuestions();
      setQuestionsList(list);
    } catch (e) {
      setError('Gagal menghapus soal.');
    }
  };

  const resetQuestionForm = () => {
    setIsEditingQuestion(false);
    setEditingQuestionId(null);
    setFormQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setOptionE('');
    setFormCorrectOption('A');
    setFormExplanation('');
    setTkpScoreA(5);
    setTkpScoreB(4);
    setTkpScoreC(3);
    setTkpScoreD(2);
    setTkpScoreE(1);
  };

  // --- PACKAGE CONTROLLERS ---
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const name = formPackageName.trim();
    const price = Number(formPackagePrice);
    const description = formPackageDescription.trim();
    
    const features = formPackageFeaturesText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    if (!name) {
      setError('Nama paket wajib diisi.');
      return;
    }

    if (isNaN(price) || price < 0) {
      setError('Harga paket harus bernilai 0 atau lebih.');
      return;
    }

    try {
      if (isEditingPackage && editingPackageId) {
        const updated = await db.updatePackage(editingPackageId, {
          name,
          price,
          description: description || undefined,
          features
        });
        if (updated) {
          setSuccess('Paket berhasil diperbarui.');
        } else {
          setError('Gagal memperbarui paket. Silakan buat tabel packages di Supabase SQL Editor terlebih dahulu jika terhubung ke Supabase live.');
        }
      } else {
        const created = await db.createPackage({
          name,
          price,
          description: description || undefined,
          features
        });
        if (created) {
          setSuccess('Paket baru berhasil ditambahkan.');
        } else {
          setError('Gagal menambahkan paket. Silakan buat tabel packages di Supabase SQL Editor terlebih dahulu jika terhubung ke Supabase live.');
        }
      }

      resetPackageForm();
      const list = await db.getPackages();
      setPackagesList(list);
    } catch (err: any) {
      setError('Gagal menyimpan paket.');
    }
  };

  const handleEditPackageClick = (pkg: Package) => {
    setIsEditingPackage(true);
    setEditingPackageId(pkg.id);
    setFormPackageName(pkg.name);
    setFormPackagePrice(pkg.price);
    setFormPackageDescription(pkg.description || '');
    setFormPackageFeaturesText(pkg.features.join('\n'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return;
    setError(null);
    setSuccess(null);
    try {
      await db.deletePackage(id);
      setSuccess('Paket berhasil dihapus.');
      const list = await db.getPackages();
      setPackagesList(list);
    } catch (e) {
      setError('Gagal menghapus paket.');
    }
  };

  const resetPackageForm = () => {
    setIsEditingPackage(false);
    setEditingPackageId(null);
    setFormPackageName('');
    setFormPackagePrice(0);
    setFormPackageDescription('');
    setFormPackageFeaturesText('');
  };

  // Filter list logic
  const filteredQuestions = questionsList.filter(q => questionFilter === 'All' || q.category === questionFilter);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b13]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Memuat panel admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-200">
      {/* Admin Header */}
      <header className="glass-premium border-b border-slate-200/50 dark:border-slate-800/40 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              kelas<span className="text-brand-600 font-extrabold">materi</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{usersList.length} Pengguna Terdaftar</span>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full space-y-8 flex-1">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveTab('users'); setError(null); setSuccess(null); }}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-all shrink-0 ${
              activeTab === 'users'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Manajemen Pengguna</span>
          </button>
          <button
            onClick={() => { setActiveTab('questions'); setError(null); setSuccess(null); }}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-all shrink-0 ${
              activeTab === 'questions'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span>Bank Soal Manual</span>
          </button>
          <button
            onClick={() => { setActiveTab('packages'); setError(null); setSuccess(null); }}
            className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 cursor-pointer transition-all shrink-0 ${
              activeTab === 'packages'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Award className="w-4.5 h-4.5" />
            <span>Manajemen Paket</span>
          </button>
        </div>

        {/* Global Feedback Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-sm animate-fade-in">
            <Check className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* --- TAB 1: USERS PANEL --- */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: User Provision Form */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Tambah Pengguna</span>
              </h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label htmlFor="userEmail" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Alamat Email
                  </label>
                  <input
                    id="userEmail"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                    placeholder="contoh@email.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="userPassword" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Kata Sandi (Password)
                  </label>
                  <input
                    id="userPassword"
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 mb-2"
                    placeholder="Minimal 6 karakter"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="userRole" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Hak Akses (Role)
                  </label>
                  <select
                    id="userRole"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                  >
                    <option value="user">User (Standard)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Akun</span>
                </button>
              </form>
            </div>

            {/* Right: User Management Table */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Pengguna Platform</h3>
                <p className="text-xs text-slate-400 mt-1">Mengatur wewenang, menghapus, serta memberikan izin modul Tryout AI.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800/80">
                      <th className="p-4">Alamat Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-center">Izin Ujian AI</th>
                      <th className="p-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">{user.email}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleRole(user.id, user.role)}
                            className={`px-2.5 py-1 rounded-md font-bold text-[10px] tracking-wider uppercase cursor-pointer transition-colors ${
                              user.role === 'admin'
                                ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {user.role}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleCanGenerateExam(user.id, user.can_generate_exam)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                              user.can_generate_exam
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{user.can_generate_exam ? 'Aktif' : 'Terkunci'}</span>
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer inline-flex"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: QUESTIONS CRUD PANEL --- */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            
            {/* Expandable Form: Add or Edit Question */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isEditingQuestion ? <Edit3 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-brand-500" />}
                  <span>{isEditingQuestion ? 'Sunting Soal Ujian' : 'Tambah Soal Manual Baru'}</span>
                </h3>
                {isEditingQuestion && (
                  <button
                    onClick={resetQuestionForm}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                    <span>Batalkan Edit</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category select */}
                  <div>
                    <label htmlFor="formCategory" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Kategori Materi
                    </label>
                    <select
                      id="formCategory"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                      value={formCategory}
                      onChange={(e) => {
                        const cat = e.target.value as 'TIU' | 'TWK' | 'TKP';
                        setFormCategory(cat);
                      }}
                    >
                      <option value="TWK">TWK (Wawasan Kebangsaan)</option>
                      <option value="TIU">TIU (Inteligensia Umum)</option>
                      <option value="TKP">TKP (Karakteristik Pribadi)</option>
                    </select>
                  </div>
                  
                  {/* Correct Answer Selection for TWK / TIU */}
                  {formCategory !== 'TKP' ? (
                    <div>
                      <label htmlFor="correctOption" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Pilihan Jawaban Benar
                      </label>
                      <select
                        id="correctOption"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                        value={formCorrectOption}
                        onChange={(e) => setFormCorrectOption(e.target.value)}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-2 flex items-center p-3.5 bg-brand-500/5 border border-brand-500/10 rounded-xl text-xs text-brand-600 dark:text-brand-400 font-semibold gap-2 self-end">
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <span>Untuk soal TKP, setiap pilihan jawaban memiliki bobot nilai terpisah (1 hingga 5). Konfigurasikan pembobotan nilai di bawah ini.</span>
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <div>
                  <label htmlFor="questionText" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Pertanyaan (Soal)
                  </label>
                  <textarea
                    id="questionText"
                    rows={3}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="Tulis soal ujian di sini..."
                    value={formQuestionText}
                    onChange={(e) => setFormQuestionText(e.target.value)}
                  />
                </div>

                {/* Explanation Text */}
                <div>
                  <label htmlFor="formExplanation" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Pembahasan / Penjelasan Soal (Opsional)
                  </label>
                  <textarea
                    id="formExplanation"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="Tulis pembahasan atau penjelasan kunci jawaban soal di sini..."
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                  />
                </div>

                {/* Options Input A - E */}
                <div className="space-y-4">
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilihan Jawaban & Skoring</span>
                  
                  {[
                    { key: 'A', val: optionA, setter: setOptionA, tkpVal: tkpScoreA, tkpSetter: setTkpScoreA },
                    { key: 'B', val: optionB, setter: setOptionB, tkpVal: tkpScoreB, tkpSetter: setTkpScoreB },
                    { key: 'C', val: optionC, setter: setOptionC, tkpVal: tkpScoreC, tkpSetter: setTkpScoreC },
                    { key: 'D', val: optionD, setter: setOptionD, tkpVal: tkpScoreD, tkpSetter: setTkpScoreD },
                    { key: 'E', val: optionE, setter: setOptionE, tkpVal: tkpScoreE, tkpSetter: setTkpScoreE },
                  ].map((opt) => (
                    <div key={opt.key} className="flex gap-4 items-center">
                      <span className="font-extrabold text-sm text-slate-400 w-4">{opt.key}</span>
                      <input
                        type="text"
                        required
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                        placeholder={`Teks Jawaban Pilihan ${opt.key}`}
                        value={opt.val}
                        onChange={(e) => opt.setter(e.target.value)}
                      />
                      
                      {/* TKP Scoring field */}
                      {formCategory === 'TKP' && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-400 font-bold shrink-0">Poin:</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            className="w-16 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm text-center focus:outline-none"
                            value={opt.tkpVal}
                            onChange={(e) => opt.tkpSetter(Number(e.target.value))}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Form buttons */}
                <div className="flex gap-4 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={resetQuestionForm}
                    className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-500 text-sm font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Save className="w-4.5 h-4.5" />
                    <span>{isEditingQuestion ? 'Perbarui Soal' : 'Simpan Soal'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List and Category Filtering */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Soal Bank Soal</h3>
                  <p className="text-xs text-slate-400 mt-1">Total {questionsList.length} soal manual terdaftar.</p>
                </div>

                {/* Filters */}
                <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  {['All', 'TWK', 'TIU', 'TKP'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setQuestionFilter(filter as any)}
                      className={`px-4 py-2 font-bold cursor-pointer transition-all ${
                        questionFilter === filter
                          ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950'
                          : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950/60'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table list of questions */}
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q) => (
                    <div key={q.id} className="p-6 hover:bg-slate-50/20 dark:hover:bg-slate-950/10 transition-colors flex gap-6 justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex gap-2 items-center">
                          <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border ${
                            q.category === 'TWK' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                              : q.category === 'TIU'
                              ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/30'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                          }`}>
                            {q.category}
                          </span>
                          
                          {/* Answer summary */}
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">
                            Kunci: {q.category === 'TKP' ? 'Skala TKP' : q.correct_answer}
                          </span>
                        </div>

                        <p className="text-sm text-slate-900 dark:text-white leading-relaxed font-medium">
                          {q.question_text}
                        </p>

                        {/* Options preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className="truncate" title={opt}>{opt}</div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditQuestionClick(q)}
                          className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all cursor-pointer"
                          title="Sunting Soal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                    <span className="text-xs font-semibold">Tidak Ada Soal Ditemukan</span>
                    <span className="text-[10px]">Pilih kategori lain atau tambahkan soal baru menggunakan form di atas.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: PACKAGES PANEL --- */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Left Column: Create/Edit Package form */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isEditingPackage ? <Edit3 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-brand-500" />}
                  <span>{isEditingPackage ? 'Sunting Paket' : 'Tambah Paket Baru'}</span>
                </h3>
                {isEditingPackage && (
                  <button
                    onClick={resetPackageForm}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Batal</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSavePackage} className="space-y-4">
                <div>
                  <label htmlFor="packageName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Nama Paket / Kelas
                  </label>
                  <input
                    id="packageName"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="Contoh: Paket Premium CAT"
                    value={formPackageName}
                    onChange={(e) => setFormPackageName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="packagePrice" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Harga Paket (Rupiah)
                  </label>
                  <input
                    id="packagePrice"
                    type="number"
                    min={0}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="Contoh: 49000 (0 untuk gratis)"
                    value={formPackagePrice}
                    onChange={(e) => setFormPackagePrice(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label htmlFor="packageDescription" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Deskripsi Ringkas
                  </label>
                  <textarea
                    id="packageDescription"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="Masukkan deskripsi singkat tentang paket..."
                    value={formPackageDescription}
                    onChange={(e) => setFormPackageDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="packageFeatures" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Fitur Pendukung (Satu baris per fitur)
                  </label>
                  <textarea
                    id="packageFeatures"
                    rows={5}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
                    placeholder="Akses Penuh Soal&#10;Durasi Ujian 100 Menit&#10;Pembahasan Lengkap"
                    value={formPackageFeaturesText}
                    onChange={(e) => setFormPackageFeaturesText(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isEditingPackage ? 'Perbarui Paket' : 'Tambah Paket'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Packages Table Grid */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/85 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Paket Kelas</h3>
                <p className="text-xs text-slate-400 mt-1">Mengatur pilihan paket dan harga yang ditampilkan di landing page.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800/80">
                      <th className="p-4">Nama Paket</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4">Fitur</th>
                      <th className="p-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {packagesList.length > 0 ? (
                      packagesList.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{pkg.name}</div>
                            <div className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate" title={pkg.description}>
                              {pkg.description || '-'}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white font-mono">
                            {pkg.price === 0 ? 'Gratis' : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                          </td>
                          <td className="p-4">
                            <ul className="list-disc pl-4 space-y-1 text-slate-500 max-w-[300px]">
                              {pkg.features.map((feature, fIdx) => (
                                <li key={fIdx} className="truncate" title={feature}>{feature}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditPackageClick(pkg)}
                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all cursor-pointer"
                                title="Sunting Paket"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePackage(pkg.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                                title="Hapus Paket"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          Tidak ada paket terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Keluar dari Akun Admin?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin keluar dari sesi admin saat ini? Anda harus masuk kembali untuk mengelola data.
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
    </div>
  );
}
