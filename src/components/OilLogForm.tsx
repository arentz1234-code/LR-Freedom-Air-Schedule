'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OilLogForm() {
  const router = useRouter();
  const [quarts, setQuarts] = useState('');
  const [hobbsTime, setHobbsTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/oil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quarts: parseFloat(quarts),
          hobbsTime: parseFloat(hobbsTime),
          notes,
        }),
      });

      if (res.ok) {
        setQuarts('');
        setHobbsTime('');
        setNotes('');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add oil entry');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Quarts Added *</label>
          <input
            type="number"
            step="0.25"
            min="0.25"
            max="8"
            value={quarts}
            onChange={(e) => setQuarts(e.target.value)}
            className="input"
            placeholder="e.g., 1.5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Hobbs Time *</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={hobbsTime}
            onChange={(e) => setHobbsTime(e.target.value)}
            className="input"
            placeholder="e.g., 1234.5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="e.g., Pre-flight check"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Adding...' : 'Add Oil Entry'}
      </button>
    </form>
  );
}
