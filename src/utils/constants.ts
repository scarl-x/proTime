export const STANDUP_TASK_NAME = 'Ежедневный дейлик команды';

export type NormalizedStatus = 'planned' | 'in-progress' | 'completed';

export const normalizeStatus = (raw: string | undefined | null): NormalizedStatus => {
  const s = (raw || '').toLowerCase();
  const map: Record<string, NormalizedStatus> = {
    'planned': 'planned', 'запланировано': 'planned',
    'in-progress': 'in-progress', 'в-работе': 'in-progress',
    'completed': 'completed', 'завершено': 'completed',
  };
  return map[s] || 'planned';
};

// Смещение «наследованного» серверного времени.
// Если ранее слоты сохранялись как локальные UTC+3, укажите 180.
// Если всё уже в UTC — оставьте 0.
export const SERVER_BASE_OFFSET_MIN = 0;


