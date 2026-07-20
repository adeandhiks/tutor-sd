'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Square } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { ChatBubble } from './ChatBubble';
import { MessageActions } from './MessageActions';
import { WelcomeScreen } from './WelcomeScreen';

export function ChatArea() {
  const { activeConversation, isGenerating, stopGenerating } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages.filter(m => m.role !== 'system') || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (!activeConversation || messages.length === 0) {
    return (
      <div ref={scrollRef} className="h-full overflow-y-auto">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {messages.map((msg, idx) => {
          const isLastAssistant =
            msg.role === 'assistant' &&
            idx === messages.length - 1;

          return (
            <div key={msg.id} className="group">
              <ChatBubble message={msg} />
              <MessageActions message={msg} isLast={isLastAssistant} />
            </div>
          );
        })}

        {/* Stop Generating Button */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-4"
          >
            <button
              onClick={stopGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border hover:bg-surface-hover text-sm text-foreground shadow-lg transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Hentikan
            </button>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
