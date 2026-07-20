'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Trash2, Pencil, Check, FileText, FileDown, Sun, Moon, MessageSquare } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { formatDate, truncateText } from '@/lib/utils';
import { exportToMarkdown, exportToPDF } from '@/lib/export-utils';
import { Conversation } from '@/lib/types';

export function Sidebar() {
  const {
    filteredConversations, activeConversationId, sidebarOpen,
    createNewChat, setActiveConversation, deleteConversation,
    renameConversation, toggleSidebar, setSidebarOpen, searchQuery, setSearchQuery,
  } = useChat();
  const { theme, toggleTheme } = useTheme();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Group conversations by time
  const grouped = groupConversations(filteredConversations);

  const handleSelectChat = (id: string) => {
    setActiveConversation(id);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              🎓 AI Tutor SD
            </span>
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={createNewChat}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Chat Baru"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-surface-hover text-muted-foreground md:hidden transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari chat..."
            className="w-full pl-9 pr-3 py-2 bg-input-bg border border-input-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Belum ada chat</p>
          </div>
        ) : (
          Object.entries(grouped).map(([label, convos]) => {
            if (convos.length === 0) return null;
            return (
              <div key={label} className="mb-2">
                <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {label}
                </div>
                {convos.map((conv) => (
                  <ChatItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={() => handleSelectChat(conv.id)}
                    onDelete={() => deleteConversation(conv.id)}
                    onRename={(title) => renameConversation(conv.id, title)}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-sidebar-foreground"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          <span className="text-sm">{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block shrink-0 h-full border-r border-border overflow-hidden"
          >
            <div className="w-[280px] h-full">{sidebarContent}</div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Chat Item Component ---
function ChatItem({ conversation, isActive, onSelect, onDelete, onRename }: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (confirmDelete) {
      const t = setTimeout(() => setConfirmDelete(false), 3000);
      return () => clearTimeout(t);
    }
  }, [confirmDelete]);

  const handleSaveRename = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div
      className={`group relative mx-2 rounded-xl cursor-pointer transition-colors ${
        isActive
          ? 'bg-primary/10 border-l-2 border-primary'
          : 'hover:bg-sidebar-hover'
      }`}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 px-3 py-2.5">
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setIsEditing(false); }}
            onBlur={handleSaveRename}
            className="flex-1 bg-input-bg border border-input-border rounded-lg px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
          />
          <button onClick={handleSaveRename} className="p-1 text-green-500"><Check className="w-4 h-4" /></button>
        </div>
      ) : (
        <div onClick={onSelect} className="px-3 py-2.5">
          <div className="text-sm text-sidebar-foreground truncate pr-16">
            {truncateText(conversation.title, 30)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {formatDate(conversation.updatedAt)}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isEditing && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditTitle(conversation.title); }}
            className="p-1 rounded hover:bg-surface-hover text-muted-foreground"
            title="Ubah nama"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowExport(!showExport); }}
            className="p-1 rounded hover:bg-surface-hover text-muted-foreground"
            title="Ekspor"
          >
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className={`p-1 rounded transition-colors ${confirmDelete ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'hover:bg-surface-hover text-muted-foreground'}`}
            title={confirmDelete ? 'Klik lagi untuk hapus' : 'Hapus'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Export Dropdown */}
      <AnimatePresence>
        {showExport && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute right-2 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg z-20 py-1 min-w-[140px]"
          >
            <button
              onClick={(e) => { e.stopPropagation(); exportToMarkdown(conversation); setShowExport(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
            >
              <FileText className="w-4 h-4" /> Markdown
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); exportToPDF(conversation); setShowExport(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-hover"
            >
              <FileDown className="w-4 h-4" /> PDF
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helper: Group by time ---
function groupConversations(conversations: Conversation[]) {
  const now = Date.now();
  const day = 86400000;
  const groups: Record<string, Conversation[]> = {
    'Hari Ini': [],
    'Kemarin': [],
    '7 Hari Lalu': [],
    'Lebih Lama': [],
  };

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  for (const conv of sorted) {
    const diff = now - conv.updatedAt;
    if (diff < day) groups['Hari Ini'].push(conv);
    else if (diff < day * 2) groups['Kemarin'].push(conv);
    else if (diff < day * 7) groups['7 Hari Lalu'].push(conv);
    else groups['Lebih Lama'].push(conv);
  }

  return groups;
}
