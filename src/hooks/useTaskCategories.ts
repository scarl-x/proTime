import { useState, useEffect } from 'react';
import { TaskCategory } from '../types';
import { taskCategoriesAPI } from '../lib/api';

export const useTaskCategories = (currentUserId?: string) => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);

  useEffect(() => {
    if (currentUserId) {
      loadCategories();
    }
  }, [currentUserId]);

  const loadDemoCategories = () => {
    const demoCategories: TaskCategory[] = [
      {
        id: '1',
        name: 'Разработка API',
        description: 'Создание и разработка API endpoints',
        defaultHours: 16,
        defaultHourlyRate: 3500,
        color: '#3B82F6',
        isActive: true,
        createdBy: '1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Тестирование',
        description: 'Написание и выполнение тестов',
        defaultHours: 8,
        defaultHourlyRate: 3000,
        color: '#10B981',
        isActive: true,
        createdBy: '1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Код-ревью',
        description: 'Проверка и ревью кода коллег',
        defaultHours: 4,
        defaultHourlyRate: 3500,
        color: '#8B5CF6',
        isActive: true,
        createdBy: '1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Документация',
        description: 'Написание технической документации',
        defaultHours: 6,
        defaultHourlyRate: 2500,
        color: '#F59E0B',
        isActive: true,
        createdBy: '1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'Исправление багов',
        description: 'Поиск и исправление ошибок',
        defaultHours: 4,
        defaultHourlyRate: 3500,
        color: '#EF4444',
        isActive: true,
        createdBy: '1',
        createdAt: new Date().toISOString(),
      },
    ];
    setCategories(demoCategories);
  };

  const loadCategories = async () => {
    try {
      const loadedCategories = await taskCategoriesAPI.getAll(true);
      // Фильтруем категории: показываем только те, которые созданы текущим пользователем
      const filteredCategories = currentUserId 
        ? loadedCategories.filter(cat => cat.createdBy === currentUserId)
        : loadedCategories;
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error loading task categories:', error);
      loadDemoCategories();
    }
  };

  const createCategory = async (category: Omit<TaskCategory, 'id' | 'createdAt'>) => {
    try {
      const newCategory = await taskCategoriesAPI.create(category);
      await loadCategories();
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<TaskCategory>) => {
    try {
      await taskCategoriesAPI.update(id, updates);
      await loadCategories();
    } catch (error) {
      console.error('Error updating task category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Мягкое удаление - помечаем как неактивную
      await taskCategoriesAPI.update(id, { isActive: false });
      await loadCategories();
    } catch (error) {
      console.error('Error deleting task category:', error);
      throw error;
    }
  };

  const getActiveCategories = () => {
    return categories.filter(category => category.isActive);
  };

  return {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    getActiveCategories,
  };
};
