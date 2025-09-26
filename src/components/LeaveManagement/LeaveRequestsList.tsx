import React, { useState } from 'react';
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Eye, Edit2, Trash2 } from 'lucide-react';
import { LeaveRequest, User as UserType } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface LeaveRequestsListProps {
  leaveRequests: LeaveRequest[];
  employees: UserType[];
  currentUser: UserType;
  onUpdateRequest: (id: string, updates: Partial<LeaveRequest>) => void;
  onDeleteRequest: (id: string) => void;
  onEditRequest: (request: LeaveRequest) => void;
}

const LEAVE_TYPES = {
  vacation: 'Отпуск',
  sick_leave: 'Больничный',
  personal_leave: 'Личный день',
  compensatory_leave: 'Отгул',
};

const STATUS_LABELS = {
  pending: 'Ожидает рассмотрения',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
};

export const LeaveRequestsList: React.FC<LeaveRequestsListProps> = ({
  leaveRequests,
  employees,
  currentUser,
  onUpdateRequest,
  onDeleteRequest,
  onEditRequest,
}) => {
  const [filter, setFilter] = useState<'all' | 'my-requests' | 'pending'>(
    currentUser.role === 'employee' ? 'my-requests' : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'Неизвестный сотрудник';
  };

  const getFilteredRequests = () => {
    let filtered = leaveRequests;

    // Обычные сотрудники всегда видят только свои заявки
    if (currentUser.role === 'employee' || filter === 'my-requests') {
      filtered = filtered.filter(request => request.employeeId === currentUser.id);
    } else if (filter === 'pending') {
      filtered = filtered.filter(request => request.status === 'pending');
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (employeeFilter !== 'all') {
      filtered = filtered.filter(request => request.employeeId === employeeFilter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getStatusColor = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'vacation':
        return 'bg-blue-100 text-blue-800';
      case 'sick_leave':
        return 'bg-red-100 text-red-800';
      case 'personal_leave':
        return 'bg-purple-100 text-purple-800';
      case 'compensatory_leave':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (requestId: string, newStatus: LeaveRequest['status']) => {
    const updates: Partial<LeaveRequest> = { status: newStatus };
    
    if (newStatus === 'approved') {
      updates.approvedBy = currentUser.id;
      updates.approvedAt = new Date().toISOString();
    }

    onUpdateRequest(requestId, updates);
  };

  const canManageRequest = (request: LeaveRequest) => {
    return currentUser.role === 'admin' || request.employeeId === currentUser.id;
  };

  const canApproveRequest = (request: LeaveRequest) => {
    return currentUser.role === 'admin' && request.status === 'pending';
  };

  const filteredRequests = getFilteredRequests();
  const availableEmployees = employees.filter(emp => emp.role === 'employee');

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Показать:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={currentUser.role === 'employee'}
            >
              <option value="all">Все заявки</option>
              <option value="my-requests">Мои заявки</option>
              {currentUser.role === 'admin' && (
                <option value="pending">Ожидают рассмотрения</option>
              )}
            </select>
            {currentUser.role === 'employee' && (
              <span className="text-xs text-gray-500 ml-2">
                (только ваши заявки)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Статус:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидает рассмотрения</option>
              <option value="approved">Одобрено</option>
              <option value="rejected">Отклонено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>

          {currentUser.role === 'admin' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Сотрудник:</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все сотрудники</option>
                {availableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Active filters indicator */}
        {(filter !== 'all' || statusFilter !== 'all' || employeeFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Активные фильтры:</span>
              {filter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {filter === 'my-requests' ? 'Мои заявки' : 'Ожидают рассмотрения'}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]}
                </span>
              )}
              {employeeFilter !== 'all' && currentUser.role === 'admin' && (
                <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  {getEmployeeName(employeeFilter)}
                </span>
              )}
              <button
                onClick={() => {
                  setFilter('all');
                  setStatusFilter('all');
                  setEmployeeFilter('all');
                }}
                className="text-blue-600 hover:text-blue-700 text-xs underline"
              >
                Сбросить все
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Заявки на отпуска ({filteredRequests.length})
          </h3>
        </div>

        {filteredRequests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(request.type)}`}>
                        {LEAVE_TYPES[request.type]}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>
                          <strong>Сотрудник:</strong> {getEmployeeName(request.employeeId)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          <strong>Период:</strong> {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          <strong>Дней:</strong> {request.daysCount}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 mb-3">
                      <strong>Причина:</strong> {request.reason}
                    </div>

                    {request.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <strong>Заметки администратора:</strong> {request.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {canApproveRequest(request) && (
                      <>
                        <button
                          onClick={() => handleStatusChange(request.id, 'approved')}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                          title="Одобрить"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(request.id, 'rejected')}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                          title="Отклонить"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {canManageRequest(request) && (
                      <>
                        <button
                          onClick={() => onEditRequest(request)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                          title="Редактировать"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
                              onDeleteRequest(request.id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет заявок для отображения</p>
          </div>
        )}
      </div>
    </div>
  );
};