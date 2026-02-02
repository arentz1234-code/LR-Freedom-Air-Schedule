import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import OilLogForm from '@/components/OilLogForm';

interface OilLog {
  id: number;
  user_id: number;
  date: string;
  quarts: number;
  hobbs_time: number;
  notes: string | null;
  user_name: string;
}

export default async function OilPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch oil logs
  const oilLogs = await query<OilLog>(
    `SELECT o.*, u.name as user_name
     FROM oil_logs o
     JOIN users u ON o.user_id = u.id
     ORDER BY o.date DESC`
  );

  // Calculate totals
  const totalQuarts = oilLogs.reduce((sum, log) => sum + log.quarts, 0);
  const avgConsumption = oilLogs.length >= 2
    ? calculateAvgConsumption(oilLogs)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Oil Tracking</h1>
        <p className="text-gray-500">Log oil additions and monitor consumption</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Total Oil Added */}
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalQuarts.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Total Quarts Added</p>
            </div>
          </div>
        </div>

        {/* Entries Count */}
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">{oilLogs.length}</p>
              <p className="text-sm text-gray-500">Log Entries</p>
            </div>
          </div>
        </div>

        {/* Avg Consumption */}
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              avgConsumption && avgConsumption > 0.1 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <svg className={`w-6 h-6 ${
                avgConsumption && avgConsumption > 0.1 ? 'text-red-600' : 'text-green-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {avgConsumption ? `${avgConsumption.toFixed(3)}` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Qt/Hour Avg</p>
            </div>
          </div>
          {avgConsumption && avgConsumption > 0.1 && (
            <p className="text-xs text-red-500 mt-2">⚠️ High consumption - check for leaks</p>
          )}
        </div>
      </div>

      {/* Add Oil Form */}
      <div className="card mb-8">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Add Oil Entry</h2>
        </div>
        <div className="p-4">
          <OilLogForm />
        </div>
      </div>

      {/* Oil History Table */}
      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Oil History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Quarts</th>
                <th>Hobbs Time</th>
                <th>Added By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {oilLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function calculateAvgConsumption(logs: OilLog[]): number | null {
  if (logs.length < 2) return null;

  const sortedLogs = [...logs].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let totalQuarts = 0;
  let totalHours = 0;

  for (let i = 1; i < sortedLogs.length; i++) {
    const hoursElapsed = sortedLogs[i].hobbs_time - sortedLogs[i - 1].hobbs_time;
    if (hoursElapsed > 0) {
      totalQuarts += sortedLogs[i].quarts;
      totalHours += hoursElapsed;
    }
  }

  return totalHours > 0 ? totalQuarts / totalHours : null;
}
