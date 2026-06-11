import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/db';

// Interface matching our question scheme
interface GeneratedQuestion {
  id: string;
  category: 'TIU' | 'TWK' | 'TKP';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

// Helper function to query a batch of questions from Gemini
async function generateGeminiBatch(
  model: any, 
  category: 'TWK' | 'TIU' | 'TKP', 
  count: number
): Promise<GeneratedQuestion[]> {
  const prompt = `
    Anda adalah seorang ahli pembuat soal seleksi CPNS (Calon Pegawai Negeri Sipil) Indonesia.
    Buatlah tepat ${count} butir soal tryout CPNS berkualitas tinggi dalam bahasa Indonesia untuk kategori ${category}.
    
    Output harus berupa valid JSON dengan struktur schema objek persis seperti berikut:
    {
      "questions": [
        {
          "id": "string acak pembeda unik, awalan 'ai-gen-${category.toLowerCase()}-'",
          "category": "${category}",
          "question_text": "teks soal pertanyaan lengkap",
          "options": [
            "A. teks pilihan A",
            "B. teks pilihan B",
            "C. teks pilihan C",
            "D. teks pilihan D",
            "E. teks pilihan E"
          ],
          "correct_answer": "${
            category === 'TKP' 
              ? 'Tulis JSON string yang memetakan huruf opsi ke poin nilai 1 sampai 5. Contoh: \'{\\"A\\":5,\\"B\\":4,\\"C\\":3,\\"D\\":2,\\"E\\":1}\' di mana setiap huruf memetakan secara unik ke poin 1, 2, 3, 4, dan 5 tanpa duplikasi.' 
              : 'Tulis salah satu huruf \'A\', \'B\', \'C\', \'D\', atau \'E\''
          }",
          "explanation": "Tulis pembahasan penjelasan detil mengapa opsi tersebut benar dan analisis jawabannya dalam bahasa Indonesia."
        }
      ]
    }

    Catatan Penting:
    1. Pastikan pertanyaan bervariasi, menantang, dan menggunakan kaidah bahasa Indonesia yang baik dan benar.
    2. Pastikan format string opsi persis mengandung 'A. ', 'B. ', 'C. ', 'D. ', 'E. ' di depannya.
    3. Untuk TKP, pastikan semua huruf opsi A, B, C, D, E masing-masing memetakan secara unik ke skor 1, 2, 3, 4, dan 5 secara bervariasi (tidak semuanya A=5, B=4, dll. namun diacak).
    4. Pastikan tidak ada soal yang terulang atau memiliki skenario/makna yang mirip. Semua butir soal harus benar-benar unik.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error(`Respons kosong dari Gemini untuk kategori ${category}`);
  }

  const parsedData = JSON.parse(text);
  if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
    throw new Error(`Format JSON tidak sesuai untuk kategori ${category}`);
  }

  return parsedData.questions as GeneratedQuestion[];
}

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib dilampirkan.' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;

    // 1. Fallback if API Key is not configured
    if (!geminiApiKey) {
      const fullPack = await db.getFullTryoutPackage();
      return NextResponse.json({
        questions: fullPack,
        source: 'local_mock'
      });
    }

    // 2. Gemini AI Integration (Parallel Batches)
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    try {
      // Execute 3 parallel requests for TWK (30), TIU (35), and TKP (45) questions
      const [twkQuestions, tiuQuestions, tkpQuestions] = await Promise.all([
        generateGeminiBatch(model, 'TWK', 30),
        generateGeminiBatch(model, 'TIU', 35),
        generateGeminiBatch(model, 'TKP', 45)
      ]);

      const combined = [...twkQuestions, ...tiuQuestions, ...tkpQuestions];

      // Return combined 110 questions
      return NextResponse.json({
        questions: combined,
        source: 'gemini_ai_full'
      });

    } catch (apiError: any) {
      // If Gemini quota/rate limits are hit, fall back to our programmatic package of 110 questions
      const fullPack = await db.getFullTryoutPackage();
      return NextResponse.json({
        questions: fullPack,
        source: 'local_mock_fallback',
        warning: apiError.message || 'Gagal memanggil Gemini. Menggunakan generator bank soal pre-seeded.'
      });
    }

  } catch (error: any) {
    // Graceful fallback to mock data on parsing error
    const fullPack = await db.getFullTryoutPackage();
    return NextResponse.json({
      questions: fullPack,
      source: 'local_mock_error_fallback'
    });
  }
}
