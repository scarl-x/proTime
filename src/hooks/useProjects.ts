import { useState } from 'react';
import { Project } from '../types';
import { supabase, hasSupabaseCredentials } from '../lib/supabase';
import { useEffect } from 'react';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    if (hasSupabaseCredentials && supabase) {
      loadProjects();
    } else {
      loadDemoProjects();
    }
  }, []);

  const loadDemoProjects = () => {
    const demoProjects: Project[] = [
      {
        id: '1',
        name: 'Веб-приложение CRM',
        description: 'Разработка системы управления клиентами',
        color: '#3B82F6',
        status: 'active',
        teamLeadId: '2',
        createdAt: '2024-01-01',
        teamMembers: ['2', '3'],
      },
      {
        id: '2',
        name: 'Мобильное приложение',
        description: 'iOS и Android приложение для клиентов',
        color: '#10B981',
        status: 'active',
        teamLeadId: undefined,
        createdAt: '2024-01-15',
        teamMembers: ['2'],
      },
      {
        id: '3',
        name: 'Система аналитики',
        description: 'Внутренняя система для анализа данных',
        color: '#F59E0B',
        status: 'on-hold',
        teamLeadId: '3',
        createdAt: '2024-02-01',
        teamMembers: ['3'],
      },
    ];
    setProjects(demoProjects);
    // По умолчанию показываем все проекты
    setCurrentProject(null);
  };

  const loadProjects = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const formattedProjects: Project[] = data.map(dbProject => ({
        id: dbProject.id,
        name: dbProject.name,
        description: dbProject.description,
        color: dbProject.color,
        status: dbProject.status as 'active' | 'completed' | 'on-hold',
        createdAt: dbProject.created_at.split('T')[0],
        teamLeadId: dbProject.team_lead_id || undefined,
        teamMembers: dbProject.team_members || [],
      }));

      setProjects(formattedProjects);
      
      // По умолчанию показываем все проекты
      if (!currentProject) {
        setCurrentProject(null);
      }
      
      if (formattedProjects.length === 0) {
        await createDemoProjectsInSupabase();
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      loadDemoProjects();
    }
  };

  const createDemoProjectsInSupabase = async () => {
    if (!supabase) return;
    
    try {
      const demoProjects = [
        {
          name: 'Веб-приложение CRM',
          description: 'Разработка системы управления клиентами',
          color: '#3B82F6',
          status: 'active',
          team_members: [],
        },
        {
          name: 'Мобильное приложение',
          description: 'iOS и Android приложение для клиентов',
          color: '#10B981',
          status: 'active',
          team_members: [],
        },
        {
          name: 'Система аналитики',
          description: 'Внутренняя система для анализа данных',
          color: '#F59E0B',
          status: 'on-hold',
          team_members: [],
        },
      ];

      const { data, error } = await supabase
        .from('projects')
        .insert(demoProjects)
        .select();

      if (error) {
        loadDemoProjects();
        return;
      }

      await loadProjects();
    } catch (error) {
      loadDemoProjects();
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    if (!supabase) {
      // Demo mode - add to local state
      const newProject: Project = {
        ...project,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProjects(prev => [...prev, newProject]);
      return newProject;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          description: project.description,
          color: project.color,
          status: project.status,
          team_lead_id: project.teamLeadId || null,
          team_members: project.teamMembers,
        })
        .select()
        .single();

      if (error) throw error;

      await loadProjects();
      return data;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!supabase) {
      // Demo mode - update local state
      setProjects(prev => prev.map(project => 
        project.id === id ? { ...project, ...updates } : project
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          status: updates.status,
          team_lead_id: updates.teamLeadId,
          team_members: updates.teamMembers,
        })
        .eq('id', id);

      if (error) throw error;

      await loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    if (!supabase) {
      // Demo mode - remove from local state
      setProjects(prev => prev.filter(project => project.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProjects();
      
      // Reset current project if it's the one being deleted
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const getProjectsByEmployee = (employeeId: string) => {
    return projects.filter(project => project.teamMembers.includes(employeeId));
  };

  const addTeamMember = async (projectId: string, employeeId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      await updateProject(projectId, {
        teamMembers: [...project.teamMembers, employeeId]
      });
    }
  };

  const removeTeamMember = async (projectId: string, employeeId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      await updateProject(projectId, {
        teamMembers: project.teamMembers.filter(id => id !== employeeId)
      });
    }
  };

  return {
    projects,
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    getProjectsByEmployee,
    addTeamMember,
    removeTeamMember,
  };
};