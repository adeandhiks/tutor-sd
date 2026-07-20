'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, SwitchCamera, FlipHorizontal } from 'lucide-react';
import { ImageAttachment } from '@/lib/types';
import { generateId, fileToBase64 } from '@/lib/utils';
import { toast } from '@/components/shared/Toast';

interface CameraModalProps {
  onCapture: (image: ImageAttachment) => void;
  onClose: () => void;
}

export function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isReady, setIsReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    // Stop previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.', 'error');
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    setIsReady(false);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
  };

  const confirmCapture = () => {
    if (!capturedImage) return;

    const attachment: ImageAttachment = {
      id: generateId(),
      url: capturedImage,
      name: `kamera_${Date.now()}.jpg`,
      type: 'image/jpeg',
      base64: capturedImage,
    };

    onCapture(attachment);
    toast('Foto berhasil diambil! 📸', 'success');
    handleClose();
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-white text-sm font-medium">📸 Ambil Foto</span>
        <button
          onClick={switchCamera}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          title="Ganti kamera"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>
      </div>

      {/* Camera View / Captured Image */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`max-w-full max-h-full object-contain ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-white text-sm">Memuat kamera...</span>
                </div>
              </div>
            )}
            {/* Camera guide overlay */}
            {isReady && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-white/20 rounded-2xl" />
                <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
                <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
                <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
                <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="px-4 py-6 bg-black/80">
        {capturedImage ? (
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={retake}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <FlipHorizontal className="w-6 h-6" />
              </div>
              <span className="text-xs">Ulangi</span>
            </button>
            <button
              onClick={confirmCapture}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs">Gunakan</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={!isReady}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90"
              title="Ambil foto"
            >
              <div className="w-14 h-14 rounded-full bg-white hover:bg-gray-200 transition-colors" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
