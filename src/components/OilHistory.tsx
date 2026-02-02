'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OilLog {
  id: number;
  user_id: number;
  date: string;
  quarts: number;
  hobbs_time: number;
  notes: string | null;
  user_name: string;
}

interface OilHistoryProps {
  oilLogs: OilLog[];
}

export default function OilHistory({ oilLogs }: OilHistoryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);

  const handleDelete = async (logId: number) => {
    if (!confirm('Are you sure you want to delete this oil entry?')) {
      return;
    }

    setLoading(logId);
    try {
      const res = await fetch(`/api/oil/${logId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete oil entry');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Quarts</th>
            <th>Hobbs Time</th>
            <th>Added By</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {oilLogs.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-gray-500 py-8">
                No oil entries yet
              </td>
            </tr>
          ) : (
            oilLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.date).toLocaleDateString()}</td>
                <td className="font-medium">{log.quarts}</td>
                <td className="font-mono">{log.hobbs_time}</td>
                <td>{log.user_name}</td>
                <td className="text-gray-500">{log.notes || '-'}</td>
                <td>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={loading === log.id}
                    className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                  >
                    {loading === log.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
