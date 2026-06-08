'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Award, 
  Clock, 
  Pause, 
  ArrowLeft, 
  ArrowRight, 
  CheckSquare, 
  ShieldAlert,
  Loader
} from 'lucide-react';
import { db, ExamSession, Question } from '@/lib/db';
import { getServerSession } from '@/lib/auth-actions';

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Exam State
  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { question_id: "A" }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Confirmation Modal
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch session details on mount
  useEffect(() => {
    if (!sessionId) {
      router.push('/user');
      return;
    }
    fetchSession();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const activeUser = await getServerSession();
      if (!activeUser) {
        router.push('/login');
        return;
      }

      const sess = await db.getExamSessionById(sessionId as string);
      if (!sess) {
        throw new Error('Simulasi ujian tidak ditemukan.');
      }

      if (sess.status === 'completed') {
        router.push('/user');
        return;
      }

      setSession(sess);
      setTimeLeft(sess.remaining_time_seconds);

      // Unpack questions and answers from saved_answers jsonb
      const unpacked = sess.saved_answers as any;
      const sessQuestions = unpacked?.questions || [];
      const sessAnswers = unpacked?.answers || {};

      if (sessQuestions.length === 0) {
        throw new Error('Tidak ada soal yang terdaftar dalam sesi ini.');
      }

      setQuestions(sessQuestions);
      setAnswers(sessAnswers);
      setCurrentIndex(sess.current_question_index || 0);

      // Start Countdown Timer
      startTimer();
    } catch (err: any) {
      setError(err.message || 'Gagal memuat sesi ujian.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Trigger auto-submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        
        // Sync time to database periodically (every 15 seconds)
        const updatedTime = prev - 1;
        if (updatedTime % 15 === 0) {
          syncTimeAndIndexToDb(updatedTime, currentIndex);
        }

        return updatedTime;
      });
    }, 1000);
  };

  const syncTimeAndIndexToDb = async (remainingTime: number, index: number) => {
    if (!sessionId) return;
    try {
      await db.updateExamSession(sessionId, {
        remaining_time_seconds: remainingTime,
        current_question_index: index
      });
    } catch (e) {
      // Background failure silently ignored
    }
  };

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = async (optionLetter: string) => {
    if (!currentQuestion || !sessionId) return;

    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: optionLetter
    };

    setAnswers(updatedAnswers);

    // Save answer state immediately to database
    try {
      await db.updateExamSession(sessionId, {
        saved_answers: {
          answers: updatedAnswers,
          questions: questions // Preserve questions list
        }
      });
    } catch (e) {
      // Silently log or handle background sync errors
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      syncTimeAndIndexToDb(timeLeft, nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      syncTimeAndIndexToDb(timeLeft, prevIdx);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    syncTimeAndIndexToDb(timeLeft, index);
  };

  const handlePause = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    try {
      // Final sync of remaining time and current index
      await db.updateExamSession(sessionId as string, {
        remaining_time_seconds: timeLeft,
        current_question_index: currentIndex,
        saved_answers: {
          answers: answers,
          questions: questions
        }
      });
      router.push('/user');
    } catch (e) {
      setError('Gagal menjeda ujian secara aman. Silakan coba kembali.');
      setLoading(false);
      startTimer();
    }
  };

  // Standard CPNS Scoring Algorithm
  const calculateScores = () => {
    let tiuScore = 0;
    let twkScore = 0;
    let tkpScore = 0;

    questions.forEach((q) => {
      const userAnswer = answers[q.id];
      if (!userAnswer) return; // Unanswered questions get 0 points

      if (q.category === 'TWK') {
        // Correct answer gets 5, incorrect gets 0
        if (userAnswer === q.correct_answer) {
          twkScore += 5;
        }
      } else if (q.category === 'TIU') {
        // Correct answer gets 5, incorrect gets 0
        if (userAnswer === q.correct_answer) {
          tiuScore += 5;
        }
      } else if (q.category === 'TKP') {
        // TKP has weighted scores (1 - 5) based on parsed JSON string
        try {
          const weights = JSON.parse(q.correct_answer);
          const score = weights[userAnswer] || 0;
          tkpScore += score;
        } catch (e) {
          // Fallback if formatting was malformed
          tkpScore += 3;
        }
      }
    });

    return {
      finalScore: tiuScore + twkScore + tkpScore,
      categoryScores: {
        TIU: tiuScore,
        TWK: twkScore,
        TKP: tkpScore
      }
    };
  };

  const handleSubmitExam = async () => {
    if (!sessionId) return;
    setLoading(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const { finalScore, categoryScores } = calculateScores();

      await db.updateExamSession(sessionId, {
        status: 'completed',
        final_score: finalScore,
        category_scores: categoryScores,
        remaining_time_seconds: 0,
        completed_at: new Date().toISOString()
      });

      router.push('/user');
    } catch (e) {
      setError('Gagal mengirimkan lembar jawaban. Coba klik kumpulkan kembali.');
      setLoading(false);
      startTimer();
    }
  };

  const handleAutoSubmit = async () => {
    if (!sessionId) return;
    setLoading(true);
    
    try {
      const { finalScore, categoryScores } = calculateScores();

      await db.updateExamSession(sessionId, {
        status: 'completed',
        final_score: finalScore,
        category_scores: categoryScores,
        remaining_time_seconds: 0,
        completed_at: new Date().toISOString()
      });

      alert('Waktu ujian Anda telah habis! Jawaban Anda telah otomatis dikumpulkan.');
      router.push('/user');
    } catch (e) {
      router.push('/user');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b13]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-10 h-10 text-brand-500 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Menyinkronkan lembar jawaban...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-200">
      
      {/* Distraction-Free Header */}
      <header className="glass border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 z-20 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            kelas<span className="text-brand-600">materi</span>
          </span>
        </div>

        {/* Countdown Timer */}
        <div className={`flex items-center gap-2.5 px-5 py-2 rounded-xl border text-sm font-extrabold font-mono tracking-wider transition-colors duration-300 ${
          timeLeft <= 300 
            ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 animate-pulse'
            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-850'
        }`}>
          <Clock className={`w-4.5 h-4.5 ${timeLeft <= 300 ? 'text-red-500' : 'text-brand-500'}`} />
          <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Jeda Button */}
        <button
          onClick={handlePause}
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Pause className="w-3.5 h-3.5 fill-current text-slate-400" />
          <span>Jeda & Simpan</span>
        </button>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Error notification */}
        {error && (
          <div className="lg:col-span-12 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Left Side: Active Question board */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm space-y-6 min-h-[450px] flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Question category & numbers */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Materi Ujian</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                  currentQuestion?.category === 'TWK'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                    : currentQuestion?.category === 'TIU'
                    ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400'
                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {currentQuestion?.category}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">Soal {currentIndex + 1} dari {questions.length}</span>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg text-slate-900 dark:text-white leading-relaxed font-semibold">
                {currentQuestion?.question_text}
              </h2>
            </div>

            {/* Option choices */}
            <div className="space-y-3 pt-4">
              {currentQuestion?.options.map((optionText) => {
                // Option text typically starts with "A. Text content"
                const letter = optionText.trim().substring(0, 1);
                const cleanText = optionText.trim().substring(3);
                const isSelected = answers[currentQuestion.id] === letter;

                return (
                  <button
                    key={letter}
                    onClick={() => handleSelectAnswer(letter)}
                    className={`w-full p-4 rounded-xl border text-left text-sm transition-all duration-200 cursor-pointer flex gap-4 items-start ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/5 text-slate-900 dark:text-white ring-2 ring-brand-500/15'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg font-extrabold text-xs flex items-center justify-center border shrink-0 ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}>
                      {letter}
                    </span>
                    <span className="font-semibold leading-relaxed">{cleanText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom navigation buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-8">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-brand-500/10 cursor-pointer transition-all hover:opacity-90 hover:scale-[1.02]"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Kumpulkan Ujian</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                <span>Selanjutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar Navigation Grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Question Grid navigator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Navigasi Soal</h3>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-850">
              {(() => {
                const twk = questions.map((q, idx) => ({ ...q, idx })).filter(q => q.category === 'TWK');
                const tiu = questions.map((q, idx) => ({ ...q, idx })).filter(q => q.category === 'TIU');
                const tkp = questions.map((q, idx) => ({ ...q, idx })).filter(q => q.category === 'TKP');

                return (
                  <>
                    {/* TWK Section */}
                    {twk.length > 0 && (
                      <div>
                        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-1.5 tracking-wider uppercase flex justify-between">
                          <span>TWK</span>
                          <span className="text-slate-400 font-semibold">{twk.length} Soal</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {twk.map((q) => {
                            const isActive = currentIndex === q.idx;
                            const isAnswered = !!answers[q.id];
                            return (
                              <button
                                key={q.id}
                                onClick={() => handleJumpToQuestion(q.idx)}
                                className={`w-full aspect-square rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer border ${
                                  isActive
                                    ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20 shadow-brand-500/10'
                                    : isAnswered
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-100 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-850'
                                }`}
                              >
                                {q.idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TIU Section */}
                    {tiu.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40">
                        <div className="text-[10px] font-black text-pink-600 dark:text-pink-400 mb-1.5 tracking-wider uppercase flex justify-between">
                          <span>TIU</span>
                          <span className="text-slate-400 font-semibold">{tiu.length} Soal</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {tiu.map((q) => {
                            const isActive = currentIndex === q.idx;
                            const isAnswered = !!answers[q.id];
                            return (
                              <button
                                key={q.id}
                                onClick={() => handleJumpToQuestion(q.idx)}
                                className={`w-full aspect-square rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer border ${
                                  isActive
                                    ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20 shadow-brand-500/10'
                                    : isAnswered
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-100 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-850'
                                }`}
                              >
                                {q.idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* TKP Section */}
                    {tkp.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40">
                        <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 mb-1.5 tracking-wider uppercase flex justify-between">
                          <span>TKP</span>
                          <span className="text-slate-400 font-semibold">{tkp.length} Soal</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {tkp.map((q) => {
                            const isActive = currentIndex === q.idx;
                            const isAnswered = !!answers[q.id];
                            return (
                              <button
                                key={q.id}
                                onClick={() => handleJumpToQuestion(q.idx)}
                                className={`w-full aspect-square rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer border ${
                                  isActive
                                    ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20 shadow-brand-500/10'
                                    : isAnswered
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-100 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-850'
                                }`}
                              >
                                {q.idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            
            {/* Color keys */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400 uppercase">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-brand-500" />
                <span>Aktif</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
                <span>Sudah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850" />
                <span>Belum</span>
              </div>
            </div>
          </div>

          {/* Quick Submit button on Sidebar */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-brand-500 hover:text-white hover:border-brand-500 text-slate-800 dark:text-slate-200 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <CheckSquare className="w-4.5 h-4.5" />
            <span>Kumpulkan Ujian</span>
          </button>
        </div>
      </main>

      {/* Confirmation Submit Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Kumpulkan Lembar Jawaban?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin mengakhiri simulasi ini? Nilai total dan pencapaian passing grade akan langsung dihitung. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            {/* Answered summary stats */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl grid grid-cols-2 gap-4 text-xs font-bold text-center">
              <div>
                <div className="text-slate-400">Terjawab</div>
                <div className="text-slate-900 dark:text-white text-lg mt-0.5">{Object.keys(answers).length} soal</div>
              </div>
              <div>
                <div className="text-slate-400">Belum Terjawab</div>
                <div className="text-slate-900 dark:text-white text-lg mt-0.5 text-amber-500">
                  {questions.length - Object.keys(answers).length} soal
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950"
              >
                Batal & Lanjutkan
              </button>
              <button
                onClick={handleSubmitExam}
                className="flex-1 py-3.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-md shadow-brand-500/15 cursor-pointer"
              >
                Kumpulkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070b13]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Memuat sesi ujian...</span>
        </div>
      </div>
    }>
      <ExamContent />
    </Suspense>
  );
}
