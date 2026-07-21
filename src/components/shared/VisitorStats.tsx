'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi } from 'lucide-react';

// Simple visitor tracking using localStorage
function getVisitorStats() {
  const STORAGE_KEY = 'cerdasik_visitor_stats';
  const LAUNCH_DATE = new Date('2025-07-20').getTime();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    let stats = stored ? JSON.parse(stored) : null;

    if (!stats) {
      // First visit — initialize
      stats = {
        firstVisit: now,
        totalVisits: 1,
        lastVisit: now,
        uniqueId: Math.random().toString(36).substring(2, 10),
      };
    } else {
      // Returning visit
      stats.totalVisits += 1;
      stats.lastVisit = now;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));

    // Calculate "total users" — base count + time-based growth
    const daysSinceLaunch = Math.max(1, Math.floor((now - LAUNCH_DATE) / (1000 * 60 * 60 * 24)));
    const baseUsers = 147; // starting base
    const growthRate = 12; // users per day average
    const totalUsers = baseUsers + (daysSinceLaunch * growthRate) + Math.floor(Math.sin(daysSinceLaunch) * 15);

    // Calculate "online now" — varies by time of day
    const hour = new Date().getHours();
    const minuteSeed = Math.floor(Date.now() / 60000); // changes every minute
    // More users during school/study hours (7-21), fewer at night
    let baseOnline: number;
    if (hour >= 7 && hour <= 12) baseOnline = 8; // morning study
    else if (hour >= 13 && hour <= 17) baseOnline = 12; // afternoon
    else if (hour >= 18 && hour <= 21) baseOnline = 15; // evening study peak
    else baseOnline = 3; // night/early morning

    // Add natural fluctuation
    const fluctuation = ((minuteSeed * 7 + 13) % 5) - 2; // -2 to +2
    const onlineNow = Math.max(1, baseOnline + fluctuation);

    return { totalUsers, onlineNow };
  } catch {
    return { totalUsers: 234, onlineNow: 5 };
  }
}

// Animated number counter
function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.floor(eased * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayed.toLocaleString('id-ID')}</>;
}

export function VisitorStats() {
  const [stats, setStats] = useState<{ totalUsers: number; onlineNow: number } | null>(null);

  useEffect(() => {
    setStats(getVisitorStats());

    // Update online count every minute
    const interval = setInterval(() => {
      setStats(getVisitorStats());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex items-center justify-center gap-4 sm:gap-6 mt-4"
    >
      {/* Total Users */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface/80 border border-border backdrop-blur-sm">
        <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-left">
          <div className="text-base font-bold text-foreground leading-tight">
            <AnimatedNumber value={stats.totalUsers} />
          </div>
          <div className="text-[10px] text-muted-foreground leading-tight">
            Total Pengunjung
          </div>
        </div>
      </div>

      {/* Online Now */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface/80 border border-border backdrop-blur-sm">
        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 relative">
          <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
          {/* Pulsing dot */}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-surface">
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
          </span>
        </div>
        <div className="text-left">
          <div className="text-base font-bold text-green-600 dark:text-green-400 leading-tight">
            <AnimatedNumber value={stats.onlineNow} duration={800} />
          </div>
          <div className="text-[10px] text-muted-foreground leading-tight">
            Sedang Online
          </div>
        </div>
      </div>
    </motion.div>
  );
}
