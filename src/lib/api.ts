import { SYSTEM_PROMPT, API_CONFIG } from './constants';
import { APIMessage, APIMessageContent, Message, ImageAttachment } from './types';

function buildMessages(messages: Message[]): APIMessage[] {
  const apiMessages: APIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  for (const msg of messages) {
    if (msg.role === 'system') continue;
    
    if (msg.role === 'user' && msg.images && msg.images.length > 0) {
      const contentParts: APIMessageContent[] = [];
      
      if (msg.content) {
        contentParts.push({ type: 'text', text: msg.content });
      }
      
      for (const img of msg.images) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: img.base64.startsWith('data:') ? img.base64 : `data:${img.type};base64,${img.base64}`, detail: 'auto' },
        });
      }
      
      apiMessages.push({ role: 'user', content: contentParts });
    } else if (msg.role === 'user' && msg.audioTranscript) {
      const text = msg.content 
        ? `${msg.content}\n\n[Transkripsi suara]: ${msg.audioTranscript}`
        : `[Transkripsi suara]: ${msg.audioTranscript}`;
      apiMessages.push({ role: 'user', content: text });
    } else {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  return apiMessages;
}

export async function* streamChat(
  messages: Message[],
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  // Hanya kirim 6 pesan terakhir untuk konteks (hemat token, lebih cepat)
  const recentMessages = messages.slice(-6);
  const apiMessages = buildMessages(recentMessages);

  // Dynamic max_tokens berdasarkan panjang pesan terakhir
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  const inputLength = lastUserMsg?.content?.length || 0;
  const hasImages = lastUserMsg?.images && lastUserMsg.images.length > 0;
  const hasDocContent = lastUserMsg?.content?.includes('[Isi dokumen');

  let maxTokens: number;
  if (hasDocContent) {
    maxTokens = 2048; // Dokumen butuh jawaban panjang
  } else if (hasImages) {
    maxTokens = 1024; // Gambar butuh deskripsi
  } else if (inputLength <= 30) {
    maxTokens = 256;  // Sapaan/pertanyaan singkat
  } else if (inputLength <= 100) {
    maxTokens = 512;  // Pertanyaan pendek
  } else if (inputLength <= 300) {
    maxTokens = 1024; // Pertanyaan sedang
  } else {
    maxTokens = 2048; // Pertanyaan panjang/kompleks
  }

  const response = await fetch(`${API_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      messages: apiMessages,
      stream: true,
      temperature: 0.6,
      max_tokens: maxTokens,
    }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('API Key tidak valid. Pastikan API Key sudah benar di pengaturan.');
    } else if (response.status === 429) {
      throw new Error('Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi ya! ⏳');
    } else if (response.status === 500) {
      throw new Error('Server AI sedang bermasalah. Coba lagi nanti ya! 🔧');
    } else if (response.status === 503) {
      throw new Error('Server AI sedang sibuk. Coba lagi dalam beberapa saat. 🔄');
    } else {
      throw new Error(`Terjadi kesalahan (${response.status}). Coba lagi nanti.`);
    }
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'id');

  const response = await fetch(`${API_CONFIG.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_CONFIG.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed (${response.status})`);
  }

  const result = await response.json();
  return result.text || '';
}
