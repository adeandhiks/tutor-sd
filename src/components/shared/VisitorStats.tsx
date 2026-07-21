'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi, AlertCircle } from 'lucide-react';

// Generate or retrieve a persistent visitor ID
function getVisitorId(): string {
  const KEY = 'cerdasik_visitor_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

// Animated number counter
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;

    let startTime: number;
    let frame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDisplayed(Math.floor(start + diff * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{displayed.toLocaleString('id-ID')}</>;
}

export function VisitorStats() {
  const [stats, setStats] = useState({ totalVisitors: 0, onlineNow: 0 });
  const [configured, setConfigured] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats({ totalVisitors: data.totalVisitors || 0, onlineNow: data.onlineNow || 0 });
      setConfigured(data.configured !== false);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  };

  // Send heartbeat to track online presence
  const sendHeartbeat = async (action: 'visit' | 'heartbeat') => {
    try {
      const visitorId = getVisitorId();
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, action }),
      });
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    // Initial visit registration + fetch stats
    sendHeartbeat('visit').then(() => fetchStats());

    // Heartbeat every 60 seconds to maintain online presence
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat('heartbeat');
    }, 60000);

    // Refresh stats every 30 seconds
    const statsInterval = setInterval(() => {
      fetchStats();
    }, 30000);

    // Send leave signal on page close
    const handleBeforeUnload = () => {
      const visitorId = getVisitorId();
      navigator.sendBeacon('/api/stats', JSON.stringify({ visitorId, action: 'leave' }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(statsInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (!loaded) return null;

  // If Upstash is not configured, show setup hint
  if (!configured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mt-4 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs"
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>Statistik pengunjung belum aktif. Setup Upstash Redis untuk mengaktifkan.</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex items-center justify-center gap-4 sm:gap-6 mt-4"
    >
      {/* Total Visitors */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface/80 border border-border backdrop-blur-sm">
        <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-left">
          <div className="text-base font-bold text-foreground leading-tight">
            <AnimatedNumber value={stats.totalVisitors} />
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
