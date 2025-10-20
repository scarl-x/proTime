import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Calendar, Clock, Tag, User, Bold, Italic, List, ListOrdered, Link, Code, Heading1, Heading2, Quote } from 'lucide-react';
import { TaskAssignment, User as UserType, TimeSlot, Project, TaskCategory } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { DisplayTimezoneContext } from '../../utils/timezoneContext';
import { convertLocalToUtc, convertSlotToLocal } from '../../utils/timezone';

interface AssignmentSlotsEditorProps {
  assignment: TaskAssignment;
  employee: UserType;
  timeSlots: TimeSlot[];
  projects: Project[];
  categories?: TaskCategory[];
  onUpdateTimeSlot?: (id: string, updates: Partial<TimeSlot>) => void;
  onDeleteTimeSlot?: (id: string) => void;
  onUpdateAssignment?: (id: string, updates: Partial<TaskAssignment>) => void;
}

// Fallback categories if no categories are provided
const defaultCategories = [
  'Разработка',
  'Тестирование',
  'Код-ревью',
  'Совещание',
  'Планирование',
  'Документация',
  'Поддержка',
  'Исследование',
];

export const AssignmentSlotsEditor: React.FC<AssignmentSlotsEditorProps> = ({
  assignment,
  employee,
  timeSlots,
  projects,
  categories = [],
  onUpdateTimeSlot,
  onDeleteTimeSlot,
  onUpdateAssignment,
}) => {
  const effectiveZone = React.useContext(DisplayTimezoneContext) ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [distributionResult, setDistributionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Локальная копия слотов для мгновенного UI-обновления
  const [localSlots, setLocalSlots] = useState<TimeSlot[]>(timeSlots);
  useEffect(() => {
    setLocalSlots(timeSlots);
  }, [timeSlots]);

  // Общие поля для всех слотов
  const [commonFields, setCommonFields] = useState({
    projectId: '',
    taskTitle: '',
    status: 'planned' as 'planned' | 'in-progress' | 'completed',
    category: '',
    description: '',
    deadline: '',
  });

  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Инициализируем общие поля из первого слота или назначения
  useEffect(() => {
    if (localSlots.length > 0) {
      const firstSlot = localSlots[0];
      setCommonFields({
        projectId: firstSlot.projectId || '',
        taskTitle: (assignment as any).title || '',
        status: firstSlot.status || 'planned',
        category: firstSlot.category || '',
        description: firstSlot.description || (assignment as any).description || '',
        deadline: firstSlot.deadline || assignment.deadline || '',
      });
    }
  }, [localSlots, assignment]);

  // Функция для вставки форматирования в textarea
  const insertFormatting = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = commonFields.description.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newText =
      commonFields.description.substring(0, start) +
      before +
      textToInsert +
      after +
      commonFields.description.substring(end);

    setCommonFields({ ...commonFields, description: newText });

    // Установить курсор после вставленного текста
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Обработка горячих клавиш для форматирования
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertFormatting('**', '**', 'жирный текст');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertFormatting('*', '*', 'курсив');
      } else if (e.key === 'k') {
        e.preventDefault();
        insertFormatting('[', '](url)', 'текст ссылки');
      }
    }
  };

  const handleApplyCommonFields = async () => {
    if (!onUpdateTimeSlot || !onUpdateAssignment) return;
    
    try {
      // Обновляем все слоты с общими полями
      const updatedLocal: TimeSlot[] = [];
      for (const slot of localSlots) {
        if (slot.id) {
          // сохраняем UTC время согласно текущему времени слота
          const date = (slot.date || '').split('T')[0];
          const startTime = slot.startTime || '09:00';
          const endTime = slot.endTime || '17:00';
          const utcData = convertLocalToUtc(date, startTime, endTime, effectiveZone);
          await onUpdateTimeSlot(slot.id, {
            projectId: commonFields.projectId,
            task: commonFields.taskTitle,
            status: commonFields.status,
            category: commonFields.category,
            description: commonFields.description,
            deadline: commonFields.deadline,
            ...utcData,
          });
          // Оптимистично обновляем локальную копию
          updatedLocal.push({
            ...slot,
            projectId: commonFields.projectId,
            task: commonFields.taskTitle as any,
            status: commonFields.status,
            category: commonFields.category,
            description: commonFields.description,
            deadline: commonFields.deadline,
            ...(utcData as any),
          });
        } else {
          updatedLocal.push(slot);
        }
      }
      setLocalSlots(updatedLocal);
      
      // Обновляем назначение с новыми полями
      await onUpdateAssignment(assignment.id, {
        title: commonFields.taskTitle,
        description: commonFields.description,
      });
      
      setDistributionResult({
        type: 'success',
        message: 'Общие поля применены ко всем слотам'
      });
    } catch (error) {
      setDistributionResult({
        type: 'error',
        message: 'Ошибка применения общих полей'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Distribution Result Notification */}
      {distributionResult && (
        <div className={`p-4 rounded-lg border ${
          distributionResult.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {distributionResult.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{distributionResult.message}</span>
          </div>
        </div>
      )}

      {/* Информация о назначении */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{employee.name}</h4>
            <p className="text-sm text-gray-600">{(assignment as any).title || 'Часть задачи'}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Выделено часов:</span>
            <div className="text-blue-900 font-bold">{assignment.allocatedHours}ч</div>
          </div>
          <div>
            <span className="text-blue-700 font-medium">План часов:</span>
            <div className="text-blue-900 font-bold">{timeSlots.reduce((sum, s) => sum + (s.plannedHours || 0), 0)}ч</div>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Факт часов:</span>
            <div className="text-blue-900 font-bold">{timeSlots.reduce((sum, s) => sum + (s.actualHours || 0), 0)}ч</div>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Осталось:</span>
            <div className="text-blue-900 font-bold">{Math.max(assignment.allocatedHours - timeSlots.reduce((sum, s) => sum + (s.plannedHours || 0), 0), 0)}ч</div>
          </div>
        </div>
      </div>

      {/* Общие настройки для всех слотов */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">Общие настройки для всех слотов</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Project Selection */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4" />
                <span>Проект</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={commonFields.projectId}
                onChange={(e) => setCommonFields({ ...commonFields, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="">Выберите проект</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название задачи
              </label>
              <input
                type="text"
                value={commonFields.taskTitle}
                onChange={(e) => setCommonFields({ ...commonFields, taskTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Например: Разработка формы логина"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <select
                value={commonFields.status}
                onChange={(e) => setCommonFields({ ...commonFields, status: e.target.value as 'planned' | 'in-progress' | 'completed' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="planned">Запланировано</option>
                <option value="in-progress">В работе</option>
                <option value="completed">Завершено</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4" />
                <span>Категория</span>
              </label>
              <select
                value={commonFields.category}
                onChange={(e) => setCommonFields({ ...commonFields, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Без категории</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  defaultCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Дедлайн</span>
              </label>
              <input
                type="date"
                value={commonFields.deadline}
                onChange={(e) => setCommonFields({ ...commonFields, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-lg border-b-0">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**', 'жирный текст')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Жирный (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*', 'курсив')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Курсив (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting('# ', '', 'Заголовок 1')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Заголовок 1"
              >
                <Heading1 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('## ', '', 'Заголовок 2')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Заголовок 2"
              >
                <Heading2 className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting('- ', '', 'элемент списка')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Маркированный список"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('1. ', '', 'элемент списка')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Нумерованный список"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => insertFormatting('[', '](url)', 'текст ссылки')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Ссылка (Ctrl+K)"
              >
                <Link className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('`', '`', 'код')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Инлайн код"
              >
                <Code className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ', '', 'цитата')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Цитата"
              >
                <Quote className="h-4 w-4" />
              </button>
            </div>
            
            <textarea
              ref={descriptionRef}
              rows={4}
              value={commonFields.description}
              onChange={(e) => setCommonFields({ ...commonFields, description: e.target.value })}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Описание задачи..."
            />
            
            {/* Preview */}
            {commonFields.description && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                <div className="text-xs text-gray-500 mb-2">Предварительный просмотр:</div>
                <div className="prose prose-sm max-w-none">
                  <MarkdownRenderer content={commonFields.description} />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleApplyCommonFields}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Применить ко всем слотам
            </button>
          </div>
        </div>
      </div>

      {/* Слоты времени */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Слоты времени ({timeSlots.length})</h4>
        <div className="space-y-4">
          {localSlots.map((slot) => (
            <SlotEditor
              key={slot.id}
              slot={slot}
              onSave={async (updates) => {
                if (!slot.id || !onUpdateTimeSlot) return;
                // Конвертируем локальное время в UTC, как в TimeSlotModal
                const date = (updates as any).date ?? slot.date?.split('T')[0] ?? '';
                const startTime = (updates as any).startTime ?? slot.startTime ?? '';
                const endTime = (updates as any).endTime ?? slot.endTime ?? '';
                const utcData = convertLocalToUtc(date, startTime, endTime, effectiveZone);
                await onUpdateTimeSlot(slot.id, { ...updates, ...utcData });
                // Оптимистичное обновление локального состояния
                setLocalSlots(prev => prev.map(s => s.id === slot.id ? { ...s, ...updates, ...(utcData as any) } as TimeSlot : s));
              }}
              onDelete={async () => {
                if (!slot.id || !onDeleteTimeSlot) return;
                await onDeleteTimeSlot(slot.id);
                setLocalSlots(prev => prev.filter(s => s.id !== slot.id));
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Редактор слота для режима редактирования
const SlotEditor: React.FC<{
  slot: TimeSlot;
  onSave: (updates: Partial<TimeSlot>) => void;
  onDelete: () => void;
}> = ({ slot, onSave, onDelete }) => {
  const effectiveZone = React.useContext(DisplayTimezoneContext) ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localSlot = convertSlotToLocal(slot as any, effectiveZone) as any;
  const initialDate = (localSlot?.date || slot.date || '').split('T')[0];
  const initialStart = localSlot?.startTime || slot.startTime || '09:00';
  const initialEnd = localSlot?.endTime || slot.endTime || '17:00';
  const [formData, setFormData] = useState({
    date: initialDate,
    startTime: initialStart,
    endTime: initialEnd,
    plannedHours: slot.plannedHours || 8,
    actualHours: slot.actualHours || 0,
  });

  const calculateHours = () => {
    const start = new Date(`2000-01-01 ${formData.startTime}`);
    const end = new Date(`2000-01-01 ${formData.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(0, hours);
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Auto-calculate planned hours based on time range
    if (newData.startTime && newData.endTime) {
      const start = new Date(`2000-01-01 ${newData.startTime}`);
      const end = new Date(`2000-01-01 ${newData.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (hours > 0) {
        setFormData({ ...newData, plannedHours: hours });
      }
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Date */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4" />
            <span>Дата</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4" />
            <span>Время начала</span>
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* End Time */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4" />
            <span>Время окончания</span>
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => handleTimeChange('endTime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Planned Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Запланированные часы
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="12"
            value={formData.plannedHours}
            onChange={(e) => setFormData({ ...formData, plannedHours: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Actual Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фактические часы
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="12"
            value={formData.actualHours}
            onChange={(e) => setFormData({ ...formData, actualHours: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Сохранить
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
        >
          Удалить
        </button>
      </div>
    </div>
  );
};
