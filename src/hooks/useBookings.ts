import { useState, useEffect } from 'react';
import { Booking, EmployeeAvailability, TimeSlot } from '../types';
import { supabase, hasSupabaseCredentials } from '../lib/supabase';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (hasSupabaseCredentials && supabase) {
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
    ];
    setBookings(demoBookings);
  };

  const loadBookings = async () => {
    if (!supabase) return;
    
    try {
      console.log('Loading bookings from Supabase...');
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading bookings:', error);
        throw error;
      }

      console.log('Raw bookings data from Supabase:', data);

      const formattedBookings: Booking[] = data.map(dbBooking => ({
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

      console.log('Formatted bookings:', formattedBookings);
      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      loadDemoBookings();
    }
  };

  const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!supabase) {
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
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          requester_id: booking.requesterId,
          employee_id: booking.employeeId,
          project_id: booking.projectId,
          date: booking.date,
          start_time: booking.startTime,
          end_time: booking.endTime,
          duration_hours: booking.durationHours,
          task_description: booking.taskDescription,
          status: booking.status,
          notes: booking.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await loadBookings();
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    if (!supabase) {
      // Demo mode - update local state
      setBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, ...updates, updatedAt: new Date().toISOString() } : booking
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          requester_id: updates.requesterId,
          employee_id: updates.employeeId,
          project_id: updates.projectId,
          date: updates.date,
          start_time: updates.startTime,
          end_time: updates.endTime,
          duration_hours: updates.durationHours,
          task_description: updates.taskDescription,
          status: updates.status,
          notes: updates.notes,
        })
        .eq('id', id);

      if (error) throw error;

      await loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  };

  const deleteBooking = async (id: string) => {
    if (!supabase) {
      // Demo mode - remove from local state
      setBookings(prev => prev.filter(booking => booking.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

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