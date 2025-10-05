import { useState, useEffect } from 'react';
import { LeaveRequest, LeaveBalance } from '../types';
import { API_URL, hasApiConnection } from '../lib/api';


export const useLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    if (hasApiConnection) {
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
    if (!hasApiConnection) {
      loadDemoLeaveRequests();
      return;
    }
    
    // REST API режим
    try {
      const res = await fetch(`${API_URL}/api/leave-requests`);
      if (!res.ok) throw new Error('Failed to load leave requests');
      const data = await res.json();
      const formattedRequests: LeaveRequest[] = data.map((dbRequest: any) => ({
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
      loadDemoLeaveRequests();
    }
  };

  const createLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!hasApiConnection) {
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

    // TODO: Implement REST API for creating leave request
    console.log('createLeaveRequest not yet implemented for REST API');
    return null;
  };

  const updateLeaveRequest = async (id: string, updates: Partial<LeaveRequest>) => {
    if (!hasApiConnection) {
      // Demo mode
      setLeaveRequests(prev => prev.map(request => 
        request.id === id ? { ...request, ...updates, updatedAt: new Date().toISOString() } : request
      ));
      return;
    }

    // TODO: Implement REST API for updating leave request
    console.log('updateLeaveRequest not yet implemented for REST API');
  };

  const deleteLeaveRequest = async (id: string) => {
    if (!hasApiConnection) {
      // Demo mode
      setLeaveRequests(prev => prev.filter(request => request.id !== id));
      return;
    }

    // TODO: Implement REST API for deleting leave request
    console.log('deleteLeaveRequest not yet implemented for REST API');
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


