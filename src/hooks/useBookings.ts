import { useState, useEffect } from 'react';
import { Booking, EmployeeAvailability, TimeSlot } from '../types';
import { API_URL, hasApiConnection } from '../lib/api';


export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (hasApiConnection) {
      loadBookings();
    } else {
      loadDemoBookings();
    }
  }, []);

  const loadDemoBookings = () => {
    const demoBookings: Booking[] = [
      {
        id: '1',
        requesterId: '2',
        employeeId: '3',
        projectId: '1',
        date: new Date().toISOString().split('T')[0],
        startTime: '14:00',
        endTime: '16:00',
        durationHours: 2,
        taskDescription: 'Совместная работа над дизайном интерфейса',
        status: 'approved',
        notes: 'Нужно обсудить UX решения',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        requesterId: '1', // Админ запрашивает время
        employeeId: '2',
        projectId: '1',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        durationHours: 2,
        taskDescription: 'Консультация по архитектуре проекта',
        status: 'pending',
        notes: 'Нужна помощь с выбором технологий',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        requesterId: '3',
        employeeId: '1', // Админа бронируют
        projectId: '1',
        date: new Date().toISOString().split('T')[0],
        startTime: '15:00',
        endTime: '17:00',
        durationHours: 2,
        taskDescription: 'Код-ревью и обсуждение задач',
        status: 'approved',
        notes: 'Проверить качество кода',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setBookings(demoBookings);
  };

  const loadBookings = async () => {
    if (!hasApiConnection) {
      loadDemoBookings();
      return;
    }
    
    // REST API режим
    try {
      const res = await fetch(`${API_URL}/api/bookings`);
      if (!res.ok) throw new Error('Failed to load bookings');
      const data = await res.json();
      const formattedBookings: Booking[] = data.map((dbBooking: any) => ({
        id: dbBooking.id,
        requesterId: dbBooking.requester_id,
        employeeId: dbBooking.employee_id,
        projectId: dbBooking.project_id,
        date: dbBooking.date,
        startTime: dbBooking.start_time,
        endTime: dbBooking.end_time,
        durationHours: dbBooking.duration_hours,
        taskDescription: dbBooking.task_description,
        status: dbBooking.status as Booking['status'],
        notes: dbBooking.notes,
        createdAt: dbBooking.created_at,
        updatedAt: dbBooking.updated_at,
      }));
      setBookings(formattedBookings);
    } catch (error) {
      loadDemoBookings();
    }
  };

  const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!hasApiConnection) {
      // Demo mode - add to local state
      const newBooking: Booking = {
        ...booking,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBookings(prev => [...prev, newBooking]);
      return newBooking;
    }

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: booking.requesterId,
          employeeId: booking.employeeId,
          projectId: booking.projectId,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          durationHours: booking.durationHours,
          taskDescription: booking.taskDescription,
          status: booking.status,
          notes: booking.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to create booking');
      const data = await res.json();
      await loadBookings();
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    if (!hasApiConnection) {
      // Demo mode - update local state
      setBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, ...updates, updatedAt: new Date().toISOString() } : booking
      ));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: updates.requesterId,
          employeeId: updates.employeeId,
          projectId: updates.projectId,
          date: updates.date,
          startTime: updates.startTime,
          endTime: updates.endTime,
          durationHours: updates.durationHours,
          taskDescription: updates.taskDescription,
          status: updates.status,
          notes: updates.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to update booking');
      await loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  };

  const deleteBooking = async (id: string) => {
    if (!hasApiConnection) {
      // Demo mode - remove from local state
      setBookings(prev => prev.filter(booking => booking.id !== id));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete booking');
      await loadBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  };

  const getBookingsByEmployee = (employeeId: string) => {
    return bookings.filter(booking => booking.employeeId === employeeId);
  };

  const getBookingsByRequester = (requesterId: string) => {
    return bookings.filter(booking => booking.requesterId === requesterId);
  };

  const getBookingsForDate = (date: string, employeeId?: string) => {
    return bookings.filter(booking => 
      booking.date === date && 
      (employeeId ? booking.employeeId === employeeId : true)
    );
  };

  const checkAvailability = (
    employeeId: string, 
    date: string, 
    startTime: string, 
    endTime: string,
    timeSlots: TimeSlot[]
  ): boolean => {
    // Check existing bookings
    const existingBookings = getBookingsForDate(date, employeeId);
    const hasBookingConflict = existingBookings.some(booking => {
      if (booking.status === 'rejected' || booking.status === 'cancelled') return false;
      
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;
      
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });

    if (hasBookingConflict) return false;

    // Check existing time slots
    const existingSlots = timeSlots.filter(slot => 
      slot.employeeId === employeeId && slot.date === date
    );
    
    const hasSlotConflict = existingSlots.some(slot => {
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;
      
      return (
        (startTime >= slotStart && startTime < slotEnd) ||
        (endTime > slotStart && endTime <= slotEnd) ||
        (startTime <= slotStart && endTime >= slotEnd)
      );
    });

    return !hasSlotConflict;
  };

  const getEmployeeAvailability = (
    employeeId: string, 
    date: string, 
    timeSlots: TimeSlot[]
  ): EmployeeAvailability => {
    const workingHours = { start: '09:00', end: '18:00' };
    const employeeBookings = getBookingsForDate(date, employeeId);
    const employeeSlots = timeSlots.filter(slot => 
      slot.employeeId === employeeId && slot.date === date
    );

    // Generate available slots (simplified - could be more sophisticated)
    const availableSlots: TimeSlot[] = [];
    
    return {
      employeeId,
      date,
      availableSlots,
      bookedSlots: employeeBookings,
      workingHours,
    };
  };

  return {
    bookings,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingsByEmployee,
    getBookingsByRequester,
    getBookingsForDate,
    checkAvailability,
    getEmployeeAvailability,
  };
};
