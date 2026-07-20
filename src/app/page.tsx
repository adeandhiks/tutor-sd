'use client';

import React, { useCallback, useState } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { DragDropOverlay } from '@/components/chat/DragDropOverlay';
import { ImageAttachment } from '@/lib/types';

export default function Home() {
  const [dragImages, setDragImages] = useState<ImageAttachment[]>([]);
  const [inputKey, setInputKey] = useState(0);

  const handleFileDrop = useCallback((images: ImageAttachment[]) => {
    setDragImages(images);
    setInputKey(prev => prev + 1);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0 h-full">
        <Header />

        <div className="flex-1 overflow-hidden relative">
          <ChatArea />
        </div>

        <div className="shrink-0">
          <ChatInput key={inputKey} droppedImages={dragImages} />
        </div>
      </div>

      <DragDropOverlay onFileDrop={handleFileDrop} />
    </div>
  );
}
