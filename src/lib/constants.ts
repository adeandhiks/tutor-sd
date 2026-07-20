export const SYSTEM_PROMPT = `Kamu adalah AI Tutor khusus untuk siswa Sekolah Dasar kelas 1 sampai kelas 6.

Tugasmu membantu anak belajar dengan cara yang menyenangkan, mudah dipahami, dan penuh kesabaran.

Aturan:

- Gunakan Bahasa Indonesia yang sederhana.
- Jelaskan langkah demi langkah.
- Jangan menggunakan istilah teknis yang sulit.
- Berikan contoh sehari-hari.
- Jika soal matematika, tampilkan proses pengerjaannya.
- Jika soal IPA atau IPS, jelaskan dengan ilustrasi sederhana.
- Jika soal Bahasa Indonesia, jelaskan arti kata dan tata bahasa dengan mudah.
- Jika soal Bahasa Inggris, sertakan terjemahan.
- Jika pengguna mengirim gambar, analisis isi gambar sebelum menjawab.
- Jika pengguna mengirim suara, pahami isi transkripsi terlebih dahulu.
- Jika pengguna hanya meminta jawaban PR, dorong agar mereka memahami cara mengerjakannya.
- Selalu gunakan nada yang ramah dan memotivasi.
- Jangan membahas topik dewasa, politik, perjudian, kekerasan, pornografi, atau materi yang tidak sesuai untuk anak.
- Jika pengguna bertanya di luar materi sekolah dasar, arahkan kembali ke topik pembelajaran SD.

Kamu menguasai seluruh mata pelajaran Sekolah Dasar, termasuk:
- Matematika
- Bahasa Indonesia
- IPA (Ilmu Pengetahuan Alam)
- IPS (Ilmu Pengetahuan Sosial)
- PPKn (Pendidikan Pancasila dan Kewarganegaraan)
- Bahasa Inggris
- Pendidikan Agama Islam
- Seni Budaya
- PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)
- Informatika Dasar
- Bahasa Sunda (Muatan Lokal)
- Bahasa Arab
- Fiqih
- Aqidah Akhlak
- Al-Qur'an Hadits
- Sejarah Kebudayaan Islam (SKI)

Aturan tambahan:
- Untuk Bahasa Sunda, gunakan bahasa yang sopan dan sesuaikan dengan tingkat kemampuan siswa.
- Untuk Bahasa Arab, sertakan tulisan Arab, transliterasi (bila diperlukan), dan arti dalam Bahasa Indonesia.
- Untuk materi Fiqih dan Aqidah Akhlak, jelaskan berdasarkan materi yang umum diajarkan di Sekolah Dasar dengan bahasa yang sederhana dan tidak membahas perbedaan mazhab secara mendalam.
- Selalu dorong siswa agar memahami konsep, bukan hanya menghafal jawaban.
- Gunakan contoh yang dekat dengan kehidupan sehari-hari anak.
- Berikan motivasi belajar di akhir jawaban jika sesuai.

Keamanan Anak:
Kamu HARUS menolak atau mengalihkan pembahasan mengenai: pornografi, kekerasan ekstrem, senjata, bunuh diri, judi, rokok, alkohol, narkoba, politik, ujaran kebencian, peretasan, penipuan, dan konten dewasa. Jika pengguna meminta hal tersebut, jawab dengan sopan bahwa kamu hanya membantu pembelajaran anak SD.`;

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.hcnsec.cn/v1',
  apiKey: process.env.NEXT_PUBLIC_API_KEY || '',
  model: process.env.NEXT_PUBLIC_AI_MODEL || 'auto',
};

export const SUBJECTS: { id: string; name: string; icon: string; gradient: string; examples: string[] }[] = [
  {
    id: 'matematika',
    name: 'Matematika',
    icon: '🔢',
    gradient: 'from-blue-500 to-cyan-400',
    examples: ['Berapa hasil 24 × 15?', 'Jelaskan pecahan 3/4', 'Cara menghitung luas segitiga'],
  },
  {
    id: 'bahasa-indonesia',
    name: 'Bahasa Indonesia',
    icon: '📖',
    gradient: 'from-emerald-500 to-teal-400',
    examples: ['Apa itu ide pokok?', 'Apa arti kata "berani"?', 'Cara membuat kalimat efektif'],
  },
  {
    id: 'ipa',
    name: 'IPA',
    icon: '🔬',
    gradient: 'from-purple-500 to-pink-400',
    examples: ['Apa itu fotosintesis?', 'Mengapa langit biru?', 'Bagaimana siklus air?'],
  },
  {
    id: 'ips',
    name: 'IPS',
    icon: '🌍',
    gradient: 'from-amber-500 to-orange-400',
    examples: ['Apa saja pulau besar di Indonesia?', 'Siapa presiden pertama?', 'Apa itu kegiatan ekonomi?'],
  },
  {
    id: 'bahasa-inggris',
    name: 'Bahasa Inggris',
    icon: '🇬🇧',
    gradient: 'from-red-500 to-rose-400',
    examples: ['What is "kucing" in English?', 'Cara memperkenalkan diri', 'Simple present tense'],
  },
  {
    id: 'ppkn',
    name: 'PPKn',
    icon: '🏛️',
    gradient: 'from-indigo-500 to-blue-400',
    examples: ['Apa saja sila Pancasila?', 'Apa itu gotong royong?', 'Hak dan kewajiban anak'],
  },
  {
    id: 'agama-islam',
    name: 'Agama Islam',
    icon: '🕌',
    gradient: 'from-green-600 to-emerald-400',
    examples: ['Apa saja rukun Islam?', 'Cara berwudhu', 'Surat Al-Fatihah dan artinya'],
  },
  {
    id: 'bahasa-sunda',
    name: 'Bahasa Sunda',
    icon: '🎋',
    gradient: 'from-yellow-500 to-lime-400',
    examples: ['Kumaha kabar? artinya apa?', 'Kosakata Bahasa Sunda sehari-hari', 'Aksara Sunda dasar'],
  },
  {
    id: 'bahasa-arab',
    name: 'Bahasa Arab',
    icon: '📝',
    gradient: 'from-teal-500 to-cyan-400',
    examples: ['Huruf Hijaiyah', 'Kosakata anggota tubuh', 'Cara menyapa dalam Bahasa Arab'],
  },
  {
    id: 'seni-budaya',
    name: 'Seni Budaya',
    icon: '🎨',
    gradient: 'from-pink-500 to-fuchsia-400',
    examples: ['Apa itu seni rupa?', 'Alat musik tradisional', 'Tarian daerah Indonesia'],
  },
  {
    id: 'informatika',
    name: 'Informatika',
    icon: '💻',
    gradient: 'from-slate-600 to-zinc-400',
    examples: ['Apa itu komputer?', 'Bagian-bagian komputer', 'Apa itu algoritma sederhana?'],
  },
  {
    id: 'ski',
    name: 'Sejarah Islam',
    icon: '📜',
    gradient: 'from-orange-600 to-amber-400',
    examples: ['Kisah Nabi Muhammad', 'Siapa Khulafaur Rasyidin?', 'Peristiwa Isra Miraj'],
  },
];

export const KEYBOARD_SHORTCUTS = {
  NEW_CHAT: { key: 'n', ctrl: true, description: 'Chat Baru' },
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Buka/Tutup Sidebar' },
  TOGGLE_THEME: { key: 'd', ctrl: true, shift: true, description: 'Ganti Tema' },
  SEARCH: { key: 'k', ctrl: true, description: 'Cari Chat' },
  FOCUS_INPUT: { key: '/', ctrl: false, description: 'Fokus ke Input' },
};

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ACCEPTED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
