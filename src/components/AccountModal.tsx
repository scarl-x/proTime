import React, { useEffect, useState } from 'react';
import { X, User as UserIcon, Calendar } from 'lucide-react';
import { User } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updates: Partial<User>) => Promise<void> | void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [form, setForm] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        birthday: user.birthday,
        employmentDate: user.employmentDate,
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, ...safeUpdates } = form;
    await onSave(safeUpdates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <UserIcon className="h-6 w-6 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Мой аккаунт</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition duration-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={form.email || ''}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Email изменить нельзя. Обратитесь к администратору для смены.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Дата рождения</span>
              </label>
              <input
                type="date"
                value={form.birthday || ''}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Дата трудоустройства</span>
              </label>
              <input
                type="date"
                value={form.employmentDate || ''}
                onChange={(e) => setForm({ ...form, employmentDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Смена пароля (заготовка)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="password" placeholder="Текущий пароль" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled />
              <input type="password" placeholder="Новый пароль" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled />
            </div>
            <p className="text-xs text-gray-500 mt-2">Функционал смены пароля будет добавлен позже.</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Отмена</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
};


