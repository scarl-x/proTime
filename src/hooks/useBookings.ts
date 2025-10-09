import { useState, useEffect } from 'react';
import { Booking, EmployeeAvailability, TimeSlot } from '../types';
import { bookingsAPI } from '../lib/api';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadBookings();
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
    try {
      const loadedBookings = await bookingsAPI.getAll();
      setBookings(loadedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      loadDemoBookings();
    }
  };

  const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBooking = await bookingsAPI.create(booking);
      await loadBookings();
      return newBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    try {
      await bookingsAPI.update(id, updates);
      await loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await bookingsAPI.delete(id);
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
