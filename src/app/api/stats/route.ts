import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET — baca statistik pengunjung
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_visitor_stats');

    if (error) {
      console.error('Stats error:', error);
      return NextResponse.json({ totalVisitors: 0, onlineNow: 0, configured: false });
    }

    return NextResponse.json({
      totalVisitors: data?.totalVisitors || 0,
      onlineNow: data?.onlineNow || 0,
      configured: true,
    });
  } catch {
    return NextResponse.json({ totalVisitors: 0, onlineNow: 0, configured: false });
  }
}

// POST — catat kunjungan + heartbeat
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, action } = body;

    if (!visitorId) {
      return NextResponse.json({ success: false, reason: 'no_visitor_id' });
    }

    const userAgent = req.headers.get('user-agent') || '';

    if (action === 'visit') {
      // Register visit (upsert — baru atau tambah counter)
      const { error } = await supabaseAdmin.rpc('register_visit', {
        p_visitor_id: visitorId,
        p_user_agent: userAgent,
      });

      if (error) {
        console.error('Visit error:', error);
        return NextResponse.json({ success: false, reason: 'db_error' });
      }
    } else if (action === 'heartbeat') {
      // Update heartbeat timestamp
      const { error } = await supabaseAdmin.rpc('heartbeat', {
        p_visitor_id: visitorId,
      });

      if (error) {
        console.error('Heartbeat error:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, reason: 'error' });
  }
}
