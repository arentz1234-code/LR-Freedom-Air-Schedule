import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, run, get, USER_COLORS } from '@/lib/db';

interface User {
  id: number;
  email: string;
}

export async function POST(request: Request) {
  try {
    const { name, email, password, role: requestedRole } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await get<User>('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Get count of existing users to assign color
    const users = await query<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const userCount = users[0]?.count || 0;
    const color = USER_COLORS[userCount % USER_COLORS.length];

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role - owner gets admin privileges, leasor is regular user
    const role = requestedRole === 'owner' ? 'owner' : 'leasor';

    // Create user
    const result = await run(
      'INSERT INTO users (name, email, password, color, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, color, role]
    );

    return NextResponse.json({
      id: result.lastInsertRowid,
      name,
      email,
      color,
      role,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const users = await query<{
      id: number;
      name: string;
      email: string;
      color: string;
      role: string;
    }>('SELECT id, name, email, color, role FROM users ORDER BY name');

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
