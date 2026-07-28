'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useChat } from '@/context/ChatContext';
import { Clock, Zap, Pencil, Check, X } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
}

// Live timer hook for streaming
function useStreamTimer(isStreaming?: boolean, startTime?: number) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isStreaming || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 100) / 10);
    }, 100);

    return () => clearInterval(interval);
  }, [isStreaming, startTime]);

  return elapsed;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const [showTime, setShowTime] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const { editMessage, isGenerating } = useChat();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const elapsed = useStreamTimer(message.isStreaming, message.streamStartTime);

  if (message.role === 'system') return null;

  const handleStartEdit = () => {
    setEditText(message.content);
    setIsEditing(true);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    editMessage(message.id, trimmed);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: isUser ? 10 : -10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      {/* AI Avatar */}
      {isAssistant && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-md mt-1">
          🤖
        </div>
      )}

      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'order-first' : ''}`}>
        {/* Image previews */}
        {message.images && message.images.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {message.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt={img.name}
                className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-border shadow-sm"
              />
            ))}
          </div>
        )}

        {/* Audio transcript badge */}
        {message.audioTranscript && (
          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
              🎙️ Transkripsi suara
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`
            px-4 py-3 rounded-2xl
            ${isUser
              ? 'bg-user-bubble text-user-bubble-foreground rounded-br-sm'
              : message.isError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                : 'bg-ai-bubble text-ai-bubble-foreground rounded-bl-sm shadow-sm border border-border'
            }
          `}
        >
          {/* Typing indicator with live timer */}
          {isAssistant && message.isStreaming && !message.content ? (
            <div className="flex items-center gap-3 py-1 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
                <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
                <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {elapsed.toFixed(1)}s
              </span>
            </div>
          ) : isUser && isEditing ? (
            /* Inline edit mode */
            <div className="min-w-[200px]">
              <textarea
                ref={editRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm leading-relaxed resize-none outline-none min-h-[40px] text-user-bubble-foreground placeholder:text-user-bubble-foreground/50"
                rows={Math.min(editText.split('\n').length + 1, 6)}
              />
              <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-white/20">
                <button
                  onClick={handleSaveEdit}
                  className="p-1 rounded-md hover:bg-white/20 transition-colors"
                  title="Simpan (Enter)"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 rounded-md hover:bg-white/20 transition-colors"
                  title="Batal (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="markdown-content text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />
              )}
            </div>
          )}
        </div>

        {/* Edit button for user messages */}
        {isUser && !isEditing && !isGenerating && (
          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mt-1`}>
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted"
              title="Edit pesan"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
        )}

        {/* Streaming timer (while content is flowing) */}
        {isAssistant && message.isStreaming && message.content && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1 mt-1 ml-1 text-[10px] text-muted-foreground"
          >
            <Clock className="w-3 h-3 animate-pulse" />
            <span>Menjawab... {elapsed.toFixed(1)}s</span>
          </motion.div>
        )}

        {/* Completed duration badge */}
        {isAssistant && !message.isStreaming && message.streamDuration != null && message.content && !message.isError && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 mt-1 ml-1 text-[10px] text-muted-foreground"
          >
            <Zap className={`w-3 h-3 ${message.streamDuration <= 10 ? 'text-green-500' : 'text-amber-500'}`} />
            <span>
              Selesai dalam {message.streamDuration}s
              {message.streamDuration <= 5 && ' ⚡'}
              {message.streamDuration > 5 && message.streamDuration <= 10 && ' ✅'}
              {message.streamDuration > 10 && ' 🐢'}
            </span>
          </motion.div>
        )}

        {/* Timestamp */}
        {showTime && !isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-[10px] text-muted-foreground mt-1 ${isUser ? 'text-right' : 'text-left'}`}
          >
            {formatDate(message.timestamp)}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
