'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { VisitorStats } from '@/components/shared/VisitorStats';

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4"
        >
          <img src="/logo.png" alt="Cerdasik" className="w-20 h-20 mx-auto rounded-2xl shadow-lg" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Cerdasik
          </span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
          Belajar jadi mudah, pintar jadi seru! 📚
        </p>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Ketik pertanyaanmu di bawah untuk mulai belajar ✨
        </p>
      </motion.div>

      {/* Visitor Stats */}
      <VisitorStats />

      {/* Developer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-6 text-center text-xs text-muted-foreground"
      >
        <p>
          Pengembang:{' '}
          <span className="font-medium text-foreground/70">Adam Puspabhuana</span>
        </p>
        <p className="mt-1">
          Website:{' '}
          <a
            href="https://adambhuana.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            adambhuana.my.id
          </a>
        </p>
      </motion.div>
    </div>
  );
}
