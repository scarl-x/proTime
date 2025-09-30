import { DateTime } from 'luxon';

// ============================================================================
// CORE TIMEZONE UTILITIES
// ============================================================================

/**
 * Получить эффективную timezone для пользователя
 * Приоритет: customZone -> user.timezone -> system timezone
 */
export const getEffectiveTimezone = (
  customZone: string | null,
  userTimezone?: string
): string => {
  if (customZone) return customZone;
  if (userTimezone) return userTimezone;
  
  // Fallback на системную timezone
  const now = new Date();
  const systemOffset = -now.getTimezoneOffset();
  const offHours = Math.floor(systemOffset / 60);
  return `UTC${offHours >= 0 ? '+' : ''}${offHours}`;
};

/**
 * Проверить, является ли строка IANA timezone
 */
export const isIANATimezone = (zone: string): boolean => {
  return zone.includes('/') && (
    zone.startsWith('Europe/') ||
    zone.startsWith('Asia/') ||
    zone.startsWith('America/') ||
    zone.startsWith('Africa/') ||
    zone.startsWith('Australia/')
  );
};

/**
 * Конвертировать UTC±H в IANA формат для Intl API
 */
export const utcToIANA = (utcZone: string): string => {
  const match = utcZone.match(/^UTC([+-]?)(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return utcZone;
  
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10) * sign;
  return `Etc/GMT${hours >= 0 ? '-' : '+'}${Math.abs(hours)}`;
};

// ============================================================================
// TIME CONVERSION UTILITIES
// ============================================================================

/**
 * Конвертировать локальное время в UTC ISO string
 */
export const toUtcISO = (date: string, timeHM: string, zone: string): string => {
  const timeStr = timeHM.includes(':') ? timeHM.split(':').slice(0, 2).join(':') : timeHM;
  const dt = DateTime.fromISO(`${date}T${timeStr}:00`, { zone });
  const iso = dt.toUTC().toISO({ suppressMilliseconds: true });
  if (!iso) {
    throw new Error('Invalid UTC conversion');
  }
  return iso;
};

/**
 * Конвертировать UTC ISO в локальное время (HH:mm)
 */
export const fromUtcToLocalHM = (utcISO: string, zone: string): string => {
  const dt = DateTime.fromISO(utcISO, { zone: 'utc' }).setZone(zone);
  return dt.toFormat('HH:mm');
};

/**
 * Конвертировать UTC ISO в локальную дату (YYYY-MM-DD)
 */
export const fromUtcToLocalDate = (utcISO: string, zone: string): string | null => {
  const dt = DateTime.fromISO(utcISO, { zone: 'utc' }).setZone(zone);
  return dt.toISODate();
};

/**
 * Конвертировать UTC ISO в локальное время и дату
 */
export const fromUtcToLocal = (utcISO: string, zone: string): { date: string; hm: string } => {
  const dt = DateTime.fromISO(utcISO, { zone: 'utc' }).setZone(zone);
  const date = dt.toISODate();
  if (!date) {
    throw new Error('Invalid date conversion');
  }
  return {
    date,
    hm: dt.toFormat('HH:mm')
  };
};

// ============================================================================
// TIME SLOT UTILITIES
// ============================================================================

/**
 * Конвертировать слот из UTC в локальное время
 */
export const convertSlotToLocal = (slot: { date: string; startTime: string; endTime: string; start_at_utc?: string; end_at_utc?: string }, zone: string) => {
  // Если есть новые UTC поля - используем их
  if (slot.start_at_utc && slot.end_at_utc) {
    const startLocal = fromUtcToLocal(slot.start_at_utc, zone);
    const endLocal = fromUtcToLocal(slot.end_at_utc, zone);
    return {
      date: startLocal.date,
      startTime: startLocal.hm,
      endTime: endLocal.hm
    };
  }
  
  // Fallback на legacy поля
  const timeStr = slot.startTime.includes(':') ? slot.startTime.split(':').slice(0, 2).join(':') : slot.startTime;
  const iso = `${slot.date}T${timeStr}:00`;
  const dt = DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone);
  const localDate = dt.toISODate()!;
  const localHM = dt.toFormat('HH:mm');
  
  // Для endTime используем ту же логику
  const endTimeStr = slot.endTime.includes(':') ? slot.endTime.split(':').slice(0, 2).join(':') : slot.endTime;
  const endIso = `${slot.date}T${endTimeStr}:00`;
  const endDt = DateTime.fromISO(endIso, { zone: 'utc' }).setZone(zone);
  const endLocalHM = endDt.toFormat('HH:mm');
  
  return {
    date: localDate,
    startTime: localHM,
    endTime: endLocalHM
  };
};

/**
 * Конвертировать локальное время в UTC для сохранения
 */
export const convertLocalToUtc = (date: string, startTime: string, endTime: string, zone: string) => {
  const startUtc = toUtcISO(date, startTime, zone);
  const endUtc = toUtcISO(date, endTime, zone);
  
  return {
    start_at_utc: startUtc,
    end_at_utc: endUtc,
    // Legacy поля для обратной совместимости
    date: DateTime.fromISO(startUtc).toISODate()!,
    startTime: DateTime.fromISO(startUtc).toFormat('HH:mm'),
    endTime: DateTime.fromISO(endUtc).toFormat('HH:mm')
  };
};

// ============================================================================
// DISPLAY UTILITIES
// ============================================================================

/**
 * Получить текущее время в указанной зоне
 */
export const nowInZoneHM = (zone: string): string => {
  return DateTime.now().setZone(zone).toFormat('HH:mm');
};

/**
 * Форматировать время для отображения в UI
 */
export const formatTimeForDisplay = (zone: string): string => {
  const now = new Date();
  
  // Для IANA зон используем Intl API
  if (isIANATimezone(zone)) {
    try {
      const fmt = new Intl.DateTimeFormat('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false, 
        timeZone: zone 
      });
      const parts = fmt.formatToParts(now);
      const hh = parts.find(p => p.type === 'hour')?.value || '00';
      const mm = parts.find(p => p.type === 'minute')?.value || '00';
      return `${hh}:${mm} ${zone}`;
    } catch (error) {
      console.warn('Intl API failed, using fallback:', error);
    }
  }
  
  // Для UTC±H зон конвертируем в IANA и используем Intl
  const utcMatch = zone.match(/^UTC([+-]?)(\d{1,2})(?::(\d{2}))?$/);
  if (utcMatch) {
    try {
      const ianaZone = utcToIANA(zone);
      const fmt = new Intl.DateTimeFormat('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false, 
        timeZone: ianaZone 
      });
      const parts = fmt.formatToParts(now);
      const hh = parts.find(p => p.type === 'hour')?.value || '00';
      const mm = parts.find(p => p.type === 'minute')?.value || '00';
      return `${hh}:${mm} ${zone}`;
    } catch (error) {
      console.warn('IANA conversion failed, using fallback:', error);
    }
  }
  
  // Fallback на системное время
  const hh = `${now.getHours()}`.padStart(2, '0');
  const mm = `${now.getMinutes()}`.padStart(2, '0');
  const systemOffset = -now.getTimezoneOffset();
  const offHours = Math.floor(systemOffset / 60);
  const fallbackZone = `UTC${offHours >= 0 ? '+' : ''}${offHours}`;
  return `${hh}:${mm} ${fallbackZone}`;
};


