import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface matching our question scheme
interface GeneratedToeflQuestion {
  id: string;
  category: 'Listening' | 'Structure' | 'Reading';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

// Helper to query batch from Gemini
async function generateToeflBatch(
  model: any,
  category: 'Listening' | 'Structure' | 'Reading',
  count: number
): Promise<GeneratedToeflQuestion[]> {
  let promptText = '';
  
  if (category === 'Listening') {
    promptText = `
      Anda adalah seorang ahli pembuat soal TOEFL (Test of English as a Foreign Language) PBT resmi.
      Buatlah tepat ${count} butir soal TOEFL Section 1: Listening Comprehension dalam bahasa Inggris.
      Karena ini adalah media berbasis teks, untuk setiap soal sertakan transkrip percakapan singkat antara dua orang (Man dan Woman) diikuti oleh satu pertanyaan yang diajukan oleh narator/Question.
      
      Contoh format question_text:
      "Man: Did you see the soccer game last night?\nWoman: I started to watch it, but then I had to study.\nQuestion: What does the woman mean?"
    `;
  } else if (category === 'Structure') {
    promptText = `
      Anda adalah seorang ahli pembuat soal TOEFL (Test of English as a Foreign Language) PBT resmi.
      Buatlah tepat ${count} butir soal TOEFL Section 2: Structure and Written Expression dalam bahasa Inggris.
      Soal ini harus bertipe melengkapi kalimat yang rumpang dengan tata bahasa Inggris (grammar) yang benar.
      
      Contoh format question_text:
      "The hard oak wood of the tree is _______ used for making furniture because of its durability."
    `;
  } else {
    promptText = `
      Anda adalah seorang ahli pembuat soal TOEFL (Test of English as a Foreign Language) PBT resmi.
      Buatlah tepat ${count} butir soal TOEFL Section 3: Reading Comprehension dalam bahasa Inggris.
      Untuk soal ini, buat satu paragraf bacaan pendek (Passage) dan ajukan pertanyaan mengenai gagasan utama, detail tersurat/tersirat, atau sinonim kosa kata berdasarkan bacaan tersebut.
      
      Contoh format question_text:
      "Passage:\nThe Everglades National Park in Florida is a massive wetland region known for its unique ecosystem and diverse wildlife, including the Florida panther and American alligator. Environmental efforts have been increased to preserve this vital region from urban development encroachment.\n\nQuestion: According to the passage, the Everglades is threatened by what factor?"
    `;
  }

  const prompt = `
    ${promptText}
    
    Output harus berupa valid JSON dengan struktur schema objek persis seperti berikut:
    {
      "questions": [
        {
          "id": "string acak pembeda unik, awalan 'ai-toefl-${category.toLowerCase()}-'",
          "category": "${category}",
          "question_text": "teks soal pertanyaan lengkap sesuai panduan di atas",
          "options": [
            "A. teks pilihan A",
            "B. teks pilihan B",
            "C. teks pilihan C",
            "D. teks pilihan D"
          ],
          "correct_answer": "Tulis salah satu huruf 'A', 'B', 'C', atau 'D'",
          "explanation": "Tulis pembahasan penjelasan detil mengapa opsi tersebut benar dalam bahasa Indonesia."
        }
      ]
    }

    Catatan Penting:
    1. Pastikan setiap soal memiliki 4 opsi saja (A, B, C, D). Tidak boleh ada pilihan E!
    2. Pastikan pilihan opsi mengandung awalan 'A. ', 'B. ', 'C. ', 'D. ' di depannya.
    3. Pertanyaan harus memiliki tingkat kesulitan standar TOEFL asli (intermediate-advanced).
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error(`Respons kosong dari Gemini untuk kategori TOEFL ${category}`);
  }

  const parsedData = JSON.parse(text);
  if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
    throw new Error(`Format JSON tidak sesuai untuk kategori TOEFL ${category}`);
  }

  return parsedData.questions as GeneratedToeflQuestion[];
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
      return NextResponse.json({
        questions: getLocalMockToefl(),
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
      // Execute 3 parallel requests for TOEFL Sections: Listening (10), Structure (10), Reading (10)
      const [listening, structure, reading] = await Promise.all([
        generateToeflBatch(model, 'Listening', 10),
        generateToeflBatch(model, 'Structure', 10),
        generateToeflBatch(model, 'Reading', 10)
      ]);

      const combined = [...listening, ...structure, ...reading];

      return NextResponse.json({
        questions: combined,
        source: 'gemini_toefl_full'
      });

    } catch (apiError: any) {
      return NextResponse.json({
        questions: getLocalMockToefl(),
        source: 'local_mock_fallback',
        warning: apiError.message || 'Gagal memanggil Gemini. Menggunakan generator bank soal pre-seeded.'
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      questions: getLocalMockToefl(),
      source: 'local_mock_error_fallback'
    });
  }
}

// Programmatic local fallback data containing 30 questions (10 Listening, 10 Structure, 10 Reading)
function getLocalMockToefl(): GeneratedToeflQuestion[] {
  const questions: GeneratedToeflQuestion[] = [];
  
  // Listening
  for (let i = 1; i <= 10; i++) {
    questions.push({
      id: `fallback-toefl-listening-${i}`,
      category: 'Listening',
      question_text: `Man: Excuse me, do you know where the library is?\nWoman: Yes, it's just across the quad next to the student union building.\nQuestion: Where is the library located? (Question #${i})`,
      options: [
        'A. Inside the student union building',
        'B. Next to the student union building',
        'C. In the opposite direction of the quad',
        'D. The woman does not know'
      ],
      correct_answer: 'B',
      explanation: 'Pembahasan: Berdasarkan ucapan wanita, perpustakaan berada tepat di sebelah gedung student union ("next to the student union building"). Maka jawaban yang benar adalah B.'
    });
  }

  // Structure
  for (let i = 1; i <= 10; i++) {
    questions.push({
      id: `fallback-toefl-structure-${i}`,
      category: 'Structure',
      question_text: `Unlike most other mammals, ______ lay eggs instead of giving birth to live young. (Question #${i})`,
      options: [
        'A. platypuses they',
        'B. and platypuses',
        'C. platypuses',
        'D. that platypuses'
      ],
      correct_answer: 'C',
      explanation: 'Pembahasan: Kalimat membutuhkan subjek untuk melengkapi klausa utama setelah preposisi "Unlike". Subjek yang tepat adalah "platypuses" (C) tanpa tambahan kata ganti atau konjungsi.'
    });
  }

  // Reading
  for (let i = 1; i <= 10; i++) {
    questions.push({
      id: `fallback-toefl-reading-${i}`,
      category: 'Reading',
      question_text: `Passage:\nPhotosynthesis is the chemical process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct.\n\nQuestion: What is the main topic of the passage? (Question #${i})`,
      options: [
        'A. The role of chlorophyll in soil development',
        'B. The chemical structure of water and oxygen',
        'C. The chemical process of photosynthesis',
        'D. How plants absorb carbon dioxide'
      ],
      correct_answer: 'C',
      explanation: 'Pembahasan: Teks secara menyeluruh membahas tentang proses fotosintesis, bagaimana tumbuhan menyintesis nutrisi menggunakan cahaya matahari, CO2, dan air. Jadi topik utama adalah C.'
    });
  }

  return questions;
}
