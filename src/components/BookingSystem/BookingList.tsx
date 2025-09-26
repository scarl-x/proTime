import React, { useState } from 'react';
import { Clock, User, Calendar, CheckCircle, XCircle, AlertCircle, Eye, MessageSquare } from 'lucide-react';
import { Booking, User as UserType, Project } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface BookingListProps {
  bookings: Booking[];
  employees: UserType[];
  projects: Project[];
  currentUser: UserType;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
}

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  employees,
  projects,
  currentUser,
  onUpdateBooking,
  onDeleteBooking,
}) => {
  const [filter, setFilter] = useState<'all' | 'my-requests' | 'my-bookings'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'Неизвестный сотрудник';
  };

  const getProjectName = (id: string) => {
    return projects.find(proj => proj.id === id)?.name || 'Неизвестный проект';
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    // Filter by user relationship
    if (filter === 'my-requests') {
      filtered = filtered.filter(booking => booking.requesterId === currentUser.id);
    } else if (filter === 'my-bookings') {
      filtered = filtered.filter(booking => booking.employeeId === currentUser.id);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const handleStatusChange = (bookingId: string, newStatus: Booking['status']) => {
    onUpdateBooking(bookingId, { status: newStatus });
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'Ожидает подтверждения';
      case 'approved':
        return 'Подтверждено';
      case 'rejected':
        return 'Отклонено';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
    }
  };

  const canManageBooking = (booking: Booking) => {
    return booking.employeeId === currentUser.id || currentUser.role === 'admin';
  };

  const canCancelBooking = (booking: Booking) => {
    return booking.requesterId === currentUser.id && 
           ['pending', 'approved'].includes(booking.status);
  };

  const filteredBookings = getFilteredBookings();

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
            >
              <option value="all">Все бронирования</option>
              <option value="my-requests">Мои запросы</option>
              <option value="my-bookings">Мое время</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Статус:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидает подтверждения</option>
              <option value="approved">Подтверждено</option>
              <option value="rejected">Отклонено</option>
              <option value="completed">Завершено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Бронирования ({filteredBookings.length})
          </h3>
        </div>

        {filteredBookings.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50 transition duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {booking.taskDescription}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>
                          <strong>Запросил:</strong> {getEmployeeName(booking.requesterId)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>
                          <strong>Сотрудник:</strong> {getEmployeeName(booking.employeeId)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          <strong>Проект:</strong> {getProjectName(booking.projectId)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mt-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          <strong>Дата:</strong> {formatDate(booking.date)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          <strong>Время:</strong> {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          <strong>Длительность:</strong> {booking.durationHours}ч
                        </span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Заметки:</p>
                            <p className="text-sm text-gray-600">{booking.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                      title="Подробности"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Action buttons based on user role and booking status */}
                    {canManageBooking(booking) && booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'approved')}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                          title="Подтвердить"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking.id, 'rejected')}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                          title="Отклонить"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {canManageBooking(booking) && booking.status === 'approved' && (
                      <button
                        onClick={() => handleStatusChange(booking.id, 'completed')}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                        title="Отметить как завершенное"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}

                    {canCancelBooking(booking) && (
                      <button
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                        title="Отменить бронирование"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет бронирований для отображения</p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Детали бронирования
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedBooking.taskDescription}
                  </h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusLabel(selectedBooking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Запросил</p>
                    <p className="text-gray-900">{getEmployeeName(selectedBooking.requesterId)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Сотрудник</p>
                    <p className="text-gray-900">{getEmployeeName(selectedBooking.employeeId)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Проект</p>
                    <p className="text-gray-900">{getProjectName(selectedBooking.projectId)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Дата</p>
                    <p className="text-gray-900">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Время</p>
                    <p className="text-gray-900">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Длительность</p>
                    <p className="text-gray-900">{selectedBooking.durationHours} часов</p>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Заметки</p>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{selectedBooking.notes}</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-4 border-t">
                  <p>Создано: {new Date(selectedBooking.createdAt).toLocaleString('ru-RU')}</p>
                  <p>Обновлено: {new Date(selectedBooking.updatedAt).toLocaleString('ru-RU')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};