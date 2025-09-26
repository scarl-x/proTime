import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, Clock } from 'lucide-react';
import { LeaveRequest, User as UserType } from '../../types';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  employees: UserType[];
  currentUser: UserType;
  editingRequest?: LeaveRequest;
}

const LEAVE_TYPES = {
  vacation: 'Отпуск',
  sick_leave: 'Больничный',
  personal_leave: 'Личный день',
  compensatory_leave: 'Отгул',
};

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employees,
  currentUser,
  editingRequest,
}) => {
  const [formData, setFormData] = useState({
    employeeId: currentUser.id,
    type: 'vacation' as LeaveRequest['type'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'pending' as LeaveRequest['status'],
    notes: '',
  });

  useEffect(() => {
    if (editingRequest) {
      setFormData({
        employeeId: editingRequest.employeeId,
        type: editingRequest.type,
        startDate: editingRequest.startDate,
        endDate: editingRequest.endDate,
        reason: editingRequest.reason,
        status: editingRequest.status,
        notes: editingRequest.notes || '',
      });
    } else {
      setFormData({
        employeeId: currentUser.id,
        type: 'vacation',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        status: 'pending',
        notes: '',
      });
    }
  }, [editingRequest, currentUser.id]);

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const daysCount = calculateDays();
    if (daysCount <= 0) {
      alert('Некорректные даты');
      return;
    }

    onSave({
      ...formData,
      daysCount,
    });

    onClose();
  };

  if (!isOpen) return null;

  const availableEmployees = currentUser.role === 'admin' 
    ? employees.filter(emp => emp.role === 'employee')
    : [currentUser];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingRequest ? 'Редактировать заявку' : 'Новая заявка на отпуск'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            {currentUser.role === 'admin' && (
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4" />
                  <span>Сотрудник</span>
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип отпуска
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveRequest['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {Object.entries(LEAVE_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status (for admin) */}
            {currentUser.role === 'admin' && editingRequest && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LeaveRequest['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Ожидает рассмотрения</option>
                  <option value="approved">Одобрено</option>
                  <option value="rejected">Отклонено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Дата начала</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Дата окончания</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Days Count Display */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Количество дней: <strong>{calculateDays()}</strong></span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="mt-6">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4" />
              <span>Причина/Описание</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Укажите причину отпуска..."
              required
            />
          </div>

          {/* Admin Notes */}
          {currentUser.role === 'admin' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заметки администратора
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Дополнительные заметки..."
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              {editingRequest ? 'Сохранить' : 'Создать заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};