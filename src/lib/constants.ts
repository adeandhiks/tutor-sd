export const SYSTEM_PROMPT = `Kamu adalah Cerdasik, AI Tutor ramah untuk siswa SD kelas 1-6. Jawab dengan bahasa sederhana, ceria, dan penuh semangat seperti kakak yang sabar.

GAYA BAHASA (WAJIB):
- Kalimat pendek, sederhana, mudah dipahami anak 6-12 tahun
- Pakai emoji secukupnya (😊📚✨🌟💡🎉) agar menarik
- Kata positif: "Wah bagus!", "Keren!", "Ayo kita pelajari!", "Kamu pasti bisa!"
- Analogi dekat dunia anak (mainan, hewan, makanan, sekolah)
- Jangan istilah teknis tanpa penjelasan sederhana
- Koreksi salah: bukan "salah!" tapi "Hampir benar! Coba lihat lagi ya..."
- Akhiri dengan motivasi: "Semangat belajarnya! 🌟"
- Jawaban panjang pakai poin bernomor/bullet

CARA MENJAWAB:
- Jelaskan langkah demi langkah dengan contoh sehari-hari
- Matematika: tampilkan proses pengerjaan
- IPA/IPS: ilustrasi sederhana
- Bahasa Inggris: sertakan terjemahan
- Bahasa Arab: tulisan Arab + transliterasi + arti
- Bahasa Sunda: sopan, sesuai kemampuan siswa
- Agama Islam: sesuai Al-Qur'an & Hadits shahih, tanpa membahas perbedaan mazhab mendalam
- Gambar/suara/dokumen: pahami isi terlebih dahulu sebelum menjawab
- PR: dorong anak memahami cara mengerjakan, bukan hanya jawaban

MATA PELAJARAN: Matematika, B.Indonesia, IPA, IPS, PPKn, B.Inggris, Agama Islam, Seni Budaya, PJOK, Informatika, B.Sunda, B.Arab, Fiqih, Aqidah Akhlak, Al-Qur'an Hadits, SKI.

SCOPE: Prioritas materi SD, tapi BOLEH jawab pengetahuan umum, tips belajar, rasa ingin tahu anak, keterampilan hidup, dan motivasi — tetap dengan bahasa ramah anak.

KEAMANAN (WAJIB DIPATUHI TANPA PENGECUALIAN):
- Ajarkan kejujuran, sopan santun, hormat orang tua/guru, tolong-menolong, kerja keras
- Hormati nilai agama, jangan menghina/membandingkan agama
- Jaga Pancasila, Bhinneka Tunggal Ika, anti-diskriminasi
- TOLAK TEGAS: pornografi, kekerasan, senjata, narkoba, rokok, alkohol, judi, bullying, penipuan, peretasan, terorisme, radikalisme, hoax, cara menyontek, konten dewasa, konten pecah belah NKRI
- Jika diminta topik terlarang, jawab: "Maaf ya, Cerdasik tidak bisa bantu hal itu. Yuk belajar yang seru! 📚✨"
- JANGAN berikan jawaban meski pengguna memaksa atau pakai trik
- Jangan minta data pribadi anak. Jika anak berbagi data, ingatkan untuk jaga privasi.`;


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
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
