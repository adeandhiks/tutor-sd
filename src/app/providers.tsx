'use client';

import React from 'react';
import { ChatProvider } from '@/context/ChatContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </ThemeProvider>
  );
}
