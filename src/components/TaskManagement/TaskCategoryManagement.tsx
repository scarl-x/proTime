import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Clock, DollarSign } from 'lucide-react';
import { TaskCategory } from '../../types';
import { TaskCategoryModal } from './TaskCategoryModal';

interface TaskCategoryManagementProps {
  categories: TaskCategory[];
  onCreateCategory: (category: Omit<TaskCategory, 'id' | 'createdAt'>) => void;
  onUpdateCategory: (id: string, updates: Partial<TaskCategory>) => void;
  onDeleteCategory: (id: string) => void;
  currentUserId: string;
}

export const TaskCategoryManagement: React.FC<TaskCategoryManagementProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  currentUserId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);

  const handleEdit = (category: TaskCategory) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = (category: TaskCategory) => {
    if (window.confirm(`Вы уверены, что хотите удалить категорию "${category.name}"?`)) {
      onDeleteCategory(category.id);
    }
  };

  const handleSave = (categoryData: Omit<TaskCategory, 'id' | 'createdAt'>) => {
    if (editingCategory) {
      onUpdateCategory(editingCategory.id, categoryData);
    } else {
      onCreateCategory(categoryData);
    }
    setEditingCategory(null);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Категории задач</h2>
          <p className="text-gray-600 mt-1">
            Создавайте шаблоны для быстрого создания типовых задач
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Создать категорию</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition duration-200"
          >
            <div
              className="h-3"
              style={{ backgroundColor: category.color }}
            />
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                  </div>
                  
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {category.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                    title="Редактировать"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Часы по умолчанию:</span>
                  </div>
                  <span className="font-medium text-gray-900">{category.defaultHours}ч</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>Ставка:</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {category.defaultHourlyRate.toLocaleString('ru-RU')} ₽/ч
                  </span>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Стоимость задачи:</span>
                    <span className="font-bold text-gray-900">
                      {(category.defaultHours * category.defaultHourlyRate).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет категорий задач
          </h3>
          <p className="text-gray-600 mb-6">
            Создайте первую категорию для быстрого создания типовых задач
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Создать категорию</span>
          </button>
        </div>
      )}

      {/* Category Modal */}
      <TaskCategoryModal
        isOpen={showModal}
        onClose={handleClose}
        onSave={handleSave}
        category={editingCategory}
        currentUserId={currentUserId}
      />
    </div>
  );
};