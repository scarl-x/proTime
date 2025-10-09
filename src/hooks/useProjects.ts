import { useState, useEffect } from 'react';
import { Project } from '../types';
import { projectsAPI } from '../lib/api';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
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
    setCurrentProject(null);
  };

  const loadProjects = async () => {
    try {
      const loadedProjects = await projectsAPI.getAll();
      setProjects(loadedProjects);
      
      if (!currentProject) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      loadDemoProjects();
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const newProject = await projectsAPI.create(project);
      await loadProjects();
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await projectsAPI.update(id, updates);
      await loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectsAPI.delete(id);
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
