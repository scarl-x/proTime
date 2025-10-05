import { useState, useEffect } from 'react';
import { User } from '../types';
import { API_URL, hasApiConnection } from '../lib/api';
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
      if (hasApiConnection) {
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
    if (!hasApiConnection) {
      loadDemoUsers();
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();

      const formattedUsers: User[] = data.map((dbUser: any) => ({
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

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      loadDemoUsers();
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsersAndReturn = async (): Promise<User[]> => {
    if (!hasApiConnection) {
      return loadDemoUsersAndReturn();
    }
    
    // REST API режим
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      
      const formattedUsers: User[] = data.map((dbUser: any) => ({
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

      setUsers(formattedUsers);
      return formattedUsers;
    } catch (error) {
      console.error('Error loading users from REST API:', error);
      return loadDemoUsersAndReturn();
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
    if (!hasApiConnection) {
      // Demo mode - add to local state
      const newEmployee: User = {
        ...employeeData,
        id: Date.now().toString(),
      };
      setUsers(prev => [...prev, newEmployee]);
      return newEmployee;
    }

    // TODO: Implement REST API for adding employee
    console.log('addEmployee not yet implemented for REST API');
    return null;
  };

  const createEmployeeAccount = async (employeeId: string, password: string) => {
    if (!hasApiConnection) {
      // Demo mode - update local state
      setUsers(prev => prev.map(user => 
        user.id === employeeId 
          ? { ...user, hasAccount: true, password }
          : user
      ));
      return;
    }

    // TODO: Implement REST API for creating employee account
    console.log('createEmployeeAccount not yet implemented for REST API');
  };

  const removeEmployeeAccount = async (employeeId: string) => {
    if (!hasApiConnection) {
      // Demo mode - update local state
      setUsers(prev => prev.map(user => 
        user.id === employeeId 
          ? { ...user, hasAccount: false, password: undefined }
          : user
      ));
      return;
    }

    // TODO: Implement REST API for removing employee account
    console.log('removeEmployeeAccount not yet implemented for REST API');
  };

  const updateEmployee = async (id: string, updates: Partial<User>) => {
    if (!hasApiConnection) {
      // Demo mode - update local state
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...updates } : user
      ));
      return;
    }

    // TODO: Implement REST API for updating employee
    console.log('updateEmployee not yet implemented for REST API');
  };

  const deleteEmployee = async (id: string) => {
    if (!hasApiConnection) {
      // Demo mode - remove from local state
      setUsers(prev => prev.filter(user => user.id !== id));
      return;
    }

    // TODO: Implement REST API for deleting employee
    console.log('deleteEmployee not yet implemented for REST API');
  };

  const updateTimezone = async (timezone: string) => {
    try {
      if (hasApiConnection && user) {
        // TODO: Implement REST API for updating timezone
        console.log('updateTimezone not yet implemented for REST API');
        
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