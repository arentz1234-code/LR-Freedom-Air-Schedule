'use client';

import { useState, useRef, useCallback } from 'react';
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

interface SlotKey {
  dayIndex: number;
  hour: number;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM

export default function CalendarView({
  bookings,
  maintenance,
  currentUserId,
  isAdmin,
}: CalendarViewProps) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<SlotKey | null>(null);
  const [dragEnd, setDragEnd] = useState<SlotKey | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

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
      <div className={`text-center py-2 ${isToday ? 'bg-sky-500 text-white rounded-lg' : ''}`}>
        <div className={`text-xs ${isToday ? 'text-sky-100' : 'text-gray-500'}`}>{dayNames[date.getDay()]}</div>
        <div className={`text-lg font-semibold`}>{date.getDate()}</div>
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

  // Check if this slot is the first hour of a booking on this day
  const isBookingStart = (date: Date, hour: number, booking: Booking) => {
    const bookingStart = new Date(booking.start_time);
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);
    const bookingDate = new Date(bookingStart);
    bookingDate.setHours(0, 0, 0, 0);

    // If booking starts on this day, check if this is the start hour
    if (slotDate.getTime() === bookingDate.getTime()) {
      return bookingStart.getHours() === hour;
    }
    // If booking started on a previous day, the first slot of this day is the "start"
    return hour === HOURS[0];
  };

  // Check if slot is part of a booking but not the first slot
  const isBookingContinuation = (date: Date, hour: number, booking: Booking) => {
    const bookingStart = new Date(booking.start_time);
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    return slotStart > bookingStart;
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

  const isSlotInSelection = (dayIndex: number, hour: number) => {
    if (!dragStart || !dragEnd) return false;

    const minDay = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const maxDay = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const minHour = Math.min(dragStart.hour, dragEnd.hour);
    const maxHour = Math.max(dragStart.hour, dragEnd.hour);

    // Single day selection
    if (minDay === maxDay) {
      return dayIndex === minDay && hour >= minHour && hour <= maxHour;
    }

    // Multi-day continuous selection
    if (dayIndex < minDay || dayIndex > maxDay) return false;

    // First day: from start hour to end of day
    if (dayIndex === minDay) {
      return hour >= minHour;
    }

    // Last day: from start of day to end hour
    if (dayIndex === maxDay) {
      return hour <= maxHour;
    }

    // Middle days: entire day is selected
    return true;
  };

  const handleMouseDown = (dayIndex: number, hour: number) => {
    const date = weekDates[dayIndex];
    if (!isSlotAvailable(date, hour)) {
      const slotBookings = getBookingsForSlot(date, hour);
      const userBooking = slotBookings.find((b) => b.user_id === currentUserId);
      if (userBooking || isAdmin) {
        setSelectedBooking(slotBookings[0]);
        setShowModal(true);
      }
      return;
    }

    setIsDragging(true);
    setDragStart({ dayIndex, hour });
    setDragEnd({ dayIndex, hour });
  };

  const handleMouseEnter = (dayIndex: number, hour: number) => {
    if (isDragging) {
      setDragEnd({ dayIndex, hour });
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      // Check if all slots in continuous selection are available
      const minDay = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
      const maxDay = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
      const minHour = Math.min(dragStart.hour, dragEnd.hour);
      const maxHour = Math.max(dragStart.hour, dragEnd.hour);

      let allAvailable = true;

      for (let d = minDay; d <= maxDay && allAvailable; d++) {
        // Determine hour range for this day (continuous booking)
        let startH: number, endH: number;

        if (minDay === maxDay) {
          // Single day
          startH = minHour;
          endH = maxHour;
        } else if (d === minDay) {
          // First day: from start hour to end of day
          startH = minHour;
          endH = HOURS[HOURS.length - 1];
        } else if (d === maxDay) {
          // Last day: from start of day to end hour
          startH = HOURS[0];
          endH = maxHour;
        } else {
          // Middle days: entire day
          startH = HOURS[0];
          endH = HOURS[HOURS.length - 1];
        }

        for (let h = startH; h <= endH; h++) {
          if (!isSlotAvailable(weekDates[d], h)) {
            allAvailable = false;
            break;
          }
        }
      }

      if (allAvailable) {
        setShowModal(true);
      } else {
        setDragStart(null);
        setDragEnd(null);
      }
    }
    setIsDragging(false);
  }, [isDragging, dragStart, dragEnd, weekDates]);

  const getSelectionSummary = () => {
    if (!dragStart || !dragEnd) return null;

    const minDay = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const maxDay = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const minHour = Math.min(dragStart.hour, dragEnd.hour);
    const maxHour = Math.max(dragStart.hour, dragEnd.hour);

    const startDate = new Date(weekDates[minDay]);
    const endDate = new Date(weekDates[maxDay]);
    const numDays = maxDay - minDay + 1;
    const numHours = maxHour - minHour + 1;

    // Calculate continuous hours
    // From start hour on first day to end hour on last day
    let totalHours: number;
    if (numDays === 1) {
      totalHours = numHours;
    } else {
      // Hours remaining on first day (from start hour to midnight = 24 - startHour)
      const firstDayHours = 24 - minHour;
      // Full days in between (each is 24 hours)
      const middleDaysHours = (numDays - 2) * 24;
      // Hours on last day (from midnight to end hour)
      const lastDayHours = maxHour + 1;
      totalHours = firstDayHours + middleDaysHours + lastDayHours;
    }

    return {
      startDate,
      endDate,
      startHour: minHour,
      endHour: maxHour + 1,
      numDays,
      numHours,
      totalHours,
    };
  };

  const handleCreateBooking = async () => {
    const selection = getSelectionSummary();
    if (!selection) return;

    setLoading(true);
    try {
      // Continuous booking: start time on first day, end time on last day
      const startTime = new Date(selection.startDate);
      startTime.setHours(selection.startHour, 0, 0, 0);

      const endTime = new Date(selection.endDate);
      endTime.setHours(selection.endHour, 0, 0, 0);

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
    setDragStart(null);
    setDragEnd(null);
    setSelectedBooking(null);
    setBookingNotes('');
  };

  return (
    <div
      ref={calendarRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => isDragging && handleMouseUp()}
      className="select-none"
    >
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Instructions */}
      <p className="text-sm text-gray-500 mb-4 text-center">
        Click and drag across time slots to create a booking
      </p>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-2 border-r border-gray-200"></div>
          {weekDates.map((date, i) => (
            <div key={i} className="border-r border-gray-200 last:border-r-0">
              {formatDateHeader(date)}
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
              <div className="p-2 text-xs text-gray-500 text-right pr-3 border-r border-gray-200 bg-gray-50">
                {formatHour(hour)}
              </div>
              {weekDates.map((date, dayIndex) => {
                const slotBookings = getBookingsForSlot(date, hour);
                const slotMaintenance = getMaintenanceForSlot(date, hour);
                const isAvailable = isSlotAvailable(date, hour);
                const isSelected = isSlotInSelection(dayIndex, hour);
                const isPast = new Date(date.setHours(hour)) < new Date();

                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={`
                      relative h-12 border-r border-gray-100 last:border-r-0 transition-colors
                      ${isAvailable && !isPast ? 'cursor-crosshair hover:bg-sky-50' : ''}
                      ${isSelected ? 'bg-sky-100' : ''}
                      ${isPast && isAvailable ? 'bg-gray-50' : ''}
                    `}
                    onMouseDown={() => !isPast && handleMouseDown(dayIndex, hour)}
                    onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                  >
                    {slotMaintenance.map((m, idx) => {
                      const maintStart = new Date(m.start_time);
                      const isFirstSlot = maintStart.getHours() === hour &&
                        maintStart.toDateString() === date.toDateString();
                      return (
                        <div
                          key={`m-${m.id}`}
                          className="absolute inset-0 text-xs p-1 text-white overflow-hidden"
                          style={{ backgroundColor: MAINTENANCE_COLOR }}
                          title={m.description}
                        >
                          {(isFirstSlot || (hour === HOURS[0] && idx === 0)) && `🔧 ${m.description}`}
                        </div>
                      );
                    })}
                    {slotBookings.map((b) => {
                      const isStart = isBookingStart(date, hour, b);
                      const isContinuation = isBookingContinuation(date, hour, b);
                      return (
                        <div
                          key={`b-${b.id}`}
                          className={`absolute inset-0 text-xs p-1 text-white overflow-hidden cursor-pointer hover:opacity-90 ${
                            isStart ? 'rounded-t' : ''
                          }`}
                          style={{
                            backgroundColor: b.user_color,
                            borderTop: isContinuation ? 'none' : undefined,
                          }}
                          title={`${b.user_name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (b.user_id === currentUserId || isAdmin) {
                              setSelectedBooking(b);
                              setShowModal(true);
                            }
                          }}
                        >
                          {isStart && (
                            <span className="font-medium">{b.user_name}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sky-100 border border-sky-200"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: MAINTENANCE_COLOR }}></div>
          <span>Maintenance</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            {dragStart && dragEnd && !selectedBooking ? (
              <>
                <h2 className="text-xl font-bold mb-4">New Booking</h2>
                {(() => {
                  const selection = getSelectionSummary();
                  if (!selection) return null;
                  return (
                    <div className="bg-sky-50 p-4 rounded-lg mb-6">
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Start:</strong>{' '}
                          {selection.startDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })} at {formatHour(selection.startHour)}
                        </p>
                        <p>
                          <strong>End:</strong>{' '}
                          {selection.endDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })} at {formatHour(selection.endHour)}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                    <input
                      type="text"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="input"
                      placeholder="e.g., Cross-country flight, Training"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateBooking}
                      disabled={loading}
                      className="btn-primary flex-1"
                    >
                      {loading ? 'Booking...' : 'Confirm Booking'}
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
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: selectedBooking.user_color }}
                    >
                      {selectedBooking.user_name.charAt(0)}
                    </div>
                    <span className="font-medium text-lg">{selectedBooking.user_name}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    <p className="text-gray-600">
                      <strong>Date:</strong>{' '}
                      {new Date(selectedBooking.start_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-gray-600">
                      <strong>Time:</strong>{' '}
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
                      <p className="text-gray-600">
                        <strong>Notes:</strong> {selectedBooking.notes}
                      </p>
                    )}
                  </div>
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
