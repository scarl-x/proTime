import { useState, useEffect } from 'react';
import { LeaveRequest, LeaveBalance } from '../types';
import { supabase, hasSupabaseCredentials } from '../lib/supabase';

export const useLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    if (hasSupabaseCredentials && supabase) {
      loadLeaveRequests();
    } else {
      loadDemoLeaveRequests();
    }
  }, []);

  const loadDemoLeaveRequests = () => {
    const demoRequests: LeaveRequest[] = [
      {
        id: '1',
        employeeId: '2',
        type: 'vacation',
        startDate: '2024-12-23',
        endDate: '2024-12-31',
        daysCount: 9,
        reason: 'Новогодние праздники',
        status: 'approved',
        approvedBy: '1',
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        employeeId: '3',
        type: 'sick_leave',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysCount: 3,
        reason: 'ОРВИ',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setLeaveRequests(demoRequests);
  };

  const loadLeaveRequests = async () => {
    if (!supabase) return;
    
    try {
      console.log('Loading leave requests from Supabase...');
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading leave requests:', error);
        throw error;
      }

      const formattedRequests: LeaveRequest[] = data.map(dbRequest => ({
        id: dbRequest.id,
        employeeId: dbRequest.employee_id,
        type: dbRequest.type,
        startDate: dbRequest.start_date,
        endDate: dbRequest.end_date,
        daysCount: dbRequest.days_count,
        reason: dbRequest.reason,
        status: dbRequest.status,
        approvedBy: dbRequest.approved_by,
        approvedAt: dbRequest.approved_at,
        notes: dbRequest.notes,
        worked: dbRequest.worked,
        createdAt: dbRequest.created_at,
        updatedAt: dbRequest.updated_at,
      }));

      setLeaveRequests(formattedRequests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      loadDemoLeaveRequests();
    }
  };

  const createLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!supabase) {
      // Demo mode
      const newRequest: LeaveRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLeaveRequests(prev => [...prev, newRequest]);
      return newRequest;
    }

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: request.employeeId,
          type: request.type,
          start_date: request.startDate,
          end_date: request.endDate,
          days_count: request.daysCount,
          reason: request.reason,
          status: request.status,
          approved_by: request.approvedBy,
          approved_at: request.approvedAt,
          notes: request.notes,
          worked: request.worked || false,
        })
        .select()
        .single();

      if (error) throw error;

      await loadLeaveRequests();
      return data;
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  };

  const updateLeaveRequest = async (id: string, updates: Partial<LeaveRequest>) => {
    if (!supabase) {
      // Demo mode
      setLeaveRequests(prev => prev.map(request => 
        request.id === id ? { ...request, ...updates, updatedAt: new Date().toISOString() } : request
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          employee_id: updates.employeeId,
          type: updates.type,
          start_date: updates.startDate,
          end_date: updates.endDate,
          days_count: updates.daysCount,
          reason: updates.reason,
          status: updates.status,
          approved_by: updates.approvedBy,
          approved_at: updates.approvedAt,
          notes: updates.notes,
          worked: updates.worked,
        })
        .eq('id', id);

      if (error) throw error;

      await loadLeaveRequests();
    } catch (error) {
      console.error('Error updating leave request:', error);
      throw error;
    }
  };

  const deleteLeaveRequest = async (id: string) => {
    if (!supabase) {
      // Demo mode
      setLeaveRequests(prev => prev.filter(request => request.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadLeaveRequests();
    } catch (error) {
      console.error('Error deleting leave request:', error);
      throw error;
    }
  };

  const getLeaveRequestsByEmployee = (employeeId: string) => {
    return leaveRequests.filter(request => request.employeeId === employeeId);
  };

  const getLeaveRequestsForDateRange = (startDate: string, endDate: string) => {
    return leaveRequests.filter(request => 
      request.status === 'approved' &&
      ((request.startDate >= startDate && request.startDate <= endDate) ||
       (request.endDate >= startDate && request.endDate <= endDate) ||
       (request.startDate <= startDate && request.endDate >= endDate))
    );
  };

  const calculateLeaveBalance = (employeeId: string): LeaveBalance => {
    const employeeRequests = getLeaveRequestsByEmployee(employeeId);
    const approvedRequests = employeeRequests.filter(req => req.status === 'approved');
    
    const currentYear = new Date().getFullYear();
    const yearRequests = approvedRequests.filter(req => 
      new Date(req.startDate).getFullYear() === currentYear
    );

    const usedVacationDays = yearRequests
      .filter(req => req.type === 'vacation')
      .reduce((sum, req) => sum + req.daysCount, 0);

    const usedSickDays = yearRequests
      .filter(req => req.type === 'sick_leave')
      .reduce((sum, req) => sum + req.daysCount, 0);

    const usedPersonalDays = yearRequests
      .filter(req => req.type === 'personal_leave')
      .reduce((sum, req) => sum + req.daysCount, 0);

    const usedCompensatoryDays = yearRequests
      .filter(req => req.type === 'compensatory_leave')
      .reduce((sum, req) => sum + req.daysCount, 0);

    return {
      employeeId,
      vacationDays: 28, // Стандартный отпуск в России
      sickDays: 365, // Без ограничений по больничным
      personalDays: 5, // Личные дни
      compensatoryDays: 10, // Отгулы
      usedVacationDays,
      usedSickDays,
      usedPersonalDays,
      usedCompensatoryDays,
    };
  };

  const isEmployeeOnLeave = (employeeId: string, date: string): LeaveRequest | null => {
    const approvedRequests = leaveRequests.filter(req => 
      req.employeeId === employeeId && 
      req.status === 'approved' &&
      date >= req.startDate && 
      date <= req.endDate
    );
    
    return approvedRequests[0] || null;
  };

  return {
    leaveRequests,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    getLeaveRequestsByEmployee,
    getLeaveRequestsForDateRange,
    calculateLeaveBalance,
    isEmployeeOnLeave,
  };
};