'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Clock, Zap } from 'lucide-react';

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
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const elapsed = useStreamTimer(message.isStreaming, message.streamStartTime);

  if (message.role === 'system') return null;

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
        {showTime && (
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
