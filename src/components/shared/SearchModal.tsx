'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { formatDate, truncateText } from '@/lib/utils';
import { Conversation, Message } from '@/lib/types';

interface SearchResult {
  conversation: Conversation;
  matchedMessages: {
    message: Message;
    snippet: string;
  }[];
  titleMatch: boolean;
}

export function SearchModal() {
  const { conversations, setActiveConversation, setSidebarOpen } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search logic
  const results: SearchResult[] = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const q = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    for (const conv of conversations) {
      const titleMatch = conv.title.toLowerCase().includes(q);
      const matchedMessages: SearchResult['matchedMessages'] = [];

      for (const msg of conv.messages) {
        if (msg.role === 'system') continue;
        if (msg.content.toLowerCase().includes(q)) {
          // Create snippet around the match
          const idx = msg.content.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 40);
          const end = Math.min(msg.content.length, idx + query.length + 40);
          let snippet = msg.content.substring(start, end).replace(/\n/g, ' ');
          if (start > 0) snippet = '...' + snippet;
          if (end < msg.content.length) snippet = snippet + '...';
          
          matchedMessages.push({ message: msg, snippet });
        }
      }

      if (titleMatch || matchedMessages.length > 0) {
        searchResults.push({
          conversation: conv,
          matchedMessages: matchedMessages.slice(0, 3), // Max 3 message matches per conv
          titleMatch,
        });
      }
    }

    return searchResults.slice(0, 10); // Max 10 results
  }, [query, conversations]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex].conversation.id);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const el = resultsRef.current?.children[selectedIndex] as HTMLElement;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = (conversationId: string) => {
    setActiveConversation(conversationId);
    setSidebarOpen(false);
    setIsOpen(false);
  };

  // Highlight matching text
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <>
      {/* Trigger Button (in header or standalone) */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-muted-foreground text-sm transition-colors"
        title="Cari chat (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Cari chat...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-50"
            >
              <div className="bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Cari di semua chat..."
                    className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                    autoComplete="off"
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-surface-hover text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Results */}
                <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
                  {query.length < 2 ? (
                    <div className="px-4 py-8 text-center text-muted-foreground">
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Ketik minimal 2 huruf untuk mencari</p>
                      <p className="text-xs mt-1">Cari berdasarkan judul chat atau isi pesan</p>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="px-4 py-8 text-center text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;</p>
                      <p className="text-xs mt-1">Coba kata kunci lain</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {results.length} hasil ditemukan
                      </div>
                      {results.map((result, idx) => (
                        <button
                          key={result.conversation.id}
                          onClick={() => handleSelect(result.conversation.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border/50 last:border-b-0 ${
                            idx === selectedIndex ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                          }`}
                        >
                          {/* Conversation Title */}
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm font-medium text-foreground truncate">
                              {highlightMatch(result.conversation.title, query)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0 ml-auto" />
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center gap-1 ml-6 mb-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(result.conversation.updatedAt)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              · {result.conversation.messages.filter(m => m.role !== 'system').length} pesan
                            </span>
                          </div>

                          {/* Matched Message Snippets */}
                          {result.matchedMessages.length > 0 && (
                            <div className="ml-6 space-y-1 mt-1">
                              {result.matchedMessages.map((match, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="text-xs text-muted-foreground bg-background rounded-lg px-2.5 py-1.5 leading-relaxed"
                                >
                                  <span className={`inline-block w-4 h-4 text-[10px] rounded-full text-center leading-4 mr-1.5 ${
                                    match.message.role === 'user'
                                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                  }`}>
                                    {match.message.role === 'user' ? '👤' : '🤖'}
                                  </span>
                                  {highlightMatch(match.snippet, query)}
                                </div>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-border bg-background/50 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-surface border border-border font-mono">↑↓</kbd>
                    navigasi
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-surface border border-border font-mono">Enter</kbd>
                    buka
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-surface border border-border font-mono">Esc</kbd>
                    tutup
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
