import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { query, MAINTENANCE_COLOR } from '@/lib/db';
import CalendarView from '@/components/CalendarView';

interface User {
  id: number;
  name: string;
  color: string;
}

interface Booking {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  notes: string | null;
  user_name: string;
  user_color: string;
}

interface Maintenance {
  id: number;
  start_time: string;
  end_time: string;
  description: string;
}

export default async function CalendarPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;

  // Fetch all users for legend
  const users = await query<User>('SELECT id, name, color FROM users ORDER BY name');

  // Fetch bookings for the current week and next week
  const bookings = await query<Booking>(
    `SELECT b.*, u.name as user_name, u.color as user_color
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     WHERE b.start_time >= date('now', '-7 days')
     AND b.start_time <= date('now', '+14 days')
     ORDER BY b.start_time`
  );

  // Fetch maintenance
  const maintenance = await query<Maintenance>(
    `SELECT * FROM maintenance
     WHERE start_time >= date('now', '-7 days')
     AND start_time <= date('now', '+14 days')
     ORDER BY start_time`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Aircraft Schedule</h1>
          <p className="text-gray-500">Click on a time slot to book</p>
        </div>
      </div>

      {/* Legend */}
      <div className="legend mb-6">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: MAINTENANCE_COLOR }}></div>
          <span>Maintenance</span>
        </div>
        {users.map((u) => (
          <div key={u.id} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: u.color }}></div>
            <span>{u.name}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <CalendarView
        bookings={bookings}
        maintenance={maintenance}
        currentUserId={parseInt(user.id)}
        isAdmin={user.role === 'admin'}
      />
    </div>
  );
}
