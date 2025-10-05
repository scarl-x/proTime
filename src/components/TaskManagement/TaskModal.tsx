import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, FileText, Tag, Zap } from 'lucide-react';
import { Task, TaskCategory } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'actualHours' | 'totalCost' | 'createdAt' | 'updatedAt'>) => void;
  task?: Task;
  projectId: string;
  currentUserId: string;
  categories?: TaskCategory[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  projectId,
  currentUserId,
  categories = [],
}) => {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    plannedHours: 0,
    hourlyRate: 3500,
    status: 'new' as Task['status'],
  });
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        categoryId: task.categoryId || '',
        name: task.name,
        description: task.description,
        plannedHours: task.plannedHours,
        hourlyRate: task.hourlyRate,
        status: task.status,
      });
    } else {
      setFormData({
        categoryId: '',
        name: '',
        description: '',
        plannedHours: 0,
        hourlyRate: 3500,
        status: 'new',
      });
    }
  }, [task]);

  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setSelectedCategory(category || null);
    
    if (category) {
      setFormData(prev => ({
        ...prev,
        categoryId: category.id,
        name: category.name,
        description: category.description,
        plannedHours: category.defaultHours,
        hourlyRate: category.defaultHourlyRate,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categoryId: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      ...formData,
      projectId,
      createdBy: currentUserId,
    });

    onClose();
  };

  const calculateTotalCost = () => {
    return formData.plannedHours * formData.hourlyRate;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Редактировать задачу' : 'Создать задачу'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Category Selection */}
            {!task && categories.length > 0 && (
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4" />
                  <span>Категория задачи</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите категорию (необязательно)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} - {category.defaultHours}ч • {category.defaultHourlyRate.toLocaleString('ru-RU')} ₽/ч
                    </option>
                  ))}
                </select>
                {selectedCategory && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Автозаполнение из категории
                      </span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p><strong>Название:</strong> {selectedCategory.name}</p>
                      <p><strong>Часы:</strong> {selectedCategory.defaultHours}ч</p>
                      <p><strong>Ставка:</strong> {selectedCategory.defaultHourlyRate.toLocaleString('ru-RU')} ₽/ч</p>
                      <p><strong>Стоимость:</strong> {(selectedCategory.defaultHours * selectedCategory.defaultHourlyRate).toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Task Name */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                <span>Название задачи *</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Разработка API авторизации"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Подробное описание задачи..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Planned Hours */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Плановые часы *</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.plannedHours}
                  onChange={(e) => setFormData({ ...formData, plannedHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Часы из договора с клиентом
                </p>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Ставка за час (₽) *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="new">Новая</option>
                  <option value="planned">Запланировано</option>
                  <option value="in-progress">В работе</option>
                  <option value="code-review">Код ревью</option>
                  <option value="testing-internal">Тестирование Проявление</option>
                  <option value="testing-client">Тестирование ФЗ</option>
                  <option value="closed">Закрыто</option>
                </select>
              </div>


              {/* Total Cost (calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Общая стоимость
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
                  {calculateTotalCost().toLocaleString('ru-RU')} ₽
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Автоматически рассчитывается
                </p>
              </div>
            </div>


            {/* Cost Breakdown */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Расчет стоимости
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <span>Плановые часы:</span>
                  <span>{formData.plannedHours}ч</span>
                </div>
                <div className="flex justify-between">
                  <span>Ставка за час:</span>
                  <span>{formData.hourlyRate.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between font-medium border-t border-blue-300 pt-1">
                  <span>Итого:</span>
                  <span>{calculateTotalCost().toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </div>
          </div>

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
              {task ? 'Сохранить' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};