'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Award, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  ShieldAlert, 
  Info,
  Check
} from 'lucide-react';
import { db, ExamSession, Question } from '@/lib/db';
import { getServerSession } from '@/lib/auth-actions';
import ThemeToggle from '@/components/ThemeToggle';

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!sessionId) {
      router.push('/user');
      return;
    }
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const activeUser = await getServerSession();
      if (!activeUser) {
        router.push('/login');
        return;
      }

      const sess = await db.getExamSessionById(sessionId as string);
      if (!sess) {
        throw new Error('Sesi ujian tidak ditemukan.');
      }

      if (sess.status !== 'completed') {
        throw new Error('Ujian ini belum diselesaikan. Anda tidak dapat melihat pembahasan.');
      }

      setSession(sess);
      
      const unpacked = sess.saved_answers as any;
      setQuestions(unpacked?.questions || []);
      setAnswers(unpacked?.answers || {});
    } catch (err: any) {
      setError(err.message || 'Gagal memuat halaman pembahasan.');
    } finally {
      setLoading(false);
    }
  };

  const PASSING_GRADES = { TIU: 80, TWK: 65, TKP: 166 };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b13]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Memuat pembahasan review...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#070b13]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-lg text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kesalahan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'Sesi gagal dimuat.'}</p>
          <button
            onClick={() => router.push('/user')}
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-200">
      
      {/* Header */}
      <header className="glass border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 z-20 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/user')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600" />
            <span className="text-base font-bold text-slate-900 dark:text-white">Review Hasil Simulasi</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Tipe Ujian: {session.exam_type}</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-8 w-full space-y-8 flex-1">
        
        {/* Score Board Cards */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Nilai Akhir: {session.final_score} Poin
                {session.subject === 'toefl' && <span className="text-sm font-bold text-slate-400 ml-2">(Skala PBT 310 - 677)</span>}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {session.subject === 'toefl'
                  ? 'Review detail nilai per bagian simulasi TOEFL Bahasa Inggris (Target Skor: 500+).'
                  : 'Review detail nilai kelulusan ambang batas passing grade SKD CPNS 2026.'}
              </p>
            </div>
            {session.subject === 'toefl' && (
              <div className="shrink-0">
                <span className={`px-4 py-1.5 rounded-full font-black text-xs tracking-wider uppercase ${
                  (session.final_score || 310) >= 500
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {(session.final_score || 310) >= 500 ? 'Target Terpenuhi' : 'Di Bawah Target'}
                </span>
              </div>
            )}
          </div>

          {session.subject === 'toefl' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Listening Comprehension Card */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-indigo-50/10 dark:bg-indigo-950/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Listening Comprehension</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[9px] tracking-wider uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    Target &gt;= 5
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {session.category_scores?.Listening || 0}{' '}
                  <span className="text-xs font-semibold text-slate-400">/ 10 Benar</span>
                </div>
              </div>

              {/* Structure and Written Expression Card */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-purple-50/10 dark:bg-purple-950/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Structure &amp; Written Exp.</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[9px] tracking-wider uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    Target &gt;= 5
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {session.category_scores?.Structure || 0}{' '}
                  <span className="text-xs font-semibold text-slate-400">/ 10 Benar</span>
                </div>
              </div>

              {/* Reading Comprehension Card */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-teal-50/10 dark:bg-teal-950/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">Reading Comprehension</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[9px] tracking-wider uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    Target &gt;= 5
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {session.category_scores?.Reading || 0}{' '}
                  <span className="text-xs font-semibold text-slate-400">/ 10 Benar</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* TIU Card */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">TIU (Target 80)</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] tracking-wider uppercase ${
                    (session.category_scores?.TIU || 0) >= PASSING_GRADES.TIU
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {(session.category_scores?.TIU || 0) >= PASSING_GRADES.TIU ? 'Lulus' : 'Gagal'}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{session.category_scores?.TIU} <span className="text-xs font-semibold text-slate-400">/ 175</span></div>
              </div>

              {/* TWK Card */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">TWK (Target 65)</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] tracking-wider uppercase ${
                    (session.category_scores?.TWK || 0) >= PASSING_GRADES.TWK
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {(session.category_scores?.TWK || 0) >= PASSING_GRADES.TWK ? 'Lulus' : 'Gagal'}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{session.category_scores?.TWK} <span className="text-xs font-semibold text-slate-400">/ 150</span></div>
              </div>

              {/* TKP Card */}
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">TKP (Target 166)</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] tracking-wider uppercase ${
                    (session.category_scores?.TKP || 0) >= PASSING_GRADES.TKP
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {(session.category_scores?.TKP || 0) >= PASSING_GRADES.TKP ? 'Lulus' : 'Gagal'}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{session.category_scores?.TKP} <span className="text-xs font-semibold text-slate-400">/ 225</span></div>
              </div>
            </div>
          )}
        </section>

        {/* Questions and Answers List */}
        <section className="space-y-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            <span>Kunci Jawaban &amp; Pembahasan Lengkap</span>
          </h3>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const userAnswer = answers[q.id];
              const isTkp = q.category === 'TKP';

              // TKP Points parsing
              let tkpPoints: Record<string, number> = {};
              if (isTkp) {
                try {
                  tkpPoints = JSON.parse(q.correct_answer);
                } catch(e) {}
              }

              // Determine correctness for TWK/TIU
              const isCorrect = !isTkp && userAnswer === q.correct_answer;
              const hasAnswered = !!userAnswer;

              return (
                <div 
                  key={q.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-5"
                >
                  {/* Category and Status Badge */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-400">SOAL {idx + 1}</span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${
                        q.category === 'TWK' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : q.category === 'TIU'
                          ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400'
                          : q.category === 'TKP'
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                          : q.category === 'Listening'
                          ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                          : q.category === 'Structure'
                          ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400'
                          : 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400'
                      }`}>
                        {q.category}
                      </span>
                    </div>

                    {/* Answer Status Badge */}
                    {isTkp ? (
                      <span className="text-[10px] font-semibold text-slate-400">
                        {hasAnswered ? `Mendapat ${tkpPoints[userAnswer] || 0} Poin` : 'Tidak Dijawab (0 Poin)'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {hasAnswered ? (
                          isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Benar{session.subject === 'toefl' ? '' : ' (+5)'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Salah{session.subject === 'toefl' ? '' : ' (0)'}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Tidak Dijawab{session.subject === 'toefl' ? '' : ' (0)'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {q.question_text}
                  </h4>

                  {/* Choice Options list */}
                  <div className="space-y-2.5">
                    {q.options.map((opt) => {
                      const letter = opt.trim().substring(0, 1);
                      const cleanText = opt.trim().substring(3);
                      
                      const isUserSelected = userAnswer === letter;
                      const isCorrectKey = !isTkp && q.correct_answer === letter;
                      
                      // Highlight classes
                      let borderClass = 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 text-slate-600 dark:text-slate-400';
                      let letterBg = 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800';

                      if (!isTkp) {
                        if (isCorrectKey) {
                          borderClass = 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400';
                          letterBg = 'bg-emerald-500 text-white border-emerald-500';
                        } else if (isUserSelected && !isCorrectKey) {
                          borderClass = 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-400';
                          letterBg = 'bg-red-500 text-white border-red-500';
                        }
                      } else {
                        // TKP styling shows selected with green/blue tint
                        if (isUserSelected) {
                          borderClass = 'border-brand-500 bg-brand-500/5 text-slate-900 dark:text-white';
                          letterBg = 'bg-brand-500 text-white border-brand-500';
                        }
                      }

                      return (
                        <div 
                          key={letter}
                          className={`w-full p-3.5 rounded-xl border text-xs leading-relaxed flex gap-3 items-start ${borderClass}`}
                        >
                          <span className={`w-5.5 h-5.5 rounded-md font-extrabold text-[10px] flex items-center justify-center border shrink-0 ${letterBg}`}>
                            {letter}
                          </span>
                          <div className="flex-1 font-semibold">
                            <span>{cleanText}</span>
                            {/* Display weights for TKP */}
                            {isTkp && (
                              <span className="ml-2 inline-block text-[10px] text-slate-400 font-mono">
                                ({tkpPoints[letter] || 0} Poin)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  <div className="p-4 rounded-2xl bg-brand-500/5 dark:bg-brand-950/20 border border-brand-500/10 space-y-2 text-xs leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider text-[10px]">
                      <Info className="w-3.5 h-3.5" />
                      <span>Pembahasan Soal</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-semibold">
                      {q.explanation || `Kunci jawaban yang benar adalah opsi ${q.correct_answer}. (Tidak ada penjelasan tambahan yang tersimpan).`}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b13]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Memuat pembahasan...</span>
        </div>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}
