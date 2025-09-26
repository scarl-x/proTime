import React, { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, AlertCircle, CheckCircle, Tag } from 'lucide-react';
import { Booking, User as UserType, Project, TimeSlot, TaskCategory } from '../../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => void;
  employees: UserType[];
  projects: Project[];
  currentUser: UserType;
  timeSlots: TimeSlot[];
  checkAvailability: (employeeId: string, date: string, startTime: string, endTime: string) => boolean;
  selectedEmployee?: UserType;
  selectedDate?: string;
  categories?: TaskCategory[];
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employees,
  projects,
  currentUser,
  timeSlots,
  checkAvailability,
  selectedEmployee,
  selectedDate,
  categories = [],
}) => {
  const [formData, setFormData] = useState({
    employeeId: selectedEmployee?.id || '',
    projectId: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '16:00',
    taskDescription: '',
    notes: '',
    category: 'Разработка',
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [conflictDetails, setConflictDetails] = useState<string>('');

  useEffect(() => {
    if (selectedEmployee) {
      setFormData(prev => ({ ...prev, employeeId: selectedEmployee.id }));
    }
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [selectedEmployee, selectedDate]);

  useEffect(() => {
    if (formData.employeeId && formData.date && formData.startTime && formData.endTime) {
      const available = checkAvailability(
        formData.employeeId,
        formData.date,
        formData.startTime,
        formData.endTime
      );
      setIsAvailable(available);
      
      if (!available) {
        // Find conflicting slots/bookings for better UX
        const conflicts = timeSlots.filter(slot => 
          slot.employeeId === formData.employeeId && 
          slot.date === formData.date &&
          ((formData.startTime >= slot.startTime && formData.startTime < slot.endTime) ||
           (formData.endTime > slot.startTime && formData.endTime <= slot.endTime) ||
           (formData.startTime <= slot.startTime && formData.endTime >= slot.endTime))
        );
        
        if (conflicts.length > 0) {
          setConflictDetails(`Конфликт с задачей: "${conflicts[0].task}" (${conflicts[0].startTime}-${conflicts[0].endTime})`);
        } else {
          setConflictDetails('Время уже забронировано');
        }
      }
    }
  }, [formData.employeeId, formData.date, formData.startTime, formData.endTime, timeSlots, checkAvailability]);

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    const start = new Date(`2000-01-01 ${formData.startTime}`);
    const end = new Date(`2000-01-01 ${formData.endTime}`);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAvailable) {
      alert('Выбранное время недоступно. Пожалуйста, выберите другое время.');
      return;
    }

    const duration = calculateDuration();
    if (duration <= 0) {
      alert('Некорректное время. Время окончания должно быть позже времени начала.');
      return;
    }

    onSave({
      requesterId: currentUser.id,
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      durationHours: duration,
      taskDescription: formData.taskDescription,
      status: 'pending',
      notes: formData.notes,
    });

    onClose();
  };

  const resetForm = () => {
    setFormData({
      employeeId: selectedEmployee?.id || '',
      projectId: '',
      date: selectedDate || new Date().toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '16:00',
      taskDescription: '',
      notes: '',
      category: 'Разработка',
    });
    onClose();
  };

  if (!isOpen) return null;

  // Админ должен иметь функционал и админа и сотрудника: разрешаем выбирать админов
  const availableEmployees = employees.filter(emp => emp.id !== currentUser.id);

  const selectedEmployeeData = employees.find(emp => emp.id === formData.employeeId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Забронировать время сотрудника
          </h2>
          <button
            onClick={resetForm}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4" />
                <span>Сотрудник *</span>
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Выберите сотрудника</option>
                {availableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role === 'admin' 
                      ? `Администратор${employee.position ? ` — ${employee.position}` : ''}`
                      : employee.position || 'Сотрудник'
                    }
                  </option>
                ))}
              </select>
            </div>

            {/* Project Selection */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Проект *</span>
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Выберите проект</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Дата *</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Duration Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Продолжительность
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                {calculateDuration()} часов
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4" />
                <span>Время начала *</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4" />
                <span>Время окончания *</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Availability Status */}
          {formData.employeeId && formData.date && formData.startTime && formData.endTime && (
            <div className={`mt-6 p-4 rounded-lg border ${
              isAvailable 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {isAvailable ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Время доступно для бронирования
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">
                      Время недоступно
                    </span>
                  </>
                )}
              </div>
              {!isAvailable && conflictDetails && (
                <p className="text-red-700 text-sm mt-2">{conflictDetails}</p>
              )}
            </div>
          )}

          {/* Task Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание задачи *
            </label>
            <textarea
              value={formData.taskDescription}
              onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Опишите, для чего нужно забронировать время сотрудника..."
              required
            />
          </div>

          {/* Category Selection */}
          <div className="mt-6">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4" />
              <span>Категория</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Разработка">Разработка</option>
                  <option value="Тестирование">Тестирование</option>
                  <option value="Код-ревью">Код-ревью</option>
                  <option value="Совещание">Совещание</option>
                  <option value="Планирование">Планирование</option>
                  <option value="Документация">Документация</option>
                  <option value="Поддержка">Поддержка</option>
                  <option value="Исследование">Исследование</option>
                </>
              )}
            </select>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дополнительные заметки
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Дополнительная информация (необязательно)..."
            />
          </div>

          {/* Selected Employee Info */}
          {selectedEmployeeData && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Информация о сотруднике
              </h4>
              <div className="text-sm text-blue-800">
                <p><strong>Имя:</strong> {selectedEmployeeData.name}</p>
                <p><strong>Должность:</strong> {selectedEmployeeData.position || 'Не указана'}</p>
                <p><strong>Email:</strong> {selectedEmployeeData.email}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!isAvailable}
              className={`px-6 py-2 rounded-lg transition duration-200 ${
                isAvailable
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Забронировать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};