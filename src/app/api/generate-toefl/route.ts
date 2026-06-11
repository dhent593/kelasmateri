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
    4. Pastikan tidak ada soal yang terulang atau memiliki teks bacaan/dialog yang mirip. Semua butir soal harus benar-benar unik.
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
  return [
    // --- LISTENING (10 unique questions) ---
    {
      id: "fallback-toefl-listening-1",
      category: "Listening",
      question_text: "Man: Excuse me, do you know where the library is?\nWoman: Yes, it's just across the quad next to the student union building.\nQuestion: Where is the library located?",
      options: [
        "A. Inside the student union building",
        "B. Next to the student union building",
        "C. In the opposite direction of the quad",
        "D. The woman does not know"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Berdasarkan ucapan wanita, perpustakaan berada tepat di sebelah gedung student union (\"next to the student union building\"). Maka jawaban yang benar adalah B."
    },
    {
      id: "fallback-toefl-listening-2",
      category: "Listening",
      question_text: "Man: How did you like the professor's lecture?\nWoman: I could barely keep my eyes open.\nQuestion: What does the woman imply?",
      options: [
        "A. She found the lecture very boring",
        "B. She had to leave early",
        "C. The lecture hall was too dark",
        "D. She enjoyed it very much"
      ],
      correct_answer: "A",
      explanation: "Pembahasan: Ungkapan 'barely keep my eyes open' (hampir tidak bisa membuka mata) menunjukkan bahwa ia sangat mengantuk atau bosan selama kuliah. Maka jawaban yang benar adalah A."
    },
    {
      id: "fallback-toefl-listening-3",
      category: "Listening",
      question_text: "Man: Are you going to the concert tonight?\nWoman: I would if I didn't have this history paper due tomorrow.\nQuestion: What will the woman probably do tonight?",
      options: [
        "A. Go to the concert",
        "B. Write a history paper",
        "C. Ask for an extension",
        "D. Read a book in the library"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Pola pengandaian 'I would if I didn't have...' mengindikasikan bahwa ia sebenarnya ingin pergi, namun ia harus menulis makalah sejarah karena tenggat waktunya besok. Maka jawaban yang benar adalah B."
    },
    {
      id: "fallback-toefl-listening-4",
      category: "Listening",
      question_text: "Man: Should we take a taxi or walk to the restaurant?\nWoman: Since it's starting to drizzle, walking isn't really a good option.\nQuestion: What does the woman suggest?",
      options: [
        "A. Eating at home instead",
        "B. Walking to the restaurant",
        "C. Taking a taxi",
        "D. Waiting for the rain to stop"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Karena gerimis ('drizzle'), wanita tersebut menyatakan berjalan kaki bukanlah pilihan yang baik. Secara implisit ia menyarankan untuk naik taksi. Maka jawaban yang benar adalah C."
    },
    {
      id: "fallback-toefl-listening-5",
      category: "Listening",
      question_text: "Man: I'm really struggling with this math homework.\nWoman: Why don't you visit the tutoring center? They have great tutors there.\nQuestion: What does the woman advise the man to do?",
      options: [
        "A. Quit the class",
        "B. Get help from the tutoring center",
        "C. Do his homework tomorrow",
        "D. Ask the professor for answers"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Saran wanita diawali dengan 'Why don't you visit...' yang menganjurkan pria tersebut pergi ke pusat bimbingan belajar (tutoring center) untuk mendapatkan bantuan. Maka jawaban yang benar adalah B."
    },
    {
      id: "fallback-toefl-listening-6",
      category: "Listening",
      question_text: "Man: Has the mail carrier arrived yet?\nWoman: Usually he comes around noon, but it's already two o'clock.\nQuestion: What does the woman mean?",
      options: [
        "A. The mail carrier is early today",
        "B. She has already checked the mail",
        "C. The mail carrier is late",
        "D. She needs to mail a letter"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Wanita tersebut menjelaskan bahwa kurir surat biasanya datang siang hari, namun sekarang sudah jam 2 siang dan belum datang. Ini berarti kurir tersebut terlambat. Maka jawaban yang benar adalah C."
    },
    {
      id: "fallback-toefl-listening-7",
      category: "Listening",
      question_text: "Man: Can I borrow your chemistry notes? I missed class yesterday.\nWoman: You can, but my handwriting is not very easy to read.\nQuestion: What does the woman imply?",
      options: [
        "A. She did not take notes yesterday",
        "B. Her notes might be hard for him to read",
        "C. She wants him to copy them quickly",
        "D. She doesn't want to share her notes"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Wanita tersebut membolehkan catatannya dipinjam, tetapi memperingatkan bahwa tulisan tangannya sulit dibaca. Maka jawaban yang benar adalah B."
    },
    {
      id: "fallback-toefl-listening-8",
      category: "Listening",
      question_text: "Man: Do you have time to grab lunch now?\nWoman: I have a meeting in ten minutes, so I'll have to pass this time.\nQuestion: What does the woman mean?",
      options: [
        "A. She will go to lunch with him",
        "B. She is not hungry",
        "C. She cannot go to lunch now",
        "D. She wants to change the meeting time"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Ungkapan 'I'll have to pass this time' menunjukkan penolakan halus karena ia harus menghadiri rapat 10 menit lagi. Maka jawaban yang benar adalah C."
    },
    {
      id: "fallback-toefl-listening-9",
      category: "Listening",
      question_text: "Man: How did your job interview go?\nWoman: I think it went well, but they won't make a decision until next week.\nQuestion: What does the woman mean?",
      options: [
        "A. She did not get the job",
        "B. She has to wait until next week for the decision",
        "C. She is going to another interview",
        "D. The interview was rescheduled"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Wanita tersebut menjelaskan bahwa keputusan penerimaan kerja baru akan diumumkan minggu depan. Maka jawaban yang benar adalah B."
    },
    {
      id: "fallback-toefl-listening-10",
      category: "Listening",
      question_text: "Man: It's so hot and humid today!\nWoman: I know! I wish I were at the beach right now.\nQuestion: What does the woman mean?",
      options: [
        "A. She wants to buy a house near the beach",
        "B. She does not like the beach",
        "C. She would prefer to be at the beach instead of here",
        "D. She is planning a beach vacation next month"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Ungkapan 'I wish I were at the beach right now' (Seandainya aku berada di pantai saat ini) bermakna ia lebih memilih berada di pantai dibanding cuaca gerah di tempatnya sekarang. Maka jawaban yang benar adalah C."
    },

    // --- STRUCTURE (10 unique questions) ---
    {
      id: "fallback-toefl-structure-1",
      category: "Structure",
      question_text: "Unlike most other mammals, ______ lay eggs instead of giving birth to live young.",
      options: [
        "A. platypuses they",
        "B. and platypuses",
        "C. platypuses",
        "D. that platypuses"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Kalimat membutuhkan subjek untuk melengkapi klausa utama setelah preposisi pembuka. Subjek yang tepat dan langsung adalah 'platypuses' (C)."
    },
    {
      id: "fallback-toefl-structure-2",
      category: "Structure",
      question_text: "______ of the financial crisis, the company decided to downsize its operations.",
      options: [
        "A. Because",
        "B. Since",
        "C. Because of",
        "D. For"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Struktur kalimat membutuhkan preposisi gabungan untuk diikuti oleh frasa kata benda 'the financial crisis'. 'Because of' (C) adalah jawaban yang tepat. 'Because' dan 'Since' harus diikuti oleh klausa lengkap."
    },
    {
      id: "fallback-toefl-structure-3",
      category: "Structure",
      question_text: "Not only ______ the championship, but they also set a new world record.",
      options: [
        "A. they won",
        "B. did they win",
        "C. won they",
        "D. they did win"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Penggunaan ekspresi negatif pembuka kalimat 'Not only' memicu pola inversi (susun balik) antara subjek dan kata kerja bantu, menjadi 'did they win' (B)."
    },
    {
      id: "fallback-toefl-structure-4",
      category: "Structure",
      question_text: "The committee recommended that the budget ______ revised before the presentation.",
      options: [
        "A. be",
        "B. is",
        "C. was",
        "D. to be"
      ],
      correct_answer: "A",
      explanation: "Pembahasan: Kalimat menggunakan kata kerja 'recommended that' yang memicu bentuk kata kerja dasar (Subjunctive). Oleh karena itu, kita menggunakan kata kerja dasar 'be' (A)."
    },
    {
      id: "fallback-toefl-structure-5",
      category: "Structure",
      question_text: "The team captain, along with his teammates, ______ celebrating the victory.",
      options: [
        "A. is",
        "B. are",
        "C. were",
        "D. have been"
      ],
      correct_answer: "A",
      explanation: "Pembahasan: Frasa 'along with his teammates' merupakan sisipan dan tidak mengubah subjek utama 'The team captain' yang berbentuk tunggal. Maka kata kerja yang tepat adalah tunggal 'is' (A)."
    },
    {
      id: "fallback-toefl-structure-6",
      category: "Structure",
      question_text: "By the time the train arrived, we ______ on the platform for over an hour.",
      options: [
        "A. waited",
        "B. have waited",
        "C. had been waiting",
        "D. wait"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Kalimat menceritakan kejadian di masa lampau yang sudah berlangsung sebelum kejadian lampau lainnya terjadi ('By the time the train arrived'). Tense yang tepat adalah Past Perfect Continuous 'had been waiting' (C)."
    },
    {
      id: "fallback-toefl-structure-7",
      category: "Structure",
      question_text: "Rarely ______ such a beautiful piece of classical music.",
      options: [
        "A. I have heard",
        "B. have I heard",
        "C. I heard",
        "D. heard I"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Kata keterangan negatif seperti 'Rarely' di awal kalimat memerlukan pola inversi (kata kerja bantu mendahului subjek), yaitu 'have I heard' (B)."
    },
    {
      id: "fallback-toefl-structure-8",
      category: "Structure",
      question_text: "The more you practice speaking English, ______ you will become.",
      options: [
        "A. the most confident",
        "B. the more confident",
        "C. confident",
        "D. more confident"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Kalimat ini menggunakan pola perbandingan ganda (double comparative) 'The more..., the [comparative]...'. Maka pasangan yang benar adalah 'the more confident' (B)."
    },
    {
      id: "fallback-toefl-structure-9",
      category: "Structure",
      question_text: "It is essential that every student ______ a valid ID card to enter the library.",
      options: [
        "A. has",
        "B. have",
        "C. had",
        "D. is having"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Klausa 'It is essential that...' merupakan bentuk penekanan yang membutuhkan subjunctive (kata kerja bentuk pertama/dasar tanpa akhiran -s/es), sehingga menggunakan 'have' (B)."
    },
    {
      id: "fallback-toefl-structure-10",
      category: "Structure",
      question_text: "The novel is based on the life of an artist ______ paintings are famous worldwide.",
      options: [
        "A. who",
        "B. whom",
        "C. whose",
        "D. which"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Kalimat memerlukan kata ganti kepemilikan (possessive relative pronoun) untuk menghubungkan seniman dengan lukisannya. Kata yang tepat adalah 'whose' (C)."
    },

    // --- READING (10 unique questions) ---
    {
      id: "fallback-toefl-reading-1",
      category: "Reading",
      question_text: "Passage:\nPhotosynthesis is the chemical process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct.\n\nQuestion: What is the main topic of the passage?",
      options: [
        "A. The role of chlorophyll in soil development",
        "B. The chemical structure of water and oxygen",
        "C. The chemical process of photosynthesis",
        "D. How plants absorb carbon dioxide"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Teks secara menyeluruh mendefinisikan dan menjelaskan bagaimana fotosintesis bekerja sebagai proses kimiawi pada tumbuhan. Jadi, topik utamanya adalah C."
    },
    {
      id: "fallback-toefl-reading-2",
      category: "Reading",
      question_text: "Passage:\nWater covers more than 70 percent of the Earth's surface, making it one of the most abundant resources. However, about 97 percent of it is saltwater, which is not suitable for drinking or agriculture. Only a small fraction is freshwater, and much of that is locked in glaciers and ice caps.\n\nQuestion: According to the passage, why is most of the Earth's water not suitable for human consumption?",
      options: [
        "A. It is polluted by industrial waste",
        "B. It is locked in ice caps",
        "C. It is saltwater",
        "D. It is located deep underground"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Paragraf menyatakan secara tertulis '97 percent of it is saltwater, which is not suitable for drinking or agriculture'. Maka jawaban yang benar adalah C."
    },
    {
      id: "fallback-toefl-reading-3",
      category: "Reading",
      question_text: "Passage:\nAbraham Lincoln, the 16th President of the United States, led the nation during the American Civil War. He is best remembered for his role in preserving the Union and issuing the Emancipation Proclamation, which declared the freedom of slaves within the Confederacy.\n\nQuestion: What is the main accomplishment of Abraham Lincoln mentioned in the passage?",
      options: [
        "A. Writing a new constitution",
        "B. Preserving the Union and freeing slaves",
        "C. Ending the war with Britain",
        "D. Developing the national economy"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Teks menerangkan bahwa Lincoln paling diingat atas jasanya menjaga persatuan negara ('preserving the Union') dan memerdekakan budak ('issuing the Emancipation Proclamation'). Maka jawaban yang tepat adalah B."
    },
    {
      id: "fallback-toefl-reading-4",
      category: "Reading",
      question_text: "Passage:\nThe solar system consists of the Sun and the objects that orbit it, including eight planets. Jupiter is the largest of these planets, known for its Great Red Spot, a giant storm that has raged for centuries. In contrast, Mercury is the closest planet to the Sun and is extremely hot.\n\nQuestion: What is the Great Red Spot on Jupiter?",
      options: [
        "A. A volcanic crater",
        "B. A large desert",
        "C. A giant storm",
        "D. An ocean of liquid gas"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Teks menuliskan bahwa Great Red Spot merupakan badai raksasa ('a giant storm that has raged for centuries'). Maka jawaban yang benar adalah C."
    },
    {
      id: "fallback-toefl-reading-5",
      category: "Reading",
      question_text: "Passage:\nFossils are the preserved remains or traces of ancient organisms. They provide crucial clues about the history of life on Earth and how species evolved over millions of years. Most fossils are found in sedimentary rocks, which form in layers over time.\n\nQuestion: In which type of rock are most fossils found?",
      options: [
        "A. Igneous rock",
        "B. Metamorphic rock",
        "C. Sedimentary rock",
        "D. Volcanic rock"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Berdasarkan teks, 'Most fossils are found in sedimentary rocks' (Sebagian besar fosil ditemukan di batuan sedimen). Maka jawaban yang benar adalah C."
    },
    {
      id: "fallback-toefl-reading-6",
      category: "Reading",
      question_text: "Passage:\nThe Great Wall of China is an ancient series of walls and fortifications built along the northern borders of China to protect the empire from invasions. Construction began as early as the 7th century BC and continued for centuries under various dynasties.\n\nQuestion: Why was the Great Wall of China built?",
      options: [
        "A. To mark trade routes",
        "B. To protect the empire from invasions",
        "C. To serve as a monument for emperors",
        "D. To prevent flooding from the yellow river"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Paragraf menyatakan tembok tersebut dibangun 'to protect the empire from invasions' (untuk melindungi kekaisaran dari invasi luar). Maka jawaban yang benar adalah B."
    },
    {
      id: "fallback-toefl-reading-7",
      category: "Reading",
      question_text: "Passage:\nHoneybees are crucial pollinators, playing a vital role in the reproduction of many flowering plants and crops. In recent years, honeybee populations have declined due to habitat loss, pesticide use, and diseases, raising concerns about food security.\n\nQuestion: What is one reason for the decline of honeybee populations mentioned in the passage?",
      options: [
        "A. Competition with other insects",
        "B. Changes in global weather",
        "C. Pesticide use and habitat loss",
        "D. Lack of flowering plants"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Teks menyebutkan populasi lebah menurun akibat hilangnya habitat, penggunaan pestisida, dan penyakit. Opsi yang memuat hal ini adalah C."
    },
    {
      id: "fallback-toefl-reading-8",
      category: "Reading",
      question_text: "Passage:\nMount Everest, located in the Himalayas on the border between Nepal and China, is the highest mountain on Earth above sea level, reaching an elevation of 8,848 meters. Climbing it is highly dangerous due to extreme cold, high winds, and low oxygen levels.\n\nQuestion: Why is climbing Mount Everest dangerous according to the passage?",
      options: [
        "A. Lack of experienced guides",
        "B. Severe mudslides",
        "C. Extreme cold, winds, and low oxygen",
        "D. Frequent volcanic eruptions"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Bahaya mendaki Everest dituliskan karena suhu dingin ekstrim, angin kencang, dan tingkat oksigen rendah. Maka jawaban yang benar adalah C."
    },
    {
      id: "fallback-toefl-reading-9",
      category: "Reading",
      question_text: "Passage:\nLightning is a giant spark of electricity in the atmosphere between clouds, the air, or the ground. In the early stages of development, air acts as an insulator. When the opposite charges build up enough, this insulating capacity of the air breaks down, a rapid discharge of electricity occurs, which we see as lightning.\n\nQuestion: What happens when the opposite electrical charges build up sufficiently?",
      options: [
        "A. It starts to rain heavily",
        "B. The insulating capacity of the air breaks down and lightning occurs",
        "C. The clouds disappear",
        "D. Air temperature drops instantly"
      ],
      correct_answer: "B",
      explanation: "Pembahasan: Paragraf menyatakan 'When the opposite charges build up enough, this insulating capacity of the air breaks down... rapid discharge... which we see as lightning'. Maka jawaban yang benar adalah B."
    },
    {
      id: "fallback-toefl-reading-10",
      category: "Reading",
      question_text: "Passage:\nMarie Curie was a pioneering physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize, the first person to win a Nobel Prize twice, and the only person to win a Nobel Prize in two different scientific fields (Physics and Chemistry).\n\nQuestion: In which two fields did Marie Curie win Nobel Prizes?",
      options: [
        "A. Physics and Mathematics",
        "B. Biology and Chemistry",
        "C. Physics and Chemistry",
        "D. Medicine and Chemistry"
      ],
      correct_answer: "C",
      explanation: "Pembahasan: Teks menyebutkan di baris akhir bahwa Curie merupakan satu-satunya orang yang memenangkan Nobel pada dua bidang sains berbeda yaitu Physics dan Chemistry. Maka jawaban yang benar adalah C."
    }
  ];
}
