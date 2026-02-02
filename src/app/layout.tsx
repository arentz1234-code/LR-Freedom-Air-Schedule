import type { Metadata } from 'next';
import './globals.css';
import { auth } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import { initDb } from '@/lib/db';

export const metadata: Metadata = {
  title: 'LR Freedom Air Scheduler',
  description: 'Aircraft booking calendar for LR Freedom Air',
};

// Initialize database on server start
initDb().catch(console.error);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <Navigation session={session} />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
