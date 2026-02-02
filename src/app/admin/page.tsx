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

      {/* Users, Oil Logs, and Maintenance */}
      <AdminActions
        users={users}
        oilLogs={oilLogs}
        maintenance={maintenance}
        maintenanceColor={MAINTENANCE_COLOR}
        currentUserId={user.id}
      />

      {/* Schedule Maintenance Form */}
      <div className="mt-6">
        <div className="card max-w-lg">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold">Schedule Maintenance</h2>
          </div>
          <div className="p-4">
            <MaintenanceForm />
          </div>
        </div>
      </div>
    </div>
  );
}
