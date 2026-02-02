import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { query, MAINTENANCE_COLOR } from '@/lib/db';
import MaintenanceForm from '@/components/MaintenanceForm';

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Admin Panel</h1>
        <p className="text-gray-500">Manage users and schedule maintenance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Section */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Registered Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: u.color }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-500">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-renter'}`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Section */}
        <div className="space-y-6">
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
    </div>
  );
}
