import React, { useState } from 'react';
import { User, Plus, Edit2, Trash2, Mail, UserCheck, Key, UserX, Shield, Crown } from 'lucide-react';
import { User as UserType } from '../types';
import { EMPLOYEE_POSITIONS, getPositionLabel, generatePassword } from '../utils/employeeUtils';

interface EmployeeManagementProps {
  employees: UserType[];
  onAddEmployee: (employee: Omit<UserType, 'id'>) => Promise<any> | void;
  onUpdateEmployee: (id: string, updates: Partial<UserType>) => Promise<void> | void;
  onDeleteEmployee: (id: string) => Promise<void> | void;
  onCreateAccount: (employeeId: string, password: string) => Promise<void> | void;
  onRemoveAccount: (employeeId: string) => Promise<void> | void;
}

interface EmployeeFormData {
  name: string;
  email: string;
  position: string;
  birthday: string;
  employmentDate: string;
  terminationDate?: string;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onCreateAccount,
  onRemoveAccount,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<UserType | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showViewPasswordModal, setShowViewPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserType | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    position: 'developer',
    birthday: '',
    employmentDate: '',
    terminationDate: '',
  });
  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});

  // Показываем всех, включая админов
  const employeeList = employees;

  const validateForm = (): boolean => {
    const newErrors: Partial<EmployeeFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    } else if (employees.some(emp => emp.email === formData.email && emp.id !== editingEmployee?.id)) {
      newErrors.email = 'Пользователь с таким email уже существует';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (editingEmployee) {
      onUpdateEmployee(editingEmployee.id, formData);
      setEditingEmployee(null);
    } else {
      onAddEmployee({
        ...formData,
        role: 'employee',
      });
    }

    setFormData({ name: '', email: '', position: 'developer', birthday: '', employmentDate: '', terminationDate: '' });
    setShowAddModal(false);
    setErrors({});
  };

  const handleEdit = (employee: UserType) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      position: employee.position || 'developer',
      birthday: employee.birthday || '',
      employmentDate: employee.employmentDate || '',
      terminationDate: employee.terminationDate || '',
    });
    setShowAddModal(true);
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingEmployee(null);
    setFormData({ name: '', email: '', position: 'developer', birthday: '', employmentDate: '', terminationDate: '' });
    setErrors({});
  };

  const handleDelete = (employee: UserType) => {
    if (window.confirm(`Вы уверены, что хотите удалить сотрудника ${employee.name}?`)) {
      onDeleteEmployee(employee.id);
    }
  };

  const handleCreateAccount = (employee: UserType) => {
    const password = generatePassword();
    setGeneratedPassword(password);
    setSelectedEmployee(employee);
    setShowPasswordModal(true);
  };

  const confirmCreateAccount = () => {
    if (selectedEmployee) {
      onCreateAccount(selectedEmployee.id, generatedPassword);
      setShowPasswordModal(false);
      setSelectedEmployee(null);
      setGeneratedPassword('');
    }
  };

  const handleRoleChange = (employee: UserType) => {
    setSelectedEmployee(employee);
    setShowRoleModal(true);
  };

  const confirmRoleChange = async (newRole: 'admin' | 'employee') => {
    if (selectedEmployee) {
      try {
        if (newRole === 'admin') {
          if (window.confirm(`Вы уверены, что хотите назначить ${selectedEmployee.name} администратором? Это даст полный доступ к системе.`)) {
            await onUpdateEmployee(selectedEmployee.id, { role: newRole });
          } else {
            return;
          }
        } else {
          if (window.confirm(`Вы уверены, что хотите снять права администратора с ${selectedEmployee.name}?`)) {
            await onUpdateEmployee(selectedEmployee.id, { role: newRole });
          } else {
            return;
          }
        }
      } catch (error) {
        console.error('Ошибка смены роли:', error);
        alert('Не удалось изменить роль. Проверьте заполнение данных пользователя.');
        return;
      }
    }
    setShowRoleModal(false);
    setSelectedEmployee(null);
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setSelectedEmployee(null);
  };

  const handleRemoveAccount = (employee: UserType) => {
    if (window.confirm(`Вы уверены, что хотите удалить аккаунт для ${employee.name}?`)) {
      onRemoveAccount(employee.id);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedEmployee(null);
    setGeneratedPassword('');
  };

  const handleViewPassword = (employee: UserType) => {
    setSelectedEmployee(employee);
    setShowViewPasswordModal(true);
  };

  const closeViewPasswordModal = () => {
    setShowViewPasswordModal(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управление командой</h2>
          <p className="text-gray-600 mt-1">
            Добавляйте и управляйте сотрудниками команды
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить сотрудника</span>
        </button>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Сотрудники ({employeeList.length})
          </h3>
        </div>

        {employeeList.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {employeeList.map((employee) => (
              <div key={employee.id} className="p-6 hover:bg-gray-50 transition duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {employee.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{employee.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {employee.hasAccount ? (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <UserX className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-green-600 capitalize">
                          {employee.hasAccount ? 'Есть аккаунт' : 'Нет аккаунта'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-600">
                          {employee.role === 'admin'
                            ? `Администратор${employee.position ? ` — ${getPositionLabel(employee.position)}` : ''}`
                            : getPositionLabel(employee.position)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!employee.hasAccount ? (
                      <button
                        onClick={() => handleCreateAccount(employee)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                        title="Создать аккаунт"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleViewPassword(employee)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                          title="Показать пароль"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveAccount(employee)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                          title="Удалить аккаунт"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleRoleChange(employee)}
                      className={`p-2 text-gray-500 hover:bg-orange-50 rounded-lg transition duration-200 ${
                        employee.role === 'admin' 
                          ? 'hover:text-orange-600' 
                          : 'hover:text-blue-600'
                      }`}
                      title={employee.role === 'admin' ? 'Снять права администратора' : 'Назначить администратором'}
                    >
                      <Crown className={`h-4 w-4 ${employee.role === 'admin' ? 'text-orange-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleEdit(employee)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                      title="Редактировать"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет сотрудников
            </h3>
            <p className="text-gray-600 mb-6">
              Добавьте первого сотрудника в вашу команду
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить сотрудника</span>
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Полное имя *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Иван Петров"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email адрес *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="ivan@company.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Должность *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(EMPLOYEE_POSITIONS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата рождения
                  </label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Необязательно, для поздравлений
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата трудоустройства *
                  </label>
                  <input
                    type="date"
                    value={formData.employmentDate}
                    onChange={(e) => setFormData({ ...formData, employmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Для расчета отпускного баланса
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата увольнения
                  </label>
                  <input
                    type="date"
                    value={formData.terminationDate}
                    onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Оставьте пустым для действующих сотрудников
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  {editingEmployee ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Создание аккаунта
              </h3>
              <button
                onClick={closePasswordModal}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <Key className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Аккаунт для {selectedEmployee.name}
                </h4>
                <p className="text-gray-600">
                  Сгенерирован временный пароль для входа в систему
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 mb-2">Email для входа:</div>
                <div className="font-mono text-lg text-gray-900 mb-4">
                  {selectedEmployee.email}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">Временный пароль:</div>
                <div className="font-mono text-lg text-gray-900 bg-white p-3 rounded border">
                  {generatedPassword}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Важно:</strong> Сохраните этот пароль и передайте его сотруднику. 
                  После создания аккаунта пароль можно будет посмотреть в любое время.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closePasswordModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmCreateAccount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Создать аккаунт
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Password Modal */}
      {showViewPasswordModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Данные для входа
              </h3>
              <button
                onClick={closeViewPasswordModal}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <Key className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Аккаунт: {selectedEmployee.name}
                </h4>
                <p className="text-gray-600">
                  Данные для входа в систему
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 mb-2">Email для входа:</div>
                <div className="font-mono text-lg text-gray-900 mb-4 bg-white p-3 rounded border">
                  {selectedEmployee.email}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">Пароль:</div>
                <div className="font-mono text-lg text-gray-900 bg-white p-3 rounded border">
                  {selectedEmployee.password || 'Не установлен'}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Примечание:</strong> Эти данные можно передать сотруднику для входа в систему.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeViewPasswordModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Изменение роли
              </h3>
              <button
                onClick={closeRoleModal}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <Crown className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedEmployee.name}
                </h4>
                <p className="text-gray-600">
                  Текущая роль: <span className="font-medium">
                    {selectedEmployee.role === 'admin' ? 'Администратор' : 'Сотрудник'}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                {selectedEmployee.role === 'employee' ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h5 className="font-medium text-orange-900 mb-2">
                      Назначить администратором
                    </h5>
                    <p className="text-sm text-orange-800 mb-4">
                      Администратор получит полный доступ к системе:
                    </p>
                    <ul className="text-sm text-orange-700 space-y-1 mb-4">
                      <li>• Управление всеми сотрудниками</li>
                      <li>• Создание и редактирование проектов</li>
                      <li>• Просмотр всех отчетов и аналитики</li>
                      <li>• Назначение других администраторов</li>
                    </ul>
                    <button
                      onClick={() => confirmRoleChange('admin')}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200"
                    >
                      Назначить администратором
                    </button>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">
                      Снять права администратора
                    </h5>
                    <p className="text-sm text-blue-800 mb-4">
                      Пользователь станет обычным сотрудником и потеряет доступ к:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1 mb-4">
                      <li>• Управлению сотрудниками</li>
                      <li>• Управлению проектами</li>
                      <li>• Административным отчетам</li>
                      <li>• Назначению ролей</li>
                    </ul>
                    <button
                      onClick={() => confirmRoleChange('employee')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                      Сделать сотрудником
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeRoleModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};