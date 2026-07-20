'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { SendHorizonal, ImagePlus, Mic, MicOff, X, Square, Camera } from 'lucide-react';
import { CameraModal } from './CameraModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/context/ChatContext';
import { ImageAttachment } from '@/lib/types';
import { generateId, fileToBase64, validateImageFile } from '@/lib/utils';
import { toast } from '@/components/shared/Toast';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ChatInputProps {
  droppedImages?: ImageAttachment[];
}

export function ChatInput({ droppedImages }: ChatInputProps) {
  const { sendMessage, isGenerating, stopGenerating } = useChat();
  const [text, setText] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Handle dropped images from DragDrop
  useEffect(() => {
    if (droppedImages && droppedImages.length > 0) {
      setImages(prev => [...prev, ...droppedImages]);
    }
  }, [droppedImages]);

  const handleSubmit = useCallback(async () => {
    if ((!text.trim() && images.length === 0) || isGenerating) return;

    const currentText = text;
    const currentImages = images.length > 0 ? [...images] : undefined;

    setText('');
    setImages([]);

    await sendMessage(currentText, currentImages);
  }, [text, images, isGenerating, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast(validation.error || 'File tidak valid', 'error');
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        const attachment: ImageAttachment = {
          id: generateId(),
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
          base64,
        };
        setImages(prev => [...prev, attachment]);
      } catch {
        toast('Gagal memuat gambar', 'error');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleImageUpload(e.target.files);
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleImageUpload(imageFiles);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // ==========================================
  // Voice Recording using Web Speech API
  // ==========================================
  const getSpeechRecognition = (): SpeechRecognition | null => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;
    return new SpeechRecognitionAPI();
  };

  const startRecording = () => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      toast('Browser tidak mendukung pengenalan suara. Gunakan Chrome atau Edge.', 'error');
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'id-ID'; // Bahasa Indonesia

    finalTranscriptRef.current = '';
    setLiveTranscript('');

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      toast('Mulai merekam... Silakan berbicara 🎤', 'info');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
      }

      // Show live transcript (final + interim)
      setLiveTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        toast('Tidak terdeteksi suara. Coba bicara lebih dekat ke mikrofon.', 'error');
      } else if (event.error === 'not-allowed') {
        toast('Akses mikrofon ditolak. Izinkan akses mikrofon di browser.', 'error');
      } else if (event.error === 'network') {
        toast('Koneksi internet diperlukan untuk pengenalan suara.', 'error');
      } else {
        toast('Terjadi kesalahan saat merekam suara.', 'error');
      }

      cleanupRecording();
    };

    recognition.onend = () => {
      // Recognition ended (either by user or automatically)
      const transcript = finalTranscriptRef.current.trim();
      
      cleanupRecording();

      if (transcript) {
        // Auto-send the transcribed text
        sendMessage(transcript, undefined, transcript);
        toast('Suara berhasil dikenali! 🎤', 'success');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      toast('Gagal memulai pengenalan suara.', 'error');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const cleanupRecording = () => {
    setIsRecording(false);
    setLiveTranscript('');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recognitionRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Image Previews */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 mb-3 overflow-x-auto pb-2"
            >
              {images.map((img) => (
                <div key={img.id} className="relative shrink-0 group">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-16 h-16 object-cover rounded-xl border border-border"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Indicator with Live Transcript */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Merekam... {formatTime(recordingTime)}
                </span>
                <button
                  onClick={stopRecording}
                  className="ml-auto px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Selesai
                </button>
              </div>
              {/* Live Transcript Preview */}
              {liveTranscript && (
                <div className="px-4 py-2 border-t border-red-200 dark:border-red-800 bg-red-25 dark:bg-red-950/20">
                  <p className="text-xs text-muted-foreground mb-1">💬 Hasil pengenalan:</p>
                  <p className="text-sm text-foreground italic">&ldquo;{liveTranscript}&rdquo;</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-end gap-2 bg-input-bg border border-input-border rounded-2xl px-4 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          {/* Image Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors mb-0.5"
            title="Upload gambar"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Camera Capture */}
          <button
            onClick={() => setShowCamera(true)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors mb-0.5"
            title="Ambil foto dari kamera"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Voice Record */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`shrink-0 p-1.5 rounded-lg transition-colors mb-0.5 ${
              isRecording
                ? 'bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse'
                : 'hover:bg-surface-hover text-muted-foreground hover:text-foreground'
            }`}
            title={isRecording ? 'Hentikan rekaman' : 'Rekam suara'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <TextareaAutosize
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pertanyaanmu di sini... 📝"
            className="flex-1 bg-transparent text-foreground text-sm resize-none outline-none placeholder:text-muted-foreground min-h-[36px] max-h-[150px] py-2"
            maxRows={6}
            disabled={isRecording}
          />

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              onClick={stopGenerating}
              className="shrink-0 p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors mb-0.5"
              title="Hentikan"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!text.trim() && images.length === 0}
              className="shrink-0 p-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
              title="Kirim"
            >
              <SendHorizonal className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Cerdasik — Belajar jadi mudah, pintar jadi seru! 🎓
        </p>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <CameraModal
            onCapture={(image) => {
              setImages(prev => [...prev, image]);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
