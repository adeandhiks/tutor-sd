// Text-to-Speech utility using Web Speech API

// Strip markdown formatting for cleaner speech
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')           // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')    // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/`(.+?)`/g, '$1')          // inline code
    .replace(/```[\s\S]*?```/g, '')     // code blocks
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/!\[.*?\]\(.+?\)/g, '')    // images
    .replace(/[-*+]\s/g, '')            // list markers
    .replace(/\d+\.\s/g, '')            // numbered lists
    .replace(/>\s/g, '')                // blockquotes
    .replace(/\n{2,}/g, '. ')           // double newlines to period
    .replace(/\n/g, ' ')               // newlines to space
    .replace(/\s{2,}/g, ' ')           // multiple spaces
    .trim();
}

// Detect language from text
function detectLanguage(text: string): string {
  // Check for Arabic script
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA';
  // Check for Sundanese keywords
  if (/\b(teh|mah|aya|naon|kumaha|henteu)\b/i.test(text)) return 'su-ID';
  // Check for English-heavy content
  const englishWords = text.match(/\b(the|is|are|was|were|have|has|do|does|will|would|can|could|what|how|why|this|that)\b/gi);
  if (englishWords && englishWords.length > 5) return 'en-US';
  // Default to Indonesian
  return 'id-ID';
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, lang?: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Stop any current speech
  stopSpeaking();

  const cleanText = stripMarkdown(text);
  if (!cleanText) return;

  // Limit text length for performance (max ~500 chars at a time)
  const maxChars = 500;
  const truncatedText = cleanText.length > maxChars 
    ? cleanText.substring(0, maxChars) + '...' 
    : cleanText;

  const utterance = new SpeechSynthesisUtterance(truncatedText);
  utterance.lang = lang || detectLanguage(cleanText);
  utterance.rate = 0.9;  // Slightly slower for kids
  utterance.pitch = 1.1; // Slightly higher pitch for friendly tone
  utterance.volume = 1;

  // Try to find a good voice for the language
  const voices = speechSynthesis.getVoices();
  const langPrefix = utterance.lang.split('-')[0];
  const matchingVoice = voices.find(v => v.lang.startsWith(langPrefix));
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return speechSynthesis.speaking;
}

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
