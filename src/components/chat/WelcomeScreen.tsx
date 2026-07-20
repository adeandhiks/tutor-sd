'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SUBJECTS } from '@/lib/constants';
import { useChat } from '@/context/ChatContext';
import { Sparkles } from 'lucide-react';

export function WelcomeScreen() {
  const { sendMessage } = useChat();

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
          className="text-6xl mb-4"
        >
          🎓
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 font-[var(--font-heading)]">
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Halo! Aku Asisten Belajarmu
          </span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
          Tanyakan apa saja tentang pelajaran sekolah! 📚
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Klik salah satu mata pelajaran untuk mulai</span>
        </div>
      </motion.div>

      {/* Subject Cards Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } },
        }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl w-full"
      >
        {SUBJECTS.map((subject) => (
          <motion.button
            key={subject.id}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => sendMessage(subject.examples[0])}
            className={`relative group p-4 rounded-2xl bg-gradient-to-br ${subject.gradient} text-white shadow-lg hover:shadow-xl transition-shadow overflow-hidden`}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-2xl" />
            
            <div className="relative z-10">
              <div className="text-3xl mb-2">{subject.icon}</div>
              <div className="font-semibold text-sm mb-1">{subject.name}</div>
              <div className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                &ldquo;{subject.examples[0]}&rdquo;
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
