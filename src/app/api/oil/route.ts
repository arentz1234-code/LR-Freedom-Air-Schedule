import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, run } from '@/lib/db';

export async function GET() {
  try {
    const oilLogs = await query<{
      id: number;
      user_id: number;
      date: string;
      quarts: number;
      hobbs_time: number;
      notes: string | null;
      user_name: string;
    }>(
      `SELECT o.*, u.name as user_name
       FROM oil_logs o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.date DESC`
    );

    return NextResponse.json(oilLogs);
  } catch (error) {
    console.error('Error fetching oil logs:', error);
    return NextResponse.json({ error: 'Failed to fetch oil logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { quarts, hobbsTime, notes } = await request.json();

    if (!quarts || !hobbsTime) {
      return NextResponse.json({ error: 'Quarts and Hobbs time are required' }, { status: 400 });
    }

    if (quarts <= 0 || quarts > 8) {
      return NextResponse.json({ error: 'Invalid quarts amount' }, { status: 400 });
    }

    const result = await run(
      'INSERT INTO oil_logs (user_id, date, quarts, hobbs_time, notes) VALUES (?, ?, ?, ?, ?)',
      [user.id, new Date().toISOString(), quarts, hobbsTime, notes || null]
    );

    return NextResponse.json({
      id: result.lastInsertRowid,
      user_id: user.id,
      quarts,
      hobbs_time: hobbsTime,
      notes,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding oil log:', error);
    return NextResponse.json({ error: 'Failed to add oil log' }, { status: 500 });
  }
}
