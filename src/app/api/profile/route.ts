import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { get, run } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface DbUser {
  id: number;
  password: string;
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { name, currentPassword, newPassword } = await request.json();

    // Update name
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      await run('UPDATE users SET name = ? WHERE id = ?', [name.trim(), user.id]);

      return NextResponse.json({ success: true, message: 'Name updated' });
    }

    // Update password
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Verify current password
      const dbUser = await get<DbUser>('SELECT id, password FROM users WHERE id = ?', [user.id]);

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, dbUser.password);

      if (!passwordMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

      return NextResponse.json({ success: true, message: 'Password updated' });
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
