import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file terlalu besar. Maksimal 2 MB, file Anda ${(file.size / 1024 / 1024).toFixed(1)} MB.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let text = '';

    // --- PDF ---
    if (fileName.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text || '';
    }
    // --- DOCX ---
    else if (fileName.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    }
    // --- DOC (old Word) ---
    else if (fileName.endsWith('.doc')) {
      // Basic extraction — old .doc is complex, extract readable text
      text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length < 10) {
        return NextResponse.json(
          { error: 'Format .doc lama tidak didukung sepenuhnya. Gunakan .docx.' },
          { status: 400 }
        );
      }
    }
    // --- XLSX / XLS ---
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheets: string[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
        }
      }
      text = sheets.join('\n\n');
    }
    // --- PPTX ---
    else if (fileName.endsWith('.pptx')) {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(buffer);
      const slides: string[] = [];

      // Extract text from slide XML files
      const slideFiles = Object.keys(zip.files)
        .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
        .sort();

      for (const slideName of slideFiles) {
        const xml = await zip.files[slideName].async('string');
        // Extract text from <a:t> tags
        const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
        if (textMatches) {
          const slideText = textMatches
            .map(m => m.replace(/<[^>]*>/g, ''))
            .join(' ');
          if (slideText.trim()) {
            const slideNum = slideName.match(/slide(\d+)/)?.[1] || '?';
            slides.push(`--- Slide ${slideNum} ---\n${slideText.trim()}`);
          }
        }
      }
      text = slides.join('\n\n');
    }
    // --- PPT (old) ---
    else if (fileName.endsWith('.ppt')) {
      return NextResponse.json(
        { error: 'Format .ppt lama tidak didukung. Gunakan .pptx.' },
        { status: 400 }
      );
    }
    else {
      return NextResponse.json(
        { error: 'Format file tidak didukung.' },
        { status: 400 }
      );
    }

    // Trim if too long (max ~8000 chars to not overwhelm the AI)
    const maxChars = 8000;
    let truncated = false;
    if (text.length > maxChars) {
      text = text.substring(0, maxChars);
      truncated = true;
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Tidak dapat mengekstrak teks dari file. File mungkin kosong atau berisi gambar saja.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: text.trim(),
      fileName: file.name,
      fileSize: file.size,
      truncated,
      charCount: text.trim().length,
    });
  } catch (err) {
    console.error('Parse error:', err);
    return NextResponse.json(
      { error: 'Gagal membaca file. Pastikan file tidak rusak.' },
      { status: 500 }
    );
  }
}
