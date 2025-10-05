import { useState, useEffect } from 'react';
import { TaskCategory } from '../types';
import { API_URL, hasApiConnection } from '../lib/api';


export const useTaskCategories = () => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);

  useEffect(() => {
    if (hasApiConnection) {
      loadCategories();
    } else {
      loadDemoCategories();
    }
  }, []);

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
    if (!hasApiConnection) {
      loadDemoCategories();
      return;
    }
    
    // REST API режим
    try {
      const res = await fetch(`${API_URL}/api/task-categories`);
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      const formattedCategories: TaskCategory[] = data.map((dbCategory: any) => ({
        id: dbCategory.id,
        name: dbCategory.name,
        description: dbCategory.description,
        defaultHours: dbCategory.default_hours,
        defaultHourlyRate: dbCategory.default_hourly_rate,
        color: dbCategory.color,
        isActive: dbCategory.is_active,
        createdBy: dbCategory.created_by,
        createdAt: dbCategory.created_at,
      }));
      setCategories(formattedCategories);
    } catch (e) {
      console.error('Error loading categories from REST API:', e);
      loadDemoCategories();
    }
  };


  const createCategory = async (category: Omit<TaskCategory, 'id' | 'createdAt'>) => {
    if (!hasApiConnection) {
      // Demo mode
      const newCategory: TaskCategory = {
        ...category,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    }
    
    // REST API mode
    try {
      
      const res = await fetch(`${API_URL}/api/task-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          default_hours: category.defaultHours,
          default_hourly_rate: category.defaultHourlyRate,
          color: category.color,
          is_active: category.isActive,
          created_by: category.createdBy,
        }),
      });
      if (!res.ok) throw new Error('Failed to create category');
      await loadCategories();
      return await res.json();
    } catch (error) {
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<TaskCategory>) => {
    if (!hasApiConnection) {
      // Demo mode
      setCategories(prev => prev.map(category => 
        category.id === id ? { ...category, ...updates } : category
      ));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/task-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          defaultHours: updates.defaultHours,
          defaultHourlyRate: updates.defaultHourlyRate,
          color: updates.color,
          isActive: updates.isActive,
        }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      await loadCategories();
    } catch (error) {
      console.error('Error updating task category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!hasApiConnection) {
      // Demo mode
      setCategories(prev => prev.filter(category => category.id !== id));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/task-categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
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


