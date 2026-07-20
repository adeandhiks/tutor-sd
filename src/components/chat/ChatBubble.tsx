'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const [showTime, setShowTime] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

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
          {/* Typing indicator */}
          {isAssistant && message.isStreaming && !message.content ? (
            <div className="flex items-center gap-1.5 py-1 px-1">
              <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
              <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
              <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
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
