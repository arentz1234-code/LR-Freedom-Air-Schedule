'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  color: string;
  role: string;
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

interface AdminActionsProps {
  users: User[];
  oilLogs: OilLog[];
  currentUserId: number;
}

export default function AdminActions({ users, oilLogs, currentUserId }: AdminActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This will also delete all their bookings and oil logs.`)) {
      return;
    }

    setLoading(`user-${userId}`);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteOilLog = async (logId: number) => {
    if (!confirm('Are you sure you want to delete this oil log entry?')) {
      return;
    }

    setLoading(`oil-${logId}`);
    try {
      const res = await fetch(`/api/oil/${logId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete oil log');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
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
                <th>Action</th>
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
                  <td>
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        disabled={loading === `user-${u.id}`}
                        className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                      >
                        {loading === `user-${u.id}` ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Oil Logs Section */}
      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Oil Log Entries</h2>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Quarts</th>
                <th>Hobbs</th>
                <th>By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {oilLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    No oil entries yet
                  </td>
                </tr>
              ) : (
                oilLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-sm">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="font-medium">{log.quarts}</td>
                    <td className="font-mono text-sm">{log.hobbs_time}</td>
                    <td className="text-sm">{log.user_name}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteOilLog(log.id)}
                        disabled={loading === `oil-${log.id}`}
                        className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                      >
                        {loading === `oil-${log.id}` ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
