import { NextRequest, NextResponse } from 'next/server';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command: string[]) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  
  try {
    const res = await fetch(`${UPSTASH_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    const data = await res.json();
    return data.result;
  } catch {
    return null;
  }
}

async function pipeline(commands: string[][]) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// GET — read stats
export async function GET() {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return NextResponse.json({ totalVisitors: 0, onlineNow: 0, configured: false });
  }

  try {
    const results = await pipeline([
      ['GET', 'cerdasik:total_visitors'],
      ['SCARD', 'cerdasik:online_users'],
    ]);

    const totalVisitors = parseInt(results?.[0]?.result || '0', 10);
    const onlineNow = parseInt(results?.[1]?.result || '0', 10);

    return NextResponse.json({ totalVisitors, onlineNow, configured: true });
  } catch {
    return NextResponse.json({ totalVisitors: 0, onlineNow: 0, configured: true });
  }
}

// POST — register visit + heartbeat
export async function POST(req: NextRequest) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return NextResponse.json({ success: false, reason: 'not_configured' });
  }

  try {
    const body = await req.json();
    const { visitorId, action } = body;

    if (!visitorId) {
      return NextResponse.json({ success: false, reason: 'no_visitor_id' });
    }

    if (action === 'visit') {
      // Check if this visitor has been counted before (within 24h)
      const alreadyCounted = await redis(['GET', `cerdasik:visitor:${visitorId}`]);
      
      if (!alreadyCounted) {
        // New unique visitor — increment total and mark as counted (24h TTL)
        await pipeline([
          ['INCR', 'cerdasik:total_visitors'],
          ['SET', `cerdasik:visitor:${visitorId}`, '1', 'EX', '86400'],
        ]);
      }
    }

    // Heartbeat — add to online set with 90s expiry
    const heartbeatKey = `cerdasik:heartbeat:${visitorId}`;
    await pipeline([
      ['SET', heartbeatKey, '1', 'EX', '90'],
      ['SADD', 'cerdasik:online_users', visitorId],
    ]);

    // Cleanup: remove expired users from online set
    // Get all online members and check their heartbeat
    const onlineMembers = await redis(['SMEMBERS', 'cerdasik:online_users']);
    if (Array.isArray(onlineMembers)) {
      for (const member of onlineMembers) {
        const isAlive = await redis(['EXISTS', `cerdasik:heartbeat:${member}`]);
        if (!isAlive) {
          await redis(['SREM', 'cerdasik:online_users', member]);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, reason: 'error' });
  }
}
