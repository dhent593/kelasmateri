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

// Server-side process mock DB
interface MockDbStore {
  users: UserProfile[];
  questions: Question[];
  sessions: ExamSession[];
  packages: Package[];
}

declare global {
  var _mockDb: MockDbStore | undefined;
}

if (!global._mockDb) {
  global._mockDb = {
    users: [...DEFAULT_USERS],
    questions: [...SEEDED_QUESTIONS],
    sessions: [...DEFAULT_SESSIONS],
    packages: [...DEFAULT_PACKAGES]
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
      packages: [...DEFAULT_PACKAGES]
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

  // --- 1. TWK: 30 Questions (Seeded templates + variations) ---
  const twkSubjects = [
    {
      q: 'UUD 1945 Pasal 27 Ayat (3) menyatakan bahwa setiap warga negara berhak dan wajib ikut serta dalam upaya...',
      opts: ['A. Pertahanan negara', 'B. Pembelaan negara', 'C. Ketertiban dunia', 'D. Keadilan sosial', 'E. Keamanan nasional'],
      ans: 'B',
      exp: 'Pembahasan: Berdasarkan Pasal 27 Ayat (3) UUD 1945, diatur tentang hak dan kewajiban warga negara untuk ikut serta dalam upaya "Pembelaan negara".'
    },
    {
      q: 'Sedangkan Pasal 30 Ayat (1) UUD 1945 menyatakan bahwa tiap-tiap warga negara berhak dan wajib ikut serta dalam usaha...',
      opts: ['A. Pembelaan negara', 'B. Pertahanan dan keamanan negara', 'C. Keamanan lingkungan', 'D. Penegakan hukum', 'E. Kesejahteraan rakyat'],
      ans: 'B',
      exp: 'Pembahasan: Berdasarkan Pasal 30 Ayat (1) UUD 1945, diatur tentang hak dan kewajiban warga negara dalam usaha "Pertahanan dan keamanan negara".'
    },
    {
      q: 'Lembaga negara baru yang dibentuk setelah amandemen UUD 1945 yang memiliki kewenangan menguji UU terhadap UUD adalah...',
      opts: ['A. Komisi Yudisial', 'B. Mahkamah Konstitusi', 'C. Dewan Perwakilan Daerah', 'D. Mahkamah Agung', 'E. Badan Pemeriksa Keuangan'],
      ans: 'B',
      exp: 'Pembahasan: Mahkamah Konstitusi (MK) dibentuk pasca amandemen UUD 1945 dengan tugas salah satunya adalah menguji undang-undang terhadap UUD 1945.'
    },
    {
      q: 'Tokoh sejarah yang merumuskan usulan Dasar Negara dengan sebutan Pancasila pada tanggal 1 Juni 1945 adalah...',
      opts: ['A. Mohammad Yamin', 'B. Soepomo', 'C. Ir. Soekarno', 'D. Mohammad Hatta', 'E. Radjiman Wedyodiningrat'],
      ans: 'C',
      exp: 'Pembahasan: Ir. Soekarno menyampaikan pidato rumusan dasar negara pada tanggal 1 Juni 1945 dan mengusulkan nama dasar negara tersebut adalah "Pancasila".'
    },
    {
      q: 'Pengamalan nilai Pancasila berupa menghormati hak orang lain dan bersikap adil terhadap sesama merupakan pencerminan sila...',
      opts: ['A. Sila Kedua', 'B. Sila Ketiga', 'C. Sila Keempat', 'D. Sila Kelima', 'E. Sila Kesatu'],
      ans: 'D',
      exp: 'Pembahasan: Bersikap adil dan menghormati hak orang lain merupakan butir-butir pengamalan Sila ke-5 Pancasila (Keadilan Sosial bagi Seluruh Rakyat Indonesia).'
    }
  ];

  // Generate 30 TWK questions
  for (let i = 0; i < 30; i++) {
    const template = twkSubjects[i % twkSubjects.length];
    list.push({
      id: `ai-twk-${i + 1}`,
      category: 'TWK',
      question_text: template.q,
      options: [...template.opts],
      correct_answer: template.ans,
      created_at: new Date().toISOString(),
      explanation: template.exp
    });
  }

  // --- 2. TIU: 35 Questions (Dynamic Math progressions + Syllogisms) ---
  // A. Generate Math series
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

  // B. Generate verbal analogies and syllogisms
  const tiuVerbal = [
    {
      q: 'Semua mamalia bernapas dengan paru-paru. Semua paus adalah mamalia. Kesimpulan yang tepat adalah...',
      opts: [
        'A. Semua paus bernapas dengan insang',
        'B. Semua paus bernapas dengan paru-paru',
        'C. Sebagian paus bernapas dengan paru-paru',
        'D. Semua yang bernapas dengan paru-paru adalah paus',
        'E. Tidak ada kesimpulan yang sah'
      ],
      ans: 'B',
      exp: 'Pembahasan: Menggunakan silogisme kategoris Barbara (Semua M adalah P, Semua S adalah M, maka Semua S adalah P). Maka semua paus bernapas dengan paru-paru.'
    },
    {
      q: 'KENDARAAN : BENSIN = MANUSIA : ...',
      opts: ['A. Makanan', 'B. Air', 'C. Udara', 'D. Sepatu', 'E. Tidur'],
      ans: 'A',
      exp: 'Pembahasan: Hubungan analogi energi pendukung. Kendaraan membutuhkan bensin sebagai sumber energinya, sedangkan Manusia membutuhkan Makanan sebagai sumber energinya.'
    }
  ];

  for (let i = 0; i < 15; i++) {
    const template = tiuVerbal[i % tiuVerbal.length];
    list.push({
      id: `ai-tiu-verb-${i + 1}`,
      category: 'TIU',
      question_text: template.q,
      options: [...template.opts],
      correct_answer: template.ans,
      created_at: new Date().toISOString(),
      explanation: template.exp
    });
  }

  // --- 3. TKP: 45 Questions (Situational challenges with weight scores) ---
  const tkpSituations = [
    {
      q: 'Ketika sedang sibuk melayani masyarakat di loket, tiba-tiba seorang warga paruh baya menyela antrean dengan marah-marah meminta dilayani cepat karena alasan darurat keluarga. Sikap Anda adalah...',
      opts: [
        'Menolaknya langsung dan memintanya mengantre paling belakang demi keadilan.',
        'Meninggalkan loket dan menyuruh satpam mengamankannya agar tidak mengganggu.',
        'Menjelaskan dengan ramah bahwa antrean berlaku tertib, menanyakan urgensi daruratnya, lalu menawarkannya ke loket prioritas jika darurat tersebut valid.',
        'Mengabaikan kemarahannya dan terus melayani antrean berikutnya.',
        'Melayaninya langsung tanpa peduli antrean lain yang terganggu.'
      ],
      ans: '{"C":5,"E":4,"A":3,"D":2,"B":1}',
      exp: 'Pembahasan (Aspek Pelayanan Publik): Mengakomodasi kebutuhan darurat dengan cara santun dan berprosedur (opsi C) bernilai 5. Melayaninya langsung tanpa filter (opsi E) bernilai 4. Mengantre kaku (opsi A) bernilai 3.'
    },
    {
      q: 'Atasan menugaskan Anda memimpin tim kerja lintas divisi yang beranggotakan rekan kerja baru dengan latar belakang kompetensi yang berbeda-beda. Langkah pertama Anda adalah...',
      opts: [
        'Membagikan tugas secara acak agar adil tanpa perlu berdiskusi.',
        'Mendiskusikan profil keahlian masing-masing anggota secara terbuka, mendengarkan saran mereka, lalu membagi tugas sesuai kekuatan masing-masing.',
        'Mengerjakan semua tugas penting sendirian karena tidak yakin dengan kemampuan rekan baru.',
        'Meminta atasan untuk mencarikan anggota tim lain yang sehobi dengan Anda.',
        'Menyerahkan semua keputusan pembagian kerja kepada anggota tim secara bebas.'
      ],
      ans: '{"B":5,"E":4,"A":3,"C":2,"D":1}',
      exp: 'Pembahasan (Aspek Mengelola Orang Lain): Melakukan pemetaan kompetensi anggota secara terbuka dan kolaboratif (opsi B) bernilai 5. Pendelegasian bebas (opsi E) bernilai 4. Pembagian acak (opsi A) bernilai 3.'
    }
  ];

  for (let i = 0; i < 45; i++) {
    const template = tkpSituations[i % tkpSituations.length];
    
    // Programmatic choices mapping with labels A, B, C, D, E
    const labeledOptions = template.opts.map((text, idx) => {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      return `${letters[idx]}. ${text}`;
    });

    list.push({
      id: `ai-tkp-${i + 1}`,
      category: 'TKP',
      question_text: template.q,
      options: labeledOptions,
      correct_answer: template.ans,
      created_at: new Date().toISOString(),
      explanation: template.exp
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

