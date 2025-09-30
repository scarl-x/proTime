import { TimeSlot } from '../types';
import { isTimeSlotOverdue } from './deadlineUtils';

export const getCalendarSlotClasses = (slot: TimeSlot): string => {
  if (isTimeSlotOverdue(slot)) return 'bg-red-100 border-red-300 text-red-800';

  const status = slot.status as string;
  if (status === 'completed') return 'bg-green-100 border-green-300 text-green-800';
  if (status === 'in-progress') return 'bg-blue-100 border-blue-300 text-blue-800';
  if (status === 'planned') return 'bg-yellow-100 border-yellow-300 text-yellow-800';

  return 'bg-gray-100 border-gray-300 text-gray-600';
};


