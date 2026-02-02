import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, run } from '@/lib/db';

export async function GET() {
  try {
    const maintenance = await query<{
      id: number;
      start_time: string;
      end_time: string;
      description: string;
    }>('SELECT * FROM maintenance ORDER BY start_time DESC');

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
    }

    const { startTime, endTime, description } = await request.json();

    if (!startTime || !endTime || !description) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Check for overlapping bookings
    const overlappingBookings = await query<{ id: number }>(
      `SELECT id FROM bookings
       WHERE start_time < ? AND end_time > ?`,
      [endTime, startTime]
    );

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Maintenance conflicts with existing bookings' },
        { status: 409 }
      );
    }

    const result = await run(
      'INSERT INTO maintenance (start_time, end_time, description) VALUES (?, ?, ?)',
      [startTime, endTime, description]
    );

    return NextResponse.json({
      id: result.lastInsertRowid,
      start_time: startTime,
      end_time: endTime,
      description,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance:', error);
    return NextResponse.json({ error: 'Failed to schedule maintenance' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Maintenance ID required' }, { status: 400 });
    }

    await run('DELETE FROM maintenance WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance:', error);
    return NextResponse.json({ error: 'Failed to delete maintenance' }, { status: 500 });
  }
}
