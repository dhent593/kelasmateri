'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Award, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  BookOpen, 
  Sparkles, 
  TrendingUp,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  MessageCircle
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const stats = [
    { label: 'Peserta Terdaftar', value: '54,200+', icon: Users },
    { label: 'Soal Terjaga Akurat', value: '12,500+', icon: BookOpen },
    { label: 'Kelulusan CPNS 2024-2025', value: '96.4%', icon: CheckCircle },
    { label: 'Skor Naik Rata-rata', value: '+35%', icon: TrendingUp },
  ];

  const features = [
    {
      title: 'Simulasi Sistem CAT Resmi',
      description: 'Rasakan atmosfer ujian yang sama persis dengan sistem Computer Assisted Test (CAT) BKN RI resmi.',
      icon: Award,
    },
    {
      title: 'Rekomendasi Soal AI',
      description: 'Gunakan teknologi Gemini AI untuk melatih area kelemahan Anda secara presisi dengan soal baru tak terbatas.',
      icon: Sparkles,
    },
    {
      title: 'Visualisasi Grafik Analitis',
      description: 'Lacak riwayat nilai Anda dari waktu ke waktu secara komprehensif lengkap dengan radar kelemahan sub-materi.',
      icon: TrendingUp,
    },
  ];

  const testimonials = [
    {
      name: 'Rian Hidayat',
      role: 'PNS Kementerian Hukum & HAM (CPNS 2024)',
      text: 'Fitur jeda simulasi kelasmateri sangat membantu ketika mendadak ada gangguan jaringan. Berkat analisis per sub-kategori, saya bisa mendongkrak nilai TKP saya yang awalnya selalu mepet passing grade.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: 'Sarah Amalia',
      role: 'PNS Pemerintah Provinsi DKI Jakarta (CPNS 2024)',
      text: 'Ujian AI generatifnya luar biasa cerdas! Soal-soal TIU silogisme dan figuralnya sangat variatif, membuat saya terbiasa berpikir logis dan tenang saat hari H ujian yang sesungguhnya.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    },
  ];

  const faqs = [
    {
      question: 'Apakah simulasi kelasmateri sudah mengikuti kisi-kisi PERMENPAN-RB terbaru?',
      answer: 'Ya, seluruh bank soal kami diperbarui secara berkala mengikuti Permenpan-RB nomor terbaru yang mengatur materi TWK, TIU, dan TKP, termasuk pembobotan nilai TKP berskala 1-5.'
    },
    {
      question: 'Bagaimana cara menggunakan fitur Simulasi AI?',
      answer: 'Fitur Ujian AI memerlukan hak akses khusus dari Admin. Anda dapat meminta aktivasi melalui dashboard Anda setelah melakukan pendaftaran akun.'
    },
    {
      question: 'Apakah hasil ujian saya bisa diunduh atau disimpan?',
      answer: 'Semua hasil pengerjaan, skor per sub-kategori, dan durasi pengerjaan Anda otomatis disimpan ke sistem cloud database sehingga Anda dapat meninjau riwayat belajar Anda kapan saja.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#070b13] text-slate-800 dark:text-slate-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-premium border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              kelas<span className="text-brand-600 font-extrabold">materi</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#fitur" className="hover:text-brand-500 transition-colors">Fitur</a>
            <a href="#statistik" className="hover:text-brand-500 transition-colors">Statistik</a>
            <a href="#testimoni" className="hover:text-brand-500 transition-colors">Testimoni</a>
            <a href="#faq" className="hover:text-brand-500 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/10 cursor-pointer"
            >
              Masuk / Daftar
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-lg">
            <a 
              href="#fitur" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium hover:text-brand-500"
            >
              Fitur
            </a>
            <a 
              href="#statistik" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium hover:text-brand-500"
            >
              Statistik
            </a>
            <a 
              href="#testimoni" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium hover:text-brand-500"
            >
              Testimoni
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium hover:text-brand-500"
            >
              FAQ
            </a>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pilih Mode</span>
              <ThemeToggle />
            </div>
            <Link 
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700"
            >
              Masuk / Daftar
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center py-20 px-6 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold text-xs tracking-wider uppercase mx-auto lg:mx-0">
              <Sparkles className="w-4 h-4" />
              <span>Pendaftaran Tryout CPNS 2026 Telah Dibuka</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
              Kuasai Kelulusan <br />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 bg-clip-text text-transparent">
                CPNS Dengan AI
              </span>
            </h1>

            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Platform simulasi CAT terpadu untuk mempersiapkan diri menghadapi Tes Wawasan Kebangsaan (TWK), Tes Inteligensia Umum (TIU), dan Tes Karakteristik Pribadi (TKP).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold shadow-lg shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Mulai Simulasi Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#fitur" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Pelajari Fitur
              </a>
            </div>
          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5 relative animate-float">
            <div className="relative border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl shadow-slate-200/50 dark:shadow-none">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-slate-400 font-medium font-mono">kelasmateri.vercel.app</span>
              </div>
              
              <div className="space-y-4">
                <div className="h-6 w-1/3 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                <div className="h-32 bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/20 dark:to-slate-950 rounded-2xl border border-brand-500/10 flex flex-col justify-end p-4">
                  <div className="text-xs text-brand-600 dark:text-brand-400 font-semibold mb-1">PROGRES BELAJAR</div>
                  <div className="text-2xl font-black text-slate-950 dark:text-white">Skor Tertinggi: 410</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">TIU</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">130/175</span>
                  </div>
                  <div className="h-16 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">TWK</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">120/150</span>
                  </div>
                  <div className="h-16 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold">TKP</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">160/225</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="statistik" className="py-16 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800/60 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-brand-500 shadow-sm">
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">{stat.value}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto space-y-4 mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Teknologi Modern</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Alasan Mengapa kelasmateri Berbeda</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Kami menggabungkan data histori ujian dengan model AI Gemini untuk menghadirkan kualitas simulasi terbaik yang relevan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl hover:border-brand-500/30 hover:shadow-lg dark:hover:shadow-none transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-950 dark:text-white">{feat.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-24 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800/60 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto space-y-4 mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-accent-500">Testimoni Sukses</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Mereka Yang Telah Lolos</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Ratusan alumni kelasmateri telah mengabdi sebagai aparatur sipil negara di berbagai kementerian dan pemerintah daerah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((test, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-8 rounded-2xl shadow-sm relative flex flex-col justify-between">
                <p className="italic text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                  &ldquo;{test.text}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-500/20">
                    <img 
                      src={test.avatar} 
                      alt={test.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white text-sm">{test.name}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{test.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Tanya Jawab</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Ada Pertanyaan?</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-slate-950 dark:text-white hover:text-brand-500 dark:hover:text-brand-400 cursor-pointer"
                >
                  <span className="text-sm">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-brand-500' : 'text-slate-400'}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-brand-600 to-brand-700 text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Siap Menghadapi Seleksi CPNS 2026?</h2>
          <p className="opacity-90 max-w-md mx-auto text-sm leading-relaxed">
            Daftar akun gratis hari ini, kerjakan latihan manual perdana Anda, dan lihat progres kesiapan Anda secara riil.
          </p>
          <Link 
            href="/register" 
            className="inline-flex px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-brand-700 font-bold shadow-lg hover:shadow-xl transition-all items-center gap-2 cursor-pointer group"
          >
            <span>Daftar Gratis Sekarang</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 dark:text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold">
              <Award className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">kelas<span className="text-brand-600">materi</span></span>
          </div>
          <p>&copy; {new Date().getFullYear()} kelasmateri. All rights reserved. Platform Tryout Mandiri & Simulasi CPNS 2026.</p>
        </div>
      </footer>
      {/* Floating WhatsApp Contact Button */}
      <a
        href={`https://wa.me/6289632321244?text=${encodeURIComponent(`Halo Admin KelasMateri, saya ingin berkonsultasi mengenai platform dan simulasi tryout CPNS.`)}`}
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
