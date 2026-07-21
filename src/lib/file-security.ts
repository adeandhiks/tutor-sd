/**
 * File Security Module — Cerdasik
 * Validasi keamanan berlapis untuk mencegah file berbahaya
 */

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

// Magic bytes signature untuk verifikasi tipe file asli
const MAGIC_SIGNATURES: Record<string, { bytes: number[]; offset: number }[]> = {
  // Images
  'image/jpeg': [{ bytes: [0xFF, 0xD8, 0xFF], offset: 0 }],
  'image/png': [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 }],
  'image/webp': [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }], // RIFF header

  // Documents (ZIP-based: DOCX, XLSX, PPTX)
  'application/zip': [{ bytes: [0x50, 0x4B, 0x03, 0x04], offset: 0 }],
  'application/zip-empty': [{ bytes: [0x50, 0x4B, 0x05, 0x06], offset: 0 }],

  // PDF
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 }], // %PDF

  // Old Office formats (OLE2 Compound Document)
  'application/ole2': [{ bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], offset: 0 }],
};

// Ekstensi file yang diizinkan
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'];
const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_DOC_EXTENSIONS];

// Ekstensi berbahaya yang HARUS diblokir
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.ws',
  '.ps1', '.psm1', '.psd1',
  '.sh', '.bash', '.csh',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl',
  '.dll', '.sys', '.drv',
  '.html', '.htm', '.svg', '.xml',
  '.hta', '.inf', '.reg', '.rgs',
  '.jar', '.class',
  '.lnk', '.url',
];

// Pattern berbahaya dalam konten file
const DANGEROUS_CONTENT_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /vbscript:/i,
  /on\w+\s*=/i,  // onclick=, onerror=, etc.
  /eval\s*\(/i,
  /document\.(cookie|write|location)/i,
  /window\.(location|open)/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<form/i,
  /base64,/i, // Embedded base64 payloads in documents
  /\\x[0-9a-f]{2}/i, // Hex-encoded payloads
  /powershell/i,
  /cmd\.exe/i,
  /\/bin\/sh/i,
  /wget\s+http/i,
  /curl\s+http/i,
];

export interface SecurityCheckResult {
  safe: boolean;
  error?: string;
  threat?: string;
}

/**
 * Sanitize filename — hapus karakter berbahaya
 */
export function sanitizeFilename(filename: string): string {
  // Remove null bytes
  let clean = filename.replace(/\0/g, '');
  // Remove path traversal
  clean = clean.replace(/\.\./g, '').replace(/[/\\]/g, '');
  // Remove Unicode homoglyphs and control characters
  clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // Keep only safe characters
  clean = clean.replace(/[^a-zA-Z0-9._\-() ]/g, '_');
  // Limit length
  return clean.substring(0, 200);
}

/**
 * Cek apakah file punya ekstensi ganda (misal: photo.jpg.exe)
 */
function hasDoubleExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  const parts = lower.split('.');
  if (parts.length <= 2) return false;

  // Cek apakah ada ekstensi berbahaya tersembunyi
  for (let i = 1; i < parts.length; i++) {
    const ext = '.' + parts[i];
    if (DANGEROUS_EXTENSIONS.includes(ext)) return true;
  }
  return false;
}

/**
 * Verifikasi tipe file berdasarkan magic bytes (bukan hanya ekstensi)
 */
function verifyMagicBytes(buffer: Buffer, expectedType: 'image' | 'document'): SecurityCheckResult {
  if (buffer.length < 8) {
    return { safe: false, error: 'File terlalu kecil atau kosong.', threat: 'empty_file' };
  }

  if (expectedType === 'image') {
    const isJpeg = matchBytes(buffer, MAGIC_SIGNATURES['image/jpeg']);
    const isPng = matchBytes(buffer, MAGIC_SIGNATURES['image/png']);
    const isWebp = matchBytes(buffer, MAGIC_SIGNATURES['image/webp']);

    if (!isJpeg && !isPng && !isWebp) {
      return {
        safe: false,
        error: 'File bukan gambar yang valid. File mungkin dipalsukan.',
        threat: 'fake_image',
      };
    }
  }

  if (expectedType === 'document') {
    const isPdf = matchBytes(buffer, MAGIC_SIGNATURES['application/pdf']);
    const isZip = matchBytes(buffer, MAGIC_SIGNATURES['application/zip']) ||
                  matchBytes(buffer, MAGIC_SIGNATURES['application/zip-empty']);
    const isOle2 = matchBytes(buffer, MAGIC_SIGNATURES['application/ole2']);

    if (!isPdf && !isZip && !isOle2) {
      return {
        safe: false,
        error: 'File bukan dokumen yang valid. File mungkin dipalsukan.',
        threat: 'fake_document',
      };
    }
  }

  return { safe: true };
}

function matchBytes(buffer: Buffer, signatures: { bytes: number[]; offset: number }[]): boolean {
  return signatures.some(sig => {
    if (buffer.length < sig.offset + sig.bytes.length) return false;
    return sig.bytes.every((byte, i) => buffer[sig.offset + i] === byte);
  });
}

/**
 * Scan konten teks dari dokumen untuk pattern berbahaya
 */
export function scanContentForThreats(text: string): SecurityCheckResult {
  for (const pattern of DANGEROUS_CONTENT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        error: 'Dokumen mengandung konten yang berpotensi berbahaya dan tidak dapat diproses.',
        threat: 'malicious_content',
      };
    }
  }
  return { safe: true };
}

/**
 * Validasi keamanan file secara menyeluruh (server-side)
 */
export function validateFileSecurity(
  filename: string,
  buffer: Buffer,
  fileType: 'image' | 'document'
): SecurityCheckResult {
  const cleanName = filename.toLowerCase();

  // 1. Cek ukuran file
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      safe: false,
      error: `Ukuran file terlalu besar (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Maksimal 2 MB.`,
      threat: 'oversized',
    };
  }

  // 2. Cek null bytes di nama file (serangan null byte injection)
  if (filename.includes('\0')) {
    return {
      safe: false,
      error: 'Nama file tidak valid.',
      threat: 'null_byte_injection',
    };
  }

  // 3. Cek ekstensi ganda (misal: file.jpg.exe)
  if (hasDoubleExtension(cleanName)) {
    return {
      safe: false,
      error: 'File memiliki ekstensi ganda yang mencurigakan.',
      threat: 'double_extension',
    };
  }

  // 4. Cek ekstensi berbahaya
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (cleanName.endsWith(ext)) {
      return {
        safe: false,
        error: `Tipe file ${ext} tidak diizinkan.`,
        threat: 'dangerous_extension',
      };
    }
  }

  // 5. Cek ekstensi yang diizinkan
  const hasAllowedExt = ALLOWED_EXTENSIONS.some(ext => cleanName.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      safe: false,
      error: 'Tipe file tidak didukung.',
      threat: 'unsupported_extension',
    };
  }

  // 6. Verifikasi magic bytes — pastikan isi file sesuai dengan ekstensi
  const magicCheck = verifyMagicBytes(buffer, fileType);
  if (!magicCheck.safe) {
    return magicCheck;
  }

  // 7. Cek apakah buffer mengandung executable signatures
  const executableSignatures = [
    [0x4D, 0x5A], // MZ — Windows executable
    [0x7F, 0x45, 0x4C, 0x46], // ELF — Linux executable
    [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O — macOS executable
  ];
  for (const sig of executableSignatures) {
    if (sig.every((byte, i) => buffer[i] === byte)) {
      return {
        safe: false,
        error: 'File terdeteksi sebagai program executable yang disamarkan.',
        threat: 'disguised_executable',
      };
    }
  }

  return { safe: true };
}
