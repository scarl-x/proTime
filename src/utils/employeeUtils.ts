import { EmployeePosition } from '../types';

export const EMPLOYEE_POSITIONS: Record<EmployeePosition, string> = {
  'senior-developer': 'Старший разработчик',
  'developer': 'Разработчик',
  'junior-developer': 'Младший разработчик',
  'tester': 'Тестировщик',
  'senior-tester': 'Старший тестировщик',
  'designer': 'Дизайнер',
  'analyst': 'Аналитик',
  'project-manager': 'Проект-менеджер',
  'devops': 'DevOps инженер',
  'cto': 'CTO (технический директор)',
  'cpo': 'CPO (директор по продукту)',
  'cfo': 'CFO (финансовый директор)',
};

export const getPositionLabel = (position?: string): string => {
  if (!position) return 'Не указано';
  return EMPLOYEE_POSITIONS[position as EmployeePosition] || position;
};

export const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};