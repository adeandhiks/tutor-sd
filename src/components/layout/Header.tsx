'use client';

import React from 'react';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { SearchModal } from '@/components/shared/SearchModal';
import { truncateText } from '@/lib/utils';

export function Header() {
  const { activeConversation, sidebarOpen, toggleSidebar } = useChat();

  const title = activeConversation
    ? truncateText(activeConversation.title, 30)
    : 'Cerdasik';

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border glass z-30">
      {/* Left: Toggle Sidebar */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
        title={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="w-5 h-5" />
        ) : (
          <PanelLeftOpen className="w-5 h-5" />
        )}
      </button>

      {/* Center: Title */}
      <h2 className="text-sm font-semibold text-foreground truncate px-4 hidden sm:block">
        {title}
      </h2>

      {/* Right: Search + Theme Toggle */}
      <div className="flex items-center gap-2">
        <SearchModal />
        <ThemeToggle />
      </div>
    </header>
  );
}
