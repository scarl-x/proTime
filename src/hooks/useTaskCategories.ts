import { useState, useEffect } from 'react';
import { TaskCategory } from '../types';
import { supabase, hasSupabaseCredentials } from '../lib/supabase';

export const useTaskCategories = () => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);

  useEffect(() => {
    if (hasSupabaseCredentials && supabase) {
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
    if (!supabase) return;
    
    try {
      console.log('Loading task categories from Supabase...');
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error loading task categories:', error);
        throw error;
      }

      const formattedCategories: TaskCategory[] = data.map(dbCategory => ({
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
      
      if (formattedCategories.length === 0) {
        console.log('No categories found, creating demo categories...');
        await createDemoCategoriesInSupabase();
      }
    } catch (error) {
      console.error('Error loading task categories:', error);
      loadDemoCategories();
    }
  };

  const createDemoCategoriesInSupabase = async () => {
    if (!supabase) return;
    
    try {
      console.log('Creating demo task categories in Supabase...');
      
      // Get admin user ID
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (!adminUser) {
        console.log('No admin user found, skipping demo categories creation');
        return;
      }

      const demoCategories = [
        {
          name: 'Разработка API',
          description: 'Создание и разработка API endpoints',
          default_hours: 16,
          default_hourly_rate: 3500,
          color: '#3B82F6',
          created_by: adminUser.id,
        },
        {
          name: 'Тестирование',
          description: 'Написание и выполнение тестов',
          default_hours: 8,
          default_hourly_rate: 3000,
          color: '#10B981',
          created_by: adminUser.id,
        },
        {
          name: 'Код-ревью',
          description: 'Проверка и ревью кода коллег',
          default_hours: 4,
          default_hourly_rate: 3500,
          color: '#8B5CF6',
          created_by: adminUser.id,
        },
        {
          name: 'Документация',
          description: 'Написание технической документации',
          default_hours: 6,
          default_hourly_rate: 2500,
          color: '#F59E0B',
          created_by: adminUser.id,
        },
        {
          name: 'Исправление багов',
          description: 'Поиск и исправление ошибок',
          default_hours: 4,
          default_hourly_rate: 3500,
          color: '#EF4444',
          created_by: adminUser.id,
        },
      ];

      const { data, error } = await supabase
        .from('task_categories')
        .insert(demoCategories)
        .select();

      if (error) {
        console.error('Error creating demo categories:', error);
        loadDemoCategories();
        return;
      }

      console.log('Demo task categories created successfully:', data);
      await loadCategories();
    } catch (error) {
      console.error('Error in createDemoCategoriesInSupabase:', error);
      loadDemoCategories();
    }
  };

  const createCategory = async (category: Omit<TaskCategory, 'id' | 'createdAt'>) => {
    if (!supabase) {
      // Demo mode
      const newCategory: TaskCategory = {
        ...category,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    }

    try {
      const { data, error } = await supabase
        .from('task_categories')
        .insert({
          name: category.name,
          description: category.description,
          default_hours: category.defaultHours,
          default_hourly_rate: category.defaultHourlyRate,
          color: category.color,
          is_active: category.isActive,
          created_by: category.createdBy,
        })
        .select()
        .single();

      if (error) throw error;

      await loadCategories();
      return data;
    } catch (error) {
      console.error('Error creating task category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<TaskCategory>) => {
    if (!supabase) {
      // Demo mode
      setCategories(prev => prev.map(category => 
        category.id === id ? { ...category, ...updates } : category
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('task_categories')
        .update({
          name: updates.name,
          description: updates.description,
          default_hours: updates.defaultHours,
          default_hourly_rate: updates.defaultHourlyRate,
          color: updates.color,
          is_active: updates.isActive,
        })
        .eq('id', id);

      if (error) throw error;

      await loadCategories();
    } catch (error) {
      console.error('Error updating task category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!supabase) {
      // Demo mode
      setCategories(prev => prev.filter(category => category.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('task_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

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