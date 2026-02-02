import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, run, get } from '@/lib/db';

interface Booking {
  id: number;
  start_time: string;
  end_time: string;
}

interface Maintenance {
  id: number;
  start_time: string;
  end_time: string;
}

export async function GET() {
  try {
    const bookings = await query<{
      id: number;
      user_id: number;
      start_time: string;
      end_time: string;
      notes: string | null;
      destination: string | null;
      user_name: string;
      user_color: string;
    }>(
      `SELECT b.*, u.name as user_name, u.color as user_color
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.start_time`
    );

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { startTime, endTime, notes, destination } = await request.json();

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check for overlapping bookings
    const overlappingBooking = await get<Booking>(
      `SELECT id FROM bookings
       WHERE start_time < ? AND end_time > ?`,
      [endTime, startTime]
    );

    if (overlappingBooking) {
      return NextResponse.json({ error: 'Time slot is already booked' }, { status: 400 });
    }

    // Check for overlapping maintenance
    const overlappingMaintenance = await get<Maintenance>(
      `SELECT id FROM maintenance
       WHERE start_time < ? AND end_time > ?`,
      [endTime, startTime]
    );

    if (overlappingMaintenance) {
      return NextResponse.json({ error: 'Aircraft is scheduled for maintenance' }, { status: 400 });
    }

    // Create booking
    const result = await run(
      'INSERT INTO bookings (user_id, start_time, end_time, notes, destination) VALUES (?, ?, ?, ?, ?)',
      [user.id, start.toISOString(), end.toISOString(), notes || null, destination || null]
    );

    return NextResponse.json({
      id: result.lastInsertRowid,
      user_id: user.id,
      start_time: startTime,
      end_time: endTime,
      notes,
      destination,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
