import { useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI, usersAPI, setToken, getToken, removeToken } from '../lib/api';
import { 
  validateStoredToken, 
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
      try {
        loadedUsers = await usersAPI.getAll();
        setUsers(loadedUsers);
      } catch (error) {
        // Если не удалось загрузить с API, используем демо данные
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
          removeToken();
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
    try {
      const loadedUsers = await usersAPI.getAll();
      setUsers(loadedUsers);
    } catch (error) {
      // В случае ошибки загружаем демо-пользователей
      loadDemoUsers();
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsersAndReturn = async (): Promise<User[]> => {
    try {
      const loadedUsers = await usersAPI.getAll();
      setUsers(loadedUsers);
      return loadedUsers;
    } catch (error) {
      // В случае ошибки загружаем демо-пользователей
      return loadDemoUsersAndReturn();
    }
  };


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);
      if (response.user) {
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    // Удаляем JWT токен из localStorage
    authAPI.logout();
  };

  const switchUser = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
    }
  };

  const addEmployee = async (employeeData: Omit<User, 'id'>) => {
    try {
      const newEmployee = await usersAPI.create(employeeData);
      await loadUsers();
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

  const createEmployeeAccount = async (employeeId: string, password: string) => {
    try {
      await usersAPI.createAccount(employeeId, password);
      await loadUsers();
    } catch (error) {
      console.error('Error creating employee account:', error);
      throw error;
    }
  };

  const removeEmployeeAccount = async (employeeId: string) => {
    try {
      await usersAPI.removeAccount(employeeId);
      await loadUsers();
    } catch (error) {
      console.error('Error removing employee account:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<User>) => {
    try {
      await usersAPI.update(id, updates);
      await loadUsers();
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await usersAPI.delete(id);
      await loadUsers();
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  };

  const updateTimezone = async (timezone: string) => {
    try {
      if (user) {
        await usersAPI.update(user.id, { timezone });
        
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