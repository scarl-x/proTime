import { useState, useEffect } from 'react';
import { TimeSlot, User, Project } from '../types';
import { 
  generateDailyStandups, 
  shouldCreateDailyStandups, 
  createStandupForDate,
  DEFAULT_STANDUP_CONFIG,
  DailyStandupConfig 
} from '../utils/dailyStandupUtils';
import { supabase, hasSupabaseCredentials } from '../lib/supabase';

export const useDailyStandups = (
  employees: User[],
  projects: Project[],
  timeSlots: TimeSlot[],
  onAddTimeSlot: (slot: Omit<TimeSlot, 'id'>) => void
) => {
  const [configs, setConfigs] = useState<{ [projectId: string]: DailyStandupConfig }>({});
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загружаем конфигурацию при старте
  useEffect(() => {
    loadConfigs();
  }, []);

  // Автоматическое создание дейликов только после загрузки конфигурации
  useEffect(() => {
    if (!isInitialized && isConfigLoaded && employees.length > 0 && projects.length > 0) {
      console.log('Проверяем настройки дейликов для всех проектов...');
      const enabledProjects = projects.filter(project => {
        const config = getProjectConfig(project.id);
        console.log(`Проект ${project.name}: isEnabled = ${config.isEnabled}`);
        return config.isEnabled;
      });
      
      if (enabledProjects.length > 0) {
        console.log(`Дейлики включены для ${enabledProjects.length} проектов, инициализируем...`);
        initializeDailyStandups();
      } else {
        console.log('Дейлики отключены для всех проектов, пропускаем инициализацию');
      }
      setIsInitialized(true);
    }
  }, [employees, projects, isInitialized, isConfigLoaded]);

  const loadConfigs = async () => {
    console.log('Загружаем конфигурации дейликов...');
    if (hasSupabaseCredentials && supabase) {
      try {
        const { data, error } = await supabase
          .from('daily_standup_config')
          .select('*');

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error loading standup configs:', error);
          return;
        }

        if (data && data.length > 0) {
          const configsMap: { [projectId: string]: DailyStandupConfig } = {};
          data.forEach(dbConfig => {
            configsMap[dbConfig.project_id] = {
              projectId: dbConfig.project_id,
              startTime: dbConfig.start_time,
              endTime: dbConfig.end_time,
              task: dbConfig.task,
              category: dbConfig.category,
              workDays: dbConfig.work_days,
              isEnabled: dbConfig.is_enabled,
            };
          });
          setConfigs(configsMap);
          console.log('Конфигурации загружены из Supabase:', configsMap);
        } else {
          // Создаем конфигурации для всех проектов
          await createDefaultConfigs();
        }
      } catch (error) {
        console.error('Error loading standup configs:', error);
      }
    } else {
      // В демо-режиме загружаем из localStorage
      const savedConfigs = localStorage.getItem('dailyStandupConfigs');
      if (savedConfigs) {
        try {
          const parsedConfigs = JSON.parse(savedConfigs);
          setConfigs(parsedConfigs);
          console.log('Конфигурации загружены из localStorage:', parsedConfigs);
        } catch (error) {
          console.error('Error parsing saved configs:', error);
        }
      } else {
        // Создаем конфигурации по умолчанию для всех проектов
        const defaultConfigs: { [projectId: string]: DailyStandupConfig } = {};
        projects.forEach(project => {
          defaultConfigs[project.id] = {
            ...DEFAULT_STANDUP_CONFIG,
            projectId: project.id,
            isEnabled: false, // По умолчанию отключено
          };
        });
        setConfigs(defaultConfigs);
        console.log('Используются конфигурации по умолчанию:', defaultConfigs);
      }
    }
    setIsConfigLoaded(true);
  };

  const createDefaultConfigs = async () => {
    if (!hasSupabaseCredentials || !supabase) return;
    
    if (projects.length === 0) {
      console.log('Нет проектов для создания конфигураций дейликов');
      return;
    }
    
    try {
      const configsToInsert = projects.map(project => ({
        project_id: project.id,
        start_time: DEFAULT_STANDUP_CONFIG.startTime,
        end_time: DEFAULT_STANDUP_CONFIG.endTime,
        task: DEFAULT_STANDUP_CONFIG.task,
        category: DEFAULT_STANDUP_CONFIG.category,
        work_days: DEFAULT_STANDUP_CONFIG.workDays,
        is_enabled: DEFAULT_STANDUP_CONFIG.isEnabled,
      }));

      console.log('Создаем конфигурации для проектов:', configsToInsert);

      const { error } = await supabase
        .from('daily_standup_config')
        .insert(configsToInsert);

      if (error) {
        console.error('Error creating default configs:', error);
      } else {
        console.log('Созданы конфигурации по умолчанию для всех проектов');
        await loadConfigs();
      }
    } catch (error) {
      console.error('Error in createDefaultConfigs:', error);
    }
  };

  const saveConfig = async (projectId: string, newConfig: DailyStandupConfig) => {
    console.log('Сохраняем конфигурацию дейликов для проекта:', projectId, newConfig);
    if (hasSupabaseCredentials && supabase) {
      try {
        const { error } = await supabase
          .from('daily_standup_config')
          .upsert({
            project_id: projectId,
            start_time: newConfig.startTime,
            end_time: newConfig.endTime,
            task: newConfig.task,
            category: newConfig.category,
            work_days: newConfig.workDays,
            is_enabled: newConfig.isEnabled,
          });

        if (error) {
          console.error('Error saving standup config for project:', projectId, error);
        } else {
          console.log('Конфигурация успешно сохранена в Supabase для проекта:', projectId);
        }
      } catch (error) {
        console.error('Error saving standup config for project:', projectId, error);
      }
    } else {
      // В демо-режиме сохраняем в localStorage
      const updatedConfigs = { ...configs, [projectId]: newConfig };
      localStorage.setItem('dailyStandupConfigs', JSON.stringify(updatedConfigs));
      console.log('Конфигурация сохранена в localStorage для проекта:', projectId, newConfig);
    }
  };

  const initializeDailyStandups = async () => {
    console.log('initializeDailyStandups вызвана');

    console.log('Инициализация ежедневных дейликов для всех проектов...');
    
    // Создаем дейлики на следующие 30 дней
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    let totalNewStandups = 0;

    // Создаем дейлики для каждого проекта с включенными настройками
    for (const project of projects) {
      const projectConfig = configs[project.id];
      if (!projectConfig?.isEnabled) {
        console.log(`Дейлики отключены для проекта: ${project.name}`);
        continue;
      }

      console.log(`Создаем дейлики для проекта: ${project.name}`);
      
      const standups = generateDailyStandups(employees, project, startDate, endDate, projectConfig);
      
      // Фильтруем только те дейлики, которых еще нет
      const newStandups = standups.filter(standup => 
        shouldCreateDailyStandups(timeSlots, standup.date, project.id, projectConfig)
      );

      console.log(`Создание ${newStandups.length} новых дейликов для проекта ${project.name}...`);

      // Создаем дейлики с небольшой задержкой между каждым
      for (let i = 0; i < newStandups.length; i++) {
        setTimeout(() => {
          onAddTimeSlot({
            ...newStandups[i],
            actualHours: newStandups[i].plannedHours,
            status: 'completed'
          });
        }, (totalNewStandups + i) * 50); // 50мс задержка между созданием
      }
      
      totalNewStandups += newStandups.length;
    }

    if (totalNewStandups > 0) {
      console.log(`✅ Создано ${totalNewStandups} ежедневных дейликов для всех проектов`);
    }
  };

  const createStandupsForPeriod = async (startDate: Date, endDate: Date, projectId?: string) => {
    console.log('createStandupsForPeriod вызвана для проекта:', projectId);
    
    let totalCreated = 0;
    const projectsToProcess = projectId ? [projects.find(p => p.id === projectId)!] : projects;

    for (const project of projectsToProcess) {
      if (!project) continue;
      
      const projectConfig = configs[project.id];
      if (!projectConfig?.isEnabled) continue;

      const standups = generateDailyStandups(employees, project, startDate, endDate, projectConfig);
      
      const newStandups = standups.filter(standup => 
        shouldCreateDailyStandups(timeSlots, standup.date, project.id, projectConfig)
      );

      for (const standup of newStandups) {
        await onAddTimeSlot(standup);
        totalCreated++;
      }
    }

    return totalCreated;
  };

  const createStandupForSpecificDate = async (date: string, projectId?: string) => {
    console.log('createStandupForSpecificDate вызвана для проекта:', projectId);
    
    let totalCreated = 0;
    const projectsToProcess = projectId ? [projects.find(p => p.id === projectId)!] : projects;

    for (const project of projectsToProcess) {
      if (!project) continue;
      
      const projectConfig = configs[project.id];
      if (!projectConfig?.isEnabled) continue;
      
      if (!shouldCreateDailyStandups(timeSlots, date, project.id, projectConfig)) {
        continue;
      }

      const standups = createStandupForDate(date, employees, project, projectConfig);
      
      for (const standup of standups) {
        await onAddTimeSlot(standup);
        totalCreated++;
      }
    }

    return totalCreated > 0;
  };

  const updateConfig = (projectId: string, newConfig: Partial<DailyStandupConfig>) => {
    const currentConfig = configs[projectId] || { ...DEFAULT_STANDUP_CONFIG, projectId };
    const updatedConfig = { ...currentConfig, ...newConfig, projectId };
    console.log('Обновляем конфигурацию дейликов для проекта:', projectId, updatedConfig);
    
    setConfigs(prev => ({ ...prev, [projectId]: updatedConfig }));
    saveConfig(projectId, updatedConfig);
    
    // Если изменили настройку включения/отключения, сбрасываем флаг инициализации
    if (newConfig.isEnabled !== undefined) {
      setIsInitialized(false);
    }
  };

  const getDailyStandups = (date?: string, projectId?: string) => {
    const projectConfig = projectId ? configs[projectId] : null;
    const taskName = projectConfig?.task || 'Ежедневный дейлик команды';
    
    return timeSlots.filter(slot => 
      slot.task === taskName &&
      (projectId ? slot.projectId === projectId : true) &&
      (date ? slot.date === date : true)
    );
  };

  const getStandupStats = () => {
    const allStandups = getDailyStandups();
    const completedStandups = allStandups.filter(slot => slot.status === 'completed');
    const todayStandups = getDailyStandups(new Date().toISOString().split('T')[0]);
    
    return {
      total: allStandups.length,
      completed: completedStandups.length,
      completionRate: allStandups.length > 0 ? (completedStandups.length / allStandups.length) * 100 : 0,
      todayCount: todayStandups.length,
      todayCompleted: todayStandups.filter(slot => slot.status === 'completed').length,
      projectStats: projects.map(project => {
        const projectStandups = getDailyStandups(undefined, project.id);
        const projectConfig = configs[project.id];
        return {
          projectId: project.id,
          projectName: project.name,
          isEnabled: projectConfig?.isEnabled || false,
          total: projectStandups.length,
          completed: projectStandups.filter(slot => slot.status === 'completed').length,
        };
      }),
    };
  };

  const getProjectConfig = (projectId: string): DailyStandupConfig => {
    return configs[projectId] || { ...DEFAULT_STANDUP_CONFIG, projectId };
  };

  return {
    configs,
    getProjectConfig,
    updateConfig,
    initializeDailyStandups,
    createStandupsForPeriod,
    createStandupForSpecificDate,
    getDailyStandups,
    getStandupStats,
  };
};