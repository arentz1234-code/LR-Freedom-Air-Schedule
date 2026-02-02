import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { get } from '@/lib/db';
import ProfileForm from '@/components/ProfileForm';

interface User {
  id: number;
  name: string;
  email: string;
  color: string;
  role: string;
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const user = session.user as any;

  const dbUser = await get<User>(
    'SELECT id, name, email, color, role FROM users WHERE id = ?',
    [user.id]
  );

  if (!dbUser) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Profile Settings</h1>
        <p className="text-gray-500">Manage your account information</p>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Account Information</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: dbUser.color }}
            >
              {dbUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{dbUser.name}</p>
              <p className="text-gray-500">{dbUser.email}</p>
              <span className={`badge mt-1 ${dbUser.role === 'owner' ? 'badge-admin' : 'badge-renter'}`}>
                {dbUser.role}
              </span>
            </div>
          </div>

          <ProfileForm user={dbUser} />
        </div>
      </div>

      <div className="card mt-6">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Your Color</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg"
              style={{ backgroundColor: dbUser.color }}
            />
            <div>
              <p className="font-medium">{dbUser.color}</p>
              <p className="text-sm text-gray-500">This color is used to identify your bookings on the calendar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
