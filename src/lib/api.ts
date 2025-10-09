// API Client для ProTime Backend
import { User, Project, TimeSlot, Task, TaskAssignment, TaskCategory, LeaveRequest, Booking } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Получение токена из localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('protime_token');
};

// Установка токена
export const setToken = (token: string): void => {
  localStorage.setItem('protime_token', token);
};

// Удаление токена
export const removeToken = (): void => {
  localStorage.removeItem('protime_token');
};

// Базовый fetch с обработкой ошибок и авторизацией
const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// API для аутентификации
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  logout: () => {
    removeToken();
  },
};

// API для пользователей
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    return apiFetch('/users');
  },

  getById: async (id: string): Promise<User> => {
    return apiFetch(`/users/${id}`);
  },

  create: async (userData: Omit<User, 'id'>): Promise<User> => {
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch(`/users/${id}`, { method: 'DELETE' });
  },

  createAccount: async (id: string, password: string): Promise<void> => {
    return apiFetch(`/users/${id}/account`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  removeAccount: async (id: string): Promise<void> => {
    return apiFetch(`/users/${id}/account`, { method: 'DELETE' });
  },
};

// API для проектов
export const projectsAPI = {
  getAll: async (): Promise<Project[]> => {
    return apiFetch('/projects');
  },

  getById: async (id: string): Promise<Project> => {
    return apiFetch(`/projects/${id}`);
  },

  create: async (projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    return apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    return apiFetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch(`/projects/${id}`, { method: 'DELETE' });
  },
};

// API для временных слотов
export const timeSlotsAPI = {
  getAll: async (params?: {
    employeeId?: string;
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TimeSlot[]> => {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const query = queryParams.toString();
    return apiFetch(`/time-slots${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<TimeSlot> => {
    return apiFetch(`/time-slots/${id}`);
  },

  create: async (slotData: Omit<TimeSlot, 'id' | 'createdAt'>): Promise<TimeSlot> => {
    return apiFetch('/time-slots', {
      method: 'POST',
      body: JSON.stringify(slotData),
    });
  },

  update: async (id: string, updates: Partial<TimeSlot>): Promise<TimeSlot> => {
    return apiFetch(`/time-slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch(`/time-slots/${id}`, { method: 'DELETE' });
  },
};

// API для задач
export const tasksAPI = {
  getAll: async (params?: { projectId?: string; status?: string }): Promise<Task[]> => {
    const queryParams = new URLSearchParams();
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return apiFetch(`/tasks${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Task> => {
    return apiFetch(`/tasks/${id}`);
  },

  create: async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'totalCost'>): Promise<Task> => {
    return apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  update: async (id: string, updates: Partial<Task>): Promise<Task> => {
    return apiFetch(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch(`/tasks/${id}`, { method: 'DELETE' });
  },

  getAssignments: async (taskId: string): Promise<TaskAssignment[]> => {
    return apiFetch(`/tasks/${taskId}/assignments`);
  },

  createAssignment: async (taskId: string, assignmentData: Omit<TaskAssignment, 'id' | 'taskId' | 'createdAt'>): Promise<TaskAssignment> => {
    return apiFetch(`/tasks/${taskId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
  },

  updateAssignment: async (assignmentId: string, updates: Partial<TaskAssignment>): Promise<TaskAssignment> => {
    return apiFetch(`/tasks/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteAssignment: async (assignmentId: string): Promise<void> => {
    return apiFetch(`/tasks/assignments/${assignmentId}`, { method: 'DELETE' });
  },
};

// API для категорий задач
export const taskCategoriesAPI = {
  getAll: async (isActive?: boolean): Promise<TaskCategory[]> => {
    const query = isActive !== undefined ? `?isActive=${isActive}` : '';
    return apiFetch(`/task-categories${query}`);
  },

  getById: async (id: string): Promise<TaskCategory> => {
    return apiFetch(`/task-categories/${id}`);
  },

  create: async (categoryData: Omit<TaskCategory, 'id' | 'createdAt'>): Promise<TaskCategory> => {
    return apiFetch('/task-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id: string, updates: Partial<TaskCategory>): Promise<TaskCategory> => {
    return apiFetch(`/task-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch(`/task-categories/${id}`, { method: 'DELETE' });
  },
};

// API для заявок на отпуск
export const leaveRequestsAPI = {
  getAll: async (params?: { employeeId?: string; status?: string; type?: string }): Promise<LeaveRequest[]> => {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    const query = queryParams.toString();
    return apiFetch(`/leave-requests${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<LeaveRequest> => {
    return apiFetch(`/leave-requests/${id}`);
  },

  create: async (requestData: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt' | 'approvedBy' | 'approvedAt'>): Promise<LeaveRequest> => {
    return apiFetch('/leave-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  update: async (id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    return apiFetch(`/leave-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch(`/leave-requests/${id}`, { method: 'DELETE' });
  },

  approve: async (id: string): Promise<LeaveRequest> => {
    return apiFetch(`/leave-requests/${id}/approve`, { method: 'POST' });
  },

  reject: async (id: string, notes?: string): Promise<LeaveRequest> => {
    return apiFetch(`/leave-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
};

// API для бронирований
export const bookingsAPI = {
  getAll: async (params?: {
    employeeId?: string;
    requesterId?: string;
    projectId?: string;
    status?: string;
  }): Promise<Booking[]> => {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params?.requesterId) queryParams.append('requesterId', params.requesterId);
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return apiFetch(`/bookings${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Booking> => {
    return apiFetch(`/bookings/${id}`);
  },

  create: async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> => {
    return apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  update: async (id: string, updates: Partial<Booking>): Promise<Booking> => {
    return apiFetch(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch(`/bookings/${id}`, { method: 'DELETE' });
  },
};

// Проверка доступности API
export const healthCheck = async (): Promise<boolean> => {
  try {
    await fetch(`${API_BASE_URL.replace('/api', '')}/`);
    return true;
  } catch {
    return false;
  }
};

