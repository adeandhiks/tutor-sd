import { SYSTEM_PROMPT, API_CONFIG } from './constants';
import { APIMessage, APIMessageContent, Message } from './types';

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
  // Kirim 10 pesan terakhir untuk konteks
  const recentMessages = messages.slice(-10);
  const apiMessages = buildMessages(recentMessages);

  // Timeout 15 detik — jika server tidak merespons, langsung error
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  // Gabungkan signal user (tombol stop) dengan timeout
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
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
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: combinedSignal,
    });

    clearTimeout(timeout); // Server merespons, cancel timeout

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
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      // Cek apakah timeout atau user cancel
      if (signal?.aborted) {
        throw error; // User menekan tombol stop
      }
      throw new Error('Server AI terlalu lama merespons (>15 detik). Coba lagi ya! 🔄');
    }
    throw error;
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
