import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { run, get } from '@/lib/db';

interface Booking {
  id: number;
  user_id: number;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = await params;
    const bookingId = parseInt(id);

    // Get booking
    const booking = await get<Booking>(
      'SELECT id, user_id FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user owns the booking or is owner
    if (booking.user_id !== parseInt(user.id) && user.role !== 'owner') {
      return NextResponse.json({ error: 'You can only cancel your own bookings' }, { status: 403 });
    }

    await run('DELETE FROM bookings WHERE id = ?', [bookingId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
