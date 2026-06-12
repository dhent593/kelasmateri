-- Supabase Schema for kelasmateri (CPNS Exam Simulation)

-- Drop existing tables to ensure a clean slate and prevent column/type mismatch errors
DROP TABLE IF EXISTS public.exam_sessions CASCADE;
DROP TABLE IF EXISTS public.manual_questions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;

-- Create Enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_type_enum') THEN
        CREATE TYPE exam_type_enum AS ENUM ('ai', 'manual');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_status_enum') THEN
        CREATE TYPE exam_status_enum AS ENUM ('in_progress', 'completed');
    END IF;
END $$;

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    can_generate_exam BOOLEAN NOT NULL DEFAULT false,
    unlocked_packages JSONB DEFAULT '["pkg-basic"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) to ensure smooth integration with Server Actions
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Create Manual Questions Table
CREATE TABLE IF NOT EXISTS public.manual_questions (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'TIU', 'TWK', 'TKP'
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings e.g. ["A. Option 1", "B. Option 2", ...]
    correct_answer TEXT NOT NULL, -- For TIU/TWK: 'A', 'B', etc. For TKP: JSON string/object matching options to scores e.g. {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1}
    explanation TEXT, -- Pembahasan
    package_ids JSONB DEFAULT '["pkg-basic"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) to ensure smooth integration with Server Actions
ALTER TABLE public.manual_questions DISABLE ROW LEVEL SECURITY;

-- 3. Create Exam Sessions Table
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    exam_type exam_type_enum NOT NULL,
    current_question_index INT NOT NULL DEFAULT 0,
    saved_answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- Map of { question_id_or_index: "A"/"B"/"C"/"D"/"E" }
    remaining_time_seconds INT NOT NULL,
    status exam_status_enum NOT NULL DEFAULT 'in_progress',
    final_score INT,
    category_scores JSONB, -- { "TIU": score, "TWK": score, "TKP": score }
    subject TEXT DEFAULT 'cpns',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Disable Row Level Security (RLS) to ensure smooth integration with Server Actions
ALTER TABLE public.exam_sessions DISABLE ROW LEVEL SECURITY;

-- 4. Create Packages Table
CREATE TABLE IF NOT EXISTS public.packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INT NOT NULL,
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings e.g. ["Fitur 1", "Fitur 2"]
    duration_minutes INT NOT NULL DEFAULT 30,
    total_questions INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) to ensure smooth integration with Server Actions
ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;

-- Create Indexes
CREATE INDEX IF NOT EXISTS exam_sessions_user_id_idx ON public.exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS manual_questions_category_idx ON public.manual_questions(category);

--------------------------------------------------------------------------------
-- SEED DATA
--------------------------------------------------------------------------------

-- Seed default users
INSERT INTO public.users (id, email, password, role, can_generate_exam, unlocked_packages)
VALUES 
('admin-uuid', 'admin@kelasmateri.com', 'palamana', 'admin', true, '["pkg-basic", "pkg-premium", "pkg-platinum"]'::jsonb),
('user-uuid', 'user@kelasmateri.com', 'palamana', 'user', false, '["pkg-basic"]'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- Seed default questions
INSERT INTO public.manual_questions (id, category, question_text, options, correct_answer, explanation)
VALUES
('q1', 'TWK', 'Menurut UUD 1945 yang telah diamandemen, kekuasaan kehakiman di Indonesia dilakukan oleh sebuah Mahkamah Agung dan badan peradilan yang berada di bawahnya serta oleh sebuah...', 
 '["A. Komisi Yudisial", "B. Mahkamah Konstitusi", "C. Dewan Perwakilan Rakyat", "D. Badan Pemeriksa Keuangan", "E. Majelis Permusyawaratan Rakyat"]'::jsonb, 
 'B',
 'Pembahasan: Berdasarkan UUD 1945 Pasal 24 Ayat (2) hasil amandemen, kekuasaan kehakiman di Indonesia dilakukan oleh sebuah Mahkamah Agung dan badan peradilan di bawahnya (Peradilan Umum, Agama, Militer, PTUN) serta oleh sebuah Mahkamah Konstitusi (MK).'),
('q2', 'TWK', 'Sikap rela berkorban demi kepentingan bangsa dan negara di atas kepentingan pribadi atau golongan merupakan perwujudan dari sila Pancasila yang ke...', 
 '["A. Satu", "B. Dua", "C. Tiga", "D. Empat", "E. Lima"]'::jsonb, 
 'C',
 'Pembahasan: Rela berkorban untuk kepentingan negara merupakan salah satu butir pengamalan Pancasila Sila ke-3, yaitu "Persatuan Indonesia". Sila ini menekankan persatuan, kesatuan, serta kepentingan bangsa di atas ego sektoral.'),
('q3', 'TWK', 'Sidang pertama BPUPKI yang diselenggarakan pada tanggal 29 Mei - 1 Juni 1945 berfokus membahas tentang...', 
 '["A. Rancangan Undang-Undang Dasar", "B. Bentuk Pemerintahan Negara", "C. Batas Wilayah Negara Indonesia", "D. Rumusan Dasar Negara Indonesia", "E. Pengangkatan Presiden dan Wakil Presiden"]'::jsonb, 
 'D',
 'Pembahasan: Sidang pertama BPUPKI berfokus merumuskan Dasar Negara Indonesia Merdeka (yang melahirkan Pancasila pada 1 Juni 1945). Sedangkan rancangan UUD dibahas pada sidang kedua tanggal 10 - 17 Juli 1945.'),
('q4', 'TIU', 'Carilah kelanjutan dari deret angka berikut: 3, 6, 12, 21, 33, ...', 
 '["A. 45", "B. 48", "C. 46", "D. 52", "E. 50"]'::jsonb, 
 'B',
 'Pembahasan: Pola penambahan angka adalah kelipatan 3 secara berurutan: 3 ke 6 (+3), 6 ke 12 (+6), 12 ke 21 (+9), 21 ke 33 (+12). Maka angka berikutnya ditambah 15, yaitu 33 + 15 = 48.'),
('q5', 'TIU', 'APRESIASI : KARYA SENI = ...', 
 '["A. Hukuman : Kejahatan", "B. Penghargaan : Prestasi", "C. Penilaian : Ujian", "D. Investasi : Modal", "E. Konsumsi : Makanan"]'::jsonb, 
 'B',
 'Pembahasan: Analogi hubungan fungsi. Apresiasi diberikan atas adanya Karya Seni. Begitu pula Penghargaan diberikan atas adanya Prestasi.'),
('q6', 'TIU', 'Semua mahasiswa yang rajin belajar pasti lulus ujian. Sebagian mahasiswa Teknik Sipil tidak lulus ujian. Kesimpulan yang paling tepat adalah...', 
 '["A. Semua mahasiswa Teknik Sipil rajin belajar.", "B. Semua mahasiswa Teknik Sipil tidak rajin belajar.", "C. Sebagian mahasiswa Teknik Sipil rajin belajar.", "D. Sebagian mahasiswa Teknik Sipil tidak rajin belajar.", "E. Semua yang tidak lulus ujian bukan mahasiswa Teknik Sipil."]'::jsonb, 
 'D',
 'Pembahasan: Hukum silogisme. Jika semua mahasiswa rajin pasti lulus, dan sebagian mahasiswa Teknik Sipil tidak lulus, maka disimpulkan bahwa sebagian mahasiswa Teknik Sipil tersebut tidak rajin belajar.'),
('q7', 'TKP', 'Ketika Anda sedang sibuk menyelesaikan tugas kantor yang sangat penting, tiba-tiba seorang rekan kerja datang meminta bantuan untuk memecahkan masalah sistem komputernya yang mendesak. Sikap Anda adalah...', 
 '["A. Menolaknya secara kasar karena tugas Anda jauh lebih penting dan harus segera selesai.", "B. Menghentikan tugas Anda sepenuhnya dan membantunya hingga selesai tanpa peduli pekerjaan Anda terbengkalai.", "C. Memberitahunya secara sopan bahwa Anda sedang sibuk, lalu menyarankannya untuk meminta bantuan ke bagian IT atau berjanji membantunya setelah tugas Anda selesai.", "D. Mengabaikan permintaannya dan pura-pura tidak mendengar agar dia pergi dengan sendirinya.", "E. Menyuruhnya untuk mengerjakan sendiri karena itu adalah tanggung jawabnya masing-masing."]'::jsonb, 
 '{"A":1,"B":3,"C":5,"D":2,"E":4}',
 'Pembahasan (Aspek Jejaring Kerja & Profesionalisme): Opsi C bernilai 5 karena mengutamakan keprofesionalan dalam menyelesaikan tugas pribadi yang krusial, sembari menawarkan solusi alternatif yang ramah tanpa mengabaikan rekan kerja.'),
('q8', 'TKP', 'Ketika Anda ditunjuk sebagai ketua tim dalam sebuah proyek krusial, salah satu anggota tim Anda menunjukkan penurunan performa kerja yang signifikan dan sering terlambat mengumpulkan tugasnya. Tindakan pertama yang akan Anda lakukan adalah...', 
 '["A. Melaporkan performanya yang buruk kepada atasan agar dia segera diganti.", "B. Memarahinya di depan anggota tim lain agar dia termotivasi untuk bekerja lebih cepat.", "C. Memanggilnya secara pribadi untuk berdiskusi, mendengarkan kendalanya, and mencari solusi bersama demi kelancaran proyek.", "D. Membiarkannya saja dan mengambil alih seluruh pekerjaannya secara sepihak.", "E. Mengabaikan kontribusinya dan tidak melibatkan dirinya lagi dalam rapat-rapat koordinasi."]'::jsonb, 
 '{"A":2,"B":1,"C":5,"D":4,"E":3}',
 'Pembahasan (Aspek Kemampuan Mengelola Orang Lain): Opsi C bernilai 5 karena langkah bijaksana seorang pemimpin adalah memanggil secara personal untuk mengidentifikasi masalah secara persuasif dan mencari solusi bersama demi tim.'),
('q9', 'TKP', 'Anda sedang melayani antrean masyarakat di loket pelayanan publik. Tiba-tiba seorang warga berteriak marah karena merasa terlalu lama menunggu dan menuduh Anda tidak bekerja dengan profesional. Sikap Anda menghadapi situasi ini adalah...', 
 '["A. Ikut berteriak membalas tuduhannya agar warga lain tahu bahwa Anda sudah bekerja keras.", "B. Tetap bersikap tenang, mendengarkan keluhannya dengan empati, meminta maaf atas ketidaknyamanan, dan menjelaskan situasi pelayanan dengan ramah serta menyelesaikannya secepat mungkin.", "C. Meninggalkan loket and memanggil satpam untuk mengusir warga tersebut keluar dari gedung.", "D. Diam saja dan cemberut selama melayani warga tersebut untuk menunjukkan bahwa Anda tersinggung.", "E. Menutup loket pelayanan sementara waktu sampai suasana menjadi kondusif kembali."]'::jsonb, 
 '{"A":1,"B":5,"C":3,"D":2,"E":4}',
 'Pembahasan (Aspek Pelayanan Publik): Opsi B bernilai 5 karena pelayan publik dituntut untuk memiliki kendali diri yang kuat, mendengarkan kritik secara ramah, empati, dan tidak terpancing emosi negatif.')
-- Seed default packages
INSERT INTO public.packages (id, name, price, description, features, duration_minutes, total_questions)
VALUES
('pkg-basic', 'Paket Basic (Uji Coba)', 0, 'Sangat cocok untuk pemula yang ingin mencoba sistem CAT CPNS secara gratis.', '["Akses 30 Soal Acak (10 TWK, 10 TIU, 10 TKP)", "Durasi Ujian 30 Menit", "Pembahasan Soal Lengkap", "Statistik & Progres Belajar Dasar"]'::jsonb, 30, 30),
('pkg-premium', 'Paket Premium CAT', 49000, 'Akses penuh ke semua simulasi tryout manual kurasi standar CAT BKN RI.', '["Akses Penuh 110 Soal CAT Lengkap", "Durasi Ujian 100 Menit", "Pembahasan Soal Detil & Komprehensif", "Grafik Analisis Progres Belajar", "Sistem Perbandingan Ambang Batas"]'::jsonb, 100, 110),
('pkg-platinum', 'Paket Platinum AI', 99000, 'Solusi belajar cerdas menggunakan soal kustom tak terbatas dari Gemini AI.', '["Semua Fitur Paket Premium CAT", "Akses Simulasi Adaptif Gemini AI", "Penjanaan Soal Tak Terbatas secara Real-time", "Rekomendasi Area Kelemahan Materi", "Prioritas Layanan Dukungan Admin"]'::jsonb, 120, 110)
ON CONFLICT (id) DO NOTHING;

-- 5. Create FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) to ensure smooth integration with Server Actions
ALTER TABLE public.faqs DISABLE ROW LEVEL SECURITY;

-- Seed default FAQs
INSERT INTO public.faqs (id, question, answer)
VALUES 
('faq-1', 'Apakah simulasi KelasMateri sudah mengikuti kisi-kisi PERMENPAN-RB terbaru?', 'Ya, seluruh bank soal kami diperbarui secara berkala mengikuti Permenpan-RB nomor terbaru yang mengatur materi TWK, TIU, dan TKP, termasuk pembobotan nilai TKP berskala 1-5.'),
('faq-2', 'Bagaimana cara menggunakan fitur Simulasi AI?', 'Fitur Ujian AI memerlukan hak akses khusus dari Admin. Anda dapat meminta aktivasi melalui dashboard Anda setelah melakukan pendaftaran akun.'),
('faq-3', 'Apakah hasil ujian saya bisa diunduh atau disimpan?', 'Semua hasil pengerjaan, skor per sub-kategori, dan durasi pengerjaan Anda otomatis disimpan ke sistem cloud database sehingga Anda dapat meninjau riwayat belajar Anda kapan saja.')
ON CONFLICT (id) DO NOTHING;
