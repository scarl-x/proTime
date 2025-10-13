import React, { useState } from 'react';
import { Calculator, Calendar, TrendingUp, Clock, Info, History, CheckCircle, XCircle } from 'lucide-react';
import { User, LeaveRequest } from '../../types';
import { 
  calculateVacationBalance, 
  generateVacationHistory, 
  canTakeVacation,
  formatWorkedPeriod,
  VacationCalculation,
  VacationHistory
} from '../../utils/vacationCalculator';
import { formatDate } from '../../utils/dateUtils';

interface VacationCalculatorProps {
  employees: User[];
  leaveRequests: LeaveRequest[];
  currentUser: User;
}

export const VacationCalculator: React.FC<VacationCalculatorProps> = ({
  employees,
  leaveRequests,
  currentUser,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentUser.id);
  const [calculationDate, setCalculationDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [testVacationDays, setTestVacationDays] = useState(7);

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const employeeVacations = leaveRequests.filter(req => 
    req.employeeId === selectedEmployeeId && req.type === 'vacation'
  );

  const getCalculation = (): VacationCalculation | null => {
    if (!selectedEmployee?.employmentDate) return null;
    
    const usedDays = employeeVacations
      .filter(req => req.status === 'approved' && req.startDate <= calculationDate)
      .reduce((sum, req) => sum + req.daysCount, 0);
    
    return calculateVacationBalance(
      selectedEmployee.employmentDate,
      calculationDate,
      usedDays
    );
  };

  const getVacationHistory = (): VacationHistory[] => {
    if (!selectedEmployee?.employmentDate) return [];
    
    return generateVacationHistory(
      selectedEmployee.employmentDate,
      calculationDate,
      employeeVacations
    );
  };

  const getVacationTest = () => {
    if (!selectedEmployee?.employmentDate) return null;
    
    const usedDays = employeeVacations
      .filter(req => req.status === 'approved')
      .reduce((sum, req) => sum + req.daysCount, 0);
    
    return canTakeVacation(
      selectedEmployee.employmentDate,
      calculationDate,
      usedDays,
      testVacationDays
    );
  };

  const calculation = getCalculation();
  const history = getVacationHistory();
  const vacationTest = getVacationTest();

  const availableEmployees = currentUser.role === 'admin' 
    ? employees.filter(emp => emp.role === 'employee' && emp.employmentDate)
    : employees.filter(emp => emp.id === currentUser.id && emp.employmentDate);

  if (availableEmployees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Нет данных о трудоустройстве
        </h3>
        <p className="text-gray-600 mb-6">
          Для расчета отпускного баланса необходимо указать дату трудоустройства сотрудников
        </p>
        <button
          onClick={() => window.location.hash = '#manage-employees'}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <Calendar className="h-4 w-4" />
          <span>Добавить даты трудоустройства</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Калькулятор отпускного баланса</h2>
          <p className="text-gray-600 mt-1">
            Расчет накопленных дней отпуска (28 дней в год)
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сотрудник
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {availableEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата расчета
            </label>
            <input
              type="date"
              value={calculationDate}
              onChange={(e) => setCalculationDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {selectedEmployee && calculation && (
        <>
          {/* Employee Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedEmployee.name}</h3>
                <p className="text-gray-600">{selectedEmployee.position || 'Сотрудник'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Дата трудоустройства:</span>
                <div className="font-medium text-gray-900">
                  {formatDate(selectedEmployee.employmentDate!)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Стаж работы:</span>
                <div className="font-medium text-gray-900">
                  {formatWorkedPeriod(calculation.totalWorkedMonths)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Рабочий год:</span>
                <div className="font-medium text-gray-900">
                  {formatDate(calculation.workYearStart)} - {formatDate(calculation.workYearEnd)}
                </div>
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Отработано месяцев</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{calculation.totalWorkedMonths}</p>
                </div>
                <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                  <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 hidden sm:block">
                  Полных месяцев (15+ дней)
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Начислено дней</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{calculation.earnedDays}</p>
                </div>
                <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 hidden sm:block">
                  {calculation.totalWorkedMonths} × 2.33 дня
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Использовано дней</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{calculation.usedDays}</p>
                </div>
                <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 hidden sm:block">
                  Одобренные отпуска
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Текущий баланс</p>
                  <p className={`text-lg sm:text-2xl font-bold ${
                    calculation.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calculation.currentBalance} дней
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  calculation.currentBalance >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Calculator className={`h-4 w-4 sm:h-6 sm:w-6 ${
                    calculation.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 hidden sm:block">
                  {calculation.currentBalance < 0 ? 'Отпуск взят авансом' : 'Доступно для отпуска'}
                </p>
              </div>
            </div>
          </div>

          {/* Vacation Rights Status */}
          <div className={`bg-white rounded-lg shadow-sm border p-6 ${
            calculation.canTakeVacation ? 'border-green-200' : 'border-yellow-200'
          }`}>
            <div className="flex items-center space-x-3">
              {calculation.canTakeVacation ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-600" />
              )}
              <div>
                <h4 className={`text-lg font-semibold ${
                  calculation.canTakeVacation ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {calculation.canTakeVacation ? 'Право на отпуск получено' : 'Право на отпуск не получено'}
                </h4>
                <p className={`text-sm ${
                  calculation.canTakeVacation ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {calculation.canTakeVacation 
                    ? `Сотрудник может брать отпуск (стаж ${formatWorkedPeriod(calculation.totalWorkedMonths)})`
                    : `Право на отпуск появится после 6 месяцев работы (сейчас ${formatWorkedPeriod(calculation.totalWorkedMonths)})`
                  }
                </p>
              </div>
            </div>
            
            {calculation.canTakeVacation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <p><strong>Следующее начисление:</strong> {formatDate(calculation.nextEarnDate)} (+2.33 дня)</p>
                  <p><strong>Рабочий год:</strong> {formatDate(calculation.workYearStart)} - {formatDate(calculation.workYearEnd)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Vacation Test */}
          {calculation.canTakeVacation && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Проверка возможности отпуска</h4>
              
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество дней отпуска
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={testVacationDays}
                    onChange={(e) => setTestVacationDays(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex-1">
                  {vacationTest && (
                    <div className={`p-4 rounded-lg border ${
                      vacationTest.canTake 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {vacationTest.canTake ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`text-xs sm:text-sm font-medium ${
                          vacationTest.canTake ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {vacationTest.canTake ? 'Можно взять отпуск' : 'Нельзя взять отпуск'}
                        </span>
                      </div>
                      {vacationTest.reason && (
                        <p className={`text-xs sm:text-sm mt-1 ${
                          vacationTest.canTake ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {vacationTest.reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Calculation Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">Детали расчета</h4>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 text-sm"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">{showHistory ? 'Скрыть историю' : 'Показать историю'}</span>
                <span className="sm:hidden">{showHistory ? 'Скрыть' : 'История'}</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Формула расчета</span>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Баланс = Начислено - Использовано</strong></p>
                <p className="hidden sm:block">Начислено = Отработанные месяцы × (28 дней ÷ 12 месяцев) = {calculation.totalWorkedMonths} × 2.33 = {calculation.earnedDays} дней</p>
                <p className="sm:hidden">Начислено = {calculation.totalWorkedMonths} × 2.33 = {calculation.earnedDays} дней</p>
                <p>Использовано = {calculation.usedDays} дней</p>
                <p><strong>Итого: {calculation.earnedDays} - {calculation.usedDays} = {calculation.currentBalance} дней</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Дата трудоустройства:</span>
                  <span className="font-medium text-right">{formatDate(selectedEmployee.employmentDate!)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Дата расчета:</span>
                  <span className="font-medium text-right">{formatDate(calculationDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Отработано месяцев:</span>
                  <span className="font-medium text-right">{calculation.totalWorkedMonths}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Начислено дней:</span>
                  <span className="font-medium text-green-600 text-right">{calculation.earnedDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Использовано дней:</span>
                  <span className="font-medium text-red-600 text-right">{calculation.usedDays}</span>
                </div>
                <div className="flex justify-between border-t pt-2 sm:pt-2">
                  <span className="text-gray-600 font-medium">Текущий баланс:</span>
                  <span className={`font-bold ${
                    calculation.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  } text-right`}>
                    {calculation.currentBalance} дней
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          {showHistory && history.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h4 className="text-lg font-semibold text-gray-900">История начислений и использования</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {history.map((entry, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            entry.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {entry.type === 'earned' ? (
                              <TrendingUp className={`h-4 w-4 ${
                                entry.type === 'earned' ? 'text-green-600' : 'text-red-600'
                              }`} />
                            ) : (
                              <Calendar className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(entry.date)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            entry.type === 'earned' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.type === 'earned' ? '+' : '-'}{entry.days} дней
                          </div>
                          <div className="text-xs text-gray-500">
                            Баланс: {entry.balance}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Legal Info */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="h-5 w-5 text-gray-600" />
              <h4 className="text-sm font-medium text-gray-900">Справочная информация</h4>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• <strong>Право на отпуск:</strong> После 6 месяцев непрерывной работы</p>
              <p>• <strong>Ежегодный отпуск:</strong> 28 календарных дней в год</p>
              <p>• <strong>Начисление:</strong> 2.33 дня за каждый полный отработанный месяц</p>
              <p>• <strong>Полный месяц:</strong> Месяц, в котором отработано 15 и более дней</p>
              <p>• <strong>Рабочий год:</strong> 12 месяцев с даты трудоустройства</p>
              <p>• <strong>Авансовый отпуск:</strong> Возможен по соглашению с работодателем</p>
            </div>
          </div>
        </>
      )}

      {!selectedEmployee?.employmentDate && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Для выбранного сотрудника не указана дата трудоустройства
          </p>
        </div>
      )}
    </div>
  );
};