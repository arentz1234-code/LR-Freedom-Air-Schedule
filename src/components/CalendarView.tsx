'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAINTENANCE_COLOR } from '@/lib/db';

interface Booking {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  notes: string | null;
  user_name: string;
  user_color: string;
}

interface Maintenance {
  id: number;
  start_time: string;
  end_time: string;
  description: string;
}

interface CalendarViewProps {
  bookings: Booking[];
  maintenance: Maintenance[];
  currentUserId: number;
  isAdmin: boolean;
}

export default function CalendarView({
  bookings,
  maintenance,
  currentUserId,
  isAdmin,
}: CalendarViewProps) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingDays, setBookingDays] = useState(1);
  const [bookingHours, setBookingHours] = useState(2);
  const [startHour, setStartHour] = useState(8);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Get week dates
  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();

  const formatDateHeader = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const isToday = date.toDateString() === new Date().toDateString();
    return (
      <div className={`text-center p-2 ${isToday ? 'bg-sky-100 rounded-lg' : ''}`}>
        <div className="text-xs text-gray-500">{dayNames[date.getDay()]}</div>
        <div className={`text-lg font-semibold ${isToday ? 'text-sky-600' : ''}`}>{date.getDate()}</div>
      </div>
    );
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  const getBookingsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return bookings.filter((b) => {
      const bookingStart = new Date(b.start_time);
      const bookingEnd = new Date(b.end_time);
      return bookingStart < dayEnd && bookingEnd > dayStart;
    });
  };

  const getMaintenanceForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return maintenance.filter((m) => {
      const maintStart = new Date(m.start_time);
      const maintEnd = new Date(m.end_time);
      return maintStart < dayEnd && maintEnd > dayStart;
    });
  };

  const handleDayClick = (date: Date) => {
    const dayMaintenance = getMaintenanceForDay(date);
    if (dayMaintenance.length > 0) {
      alert('This day has scheduled maintenance');
      return;
    }

    const dayBookings = getBookingsForDay(date);
    const userBooking = dayBookings.find((b) => b.user_id === currentUserId);

    if (userBooking) {
      setSelectedBooking(userBooking);
      setShowModal(true);
      return;
    }

    setSelectedDate(date);
    setShowModal(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const startTime = new Date(selectedDate);
      startTime.setHours(startHour, 0, 0, 0);

      const endTime = new Date(startTime);
      if (bookingDays > 1) {
        // Multi-day booking: end at same time on final day
        endTime.setDate(endTime.getDate() + bookingDays - 1);
        endTime.setHours(startHour + bookingHours);
      } else {
        // Single day: add hours
        endTime.setHours(startHour + bookingHours);
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: bookingNotes,
        }),
      });

      if (res.ok) {
        closeModal();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create booking');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;

    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        closeModal();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel booking');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setSelectedBooking(null);
    setBookingNotes('');
    setBookingDays(1);
    setBookingHours(2);
    setStartHour(8);
  };

  const getTotalHours = () => {
    if (bookingDays > 1) {
      return bookingDays * bookingHours;
    }
    return bookingHours;
  };

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="btn-secondary">
          ← Previous
        </button>
        <div className="text-center">
          <span className="font-semibold text-lg">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-3 text-sm text-sky-600 hover:underline"
            >
              Today
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-secondary">
          Next →
        </button>
      </div>

      {/* Calendar Grid - Day View */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dayBookings = getBookingsForDay(date);
          const dayMaintenance = getMaintenanceForDay(date);
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

          return (
            <div
              key={i}
              className={`card p-3 min-h-[180px] cursor-pointer transition-all hover:shadow-md ${
                isPast ? 'opacity-50' : ''
              } ${dayMaintenance.length > 0 ? 'bg-yellow-50 border-yellow-200' : ''}`}
              onClick={() => !isPast && handleDayClick(date)}
            >
              {formatDateHeader(date)}

              <div className="mt-2 space-y-1">
                {dayMaintenance.map((m) => (
                  <div
                    key={`m-${m.id}`}
                    className="text-xs p-2 rounded text-white truncate"
                    style={{ backgroundColor: MAINTENANCE_COLOR }}
                    title={m.description}
                  >
                    🔧 {m.description}
                  </div>
                ))}
                {dayBookings.map((b) => {
                  const start = new Date(b.start_time);
                  const end = new Date(b.end_time);
                  return (
                    <div
                      key={`b-${b.id}`}
                      className="text-xs p-2 rounded text-white truncate"
                      style={{ backgroundColor: b.user_color }}
                      title={`${b.user_name}: ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (b.user_id === currentUserId || isAdmin) {
                          setSelectedBooking(b);
                          setShowModal(true);
                        }
                      }}
                    >
                      <div className="font-medium">{b.user_name}</div>
                      <div className="opacity-80">
                        {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -
                        {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: MAINTENANCE_COLOR }}></div>
          <span>Maintenance</span>
        </div>
        <span>Click a day to book</span>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            {selectedDate && !selectedBooking ? (
              <>
                <h2 className="text-xl font-bold mb-2">New Booking</h2>
                <p className="text-gray-500 mb-6">
                  Starting{' '}
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>

                <div className="space-y-5">
                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(parseInt(e.target.value))}
                      className="input"
                    >
                      {Array.from({ length: 14 }, (_, i) => i + 6).map((hour) => (
                        <option key={hour} value={hour}>
                          {formatHour(hour)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Number of Days */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Number of Days: <span className="text-sky-600">{bookingDays}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="14"
                      value={bookingDays}
                      onChange={(e) => setBookingDays(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1 day</span>
                      <span>14 days</span>
                    </div>
                  </div>

                  {/* Hours per Day */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Hours {bookingDays > 1 ? 'per Day' : ''}: <span className="text-sky-600">{bookingHours}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={bookingHours}
                      onChange={(e) => setBookingHours(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1 hour</span>
                      <span>12 hours</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-sky-50 p-3 rounded-lg">
                    <p className="text-sm text-sky-800">
                      <strong>Summary:</strong> {bookingDays} day{bookingDays > 1 ? 's' : ''}, {bookingHours} hour{bookingHours > 1 ? 's' : ''} {bookingDays > 1 ? 'each day' : ''}
                      <br />
                      <span className="text-sky-600">
                        {formatHour(startHour)} - {formatHour(startHour + bookingHours)}
                        {bookingDays > 1 && ` (${getTotalHours()} total hours)`}
                      </span>
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="input"
                      placeholder="e.g., Cross-country flight"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCreateBooking}
                      disabled={loading}
                      className="btn-primary flex-1"
                    >
                      {loading ? 'Booking...' : 'Book Flight'}
                    </button>
                    <button onClick={closeModal} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : selectedBooking ? (
              <>
                <h2 className="text-xl font-bold mb-4">Booking Details</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: selectedBooking.user_color }}
                    />
                    <span className="font-medium">{selectedBooking.user_name}</span>
                  </div>
                  <p className="text-gray-500">
                    {new Date(selectedBooking.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-500">
                    {new Date(selectedBooking.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(selectedBooking.end_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  {selectedBooking.notes && (
                    <p className="text-gray-600">Notes: {selectedBooking.notes}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {(selectedBooking.user_id === currentUserId || isAdmin) && (
                    <button
                      onClick={handleDeleteBooking}
                      disabled={loading}
                      className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
                    >
                      {loading ? 'Canceling...' : 'Cancel Booking'}
                    </button>
                  )}
                  <button onClick={closeModal} className="btn-secondary flex-1">
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
