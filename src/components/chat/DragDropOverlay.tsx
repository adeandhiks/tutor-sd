'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload } from 'lucide-react';
import { ImageAttachment } from '@/lib/types';
import { generateId, fileToBase64, validateImageFile } from '@/lib/utils';
import { toast } from '@/components/shared/Toast';

interface DragDropOverlayProps {
  onFileDrop: (images: ImageAttachment[]) => void;
}

export function DragDropOverlay({ onFileDrop }: DragDropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = React.useRef(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imageAttachments: ImageAttachment[] = [];

    for (const file of Array.from(files)) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast(validation.error || 'File tidak didukung', 'error');
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        imageAttachments.push({
          id: generateId(),
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
          base64,
        });
      } catch {
        toast('Gagal memuat file', 'error');
      }
    }

    if (imageAttachments.length > 0) {
      onFileDrop(imageAttachments);
      toast(`${imageAttachments.length} gambar ditambahkan 📎`, 'success');
    }
  }, [onFileDrop]);

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="drag-overlay"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-surface shadow-2xl border-2 border-dashed border-primary"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Lepaskan file di sini</p>
              <p className="text-sm text-muted-foreground mt-1">Gambar (JPG, PNG, WEBP)</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
