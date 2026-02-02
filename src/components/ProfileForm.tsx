'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  color: string;
  role: string;
}

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        setSuccess('Name updated successfully');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update name');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setSuccess('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update password');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Update Name Form */}
      <form onSubmit={handleUpdateName} className="space-y-4">
        <h3 className="font-medium text-gray-700">Update Name</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Your name"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Update Name'}
        </button>
      </form>

      <hr className="border-gray-200" />

      {/* Update Password Form */}
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <h3 className="font-medium text-gray-700">Change Password</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input"
            placeholder="Enter current password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input"
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="Confirm new password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
