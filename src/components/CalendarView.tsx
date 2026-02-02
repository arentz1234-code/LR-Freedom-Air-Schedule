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

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6 AM to 8 PM

export default function CalendarView({
  bookings,
  maintenance,
  currentUserId,
  isAdmin,
}: CalendarViewProps) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingDuration, setBookingDuration] = useState(2);
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
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500">{dayNames[date.getDay()]}</div>
        <div className="font-semibold">{date.getDate()}</div>
      </div>
    );
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${ampm}`;
  };

  const getBookingsForSlot = (date: Date, hour: number) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return bookings.filter((b) => {
      const bookingStart = new Date(b.start_time);
      const bookingEnd = new Date(b.end_time);
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  };

  const getMaintenanceForSlot = (date: Date, hour: number) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return maintenance.filter((m) => {
      const maintStart = new Date(m.start_time);
      const maintEnd = new Date(m.end_time);
      return maintStart < slotEnd && maintEnd > slotStart;
    });
  };

  const isSlotAvailable = (date: Date, hour: number) => {
    const slotBookings = getBookingsForSlot(date, hour);
    const slotMaintenance = getMaintenanceForSlot(date, hour);
    return slotBookings.length === 0 && slotMaintenance.length === 0;
  };

  const handleSlotClick = (date: Date, hour: number) => {
    if (!isSlotAvailable(date, hour)) {
      // Check if it's the user's own booking
      const slotBookings = getBookingsForSlot(date, hour);
      const userBooking = slotBookings.find((b) => b.user_id === currentUserId);
      if (userBooking) {
        setSelectedBooking(userBooking);
        setShowModal(true);
      }
      return;
    }
    setSelectedSlot({ date, hour });
    setShowModal(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      const startTime = new Date(selectedSlot.date);
      startTime.setHours(selectedSlot.hour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + bookingDuration);

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
        setShowModal(false);
        setSelectedSlot(null);
        setBookingNotes('');
        setBookingDuration(2);
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
        setShowModal(false);
        setSelectedBooking(null);
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
    setSelectedSlot(null);
    setSelectedBooking(null);
    setBookingNotes('');
    setBookingDuration(2);
  };

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="btn-secondary">
          ← Previous Week
        </button>
        <div className="text-center">
          <span className="font-semibold">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-2 text-sm text-sky-600 hover:underline"
            >
              Today
            </button>
          )}
        </div>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-secondary">
          Next Week →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid bg-white">
        {/* Header */}
        <div className="calendar-header">
          <div className="calendar-header-cell"></div>
          {weekDates.map((date, i) => (
            <div key={i} className="calendar-header-cell">
              {formatDateHeader(date)}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="calendar-body">
          {HOURS.map((hour) => (
            <>
              <div key={`time-${hour}`} className="time-label">
                {formatHour(hour)}
              </div>
              {weekDates.map((date, dayIndex) => {
                const slotBookings = getBookingsForSlot(date, hour);
                const slotMaintenance = getMaintenanceForSlot(date, hour);
                const isAvailable = isSlotAvailable(date, hour);

                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={`calendar-cell ${isAvailable ? 'cursor-pointer' : ''}`}
                    onClick={() => handleSlotClick(date, hour)}
                  >
                    {slotMaintenance.map((m) => (
                      <div
                        key={`m-${m.id}`}
                        className="booking-block"
                        style={{ backgroundColor: MAINTENANCE_COLOR, top: 2 }}
                      >
                        🔧 {m.description}
                      </div>
                    ))}
                    {slotBookings.map((b) => (
                      <div
                        key={`b-${b.id}`}
                        className="booking-block"
                        style={{ backgroundColor: b.user_color, top: 2 }}
                      >
                        {b.user_name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {selectedSlot && !selectedBooking ? (
              <>
                <h2 className="text-xl font-bold mb-4">New Booking</h2>
                <p className="text-gray-500 mb-4">
                  {selectedSlot.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at {formatHour(selectedSlot.hour)}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <select
                      value={bookingDuration}
                      onChange={(e) => setBookingDuration(parseInt(e.target.value))}
                      className="input"
                    >
                      <option value={1}>1 hour</option>
                      <option value={2}>2 hours</option>
                      <option value={3}>3 hours</option>
                      <option value={4}>4 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="input"
                      placeholder="e.g., Training flight"
                    />
                  </div>

                  <div className="flex gap-2">
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
