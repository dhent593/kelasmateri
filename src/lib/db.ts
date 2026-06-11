import { createClient } from '@supabase/supabase-js';

export const SESSION_COOKIE_NAME = 'kelasmateri_session';

export interface UserSession {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// Types matching our schema
export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  can_generate_exam: boolean;
  package_id?: string;
  created_at: string;
  password?: string; // Password stored for admin provisioned accounts
}

export interface Question {
  id: string;
  category: 'TIU' | 'TWK' | 'TKP' | 'Listening' | 'Structure' | 'Reading';
  question_text: string;
  options: string[]; // e.g. ["A. ...", "B. ..."]
  correct_answer: string; // TIU/TWK: 'A', 'B', etc. TKP: '{"A": 5, "B": 4, "C": 3, "D": 2, "E": 1}'
  created_at: string;
  explanation?: string; // Pembahasan/Review
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  description?: string;
  features: string[];
  created_at: string;
}

export interface ExamSession {
  id: string;
  user_id: string;
  exam_type: 'ai' | 'manual';
  subject?: 'cpns' | 'toefl';
  current_question_index: number;
  saved_answers: any; // Map of answers and snapshot of questions: { answers: Record<string, string>, questions?: Question[] }
  remaining_time_seconds: number;
  status: 'in_progress' | 'completed';
  final_score: number | null;
  category_scores: any;
  created_at: string;
  completed_at: string | null;
}

// Check if Supabase keys exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Standard seeded questions for CPNS Tryout (TIU, TWK, TKP)
const SEEDED_QUESTIONS: Question[] = [
  {
    id: 'q1',
    category: 'TWK',
    question_text: 'Menurut UUD 1945 yang telah diamandemen, kekuasaan kehakiman di Indonesia dilakukan oleh sebuah Mahkamah Agung dan badan peradilan yang berada di bawahnya serta oleh sebuah...',
    options: [
      'A. Komisi Yudisial',
      'B. Mahkamah Konstitusi',
      'C. Dewan Perwakilan Rakyat',
      'D. Badan Pemeriksa Keuangan',
      'E. Majelis Permusyawaratan Rakyat'
    ],
    correct_answer: 'B',
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan: Berdasarkan UUD 1945 Pasal 24 Ayat (2) hasil amandemen, kekuasaan kehakiman di Indonesia dilakukan oleh sebuah Mahkamah Agung dan badan peradilan di bawahnya (Peradilan Umum, Agama, Militer, PTUN) serta oleh sebuah Mahkamah Konstitusi (MK).'
  },
  {
    id: 'q2',
    category: 'TWK',
    question_text: 'Sikap rela berkorban demi kepentingan bangsa dan negara di atas kepentingan pribadi atau golongan merupakan perwujudan dari sila Pancasila yang ke...',
    options: [
      'A. Satu',
      'B. Dua',
      'C. Tiga',
      'D. Empat',
      'E. Lima'
    ],
    correct_answer: 'C',
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan: Rela berkorban untuk kepentingan negara merupakan salah satu butir pengamalan Pancasila Sila ke-3, yaitu "Persatuan Indonesia". Sila ini menekankan persatuan, kesatuan, serta kepentingan bangsa di atas ego sektoral.'
  },
  {
    id: 'q3',
    category: 'TWK',
    question_text: 'Sidang pertama BPUPKI yang diselenggarakan pada tanggal 29 Mei - 1 Juni 1945 berfokus membahas tentang...',
    options: [
      'A. Rancangan Undang-Undang Dasar',
      'B. Bentuk Pemerintahan Negara',
      'C. Batas Wilayah Negara Indonesia',
      'D. Rumusan Dasar Negara Indonesia',
      'E. Pengangkatan Presiden dan Wakil Presiden'
    ],
    correct_answer: 'D',
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan: Sidang pertama BPUPKI berfokus merumuskan Dasar Negara Indonesia Merdeka (yang melahirkan Pancasila pada 1 Juni 1945). Sedangkan rancangan UUD dibahas pada sidang kedua tanggal 10 - 17 Juli 1945.'
  },
  {
    id: 'q4',
    category: 'TIU',
    question_text: 'Carilah kelanjutan dari deret angka berikut: 3, 6, 12, 21, 33, ...',
    options: [
      'A. 45',
      'B. 48',
      'C. 46',
      'D. 52',
      'E. 50'
    ],
    correct_answer: 'B', // Pattern: +3, +6, +9, +12, +15 (33 + 15 = 48)
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan: Pola penambahan angka adalah kelipatan 3 secara berurutan: 3 ke 6 (+3), 6 ke 12 (+6), 12 ke 21 (+9), 21 ke 33 (+12). Maka angka berikutnya ditambah 15, yaitu 33 + 15 = 48.'
  },
  {
    id: 'q5',
    category: 'TIU',
    question_text: 'APRESIASI : KARYA SENI = ...',
    options: [
      'A. Hukuman : Kejahatan',
      'B. Penghargaan : Prestasi',
      'C. Penilaian : Ujian',
      'D. Investasi : Modal',
      'E. Konsumsi : Makanan'
    ],
    correct_answer: 'B',
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan: Analogi hubungan fungsi. Apresiasi diberikan atas adanya Karya Seni. Begitu pula Penghargaan diberikan atas adanya Prestasi.'
  },
  {
    id: 'q6',
    category: 'TIU',
    question_text: 'Semua mahasiswa yang rajin belajar pasti lulus ujian. Sebagian mahasiswa Teknik Sipil tidak lulus ujian. Kesimpulan yang paling tepat adalah...',
    options: [
      'A. Semua mahasiswa Teknik Sipil rajin belajar.',
      'B. Semua mahasiswa Teknik Sipil tidak rajin belajar.',
      'C. Sebagian mahasiswa Teknik Sipil rajin belajar.',
      'D. Sebagian mahasiswa Teknik Sipil tidak rajin belajar.',
      'E. Semua yang tidak lulus ujian bukan mahasiswa Teknik Sipil.'
    ],
    correct_answer: 'D',
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan: Hukum silogisme. Jika semua mahasiswa rajin pasti lulus, dan sebagian mahasiswa Teknik Sipil tidak lulus, maka disimpulkan bahwa sebagian mahasiswa Teknik Sipil tersebut tidak rajin belajar.'
  },
  {
    id: 'q7',
    category: 'TKP',
    question_text: 'Ketika Anda sedang sibuk menyelesaikan tugas kantor yang sangat penting, tiba-tiba seorang rekan kerja datang meminta bantuan untuk memecahkan masalah sistem komputernya yang mendesak. Sikap Anda adalah...',
    options: [
      'A. Menolaknya secara kasar karena tugas Anda jauh lebih penting dan harus segera selesai.',
      'B. Menghentikan tugas Anda sepenuhnya dan membantunya hingga selesai tanpa peduli pekerjaan Anda terbengkalai.',
      'C. Memberitahunya secara sopan bahwa Anda sedang sibuk, lalu menyarankannya untuk meminta bantuan ke bagian IT atau berjanji membantunya setelah tugas Anda selesai.',
      'D. Mengabaikan permintaannya dan pura-pura tidak mendengar agar dia pergi dengan sendirinya.',
      'E. Menyuruhnya untuk mengerjakan sendiri karena itu adalah tanggung jawabnya masing-masing.'
    ],
    correct_answer: '{"A":1,"B":3,"C":5,"D":2,"E":4}',
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan (Aspek Jejaring Kerja & Profesionalisme): Opsi C bernilai 5 karena mengutamakan keprofesionalan dalam menyelesaikan tugas pribadi yang krusial, sembari menawarkan solusi alternatif yang ramah tanpa mengabaikan rekan kerja.'
  },
  {
    id: 'q8',
    category: 'TKP',
    question_text: 'Ketika Anda ditunjuk sebagai ketua tim dalam sebuah proyek krusial, salah satu anggota tim Anda menunjukkan penurunan performa kerja yang signifikan dan sering terlambat mengumpulkan tugasnya. Tindakan pertama yang akan Anda lakukan adalah...',
    options: [
      'A. Melaporkan performanya yang buruk kepada atasan agar dia segera diganti.',
      'B. Memarahinya di depan anggota tim lain agar dia termotivasi untuk bekerja lebih cepat.',
      'C. Memanggilnya secara pribadi untuk berdiskusi, mendengarkan kendalanya, dan mencari solusi bersama demi kelancaran proyek.',
      'D. Membiarkannya saja dan mengambil alih seluruh pekerjaannya secara sepihak.',
      'E. Mengabaikan kontribusinya dan tidak melibatkan dirinya lagi dalam rapat-rapat koordinasi.'
    ],
    correct_answer: '{"A":2,"B":1,"C":5,"D":4,"E":3}',
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan (Aspek Kemampuan Mengelola Orang Lain): Opsi C bernilai 5 karena langkah bijaksana seorang pemimpin adalah memanggil secara personal untuk mengidentifikasi masalah secara persuasif dan mencari solusi bersama demi tim.'
  },
  {
    id: 'q9',
    category: 'TKP',
    question_text: 'Anda sedang melayani antrean masyarakat di loket pelayanan publik. Tiba-tiba seorang warga berteriak marah karena merasa terlalu lama menunggu dan menuduh Anda tidak bekerja dengan profesional. Sikap Anda menghadapi situasi ini adalah...',
    options: [
      'A. Ikut berteriak membalas tuduhannya agar warga lain tahu bahwa Anda sudah bekerja keras.',
      'B. Tetap bersikap tenang, mendengarkan keluhannya dengan empati, meminta maaf atas ketidaknyamanan, dan menjelaskan situasi pelayanan dengan ramah serta menyelesaikannya secepat mungkin.',
      'C. Meninggalkan loket dan memanggil satpam untuk mengusir warga tersebut keluar dari gedung.',
      'D. Diam saja dan cemberut selama melayani warga tersebut untuk menunjukkan bahwa Anda tersinggung.',
      'E. Menutup loket pelayanan sementara waktu sampai suasana menjadi kondusif kembali.'
    ],
    correct_answer: '{"A":1,"B":5,"C":3,"D":2,"E":4}',
    created_at: new Date().toISOString(),
    explanation: 'Pembahasan (Aspek Pelayanan Publik): Opsi B bernilai 5 karena pelayan publik dituntut untuk memiliki kendali diri yang kuat, mendengarkan kritik secara ramah, empati, dan tidak terpancing emosi negatif.'
  }
];

// Seeded users
const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'admin-uuid',
    email: 'admin@kelasmateri.com',
    role: 'admin',
    can_generate_exam: true,
    package_id: 'pkg-platinum',
    created_at: new Date().toISOString(),
    password: 'palamana'
  },
  {
    id: 'user-uuid',
    email: 'user@kelasmateri.com',
    role: 'user',
    can_generate_exam: false,
    package_id: 'pkg-basic',
    created_at: new Date().toISOString(),
    password: 'palamana'
  }
];

// Seeded sessions to show nice historical charts immediately for 'user@kelasmateri.com' and admin!
const DEFAULT_SESSIONS: ExamSession[] = [
  {
    id: 'sess-1',
    user_id: 'user-uuid',
    exam_type: 'manual',
    subject: 'cpns',
    current_question_index: 9,
    saved_answers: {},
    remaining_time_seconds: 0,
    status: 'completed',
    final_score: 310,
    category_scores: { TIU: 90, TWK: 85, TKP: 135 },
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString()
  },
  {
    id: 'sess-2',
    user_id: 'user-uuid',
    exam_type: 'manual',
    subject: 'cpns',
    current_question_index: 9,
    saved_answers: {},
    remaining_time_seconds: 0,
    status: 'completed',
    final_score: 365,
    category_scores: { TIU: 110, TWK: 105, TKP: 150 },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString()
  },
  {
    id: 'sess-3',
    user_id: 'user-uuid',
    exam_type: 'ai',
    current_question_index: 9,
    saved_answers: {},
    remaining_time_seconds: 0,
    status: 'completed',
    final_score: 410,
    category_scores: { TIU: 130, TWK: 120, TKP: 160 },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 55 * 60 * 1000).toISOString()
  }
];

// Seeded packages
const DEFAULT_PACKAGES: Package[] = [
  {
    id: 'pkg-basic',
    name: 'Paket Basic (Uji Coba)',
    price: 0,
    description: 'Sangat cocok untuk pemula yang ingin mencoba sistem CAT CPNS secara gratis.',
    features: [
      'Akses 30 Soal Acak (10 TWK, 10 TIU, 10 TKP)',
      'Durasi Ujian 30 Menit',
      'Pembahasan Soal Lengkap',
      'Statistik & Progres Belajar Dasar'
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'pkg-premium',
    name: 'Paket Premium CAT',
    price: 49000,
    description: 'Akses penuh ke semua simulasi tryout manual kurasi standar CAT BKN RI.',
    features: [
      'Akses Penuh 110 Soal CAT Lengkap',
      'Durasi Ujian 100 Menit',
      'Pembahasan Soal Detil & Komprehensif',
      'Grafik Analisis Progres Belajar',
      'Sistem Perbandingan Ambang Batas'
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'pkg-platinum',
    name: 'Paket Platinum AI',
    price: 99000,
    description: 'Solusi belajar cerdas menggunakan soal kustom tak terbatas dari Gemini AI.',
    features: [
      'Semua Fitur Paket Premium CAT',
      'Akses Simulasi Adaptif Gemini AI',
      'Penjanaan Soal Tak Terbatas secara Real-time',
      'Rekomendasi Area Kelemahan Materi',
      'Prioritas Layanan Dukungan Admin'
    ],
    created_at: new Date().toISOString()
  }
];

const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'Apakah simulasi KelasMateri sudah mengikuti kisi-kisi PERMENPAN-RB terbaru?',
    answer: 'Ya, seluruh bank soal kami diperbarui secara berkala mengikuti Permenpan-RB nomor terbaru yang mengatur materi TWK, TIU, dan TKP, termasuk pembobotan nilai TKP berskala 1-5.',
    created_at: new Date().toISOString()
  },
  {
    id: 'faq-2',
    question: 'Bagaimana cara menggunakan fitur Simulasi AI?',
    answer: 'Fitur Ujian AI memerlukan hak akses khusus dari Admin. Anda dapat meminta aktivasi melalui dashboard Anda setelah melakukan pendaftaran akun.',
    created_at: new Date().toISOString()
  },
  {
    id: 'faq-3',
    question: 'Apakah hasil ujian saya bisa diunduh atau disimpan?',
    answer: 'Semua hasil pengerjaan, skor per sub-kategori, dan durasi pengerjaan Anda otomatis disimpan ke sistem cloud database sehingga Anda dapat meninjau riwayat belajar Anda kapan saja.',
    created_at: new Date().toISOString()
  }
];

// Server-side process mock DB
interface MockDbStore {
  users: UserProfile[];
  questions: Question[];
  sessions: ExamSession[];
  packages: Package[];
  faqs: FAQ[];
}

declare global {
  var _mockDb: MockDbStore | undefined;
}

if (!global._mockDb) {
  global._mockDb = {
    users: [...DEFAULT_USERS],
    questions: [...SEEDED_QUESTIONS],
    sessions: [...DEFAULT_SESSIONS],
    packages: [...DEFAULT_PACKAGES],
    faqs: [...DEFAULT_FAQS]
  };
}

const mockDb = global._mockDb;

// Helper to check environment
const isClient = typeof window !== 'undefined';

// Unified client-side fetcher for in-memory mock DB sync
const clientFetch = async (action: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
  try {
    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...data });
      const res = await fetch(`/api/mock-db?${params.toString()}`);
      return await res.json();
    } else {
      const res = await fetch('/api/mock-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });
      return await res.json();
    }
  } catch (e) {
    console.error('Error fetching mock DB proxy:', e);
    return null;
  }
};

// File-system persistence helpers for server-side mock DB synchronization
const getFileStorePath = () => {
  if (typeof window === 'undefined') {
    const path = require('path');
    return path.join(process.cwd(), 'mock_db_data.json');
  }
  return '';
};

const readFromFile = (): MockDbStore | null => {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const filePath = getFileStorePath();
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading mock DB from file:', e);
    }
  }
  return null;
};

const writeToFile = (store: MockDbStore) => {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const filePath = getFileStorePath();
      fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      console.error('Error writing mock DB to file:', e);
    }
  }
};

// Fetch mock DB store (file-system synced on server-side)
export const getClientStore = (): MockDbStore => {
  if (typeof window !== 'undefined') {
    return mockDb;
  }

  // Server-side: read from file to get the most updated state across bundles
  const fileData = readFromFile();
  if (fileData) {
    let updated = false;
    if (!fileData.packages) {
      fileData.packages = [...DEFAULT_PACKAGES];
      updated = true;
    }
    if (!fileData.faqs) {
      fileData.faqs = [...DEFAULT_FAQS];
      updated = true;
    }
    if (fileData.users) {
      fileData.users.forEach(u => {
        if (!u.package_id) {
          u.package_id = u.role === 'admin' ? 'pkg-platinum' : 'pkg-basic';
          updated = true;
        }
      });
    }
    if (fileData.sessions) {
      fileData.sessions.forEach(s => {
        if (!s.subject) {
          s.subject = 'cpns';
          updated = true;
        }
      });
    }
    if (updated) {
      writeToFile(fileData);
    }
    global._mockDb = fileData;
    return fileData;
  }

  // Initialize if file doesn't exist yet
  if (!global._mockDb) {
    global._mockDb = {
      users: [...DEFAULT_USERS],
      questions: [...SEEDED_QUESTIONS],
      sessions: [...DEFAULT_SESSIONS],
      packages: [...DEFAULT_PACKAGES],
      faqs: [...DEFAULT_FAQS]
    };
    writeToFile(global._mockDb);
  }
  return global._mockDb;
};

export const saveClientStore = (store: MockDbStore) => {
  global._mockDb = store;
  if (typeof window === 'undefined') {
    writeToFile(store);
  }
};

// Unified Database Controller (wraps Supabase or Fallback)
export const db = {
  // FAQ CRUD
  getFaqs: async (): Promise<FAQ[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('faqs').select('*').order('created_at', { ascending: true });
      if (!error && data) return data as FAQ[];
    }
    if (isClient) {
      return await clientFetch('getFaqs');
    }
    const store = getClientStore();
    return store.faqs || [];
  },

  createFaq: async (faq: Omit<FAQ, 'id' | 'created_at'>): Promise<FAQ> => {
    if (isClient) {
      return await clientFetch('createFaq', 'POST', { faq });
    }

    const newFaq: FAQ = {
      ...faq,
      id: `faq-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('faqs').insert(newFaq).select().single();
      if (!error && data) return data as FAQ;
    }

    const store = getClientStore();
    if (!store.faqs) store.faqs = [];
    store.faqs.push(newFaq);
    saveClientStore(store);
    return newFaq;
  },

  updateFaq: async (id: string, updates: Partial<FAQ>): Promise<FAQ | null> => {
    if (isClient) {
      return await clientFetch('updateFaq', 'POST', { id, updates });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('faqs').update(updates).eq('id', id).select().single();
      if (!error && data) return data as FAQ;
    }

    const store = getClientStore();
    if (!store.faqs) store.faqs = [];
    const index = store.faqs.findIndex(f => f.id === id);
    if (index !== -1) {
      store.faqs[index] = { ...store.faqs[index], ...updates };
      saveClientStore(store);
      return store.faqs[index];
    }
    return null;
  },

  deleteFaq: async (id: string): Promise<boolean> => {
    if (isClient) {
      const res = await clientFetch('deleteFaq', 'POST', { id });
      return !!res?.success;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (!error) return true;
    }

    const store = getClientStore();
    if (!store.faqs) store.faqs = [];
    const initialLength = store.faqs.length;
    store.faqs = store.faqs.filter(f => f.id !== id);
    saveClientStore(store);
    return store.faqs.length < initialLength;
  },
  // PACKAGE CRUD
  getPackages: async (): Promise<Package[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('packages').select('*').order('price', { ascending: true });
      if (!error && data) return data as Package[];
    }
    if (isClient) {
      return await clientFetch('getPackages');
    }
    const store = getClientStore();
    return store.packages || [];
  },

  createPackage: async (pkg: Omit<Package, 'id' | 'created_at'>): Promise<Package> => {
    if (isClient) {
      return await clientFetch('createPackage', 'POST', { package: pkg });
    }

    const newPackage: Package = {
      ...pkg,
      id: `pkg-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('packages').insert(newPackage).select().single();
      if (!error && data) return data as Package;
    }

    const store = getClientStore();
    if (!store.packages) store.packages = [];
    store.packages.push(newPackage);
    saveClientStore(store);
    return newPackage;
  },

  updatePackage: async (id: string, updates: Partial<Package>): Promise<Package | null> => {
    if (isClient) {
      return await clientFetch('updatePackage', 'POST', { id, updates });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('packages').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Package;
    }

    const store = getClientStore();
    if (!store.packages) store.packages = [];
    const index = store.packages.findIndex(p => p.id === id);
    if (index !== -1) {
      store.packages[index] = { ...store.packages[index], ...updates };
      saveClientStore(store);
      return store.packages[index];
    }
    return null;
  },

  deletePackage: async (id: string): Promise<boolean> => {
    if (isClient) {
      const res = await clientFetch('deletePackage', 'POST', { id });
      return !!res?.success;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (!error) return true;
    }

    const store = getClientStore();
    if (!store.packages) store.packages = [];
    const initialLength = store.packages.length;
    store.packages = store.packages.filter(p => p.id !== id);
    saveClientStore(store);
    return store.packages.length < initialLength;
  },

  // USER CRUD
  getUsers: async (): Promise<UserProfile[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) return data as UserProfile[];
    }
    if (isClient) {
      return await clientFetch('getUsers');
    }
    const store = getClientStore();
    return store.users;
  },

  getUserByEmail: async (email: string): Promise<UserProfile | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (!error && data) return data as UserProfile;
    }
    if (isClient) {
      return await clientFetch('getUserByEmail', 'GET', { email });
    }
    const store = getClientStore();
    return store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getUserById: async (id: string): Promise<UserProfile | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data as UserProfile;
    }
    if (isClient) {
      return await clientFetch('getUserById', 'GET', { id });
    }
    const store = getClientStore();
    return store.users.find(u => u.id === id) || null;
  },

  createUser: async (email: string, role: 'admin' | 'user' = 'user', id?: string, password?: string, package_id: string = 'pkg-basic'): Promise<UserProfile> => {
    if (isClient) {
      return await clientFetch('createUser', 'POST', { email, role, id, password, package_id });
    }

    const newId = id || `user-${Math.random().toString(36).substr(2, 9)}`;
    const newUser: UserProfile = {
      id: newId,
      email,
      role,
      can_generate_exam: email === 'admin@kelasmateri.com' || package_id === 'pkg-platinum',
      package_id,
      created_at: new Date().toISOString(),
      password: password || 'palamana'
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').insert(newUser).select().single();
      if (!error && data) return data as UserProfile;
    }

    const store = getClientStore();
    if (!store.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      store.users.push(newUser);
      saveClientStore(store);
    }
    return newUser;
  },

  updateUser: async (id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (isClient) {
      return await clientFetch('updateUser', 'POST', { id, updates });
    }

    if (updates.package_id) {
      updates.can_generate_exam = updates.package_id === 'pkg-platinum';
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
      if (!error && data) return data as UserProfile;
    }

    const store = getClientStore();
    const index = store.users.findIndex(u => u.id === id);
    if (index !== -1) {
      store.users[index] = { ...store.users[index], ...updates };
      saveClientStore(store);
      return store.users[index];
    }
    return null;
  },

  deleteUser: async (id: string): Promise<boolean> => {
    if (isClient) {
      const res = await clientFetch('deleteUser', 'POST', { id });
      return !!res?.success;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (!error) return true;
    }

    const store = getClientStore();
    const initialLength = store.users.length;
    store.users = store.users.filter(u => u.id !== id);
    saveClientStore(store);
    return store.users.length < initialLength;
  },

  // QUESTION CRUD
  getQuestions: async (): Promise<Question[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('manual_questions').select('*').order('created_at', { ascending: true });
      if (!error && data) return data as Question[];
    }
    if (isClient) {
      return await clientFetch('getQuestions');
    }
    const store = getClientStore();
    return store.questions;
  },

  createQuestion: async (question: Omit<Question, 'id' | 'created_at'>): Promise<Question> => {
    if (isClient) {
      return await clientFetch('createQuestion', 'POST', { question });
    }

    const newQuestion: Question = {
      ...question,
      id: `q-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('manual_questions').insert(newQuestion).select().single();
      if (!error && data) return data as Question;
    }

    const store = getClientStore();
    store.questions.push(newQuestion);
    saveClientStore(store);
    return newQuestion;
  },

  updateQuestion: async (id: string, updates: Partial<Question>): Promise<Question | null> => {
    if (isClient) {
      return await clientFetch('updateQuestion', 'POST', { id, updates });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('manual_questions').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Question;
    }

    const store = getClientStore();
    const index = store.questions.findIndex(q => q.id === id);
    if (index !== -1) {
      store.questions[index] = { ...store.questions[index], ...updates };
      saveClientStore(store);
      return store.questions[index];
    }
    return null;
  },

  deleteQuestion: async (id: string): Promise<boolean> => {
    if (isClient) {
      const res = await clientFetch('deleteQuestion', 'POST', { id });
      return !!res?.success;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('manual_questions').delete().eq('id', id);
      if (!error) return true;
    }

    const store = getClientStore();
    const initialLength = store.questions.length;
    store.questions = store.questions.filter(q => q.id !== id);
    saveClientStore(store);
    return store.questions.length < initialLength;
  },

  // EXAM SESSIONS
  getExamSessions: async (): Promise<ExamSession[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exam_sessions').select('*');
      if (!error && data) return data as ExamSession[];
    }
    if (isClient) {
      return await clientFetch('getExamSessions');
    }
    const store = getClientStore();
    return store.sessions;
  },

  getExamSessionById: async (id: string): Promise<ExamSession | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exam_sessions').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data as ExamSession;
    }
    if (isClient) {
      return await clientFetch('getExamSessionById', 'GET', { id });
    }
    const store = getClientStore();
    return store.sessions.find(s => s.id === id) || null;
  },

  getLatestSession: async (userId: string, status?: 'in_progress' | 'completed'): Promise<ExamSession | null> => {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('exam_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query.limit(1).maybeSingle();
      if (!error && data) return data as ExamSession;
    }

    if (isClient) {
      return await clientFetch('getLatestSession', 'GET', { userId, status });
    }

    const store = getClientStore();
    const userSessions = store.sessions
      .filter(s => s.user_id === userId && (!status || s.status === status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return userSessions[0] || null;
  },

  getUserSessions: async (userId: string): Promise<ExamSession[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exam_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (!error && data) return data as ExamSession[];
    }
    if (isClient) {
      return await clientFetch('getUserSessions', 'GET', { userId });
    }
    const store = getClientStore();
    return store.sessions
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  createExamSession: async (session: Omit<ExamSession, 'id' | 'created_at' | 'completed_at' | 'final_score' | 'category_scores'> & { subject?: 'cpns' | 'toefl' }): Promise<ExamSession> => {
    if (isClient) {
      return await clientFetch('createExamSession', 'POST', { session });
    }

    const newSession: ExamSession = {
      ...session,
      id: `sess-${Math.random().toString(36).substr(2, 9)}`,
      subject: session.subject || 'cpns',
      final_score: null,
      category_scores: null,
      created_at: new Date().toISOString(),
      completed_at: null
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exam_sessions').insert(newSession).select().single();
      if (!error && data) return data as ExamSession;
    }

    const store = getClientStore();
    store.sessions.push(newSession);
    saveClientStore(store);
    return newSession;
  },

  updateExamSession: async (id: string, updates: Partial<ExamSession>): Promise<ExamSession | null> => {
    if (isClient) {
      return await clientFetch('updateExamSession', 'POST', { id, updates });
    }

    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('exam_sessions').update(updates).eq('id', id).select().single();
      if (!error && data) return data as ExamSession;
    }

    const store = getClientStore();
    const index = store.sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      store.sessions[index] = { ...store.sessions[index], ...updates };
      saveClientStore(store);
      return store.sessions[index];
    }
    return null;
  },

  deleteExamSession: async (id: string): Promise<boolean> => {
    if (isClient) {
      const res = await clientFetch('deleteExamSession', 'POST', { id });
      return !!res?.success;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('exam_sessions').delete().eq('id', id);
      if (!error) return true;
    }

    const store = getClientStore();
    const initialLength = store.sessions.length;
    store.sessions = store.sessions.filter(s => s.id !== id);
    saveClientStore(store);
    return store.sessions.length < initialLength;
  },

  getFullTryoutPackage: async (): Promise<Question[]> => {
    if (isClient) {
      return await clientFetch('getFullTryoutPackage', 'GET');
    }
    return generate110Questions();
  },

  getTrialTryoutPackage: async (): Promise<Question[]> => {
    if (isClient) {
      return await clientFetch('getTrialTryoutPackage', 'GET');
    }
    return generate30Questions();
  }
};

// Programmatic Generator for 110 CPNS Questions (30 TWK, 35 TIU, 45 TKP)
function generate110Questions(): Question[] {
  const list: Question[] = [];

  // --- 1. TWK: 30 Completely Unique Questions ---
  const twkSubjects = [
    {
      q: 'UUD 1945 Pasal 27 Ayat (3) menyatakan bahwa setiap warga negara berhak dan wajib ikut serta dalam upaya...',
      opts: ['A. Pertahanan negara', 'B. Pembelaan negara', 'C. Ketertiban dunia', 'D. Keadilan sosial', 'E. Keamanan nasional'],
      ans: 'B',
      exp: 'Pembahasan: Berdasarkan Pasal 27 Ayat (3) UUD 1945, diatur tentang hak dan kewajiban warga negara untuk ikut serta dalam upaya pembelaan negara.'
    },
    {
      q: 'Sidang pertama BPUPKI yang diselenggarakan pada tanggal 29 Mei - 1 Juni 1945 berfokus membahas tentang...',
      opts: ['A. Rancangan Undang-Undang Dasar', 'B. Bentuk Pemerintahan Negara', 'C. Batas Wilayah Negara', 'D. Rumusan Dasar Negara', 'E. Pengangkatan Presiden'],
      ans: 'D',
      exp: 'Pembahasan: Sidang pertama BPUPKI berfokus merumuskan Dasar Negara Indonesia Merdeka yang melahirkan Pancasila.'
    },
    {
      q: 'Lembaga negara yang berwenang menguji undang-undang terhadap Undang-Undang Dasar adalah...',
      opts: ['A. Komisi Yudisial', 'B. Mahkamah Konstitusi', 'C. Dewan Perwakilan Rakyat', 'D. Mahkamah Agung', 'E. Majelis Permusyawaratan Rakyat'],
      ans: 'B',
      exp: 'Pembahasan: Mahkamah Konstitusi (MK) berwenang mengadili pada tingkat pertama dan terakhir yang putusannya bersifat final untuk menguji undang-undang terhadap UUD.'
    },
    {
      q: 'Tokoh yang merumuskan usulan Dasar Negara dengan sebutan Pancasila pada tanggal 1 Juni 1945 adalah...',
      opts: ['A. Mohammad Yamin', 'B. Soepomo', 'C. Ir. Soekarno', 'D. Mohammad Hatta', 'E. Radjiman Wedyodiningrat'],
      ans: 'C',
      exp: 'Pembahasan: Ir. Soekarno mengusulkan nama dasar negara tersebut adalah Pancasila pada pidatonya 1 Juni 1945.'
    },
    {
      q: 'Pengamalan nilai Pancasila berupa menghormati hak orang lain dan bersikap adil terhadap sesama merupakan pencerminan sila...',
      opts: ['A. Sila Kedua', 'B. Sila Ketiga', 'C. Sila Keempat', 'D. Sila Kelima', 'E. Sila Kesatu'],
      ans: 'D',
      exp: 'Pembahasan: Bersikap adil dan menghormati hak orang lain merupakan butir pengamalan Sila ke-5 Pancasila.'
    },
    {
      q: 'Panitia Sembilan yang dibentuk oleh BPUPKI menghasilkan sebuah dokumen bersejarah yang dikenal sebagai...',
      opts: ['A. UUD 1945', 'B. Piagam Jakarta', 'C. Proklamasi Kemerdekaan', 'D. Pancasila', 'E. Perjanjian Linggarjati'],
      ans: 'B',
      exp: 'Pembahasan: Panitia Sembilan menghasilkan Piagam Jakarta (Jakarta Charter) pada 22 Juni 1945.'
    },
    {
      q: 'Dekrit Presiden 5 Juli 1959 menandai kembalinya Indonesia ke sistem konstitusi...',
      opts: ['A. UUDS 1950', 'B. UUD 1945', 'C. Konstitusi RIS', 'D. UUD Amandemen', 'E. Pancasila Lembar Negara'],
      ans: 'B',
      exp: 'Pembahasan: Dekrit Presiden 5 Juli 1959 menetapkan pembubaran Konstituante dan kembalinya pemberlakuan UUD 1945.'
    },
    {
      q: 'Hak DPR untuk meminta keterangan kepada pemerintah mengenai kebijakan penting yang berdampak luas disebut...',
      opts: ['A. Hak Angket', 'B. Hak Interpelasi', 'C. Hak Menyatakan Pendapat', 'D. Hak Budget', 'E. Hak Imunitas'],
      ans: 'B',
      exp: 'Pembahasan: Hak Interpelasi adalah hak DPR untuk meminta keterangan kepada pemerintah mengenai kebijakan penting.'
    },
    {
      q: 'Konferensi Meja Bundar (KMB) yang menghasilkan pengakuan kedaulatan Indonesia oleh Belanda diselenggarakan di kota...',
      opts: ['A. Jakarta', 'B. Den Haag', 'C. Amsterdam', 'D. Batavia', 'E. Yogyakarta'],
      ans: 'B',
      exp: 'Pembahasan: KMB diselenggarakan di Den Haag, Belanda, dari 23 Agustus sampai 2 November 1949.'
    },
    {
      q: 'Sila Persatuan Indonesia dalam lambang negara dilambangkan dengan gambar...',
      opts: ['A. Rantai Emas', 'B. Pohon Beringin', 'C. Kepala Banteng', 'D. Padi dan Kapas', 'E. Bintang'],
      ans: 'B',
      exp: 'Pembahasan: Sila ke-3 (Persatuan Indonesia) dilambangkan oleh Pohon Beringin.'
    },
    {
      q: 'Asas kewarganegaraan yang menentukan kewarganegaraan seseorang berdasarkan tempat kelahiran disebut...',
      opts: ['A. Ius Sanguinis', 'B. Ius Soli', 'C. Apatride', 'D. Bipatride', 'E. Naturalisasi'],
      ans: 'B',
      exp: 'Pembahasan: Asas Ius Soli menentukan kewarganegaraan berdasarkan tempat lahir seseorang.'
    },
    {
      q: 'Bhinneka Tunggal Ika diambil dari kitab Sutasoma karangan seorang pujangga kerajaan Majapahit bernama...',
      opts: ['A. Mpu Prapanca', 'B. Mpu Tantular', 'C. Mpu Gandring', 'D. Mpu Sedah', 'E. Mpu Panuluh'],
      ans: 'B',
      exp: 'Pembahasan: Kalimat Bhinneka Tunggal Ika berasal dari Kitab Sutasoma karya Mpu Tantular.'
    },
    {
      q: 'Perancang lambang negara Indonesia, Garuda Pancasila, adalah...',
      opts: ['A. Ki Hajar Dewantara', 'B. Sultan Hamid II', 'C. Mohammad Yamin', 'D. Soekarno', 'E. Raden Saleh'],
      ans: 'B',
      exp: 'Pembahasan: Garuda Pancasila dirancang oleh Sultan Hamid II dari Pontianak.'
    },
    {
      q: 'Amandemen Undang-Undang Dasar 1945 menurut pasal 37 dilakukan oleh lembaga...',
      opts: ['A. DPR', 'B. MPR', 'C. Presiden', 'D. MK', 'E. DPD'],
      ans: 'B',
      exp: 'Pembahasan: Amandemen UUD 1945 merupakan kewenangan Majelis Permusyawaratan Rakyat (MPR).'
    },
    {
      q: 'Lagu kebangsaan Indonesia Raya pertama kali diperdengarkan secara resmi pada peristiwa...',
      opts: ['A. Proklamasi Kemerdekaan', 'B. Kongres Pemuda II', 'C. Sidang BPUPKI', 'D. Peristiwa Rengasdengklok', 'E. Sidang PPKI'],
      ans: 'B',
      exp: 'Pembahasan: Indonesia Raya pertama kali dimainkan pada Kongres Pemuda II tanggal 28 Oktober 1928.'
    },
    {
      q: 'Batas wilayah laut teritorial Indonesia berdasarkan Deklarasi Djuanda adalah sejauh...',
      opts: ['A. 3 mil', 'B. 12 mil', 'C. 200 mil', 'D. 24 mil', 'E. 100 mil'],
      ans: 'B',
      exp: 'Pembahasan: Deklarasi Djuanda menyatakan laut teritorial Indonesia selebar 12 mil laut diukur dari garis pangkal kepulauan.'
    },
    {
      q: 'Sistem pemerintahan kabinet di mana menteri bertanggung jawab kepada parlemen disebut...',
      opts: ['A. Presidensial', 'B. Parlementer', 'C. Semipresidensial', 'D. Monarki', 'E. Oligarki'],
      ans: 'B',
      exp: 'Pembahasan: Sistem Parlementer adalah sistem pemerintahan di mana kabinet bertanggung jawab kepada parlemen.'
    },
    {
      q: 'BPUPKI dipimpin oleh ketua yang bernama...',
      opts: ['A. KRT Radjiman Wedyodiningrat', 'B. RP Soeroso', 'C. Ichibangase Yosio', 'D. Soekarno', 'E. Hatta'],
      ans: 'A',
      exp: 'Pembahasan: BPUPKI diketuai oleh Dr. KRT Radjiman Wedyodiningrat.'
    },
    {
      q: 'Lembaga negara yang bertugas mengusulkan pengangkatan hakim agung dan menjaga kehormatan hakim adalah...',
      opts: ['A. Mahkamah Agung', 'B. Komisi Yudisial', 'C. Mahkamah Konstitusi', 'D. Presiden', 'E. DPR'],
      ans: 'B',
      exp: 'Pembahasan: Komisi Yudisial bertugas mengusulkan pengangkatan hakim agung serta menjaga perilaku hakim.'
    },
    {
      q: 'Asas kewarganegaraan berdasarkan pertalian darah atau keturunan disebut...',
      opts: ['A. Ius Soli', 'B. Ius Sanguinis', 'C. Naturalisasi', 'D. Bipatride', 'E. Stelsel Aktif'],
      ans: 'B',
      exp: 'Pembahasan: Ius Sanguinis menetapkan kewarganegaraan seseorang berdasarkan keturunan/orang tua.'
    },
    {
      q: 'Perjanjian diplomasi pertama antara Indonesia dan Belanda pasca proklamasi kemerdekaan adalah...',
      opts: ['A. Perjanjian Renville', 'B. Perjanjian Linggarjati', 'C. Perjanjian Roem-Royen', 'D. KMB', 'E. Perjanjian Salatiga'],
      ans: 'B',
      exp: 'Pembahasan: Perjanjian Linggarjati ditandatangani pada November 1946 secara de facto mengakui wilayah RI atas Jawa, Madura, dan Sumatera.'
    },
    {
      q: 'Pancasila sebagai dasar negara secara sah tercantum dalam Pembukaan UUD 1945 alinea ke...',
      opts: ['A. Kesatu', 'B. Kedua', 'C. Ketiga', 'D. Keempat', 'E. Kelima'],
      ans: 'D',
      exp: 'Pembahasan: Rumusan Pancasila yang sah dan resmi termuat pada alinea keempat Pembukaan UUD 1945.'
    },
    {
      q: 'Pemilihan Umum pertama di Indonesia diselenggarakan pada tahun...',
      opts: ['A. 1945', 'B. 1950', 'C. 1955', 'D. 1965', 'E. 1971'],
      ans: 'C',
      exp: 'Pembahasan: Pemilu pertama Indonesia dilaksanakan tahun 1955 untuk memilih anggota DPR dan Konstituante.'
    },
    {
      q: 'Kekuasaan presiden sebagai kepala negara untuk memberi pengampunan hukuman berupa grasi harus memperhatikan pertimbangan...',
      opts: ['A. DPR', 'B. Mahkamah Agung', 'C. Mahkamah Konstitusi', 'D. Jaksa Agung', 'E. Menteri Hukum'],
      ans: 'B',
      exp: 'Pembahasan: Sesuai Pasal 14 UUD 1945, Presiden memberi grasi dan rehabilitasi dengan memperhatikan pertimbangan MA.'
    },
    {
      q: 'Kekuasaan membuat undang-undang (legislatif) di Indonesia dipegang oleh...',
      opts: ['A. Presiden', 'B. DPR', 'C. DPD', 'D. MPR', 'E. MA'],
      ans: 'B',
      exp: 'Pembahasan: DPR memegang kekuasaan membentuk undang-undang berdasarkan Pasal 20 Ayat (1) UUD 1945.'
    },
    {
      q: 'Berikut ini yang merupakan lambang sila Kemanusiaan yang Adil dan Beradab adalah...',
      opts: ['A. Bintang', 'B. Rantai Emas', 'C. Pohon Beringin', 'D. Kepala Banteng', 'E. Padi dan Kapas'],
      ans: 'B',
      exp: 'Pembahasan: Sila ke-2 dilambangkan dengan Rantai Emas lingkaran dan persegi.'
    },
    {
      q: 'Berdasarkan UUD 1945, anggota BPK dipilih oleh DPR dengan memperhatikan pertimbangan...',
      opts: ['A. DPD', 'B. Presiden', 'C. MA', 'D. KPK', 'E. Menteri Keuangan'],
      ans: 'A',
      exp: 'Pembahasan: Anggota BPK dipilih oleh DPR dengan memperhatikan pertimbangan DPD, diresmikan oleh Presiden.'
    },
    {
      q: 'Organisasi pergerakan nasional pertama di Indonesia yang didirikan pada 20 Mei 1908 adalah...',
      opts: ['A. Sarekat Islam', 'B. Budi Utomo', 'C. Indische Partij', 'D. PNI', 'E. Muhammadiyah'],
      ans: 'B',
      exp: 'Pembahasan: Budi Utomo didirikan 20 Mei 1908 oleh dr. Soetomo dan mahasiswa STOVIA.'
    },
    {
      q: 'Sumpah Pemuda dibacakan pada Kongres Pemuda II yang dipimpin oleh...',
      opts: ['A. Soegondo Djojopoespito', 'B. Muhammad Yamin', 'C. Amir Sjarifuddin', 'D. Joko Said', 'E. Soekarno'],
      ans: 'A',
      exp: 'Pembahasan: Kongres Pemuda II diketuai oleh Soegondo Djojopoespito dari PPPI.'
    },
    {
      q: 'Lembaga tinggi negara yang bertugas melakukan pengawasan atas pelaksanaan undang-undang mengenai otonomi daerah adalah...',
      opts: ['A. DPR', 'B. DPD', 'C. BPK', 'D. MA', 'E. MK'],
      ans: 'B',
      exp: 'Pembahasan: DPD memiliki fungsi pengawasan atas pelaksanaan UU mengenai otonomi daerah.'
    }
  ];

  for (let i = 0; i < 30; i++) {
    const qData = twkSubjects[i];
    list.push({
      id: `ai-twk-${i + 1}`,
      category: 'TWK',
      question_text: qData.q,
      options: [...qData.opts],
      correct_answer: qData.ans,
      created_at: new Date().toISOString(),
      explanation: qData.exp
    });
  }

  // --- 2. TIU: 35 Questions ---
  // A. Generate Math series (20 Questions - Already randomized and unique)
  for (let i = 0; i < 20; i++) {
    const start = 2 + (i * 3);
    const step = 2 + (i % 4);
    const series = [start, start + step, start + 2 * step, start + 3 * step, start + 4 * step];
    const nextVal = start + 5 * step;
    
    list.push({
      id: `ai-tiu-math-${i + 1}`,
      category: 'TIU',
      question_text: `Tentukan kelanjutan dari deret angka berikut: ${series.join(', ')}, ...`,
      options: [
        `A. ${nextVal - 3}`,
        `B. ${nextVal}`,
        `C. ${nextVal + 2}`,
        `D. ${nextVal + 5}`,
        `E. ${nextVal - 1}`
      ],
      correct_answer: 'B',
      created_at: new Date().toISOString(),
      explanation: `Pembahasan: Deret angka memiliki pola penambahan tetap yaitu sebesar +${step}. Angka selanjutnya setelah ${series[4]} adalah ${series[4]} + ${step} = ${nextVal}.`
    });
  }

  // B. Generate verbal analogies and syllogisms (15 Completely Unique Questions)
  const tiuVerbal = [
    {
      q: 'APRESIASI : KARYA SENI = ...',
      opts: ['A. Hukuman : Kejahatan', 'B. Penghargaan : Prestasi', 'C. Penilaian : Ujian', 'D. Investasi : Modal', 'E. Konsumsi : Makanan'],
      ans: 'B',
      exp: 'Pembahasan: Apresiasi diberikan untuk menghargai Karya Seni. Penghargaan diberikan untuk menghargai Prestasi.'
    },
    {
      q: 'Semua mamalia bernapas dengan paru-paru. Semua paus adalah mamalia. Kesimpulan yang tepat adalah...',
      opts: ['A. Semua paus bernapas dengan insang', 'B. Semua paus bernapas dengan paru-paru', 'C. Sebagian paus bernapas dengan paru-paru', 'D. Semua yang bernapas dengan paru-paru adalah paus', 'E. Tidak ada kesimpulan'],
      ans: 'B',
      exp: 'Pembahasan: Silogisme. Karena semua paus adalah mamalia, dan semua mamalia bernapas dengan paru-paru, maka semua paus bernapas dengan paru-paru.'
    },
    {
      q: 'GURU : SEKOLAH = ...',
      opts: ['A. Nelayan : Laut', 'B. Dokter : Rumah Sakit', 'C. Petani : Sawah', 'D. Sopir : Kendaraan', 'E. Montir : Bengkel'],
      ans: 'B',
      exp: 'Pembahasan: Guru bekerja di instansi sekolah. Dokter bekerja di instansi rumah sakit.'
    },
    {
      q: 'Semua siswa yang rajin belajar pasti lulus ujian. Sebagian siswa Teknik tidak lulus ujian. Kesimpulan yang tepat:',
      opts: ['A. Semua siswa Teknik rajin belajar', 'B. Sebagian siswa Teknik rajin belajar', 'C. Sebagian siswa Teknik tidak rajin belajar', 'D. Semua siswa Teknik tidak rajin belajar', 'E. Tidak ada siswa Teknik yang lulus'],
      ans: 'C',
      exp: 'Pembahasan: Sebagian siswa Teknik tidak lulus berarti ada sebagian siswa Teknik yang tidak rajin belajar.'
    },
    {
      q: 'API : PANAS = ...',
      opts: ['A. Es : Dingin', 'B. Air : Basah', 'C. Matahari : Terang', 'D. Lampu : Gelap', 'E. Angin : Kencang'],
      ans: 'A',
      exp: 'Pembahasan: Karakteristik utama. Api sifatnya panas, es sifatnya dingin.'
    },
    {
      q: 'PENYAIR : PUISI = ...',
      opts: ['A. Sutradara : Film', 'B. Novelis : Novel', 'C. Pemahat : Patung', 'D. Musisi : Lagu', 'E. Pelukis : Lukisan'],
      ans: 'B',
      exp: 'Pembahasan: Penyair memproduksi puisi (karya sastra tulis). Novelis memproduksi novel (karya sastra tulis).'
    },
    {
      q: 'Semua PNS memakai seragam dinas pada hari Senin. Pak Joko adalah seorang PNS. Kesimpulan yang tepat:',
      opts: ['A. Pak Joko tidak memakai seragam dinas', 'B. Pak Joko memakai seragam dinas pada hari Senin', 'C. Pak Joko memakai seragam dinas setiap hari', 'D. Sebagian PNS tidak memakai seragam dinas', 'E. Pak Joko bukan PNS'],
      ans: 'B',
      exp: 'Pembahasan: Pak Joko adalah PNS, maka wajib memakai seragam dinas pada hari Senin.'
    },
    {
      q: 'KANCIL : CERDIK = ...',
      opts: ['A. Serigala : Licik', 'B. Singa : Buas', 'C. Merpati : Setia', 'D. Semut : Gotong Royong', 'E. Kerbau : Bodoh'],
      ans: 'A',
      exp: 'Pembahasan: Asosiasi sifat populer pada fabel. Kancil diidentikan cerdik, serigala diidentikan licik.'
    },
    {
      q: 'MATA : MELIHAT = ...',
      opts: ['A. Telinga : Mendengar', 'B. Hidung : Mencium', 'C. Lidah : Mengecap', 'D. Kaki : Berjalan', 'E. Tangan : Memegang'],
      ans: 'A',
      exp: 'Pembahasan: Fungsi indra tubuh. Mata berfungsi untuk melihat, telinga berfungsi untuk mendengar.'
    },
    {
      q: 'HAUS : MINUM = ...',
      opts: ['A. Lapar : Makan', 'B. Lelah : Istirahat', 'C. Ngantuk : Tidur', 'D. Sakit : Obat', 'E. Dingin : Selimut'],
      ans: 'A',
      exp: 'Pembahasan: Rasa haus diatasi dengan minum. Rasa lapar diatasi dengan makan.'
    },
    {
      q: 'Semua buah yang manis mengandung gula. Semangka adalah buah yang manis. Kesimpulan yang tepat:',
      opts: ['A. Semangka mengandung gula', 'B. Semangka tidak mengandung gula', 'C. Semua semangka manis', 'D. Buah yang mengandung gula hanyalah semangka', 'E. Tidak ada kesimpulan'],
      ans: 'A',
      exp: 'Pembahasan: Karena semangka merupakan buah yang manis, maka semangka mengandung gula.'
    },
    {
      q: 'DOKTER : PASIEN = ...',
      opts: ['A. Guru : Murid', 'B. Polisi : Pencuri', 'C. Pengacara : Klien', 'D. Arsitek : Bangunan', 'E. Penjual : Pembeli'],
      ans: 'C',
      exp: 'Pembahasan: Dokter melayani pasien untuk jasa konsultasi. Pengacara melayani klien untuk jasa hukum.'
    },
    {
      q: 'Semua peserta seminar mendapatkan sertifikat. Rian tidak mendapatkan sertifikat. Kesimpulan yang tepat:',
      opts: ['A. Rian adalah peserta seminar', 'B. Rian bukan peserta seminar', 'C. Rian tidak hadir seminar', 'D. Sebagian peserta tidak dapat sertifikat', 'E. Sertifikat Rian hilang'],
      ans: 'B',
      exp: 'Pembahasan: Sesuai silogisme modus tollens. Karena Rian tidak dapat sertifikat, maka Rian bukan peserta seminar.'
    },
    {
      q: 'MOBIL : RODA = ...',
      opts: ['A. Rumah : Atap', 'B. Sepeda : Rantai', 'C. Perahu : Dayung', 'D. Pesawat : Sayap', 'E. Kereta : Rel'],
      ans: 'A',
      exp: 'Pembahasan: Hubungan bagian pelengkap struktural. Roda adalah bagian dari mobil, atap adalah bagian dari rumah.'
    },
    {
      q: 'Semua tanaman membutuhkan air. Kaktus adalah tanaman. Kesimpulan yang tepat:',
      opts: ['A. Kaktus tidak membutuhkan air', 'B. Kaktus membutuhkan air', 'C. Kaktus hidup di gurun', 'D. Hanya kaktus yang butuh air', 'E. Semua tanaman adalah kaktus'],
      ans: 'B',
      exp: 'Pembahasan: Karena kaktus merupakan tanaman, maka kaktus membutuhkan air.'
    }
  ];

  for (let i = 0; i < 15; i++) {
    const qData = tiuVerbal[i];
    list.push({
      id: `ai-tiu-verb-${i + 1}`,
      category: 'TIU',
      question_text: qData.q,
      options: [...qData.opts],
      correct_answer: qData.ans,
      created_at: new Date().toISOString(),
      explanation: qData.exp
    });
  }

  // --- 3. TKP: 45 Questions (Generated Dynamically via Templates to avoid repeating) ---
  const names = ['Budi', 'Ani', 'Doni', 'Siti', 'Roni', 'Dewi', 'Joko', 'Rina', 'Andi', 'Mega', 'Tono', 'Hendra', 'Sari', 'Yanto', 'Gita'];
  const tasks = [
    'laporan keuangan bulanan divisi',
    'desain brosur kampanye promosi',
    'dokumen tender proyek konstruksi',
    'evaluasi kinerja tahunan staf',
    'materi presentasi rapat direksi utama',
    'rencana anggaran belanja tahunan',
    'laporan audit kepatuhan internal',
    'proposal kerjasama bisnis eksternal',
    'data base inventaris logistik',
    'jadwal distribusi logistik wilayah'
  ];
  const rekans = [
    'rekan satu divisi kerja',
    'staf junior di departemen Anda',
    'rekan kerja senior dari divisi lain',
    'mitra kerja dari perusahaan afiliasi',
    'kepala bagian operasional lapangan'
  ];
  const masalahs = [
    'komputer utamanya tiba-tiba mati total',
    'seluruh data laporannya terhapus tidak sengaja',
    'printer di meja kerjanya mengalami macet parah',
    'aplikasi entri datanya mengalami error koneksi',
    'dokumen fisiknya terselip entah di mana'
  ];

  const baseTkpScenarios = [
    {
      template: "Ketika Anda sedang sibuk menyelesaikan {tugas}, tiba-tiba {nama} ({rekan}) datang meminta bantuan Anda karena {masalah}. Sikap Anda adalah...",
      opts: [
        "A. Menolak permintaan {nama} secara langsung karena {tugas} Anda jauh lebih penting dan harus segera selesai.",
        "B. Menghentikan {tugas} Anda sepenuhnya dan membantunya menyelesaikan {masalah} tanpa peduli pekerjaan Anda sendiri terbengkalai.",
        "C. Memberitahunya secara sopan bahwa Anda sedang menyelesaikan {tugas}, menyarankan meminta bantuan bagian IT, atau berjanji membantunya setelah tugas Anda selesai.",
        "D. Mengabaikan permintaannya dan pura-pura tidak mendengar agar {nama} pergi dengan sendirinya.",
        "E. Menyuruhnya untuk mencari cara sendiri karena itu adalah tanggung jawab masing-masing karyawan."
      ],
      scores: { A: 2, B: 3, C: 5, D: 1, E: 4 }
    },
    {
      template: "Anda ditunjuk memimpin sebuah tim kerja untuk {tugas}. Namun salah satu anggota tim Anda, yaitu {nama}, sering terlambat menyerahkan tugasnya karena {masalah}. Sebagai ketua, tindakan Anda...",
      opts: [
        "A. Melaporkan {nama} ke atasan agar segera dikeluarkan dari tim.",
        "B. Memarahi {nama} di depan anggota tim lain agar dia merasa malu dan terpacu untuk bekerja lebih cepat.",
        "C. Mengajak {nama} berbicara secara personal, mendengarkan kendalanya terkait {masalah}, dan mencari solusi bersama demi tim.",
        "D. Membiarkannya saja dan Anda mengambil alih seluruh pekerjaannya sendirian agar proyek tetap jalan.",
        "E. Mengabaikan kontribusi {nama} dan tidak melibatkannya dalam diskusi tim selanjutnya."
      ],
      scores: { A: 2, B: 1, C: 5, D: 4, E: 3 }
    },
    {
      template: "Ketika Anda melayani antrean di loket, tiba-tiba {nama} ({rekan}) menyela antrean dengan marah-marah menuduh sistem Anda lambat karena {masalah}. Sikap Anda menghadapi {nama} adalah...",
      opts: [
        "A. Ikut berteriak membalas tuduhannya agar warga lain tahu bahwa Anda sudah bekerja keras melayani.",
        "B. Tetap bersikap tenang, meminta maaf atas ketidaknyamanan, menjelaskan situasi sistem dengan santun, serta membantunya secepat mungkin.",
        "C. Meninggalkan loket begitu saja dan memanggil satpam untuk mengusir {nama} dari area antrean.",
        "D. Diam saja dan melayani {nama} dengan ketus untuk menunjukkan bahwa Anda tersinggung dengan tuduhannya.",
        "E. Menutup loket pelayanan sementara waktu sampai suasana menjadi kondusif kembali."
      ],
      scores: { A: 1, B: 5, C: 3, D: 2, E: 4 }
    },
    {
      template: "Kantor Anda memutuskan menerapkan sistem digital baru untuk {tugas}. Namun {nama} merasa kesulitan dan mengeluh karena {masalah}. Sikap Anda menghadapi perubahan ini...",
      opts: [
        "A. Meminta manajemen membatalkan sistem baru tersebut karena menyulitkan {nama}.",
        "B. Membiarkan {nama} menggunakan sistem lama secara manual sementara yang lain menggunakan sistem baru.",
        "C. Mempelajari sistem baru tersebut dengan baik dan meluangkan waktu membantu {nama} agar terbiasa menggunakannya.",
        "D. Menertawakan kegagalan {nama} dalam beradaptasi dengan kemajuan teknologi digital.",
        "E. Mengusulkan agar {nama} dipindahkan saja ke divisi lain yang tidak menggunakan sistem digital."
      ],
      scores: { A: 2, B: 3, C: 5, D: 1, E: 4 }
    },
    {
      template: "Saat mengerjakan {tugas}, Anda ditawari gratifikasi atau hadiah oleh {nama} agar mempercepat urusannya yang terhambat karena {masalah}. Tindakan Anda adalah...",
      opts: [
        "A. Menerima hadiah tersebut karena itu adalah rezeki dan pekerjaan Anda tetap berjalan.",
        "B. Menolak secara tegas, menjelaskan bahwa tindakan tersebut melanggar integritas, dan memproses urusannya sesuai aturan baku.",
        "C. Menerima hadiah tersebut namun membaginya dengan rekan kerja lain agar adil.",
        "D. Melaporkan {nama} ke polisi agar segera ditangkap karena mencoba menyuap Anda.",
        "E. Meminta hadiah yang lebih besar karena tingkat kesulitan pekerjaannya sangat tinggi."
      ],
      scores: { A: 2, B: 5, C: 3, D: 4, E: 1 }
    },
    {
      template: "Terjadi perdebatan sengit antara Anda dan {nama} dalam rapat divisi mengenai penyelesaian {tugas}. {nama} bersikeras metodenya terbaik padahal Anda tahu metodenya berisiko {masalah}. Sikap Anda...",
      opts: [
        "A. Menyerang argumen {nama} secara personal agar dia merasa terpojok dan menyerah.",
        "B. Mengalah begitu saja agar rapat cepat selesai tanpa peduli risiko ke depan.",
        "C. Menyampaikan argumen Anda secara objektif berdasarkan data, mendengarkan argumen {nama}, dan mencari jalan tengah terbaik.",
        "D. Meninggalkan ruang rapat (walkout) sebagai bentuk protes terhadap pendapat {nama}.",
        "E. Meminta pimpinan rapat untuk langsung menyetujui pendapat Anda tanpa mendengarkan penjelasan {nama}."
      ],
      scores: { A: 2, B: 3, C: 5, D: 1, E: 4 }
    },
    {
      template: "Anda ditugaskan mendadak ke kantor cabang terpencil untuk mengaudit {tugas}. Sesampainya di sana, Anda menghadapi {masalah} yang menghambat pekerjaan Anda. Tindakan Anda...",
      opts: [
        "A. Meminta kembali ke kantor pusat dan membatalkan penugasan karena fasilitas tidak memadai.",
        "B. Mengeluh sepanjang hari kepada staf di sana dan menyalahkan mereka atas {masalah} tersebut.",
        "C. Beradaptasi dengan situasi yang ada, berkoordinasi dengan tim setempat, dan mencari alternatif agar audit tetap selesai.",
        "D. Mengerjakan audit seadanya tanpa memedulikan kualitas hasil akhir.",
        "E. Menunggu instruksi dari kantor pusat tanpa melakukan tindakan apapun."
      ],
      scores: { A: 2, B: 1, C: 5, D: 3, E: 4 }
    },
    {
      template: "Batas waktu pengumpulan {tugas} tinggal beberapa jam lagi, namun terjadi kendala teknis karena {masalah}. {nama} menyarankan untuk memanipulasi data agar terlihat selesai tepat waktu. Sikap Anda...",
      opts: [
        "A. Mengikuti saran {nama} demi menyelamatkan reputasi tim dari keterlambatan.",
        "B. Menolak saran {nama}, tetap bekerja sejujurnya, dan segera melaporkan kendala teknis serta sisa estimasi waktu kepada atasan.",
        "C. Menyerahkan keputusan sepenuhnya kepada {nama} agar Anda tidak disalahkan jika ada masalah.",
        "D. Pasrah dan berhenti mengerjakan tugas karena merasa tidak mungkin menyelesaikannya tepat waktu.",
        "E. Menyalahkan penyedia sistem atas {masalah} tersebut di depan klien."
      ],
      scores: { A: 2, B: 5, C: 3, D: 1, E: 4 }
    },
    {
      template: "Anda mengetahui bahwa {nama} tidak sengaja membuat kesalahan saat menginput data {tugas} yang menyebabkan risiko terjadinya {masalah}. Tindakan Anda adalah...",
      opts: [
        "A. Menyebarkan kesalahan {nama} ke seluruh grup chat kantor agar semua tahu.",
        "B. Membiarkannya saja karena itu bukan tanggung jawab pekerjaan Anda.",
        "C. Memberitahu {nama} secara baik-baik, membantunya merevisi kesalahan data tersebut, dan menjadikannya evaluasi bersama.",
        "D. Melaporkan kesalahan {nama} langsung ke direktur utama agar dia dihukum berat.",
        "E. Menggunakan kesalahan tersebut sebagai alat untuk memeras atau mengintimidasi {nama}."
      ],
      scores: { A: 2, B: 3, C: 5, D: 4, E: 1 }
    },
    {
      template: "Perusahaan menawarkan pelatihan sertifikasi keahlian tentang {tugas}. Namun pelatihan diadakan pada akhir pekan, padahal akhir pekan ini Anda berencana menyelesaikan {masalah}. Sikap Anda...",
      opts: [
        "A. Menolak tawaran pelatihan karena waktu libur akhir pekan adalah hak pribadi yang mutlak.",
        "B. Menerima pelatihan dengan antusias, menjadwalkan ulang penyelesaian {masalah}, dan memanfaatkannya untuk peningkatan kompetensi diri.",
        "C. Menerima pelatihan tetapi tidak hadir saat hari H agar tetap bisa berlibur.",
        "D. Meminta perusahaan mengubah jadwal pelatihan agar sesuai dengan waktu luang Anda.",
        "E. Mengikuti pelatihan setengah hati dan mengeluh selama kegiatan berlangsung."
      ],
      scores: { A: 3, B: 5, C: 1, D: 2, E: 4 }
    },
    {
      template: "Anda melihat bahwa alur kerja pengarsipan data {tugas} di kantor sangat tidak efisien dan sering memicu terjadinya {masalah}. Tindakan yang paling tepat adalah...",
      opts: [
        "A. Membiarkannya saja karena sistem tersebut sudah berjalan bertahun-tahun di kantor.",
        "B. Menyalahkan staf pengarsipan karena dinilai tidak kompeten mengelola dokumen.",
        "C. Merancang usulan perbaikan alur pengarsipan yang lebih efisien berbasis digital dan mempresentasikannya kepada atasan.",
        "D. Sengaja memperlambat kerja Anda sendiri sebagai bentuk protes terhadap alur pengarsipan yang buruk.",
        "E. Meminta dipindahkan ke divisi lain yang memiliki alur kerja lebih rapi."
      ],
      scores: { A: 3, B: 2, C: 5, D: 1, E: 4 }
    },
    {
      template: "Anda sudah berjanji menghadiri acara keluarga yang penting nanti malam. Tiba-tiba atasan meminta Anda lembur untuk menyelesaikan {tugas} karena {masalah}. Sikap Anda...",
      opts: [
        "A. Menolak tugas lembur secara kasar karena acara keluarga adalah prioritas utama.",
        "B. Mengabaikan perintah atasan dan langsung pulang setelah jam kantor selesai.",
        "C. Menjelaskan urgensi acara keluarga kepada atasan secara sopan, lalu menawarkan untuk menyelesaikan {tugas} besok pagi-pagi sekali atau mencicilnya malam ini dari rumah.",
        "D. Menerima tugas lembur tetapi mengerjakannya dengan asal-asalan agar bisa cepat pulang.",
        "E. Mengeluh di media sosial mengenai sikap atasan yang tidak pengertian."
      ],
      scores: { A: 2, B: 3, C: 5, D: 4, E: 1 }
    },
    {
      template: "Di divisi Anda, {nama} menyebarkan desas-desus negatif tentang rekan kerja lain terkait kegagalan {tugas} akibat {masalah}. Sebagai bagian dari tim, sikap Anda...",
      opts: [
        "A. Ikut menyebarkan desas-desus tersebut agar suasana kantor semakin ramai.",
        "B. Membiarkannya saja dan menganggap gosip tersebut sebagai hiburan kerja sehari-hari.",
        "C. Menolak menanggapi rumor tersebut, menasihati {nama} agar fokus bekerja, dan menjaga iklim kerja tetap kondusif.",
        "D. Menghasut rekan kerja lain agar menjauhi {nama} karena dia penyebar gosip.",
        "E. Mengkonfrontasi {nama} secara agresif di depan banyak orang."
      ],
      scores: { A: 1, B: 3, C: 5, D: 4, E: 2 }
    },
    {
      template: "Saat loket pelayanan penuh, {nama} yang lanjut usia kesulitan melengkapi formulir {tugas} karena {masalah}. Barisan antrean di belakang mulai tidak sabar. Sikap Anda...",
      opts: [
        "A. Menyuruh {nama} keluar dari antrean dan menyelesaikannya di rumah agar tidak menghambat yang lain.",
        "B. Membiarkan saja {nama} berusaha sendiri tanpa memedulikannya agar tidak dinilai pilih kasih.",
        "C. Membantu {nama} melengkapi formulir dengan sabar di loket khusus prioritas, seraya meminta maaf kepada pengantre lain atas sedikit jeda pelayanan.",
        "D. Memarahi {nama} karena dinilai kurang mempersiapkan diri sebelum mengantre.",
        "E. Menutup loket pelayanan dan pergi beristirahat karena stres menghadapi antrean."
      ],
      scores: { A: 2, B: 3, C: 5, D: 1, E: 4 }
    },
    {
      template: "Seorang pelanggan setia meminta Anda memberikan pengecualian prosedur dalam pengurusan {tugas} karena {masalah}. Jika Anda menolak, dia mengancam akan berpindah ke kompetitor. Sikap Anda...",
      opts: [
        "A. Memberikan pengecualian prosedur tersebut demi menjaga kesetiaan pelanggan.",
        "B. Menolaknya mentah-mentah tanpa penjelasan apapun karena aturan bersifat kaku.",
        "C. Menjelaskan secara santun bahwa prosedur wajib dipatuhi demi keadilan, namun membantu mencari solusi legal alternatif yang dapat menyelesaikan {masalah} miliknya.",
        "D. Menyuruh pelanggan tersebut pindah ke kompetitor jika tidak mau mengikuti aturan.",
        "E. Meminta biaya administrasi tambahan secara ilegal untuk memuluskan permintaannya."
      ],
      scores: { A: 3, B: 2, C: 5, D: 4, E: 1 }
    }
  ];

  for (let i = 0; i < 45; i++) {
    const base = baseTkpScenarios[i % baseTkpScenarios.length];
    
    // Choose variables based on index to ensure complete uniqueness
    const name = names[(i * 3) % names.length];
    const task = tasks[(i * 7) % tasks.length];
    const rekan = rekans[(i * 11) % rekans.length];
    const masalah = masalahs[(i * 13) % masalahs.length];

    const fillPlaceholders = (text: string) => {
      return text
        .replace(/{nama}/g, name)
        .replace(/{tugas}/g, task)
        .replace(/{rekan}/g, rekan)
        .replace(/{masalah}/g, masalah);
    };

    const qText = fillPlaceholders(base.template);
    const resolvedOptions = base.opts.map(opt => fillPlaceholders(opt));
    const scoreStr = JSON.stringify(base.scores);

    list.push({
      id: `ai-tkp-${i + 1}`,
      category: 'TKP',
      question_text: qText,
      options: resolvedOptions,
      correct_answer: scoreStr,
      created_at: new Date().toISOString(),
      explanation: `Pembahasan (Aspek Integritas & Pelayanan Publik): Pilihan jawaban C memiliki bobot nilai tertinggi (5 Poin) karena mengedepankan profesionalisme kerja dalam menyikapi dinamika tugas kantor.`
    });
  }

  return list;
}

function generate30Questions(): Question[] {
  const fullList = generate110Questions();
  const twk = fullList.filter(q => q.category === 'TWK').slice(0, 10);
  const tiu = fullList.filter(q => q.category === 'TIU').slice(0, 10);
  const tkp = fullList.filter(q => q.category === 'TKP').slice(0, 10);
  return [...twk, ...tiu, ...tkp];
}

