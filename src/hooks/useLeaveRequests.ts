import { useState, useEffect } from 'react';
import { LeaveRequest, LeaveBalance } from '../types';
import { leaveRequestsAPI } from '../lib/api';

export const useLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    loadLeaveRequests();
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
    try {
      const requests = await leaveRequestsAPI.getAll();
      setLeaveRequests(requests);
    } catch (error) {
      console.error('Error loading leave requests:', error);
      loadDemoLeaveRequests();
    }
  };

  const createLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newRequest = await leaveRequestsAPI.create(request);
      await loadLeaveRequests();
      return newRequest;
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  };

  const updateLeaveRequest = async (id: string, updates: Partial<LeaveRequest>) => {
    try {
      await leaveRequestsAPI.update(id, updates);
      await loadLeaveRequests();
    } catch (error) {
      console.error('Error updating leave request:', error);
      throw error;
    }
  };

  const deleteLeaveRequest = async (id: string) => {
    try {
      await leaveRequestsAPI.delete(id);
      await loadLeaveRequests();
    } catch (error) {
      console.error('Error deleting leave request:', error);
      throw error;
    }
  };

  const approveLeaveRequest = async (id: string) => {
    try {
      await leaveRequestsAPI.approve(id);
      await loadLeaveRequests();
    } catch (error) {
      console.error('Error approving leave request:', error);
      throw error;
    }
  };

  const rejectLeaveRequest = async (id: string, notes?: string) => {
    try {
      await leaveRequestsAPI.reject(id, notes);
      await loadLeaveRequests();
    } catch (error) {
      console.error('Error rejecting leave request:', error);
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
    approveLeaveRequest,
    rejectLeaveRequest,
    getLeaveRequestsByEmployee,
    getLeaveRequestsForDateRange,
    calculateLeaveBalance,
    isEmployeeOnLeave,
  };
};
