import React from 'react';
import { Calendar, Clock, User, TrendingUp, Calculator, AlertCircle } from 'lucide-react';
import { LeaveBalance as LeaveBalanceType, User as UserType } from '../../types';
import { calculateVacationBalance } from '../../utils/vacationCalculator';
import { VacationCalculator } from './VacationCalculator';

interface LeaveBalanceProps {
  balances: LeaveBalanceType[];
  employees: UserType[];
  currentUser: UserType;
  leaveRequests: any[];
}

const LEAVE_TYPE_LABELS = {
  vacation: 'Отпуск',
  sick: 'Больничные',
  personal: 'Личные дни',
  compensatory: 'Отгулы',
};

export const LeaveBalance: React.FC<LeaveBalanceProps> = ({
  balances,
  employees,
  currentUser,
  leaveRequests,
}) => {
  const [activeTab, setActiveTab] = React.useState<'balance' | 'calculator'>('balance');

  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'Неизвестный сотрудник';
  };

  const getEmployeeVacationBalance = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee?.employmentDate) return null;
    
    const employeeVacations = leaveRequests.filter(req => 
      req.employeeId === employeeId && 
      req.type === 'vacation' && 
      req.status === 'approved'
    );
    
    const usedDays = employeeVacations.reduce((sum, req) => sum + req.daysCount, 0);
    const currentDate = new Date().toISOString().split('T')[0];
    
    return calculateVacationBalance(employee.employmentDate, currentDate, usedDays);
  };
  const getProgressColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredBalances = currentUser.role === 'admin' 
    ? balances 
    : balances.filter(balance => balance.employeeId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition duration-200 ${
              activeTab === 'balance'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Баланс отпусков</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition duration-200 ${
              activeTab === 'calculator'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Калькулятор баланса</span>
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'calculator' ? (
        <VacationCalculator
          employees={employees}
          leaveRequests={leaveRequests}
          currentUser={currentUser}
        />
      ) : (
        <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Баланс отпусков (по ТК РФ)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Накопленный баланс отпусков согласно Трудовому кодексу РФ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredBalances.map((balance) => {
            const vacationBalance = getEmployeeVacationBalance(balance.employeeId);
            const employee = employees.find(emp => emp.id === balance.employeeId);
            
            return (
            <div key={balance.employeeId} className="border rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {getEmployeeName(balance.employeeId)}
                  </h4>
                  <p className="text-sm text-gray-600">
                      {employee?.position || 'Сотрудник'}
                  </p>
                    {employee?.employmentDate && (
                      <p className="text-xs text-gray-500">
                        Работает с {new Date(employee.employmentDate).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                </div>
              </div>

              <div className="space-y-4">
                  {/* Накопленный отпускной баланс по ТК РФ */}
                  {vacationBalance ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Накопленный баланс (ТК РФ)</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 mb-2">
                        {vacationBalance.currentBalance} дней
                      </div>
                      <div className="text-xs text-blue-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Стаж:</span>
                          <span>{vacationBalance.totalWorkedMonths} мес.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Начислено:</span>
                          <span>{vacationBalance.earnedDays} дней</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Использовано:</span>
                          <span>{vacationBalance.usedDays} дней</span>
                        </div>
                        <div className="flex justify-between border-t border-blue-300 pt-1">
                          <span className="font-medium">Баланс:</span>
                          <span className={`font-bold ${
                            vacationBalance.currentBalance >= 0 ? 'text-blue-900' : 'text-red-600'
                          }`}>
                            {vacationBalance.currentBalance} дней
                          </span>
                        </div>
                      </div>
                      {!vacationBalance.canTakeVacation && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                          Право на отпуск после 6 месяцев стажа
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Нет данных о трудоустройстве</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Укажите дату трудоустройства для расчета баланса
                      </p>
                    </div>
                  )}

                  {/* Старый баланс (для справки) */}
                <div>
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Другие типы отпусков:</p>
                      
                      <div className="space-y-2">
                        {/* Personal Days */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Личные дни</span>
                            <span className="text-xs text-gray-600">
                              {balance.usedPersonalDays}/{balance.personalDays}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(
                                balance.usedPersonalDays,
                                balance.personalDays
                              )}`}
                              style={{
                                width: `${Math.min((balance.usedPersonalDays / balance.personalDays) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Compensatory Days */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Отгулы</span>
                            <span className="text-xs text-gray-600">
                              {balance.usedCompensatoryDays}/{balance.compensatoryDays}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(
                                balance.usedCompensatoryDays,
                                balance.compensatoryDays
                              )}`}
                              style={{
                                width: `${Math.min((balance.usedCompensatoryDays / balance.compensatoryDays) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          {/* Строка состояния последнего отгула */}
                          {leaveRequests.filter(r => r.type === 'compensatory_leave' && r.employeeId === balance.employeeId)
                            .slice(0, 1)
                            .map(r => (
                              <div key={r.id} className={`mt-2 text-xs font-medium ${r.worked ? 'text-green-700' : 'text-red-700'}`}>
                                Состояние последнего отгула: {r.worked ? 'отработан' : 'не отработан'}
                              </div>
                          ))}
                        </div>

                        {/* Sick Days */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Больничные</span>
                            <span className="text-xs text-gray-600">
                              {balance.usedSickDays} дней
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Без ограничений
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      {currentUser.role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Всего сотрудников</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{filteredBalances.length}</p>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                <User className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Использовано отпусков</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredBalances.reduce((sum, b) => sum + b.usedVacationDays, 0)}
                </p>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Больничных дней</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {filteredBalances.reduce((sum, b) => sum + b.usedSickDays, 0)}
                </p>
              </div>
              <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Средний остаток</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {Math.round(
                    filteredBalances.reduce(
                      (sum, b) => sum + (b.vacationDays - b.usedVacationDays),
                      0
                    ) / filteredBalances.length
                  )}
                </p>
              </div>
              <div className="bg-orange-100 p-2 sm:p-3 rounded-full">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};