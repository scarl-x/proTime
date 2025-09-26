import React, { useState, useEffect } from 'react';
import { X, Tag, Clock, DollarSign, Palette, FileText } from 'lucide-react';
import { TaskCategory } from '../../types';

interface TaskCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<TaskCategory, 'id' | 'createdAt'>) => void;
  category?: TaskCategory;
  currentUserId: string;
}

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
  '#14B8A6', '#F472B6', '#A855F7', '#22C55E', '#FB923C'
];

export const TaskCategoryModal: React.FC<TaskCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  currentUserId,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultHours: 8,
    defaultHourlyRate: 3500,
    color: CATEGORY_COLORS[0],
    isActive: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        defaultHours: category.defaultHours,
        defaultHourlyRate: category.defaultHourlyRate,
        color: category.color,
        isActive: category.isActive,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        defaultHours: 8,
        defaultHourlyRate: 3500,
        color: CATEGORY_COLORS[0],
        isActive: true,
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      ...formData,
      createdBy: currentUserId,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {category ? 'Редактировать категорию' : 'Создать категорию задач'}
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
            {/* Category Name */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4" />
                <span>Название категории *</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Разработка API"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                <span>Описание</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Краткое описание типа задач..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Hours */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Часы по умолчанию *</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.defaultHours}
                  onChange={(e) => setFormData({ ...formData, defaultHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Будет автоматически подставляться при создании задач
                </p>
              </div>

              {/* Default Hourly Rate */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Ставка по умолчанию (₽/ч) *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.defaultHourlyRate}
                  onChange={(e) => setFormData({ ...formData, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Palette className="h-4 w-4" />
                <span>Цвет категории</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition duration-200 ${
                      formData.color === color ? 'border-gray-400 scale-110' : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Предварительный просмотр</h4>
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <div>
                  <div className="font-medium text-gray-900">{formData.name || 'Название категории'}</div>
                  <div className="text-sm text-gray-600">
                    {formData.defaultHours}ч • {formData.defaultHourlyRate.toLocaleString('ru-RU')} ₽/ч
                  </div>
                </div>
              </div>
              {formData.description && (
                <p className="text-sm text-gray-600 mt-2">{formData.description}</p>
              )}
            </div>

            {/* Cost Calculation */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Стоимость по умолчанию
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <span>Часы по умолчанию:</span>
                  <span>{formData.defaultHours}ч</span>
                </div>
                <div className="flex justify-between">
                  <span>Ставка за час:</span>
                  <span>{formData.defaultHourlyRate.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between font-medium border-t border-blue-300 pt-1">
                  <span>Стоимость задачи:</span>
                  <span>{(formData.defaultHours * formData.defaultHourlyRate).toLocaleString('ru-RU')} ₽</span>
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
              {category ? 'Сохранить' : 'Создать категорию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};