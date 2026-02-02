'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';

interface NavigationProps {
  session: Session | null;
}

export default function Navigation({ session }: NavigationProps) {
  const pathname = usePathname();
  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';

  return (
    <header className="bg-white border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">LR Freedom Air</h1>
              <p className="text-xs text-gray-500">Aircraft Scheduler</p>
            </div>
          </Link>

          {/* Navigation Links */}
          {session ? (
            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                href="/calendar"
                className={`nav-link ${pathname === '/calendar' ? 'active' : ''}`}
              >
                Calendar
              </Link>
              <Link
                href="/oil"
                className={`nav-link ${pathname === '/oil' ? 'active' : ''}`}
              >
                Oil Log
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}
                >
                  Admin
                </Link>
              )}
            </nav>
          ) : null}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: user?.color || '#64748b' }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-secondary text-sm">
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
