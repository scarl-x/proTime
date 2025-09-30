import { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, hasSupabaseCredentials } from '../lib/supabase';
import { 
  createJWTToken, 
  validateStoredToken, 
  saveTokenToStorage, 
  removeTokenFromStorage,
  JWTPayload 
} from '../utils/jwtUtils';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const initializeAuth = async () => {
      // Сначала пытаемся восстановить пользователя из JWT токена
      const tokenPayload = await validateStoredToken();
      
      // Загружаем пользователей
      let loadedUsers: User[] = [];
      if (hasSupabaseCredentials && supabase) {
        loadedUsers = await loadUsersAndReturn();
      } else {
        loadedUsers = loadDemoUsersAndReturn();
      }
      
      // Если токен валиден, восстанавливаем сессию
      if (tokenPayload) {
        // Находим пользователя по ID из токена
        const foundUser = loadedUsers.find(u => u.id === tokenPayload.userId);
        if (foundUser) {
          setUser(foundUser);
        } else {
          // Если пользователь не найден, удаляем невалидный токен
          removeTokenFromStorage();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const loadDemoUsers = () => {
    const demoUsers: User[] = [
      {
        id: '1',
        name: 'Админ Системы',
        email: 'admin@company.com',
        role: 'admin',
        hasAccount: true,
        password: 'password',
        employmentDate: '2024-01-15',
        timezone: 'Europe/Moscow',
      },
      {
        id: '2',
        name: 'Иван Петров',
        email: 'ivan@company.com',
        role: 'employee',
        position: 'developer',
        hasAccount: true,
        password: 'password',
        birthday: '1988-07-22',
        employmentDate: '2024-03-01',
        timezone: 'Europe/Samara',
      },
      {
        id: '3',
        name: 'Мария Сидорова',
        email: 'maria@company.com',
        role: 'employee',
        position: 'designer',
        hasAccount: true,
        password: 'password',
        birthday: '1992-11-08',
        employmentDate: '2024-06-01',
        timezone: 'Asia/Yekaterinburg',
      },
    ];
    setUsers(demoUsers);
  };

  const loadDemoUsersAndReturn = (): User[] => {
    const demoUsers: User[] = [
      {
        id: '1',
        name: 'Админ Системы',
        email: 'admin@company.com',
        role: 'admin',
        hasAccount: true,
        password: 'password',
        employmentDate: '2024-01-15',
        timezone: 'Europe/Moscow',
      },
      {
        id: '2',
        name: 'Иван Петров',
        email: 'ivan@company.com',
        role: 'employee',
        position: 'developer',
        hasAccount: true,
        password: 'password',
        birthday: '1988-07-22',
        employmentDate: '2024-03-01',
        timezone: 'Europe/Samara',
      },
      {
        id: '3',
        name: 'Мария Сидорова',
        email: 'maria@company.com',
        role: 'employee',
        position: 'designer',
        hasAccount: true,
        password: 'password',
        birthday: '1992-11-08',
        employmentDate: '2024-06-01',
        timezone: 'Asia/Yekaterinburg',
      },
    ];
    setUsers(demoUsers);
    return demoUsers;
  };

  const loadUsers = async () => {
    if (!supabase) return;
    
    try {
      console.log('Loading users from Supabase...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error loading users:', error);
        throw error;
      }

      console.log('Raw users data from Supabase:', data);
      console.log('Timezone fields in data:', data.map(u => ({ id: u.id, name: u.name, timezone: u.timezone })));

      const formattedUsers: User[] = data.map(dbUser => ({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as 'admin' | 'employee',
        position: dbUser.position,
        hasAccount: dbUser.has_account,
        password: dbUser.password,
        birthday: dbUser.birthday,
        employmentDate: dbUser.employment_date,
        terminationDate: dbUser.termination_date,
        timezone: dbUser.timezone ?? undefined,
      }));

      console.log('Formatted users:', formattedUsers);
      setUsers(formattedUsers);
      
      // Если нет пользователей в базе, добавляем демо-пользователей
      if (formattedUsers.length === 0) {
        console.log('No users found in database, loading demo users');
        await createDemoUsersInSupabase();
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // В случае ошибки загружаем демо-пользователей
      console.log('Error loading from database, falling back to demo users');
      loadDemoUsers();
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsersAndReturn = async (): Promise<User[]> => {
    if (!supabase) return loadDemoUsersAndReturn();
    
    try {
      console.log('Loading users from Supabase...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error loading users:', error);
        throw error;
      }

      console.log('Raw users data from Supabase:', data);
      console.log('Timezone fields in data:', data.map(u => ({ id: u.id, name: u.name, timezone: u.timezone })));

      const formattedUsers: User[] = data.map(dbUser => ({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as 'admin' | 'employee',
        position: dbUser.position,
        hasAccount: dbUser.has_account,
        password: dbUser.password,
        birthday: dbUser.birthday,
        employmentDate: dbUser.employment_date,
        terminationDate: dbUser.termination_date,
        timezone: dbUser.timezone ?? undefined,
      }));

      console.log('Formatted users:', formattedUsers);
      setUsers(formattedUsers);
      
      // Если нет пользователей в базе, добавляем демо-пользователей
      if (formattedUsers.length === 0) {
        console.log('No users found in database, loading demo users');
        await createDemoUsersInSupabase();
        return await loadUsersAndReturn(); // Рекурсивно загружаем после создания демо-пользователей
      }
      
      return formattedUsers;
    } catch (error) {
      console.error('Error loading users:', error);
      // В случае ошибки загружаем демо-пользователей
      console.log('Error loading from database, falling back to demo users');
      return loadDemoUsersAndReturn();
    }
  };

  const createDemoUsersInSupabase = async () => {
    if (!supabase) return;
    
    try {
      console.log('Creating demo users in Supabase...');
      const demoUsers = [
        {
          name: 'Админ Системы',
          email: 'admin@company.com',
          role: 'admin',
          has_account: true,
          password: 'password',
          employment_date: '2024-01-15',
        },
        {
          name: 'Иван Петров',
          email: 'ivan@company.com',
          role: 'employee',
          position: 'developer',
          has_account: true,
          password: 'password',
          birthday: '1988-07-22',
          employment_date: '2024-03-01',
        },
        {
          name: 'Мария Сидорова',
          email: 'maria@company.com',
          role: 'employee',
          position: 'designer',
          has_account: true,
          password: 'password',
          birthday: '1992-11-08',
          employment_date: '2024-06-01',
        },
      ];

      const { data, error } = await supabase
        .from('users')
        .insert(demoUsers)
        .select();

      if (error) {
        console.error('Error creating demo users:', error);
        loadDemoUsers();
        return;
      }

      console.log('Demo users created successfully:', data);
      await loadUsers();
    } catch (error) {
      console.error('Error in createDemoUsersInSupabase:', error);
      loadDemoUsers();
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email === email && u.hasAccount);
    if (foundUser && foundUser.password === password) {
      setUser(foundUser);
      
      // Создаем и сохраняем JWT токен
      const token = await createJWTToken(foundUser);
      saveTokenToStorage(token);
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    // Удаляем JWT токен из localStorage
    removeTokenFromStorage();
  };

  const switchUser = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
    }
  };

  const addEmployee = async (employeeData: Omit<User, 'id'>) => {
    if (!supabase) {
      // Demo mode - add to local state
      const newEmployee: User = {
        ...employeeData,
        id: Date.now().toString(),
      };
      setUsers(prev => [...prev, newEmployee]);
      return newEmployee;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: employeeData.name,
          email: employeeData.email,
          role: 'employee',
          position: employeeData.position,
          has_account: false,
          birthday: employeeData.birthday || null,
          employment_date: employeeData.employmentDate || null,
          termination_date: employeeData.terminationDate || null,
        })
        .select()
        .single();

      if (error) throw error;

      await loadUsers();
      return data;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const createEmployeeAccount = async (employeeId: string, password: string) => {
    if (!supabase) {
      // Demo mode - update local state
      setUsers(prev => prev.map(user => 
        user.id === employeeId 
          ? { ...user, hasAccount: true, password }
          : user
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ has_account: true, password })
        .eq('id', employeeId);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error('Error creating employee account:', error);
      throw error;
    }
  };

  const removeEmployeeAccount = async (employeeId: string) => {
    if (!supabase) {
      // Demo mode - update local state
      setUsers(prev => prev.map(user => 
        user.id === employeeId 
          ? { ...user, hasAccount: false, password: undefined }
          : user
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ has_account: false, password: null })
        .eq('id', employeeId);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error('Error removing employee account:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<User>) => {
    if (!supabase) {
      // Demo mode - update local state
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...updates } : user
      ));
      return;
    }

    try {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.position !== undefined) payload.position = updates.position;
      if (updates.birthday !== undefined) payload.birthday = updates.birthday || null;
      if (updates.employmentDate !== undefined) payload.employment_date = updates.employmentDate || null;
      if (updates.terminationDate !== undefined) payload.termination_date = updates.terminationDate || null;

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!supabase) {
      // Demo mode - remove from local state
      setUsers(prev => prev.filter(user => user.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadUsers();
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  };

  const updateTimezone = async (timezone: string) => {
    try {
      if (hasSupabaseCredentials && supabase && user) {
        const { error } = await supabase
          .from('users')
          .update({ timezone })
          .eq('id', user.id);
        if (error) throw error;
        
        // Обновляем локальное состояние
        setUser(prev => prev ? { ...prev, timezone } : prev);
        setUsers(prev => prev.map(u => u.id === user?.id ? { ...u, timezone } : u));
      }
    } catch (err) {
      console.error('Failed to update timezone:', err);
      throw err;
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    switchUser,
    allUsers: users,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    createEmployeeAccount,
    removeEmployeeAccount,
    updateTimezone,
  };
};