import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { query, MAINTENANCE_COLOR } from '@/lib/db';

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

interface OilLog {
  id: number;
  date: string;
  quarts: number;
  hobbs_time: number;
  notes: string | null;
  user_name: string;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Redirect to calendar as the main page
  redirect('/calendar');

  const user = session.user as any;

  // Fetch upcoming bookings
  const upcomingBookings = await query<Booking>(
    `SELECT b.*, u.name as user_name, u.color as user_color
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     WHERE b.start_time >= datetime('now')
     ORDER BY b.start_time ASC
     LIMIT 5`
  );

  // Fetch user's bookings
  const myBookings = await query<Booking>(
    `SELECT b.*, u.name as user_name, u.color as user_color
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     WHERE b.user_id = ? AND b.start_time >= datetime('now')
     ORDER BY b.start_time ASC
     LIMIT 5`,
    [user.id]
  );

  // Fetch upcoming maintenance
  const upcomingMaintenance = await query<Maintenance>(
    `SELECT * FROM maintenance
     WHERE start_time >= datetime('now')
     ORDER BY start_time ASC
     LIMIT 3`
  );

  // Fetch recent oil additions
  const recentOil = await query<OilLog>(
    `SELECT o.*, u.name as user_name
     FROM oil_logs o
     JOIN users u ON o.user_id = u.id
     ORDER BY o.date DESC
     LIMIT 5`
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name}!</h1>
        <p className="text-gray-500">Here&apos;s your flight schedule overview</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/calendar"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Book a Flight</h3>
            <p className="text-sm text-gray-500">View calendar & reserve</p>
          </div>
        </Link>

        <Link
          href="/oil"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Log Oil</h3>
            <p className="text-sm text-gray-500">Record oil addition</p>
          </div>
        </Link>

        <Link
          href="/calendar"
          className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">My Bookings</h3>
            <p className="text-sm text-gray-500">{myBookings.length} upcoming</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Upcoming Bookings */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">My Reservations</h2>
          </div>
          <div className="p-4">
            {myBookings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No upcoming reservations
              </p>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-2 h-12 rounded-full"
                      style={{ backgroundColor: booking.user_color }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {formatDate(booking.start_time)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </p>
                    </div>
                    {booking.notes && (
                      <p className="text-xs text-gray-400">{booking.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Upcoming Bookings */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Upcoming Schedule</h2>
          </div>
          <div className="p-4">
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No upcoming bookings
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: booking.user_color }}
                    >
                      {booking.user_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{booking.user_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.start_time)} • {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Schedule */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Scheduled Maintenance</h2>
          </div>
          <div className="p-4">
            {upcomingMaintenance.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No scheduled maintenance
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingMaintenance.map((maint) => (
                  <div
                    key={maint.id}
                    className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div
                      className="w-2 h-12 rounded-full"
                      style={{ backgroundColor: MAINTENANCE_COLOR }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{maint.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(maint.start_time)} • {formatTime(maint.start_time)} - {formatTime(maint.end_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Oil Additions */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Recent Oil Additions</h2>
          </div>
          <div className="p-4">
            {recentOil.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No oil logs yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentOil.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {log.quarts} quart{log.quarts !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(log.date)} by {log.user_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{log.hobbs_time} hrs</p>
                      <p className="text-xs text-gray-400">Hobbs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
