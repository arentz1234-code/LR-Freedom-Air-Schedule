'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Maintenance {
  id: number;
  start_time: string;
  end_time: string;
  description: string;
}

interface MaintenanceListProps {
  maintenance: Maintenance[];
  maintenanceColor: string;
}

export default function MaintenanceList({ maintenance, maintenanceColor }: MaintenanceListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this maintenance entry?')) {
      return;
    }

    setLoading(id);
    try {
      const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete maintenance');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setLoading(null);
    }
  };

  if (maintenance.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-4">
        No maintenance scheduled
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {maintenance.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
        >
          <div
            className="w-2 h-12 rounded-full flex-shrink-0"
            style={{ backgroundColor: maintenanceColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{m.description}</p>
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
          <button
            onClick={() => handleDelete(m.id)}
            disabled={loading === m.id}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1 rounded disabled:opacity-50 flex-shrink-0"
          >
            {loading === m.id ? '...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
}
