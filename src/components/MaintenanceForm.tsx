'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MaintenanceForm() {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date || !startTime || !endTime || !description) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      if (endDateTime <= startDateTime) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          description,
        }),
      });

      if (res.ok) {
        setDate('');
        setStartTime('08:00');
        setEndTime('17:00');
        setDescription('');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to schedule maintenance');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get tomorrow's date as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Date *</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={minDate}
          className="input"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Time *</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Time *</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          placeholder="e.g., 100-hour inspection, Annual, Oil change"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Scheduling...' : 'Schedule Maintenance'}
      </button>
    </form>
  );
}
