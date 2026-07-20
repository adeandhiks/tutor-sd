'use client';

import React, { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { Message } from '@/lib/types';
import { useChat } from '@/context/ChatContext';
import { toast } from '@/components/shared/Toast';

interface MessageActionsProps {
  message: Message;
  isLast: boolean;
}

export function MessageActions({ message, isLast }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const { regenerateLastResponse, isGenerating } = useChat();

  if (message.role !== 'assistant' || message.isStreaming) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast('Jawaban disalin! 📋', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Gagal menyalin', 'error');
    }
  };

  const handleRegenerate = () => {
    if (!isGenerating) {
      regenerateLastResponse();
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1 ml-11 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors text-xs"
        title="Salin jawaban"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        <span className="md:hidden">{copied ? 'Disalin!' : 'Salin'}</span>
      </button>

      {isLast && !isGenerating && (
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors text-xs"
          title="Buat ulang jawaban"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="md:hidden">Ulangi</span>
        </button>
      )}
    </div>
  );
}
