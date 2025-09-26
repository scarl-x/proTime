import React from 'react';
import { Calendar, Gift, Cake, User } from 'lucide-react';
import { User as UserType } from '../types';

interface EmployeeBirthdayCardsProps {
  employees: UserType[];
}

export const EmployeeBirthdayCards: React.FC<EmployeeBirthdayCardsProps> = ({
  employees,
}) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  const getEmployeesWithBirthdays = () => {
    return employees
      .filter(emp => emp.birthday)
      .map(emp => {
        const birthday = new Date(emp.birthday!);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        const nextYearBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
        
        // Определяем ближайший день рождения
        const nextBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
        const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const age = today.getFullYear() - birthday.getFullYear() - 
          (today < new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate()) ? 1 : 0);

        return {
          ...emp,
          nextBirthday,
          daysUntil,
          age: age + (thisYearBirthday >= today ? 0 : 1),
          isToday: daysUntil === 0,
          isThisWeek: daysUntil <= 7,
          isThisMonth: birthday.getMonth() === currentMonth,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const employeesWithBirthdays = getEmployeesWithBirthdays();
  const todayBirthdays = employeesWithBirthdays.filter(emp => emp.isToday);
  const upcomingBirthdays = employeesWithBirthdays.filter(emp => !emp.isToday && emp.daysUntil <= 30);

  const formatBirthdayDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const getBirthdayIcon = (daysUntil: number) => {
    if (daysUntil === 0) return <Cake className="h-5 w-5 text-pink-600" />;
    if (daysUntil <= 7) return <Gift className="h-5 w-5 text-purple-600" />;
    return <Calendar className="h-5 w-5 text-blue-600" />;
  };

  const getBirthdayCardColor = (daysUntil: number) => {
    if (daysUntil === 0) return 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200';
    if (daysUntil <= 7) return 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200';
    return 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200';
  };

  const getDaysText = (daysUntil: number) => {
    if (daysUntil === 0) return 'Сегодня!';
    if (daysUntil === 1) return 'Завтра';
    if (daysUntil <= 7) return `Через ${daysUntil} дней`;
    if (daysUntil <= 30) return `Через ${daysUntil} дней`;
    return formatBirthdayDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Today's Birthdays */}
      {todayBirthdays.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            <div className="flex items-center space-x-2">
              <Cake className="h-6 w-6" />
              <h3 className="text-lg font-semibold">🎉 День рождения сегодня!</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayBirthdays.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4 text-center"
                >
                  <div className="bg-pink-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Cake className="h-8 w-8 text-pink-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {employee.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {employee.position || 'Сотрудник'}
                  </p>
                  <div className="text-2xl font-bold text-pink-600 mb-1">
                    {employee.age} лет
                  </div>
                  <p className="text-sm text-pink-700 font-medium">
                    🎂 Поздравляем!
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Birthdays */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Ближайшие дни рождения</h3>
          </div>
        </div>
        
        {upcomingBirthdays.length > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBirthdays.slice(0, 6).map((employee) => (
                <div
                  key={employee.id}
                  className={`border rounded-lg p-4 transition duration-200 hover:shadow-md ${getBirthdayCardColor(employee.daysUntil)}`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-white p-2 rounded-full">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {employee.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {employee.position || 'Сотрудник'}
                      </p>
                    </div>
                    {getBirthdayIcon(employee.daysUntil)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Дата рождения:</span>
                      <span className="font-medium text-gray-900">
                        {formatBirthdayDate(new Date(employee.birthday!))}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Исполнится:</span>
                      <span className="font-medium text-gray-900">
                        {employee.age} лет
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          employee.daysUntil === 1 
                            ? 'bg-purple-100 text-purple-800'
                            : employee.daysUntil <= 7
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getDaysText(employee.daysUntil)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {upcomingBirthdays.length > 6 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  И еще {upcomingBirthdays.length - 6} дней рождения в ближайшие месяцы
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет ближайших дней рождения</p>
            <p className="text-sm text-gray-400 mt-1">
              Добавьте даты рождения в профили сотрудников
            </p>
          </div>
        )}
      </div>

      {/* Birthday Statistics */}
      {employeesWithBirthdays.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Дней рождения в этом месяце</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employeesWithBirthdays.filter(emp => emp.isThisMonth).length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">На этой неделе</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employeesWithBirthdays.filter(emp => emp.isThisWeek).length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No birthdays message */}
      {employeesWithBirthdays.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет информации о днях рождения
          </h3>
          <p className="text-gray-600 mb-6">
            Добавьте даты рождения сотрудников в разделе "Управление командой"
          </p>
          <button
            onClick={() => window.location.hash = '#manage-employees'}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <User className="h-4 w-4" />
            <span>Перейти к управлению командой</span>
          </button>
        </div>
      )}
    </div>
  );
};