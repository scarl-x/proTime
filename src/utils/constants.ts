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


