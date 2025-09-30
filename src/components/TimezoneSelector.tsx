import React, { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimezoneSelectorProps {
  currentTimezone: string;
  onTimezoneChange: (timezone: string) => Promise<void>;
  className?: string;
}

// Российские часовые пояса
const RUSSIAN_TIMEZONES = [
  { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)', offset: '+02:00' },
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)', offset: '+03:00' },
  { value: 'Europe/Samara', label: 'Самара (UTC+4)', offset: '+04:00' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)', offset: '+05:00' },
  { value: 'Asia/Omsk', label: 'Омск (UTC+6)', offset: '+06:00' },
  { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)', offset: '+07:00' },
  { value: 'Asia/Krasnoyarsk', label: 'Красноярск (UTC+7)', offset: '+07:00' },
  { value: 'Asia/Irkutsk', label: 'Иркутск (UTC+8)', offset: '+08:00' },
  { value: 'Asia/Yakutsk', label: 'Якутск (UTC+9)', offset: '+09:00' },
  { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)', offset: '+10:00' },
  { value: 'Asia/Magadan', label: 'Магадан (UTC+11)', offset: '+11:00' },
  { value: 'Asia/Kamchatka', label: 'Петропавловск-Камчатский (UTC+12)', offset: '+12:00' },
];

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  currentTimezone,
  onTimezoneChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentZone = RUSSIAN_TIMEZONES.find(tz => tz.value === currentTimezone) || 
    { value: currentTimezone, label: currentTimezone, offset: '' };

  const handleTimezoneSelect = async (timezone: string) => {
    await onTimezoneChange(timezone);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Clock className="w-4 h-4" />
        <span className="text-gray-700">{currentZone.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-md shadow-xl border z-50 max-h-80 overflow-y-auto">
          <div className="p-3">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Выберите ваш часовой пояс
            </div>
            <div className="space-y-1">
              {RUSSIAN_TIMEZONES.map((timezone) => (
                <button
                  key={timezone.value}
                  onClick={() => handleTimezoneSelect(timezone.value)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    currentTimezone === timezone.value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{timezone.label}</div>
                  <div className="text-xs text-gray-500">{timezone.value}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
