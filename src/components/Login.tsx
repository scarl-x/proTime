import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { hasSupabaseCredentials } from '../lib/supabase';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onLogin(email, password);
    if (!success) {
      setError('Неверный email или пароль');
    }
  };

  const quickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    await onLogin(userEmail, 'password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <LogIn className="h-12 w-12 text-indigo-600" />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">Проявление</h1>
                <p className="text-sm text-gray-600">Учет времени</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Добро пожаловать в Проявление
            </h2>
            <p className="text-gray-600 mt-2">
              Войдите в систему учета времени
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 font-medium"
            >
              Войти
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">
              Вход в систему:
            </p>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                {hasSupabaseCredentials ? (
                  <>
                    <strong>База данных подключена:</strong> Все данные сохраняются в Supabase.
                  </>
                ) : (
                  <>
                    <strong>Демо-режим:</strong> Данные не сохраняются между сессиями.
                  </>
                )}
              </p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => quickLogin('admin@company.com')}
                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200 text-sm"
              >
                <strong>Админ:</strong> admin@company.com / password
              </button>
              <button
                onClick={() => quickLogin('ivan@company.com')}
                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition duration-200 text-sm"
              >
                <strong>Сотрудник:</strong> ivan@company.com / password
              </button>
            </div>
            
            {hasSupabaseCredentials && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  <strong>Примечание:</strong> При первом входе система создаст демо-пользователей в базе данных.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};