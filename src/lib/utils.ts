import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateChatTitle(firstMessage: string): string {
  const cleaned = firstMessage.replace(/[\n\r]/g, ' ').trim();
  return truncateText(cleaned, 40);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!acceptedTypes.includes(file.type)) {
    return { valid: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'Ukuran file terlalu besar. Maksimal 20MB.' };
  }
  return { valid: true };
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const acceptedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
  const maxSize = 20 * 1024 * 1024; // 20MB

  if (!acceptedTypes.includes(file.type)) {
    return { valid: false, error: 'Format audio tidak didukung. Gunakan MP3, WAV, M4A, atau OGG.' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'Ukuran file terlalu besar. Maksimal 20MB.' };
  }
  return { valid: true };
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
