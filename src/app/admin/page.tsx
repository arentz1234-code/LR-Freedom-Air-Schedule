import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { query, MAINTENANCE_COLOR } from '@/lib/db';
import MaintenanceForm from '@/components/MaintenanceForm';
import AdminActions from '@/components/AdminActions';

interface User {
  id: number;
  name: string;
  email: string;
  color: string;
  role: string;
}

interface Maintenance {
  id: number;
  start_time: string;
  end_time: string;
  description: string;
}

interface OilLog {
  id: number;
  user_id: number;
  date: string;
  quarts: number;
  hobbs_time: number;
  notes: string | null;
  user_name: string;
}

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;

  if (user.role !== 'admin') {
    redirect('/');
  }

  // Fetch all users
  const users = await query<User>(
    'SELECT id, name, email, color, role FROM users ORDER BY name'
  );

  // Fetch maintenance schedules
  const maintenance = await query<Maintenance>(
    'SELECT * FROM maintenance ORDER BY start_time DESC'
  );

  // Fetch oil logs
  const oilLogs = await query<OilLog>(
    `SELECT o.*, u.name as user_name
     FROM oil_logs o
     JOIN users u ON o.user_id = u.id
     ORDER BY o.date DESC`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Admin Panel</h1>
        <p className="text-gray-500">Manage users, oil logs, and schedule maintenance</p>
      </div>

      {/* Users and Oil Logs */}
      <AdminActions users={users} oilLogs={oilLogs} currentUserId={user.id} />

      {/* Maintenance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Add Maintenance Form */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Schedule Maintenance</h2>
          </div>
          <div className="p-4">
            <MaintenanceForm />
          </div>
        </div>

        {/* Maintenance List */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Scheduled Maintenance</h2>
          </div>
          <div className="p-4">
            {maintenance.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No maintenance scheduled
              </p>
            ) : (
              <div className="space-y-3">
                {maintenance.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div
                      className="w-2 h-12 rounded-full"
                      style={{ backgroundColor: MAINTENANCE_COLOR }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{m.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(m.start_time).toLocaleDateString()} •{' '}
                        {new Date(m.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(m.end_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
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
