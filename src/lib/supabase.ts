// This file is deprecated. Use src/lib/api.ts instead.
// Kept for backward compatibility only.

export { API_URL as hasRestApiCredentials, hasApiConnection } from './api';

// Supabase connection status

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'admin' | 'employee';
          position?: string;
          has_account: boolean;
          password?: string;
          birthday?: string;
          employment_date?: string;
          termination_date?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role: 'admin' | 'employee';
          position?: string;
          has_account?: boolean;
          password?: string;
          birthday?: string;
          employment_date?: string;
          termination_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'admin' | 'employee';
          position?: string;
          has_account?: boolean;
          password?: string;
          birthday?: string;
          employment_date?: string;
          termination_date?: string;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          color: string;
          status: 'active' | 'completed' | 'on-hold';
          team_members: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          color?: string;
          status?: 'active' | 'completed' | 'on-hold';
          team_members?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          color?: string;
          status?: 'active' | 'completed' | 'on-hold';
          team_members?: string[];
          created_at?: string;
        };
      };
      time_slots: {
        Row: {
          id: string;
          employee_id: string;
          project_id: string;
          date: string;
          start_time: string;
          end_time: string;
          task: string;
          planned_hours: number;
          actual_hours: number;
          status: 'planned' | 'in-progress' | 'completed';
          category: string;
          created_at: string;
          parent_task_id?: string;
          task_sequence?: number;
          total_task_hours?: number;
          is_paused?: boolean;
          paused_at?: string;
          resumed_at?: string;
          is_recurring?: boolean;
          recurrence_type?: 'daily' | 'weekly' | 'monthly';
          recurrence_interval?: number;
          recurrence_end_date?: string;
          recurrence_days?: string[];
          parent_recurring_id?: string;
          recurrence_count?: number;
          deadline?: string;
          deadline_type?: 'soft' | 'hard';
          is_assigned_by_admin?: boolean;
          deadline_reason?: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          project_id: string;
          date: string;
          start_time: string;
          end_time: string;
          task: string;
          planned_hours?: number;
          actual_hours?: number;
          status?: 'planned' | 'in-progress' | 'completed';
          category?: string;
          created_at?: string;
          parent_task_id?: string;
          task_sequence?: number;
          total_task_hours?: number;
          is_paused?: boolean;
          paused_at?: string;
          resumed_at?: string;
          is_recurring?: boolean;
          recurrence_type?: 'daily' | 'weekly' | 'monthly';
          recurrence_interval?: number;
          recurrence_end_date?: string;
          recurrence_days?: string[];
          parent_recurring_id?: string;
          recurrence_count?: number;
          deadline?: string;
          deadline_type?: 'soft' | 'hard';
          is_assigned_by_admin?: boolean;
          deadline_reason?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          project_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          task?: string;
          planned_hours?: number;
          actual_hours?: number;
          status?: 'planned' | 'in-progress' | 'completed';
          category?: string;
          created_at?: string;
          parent_task_id?: string;
          task_sequence?: number;
          total_task_hours?: number;
          is_paused?: boolean;
          paused_at?: string;
          resumed_at?: string;
          is_recurring?: boolean;
          recurrence_type?: 'daily' | 'weekly' | 'monthly';
          recurrence_interval?: number;
          recurrence_end_date?: string;
          recurrence_days?: string[];
          parent_recurring_id?: string;
          recurrence_count?: number;
          deadline?: string;
          deadline_type?: 'soft' | 'hard';
          is_assigned_by_admin?: boolean;
          deadline_reason?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string;
          planned_hours: number;
          actual_hours: number;
          hourly_rate: number;
          total_cost: number;
          status: 'new' | 'planned' | 'in-progress' | 'code-review' | 'testing-internal' | 'testing-client' | 'closed';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string;
          planned_hours: number;
          actual_hours?: number;
          hourly_rate?: number;
          status?: 'new' | 'planned' | 'in-progress' | 'code-review' | 'testing-internal' | 'testing-client' | 'closed';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string;
          planned_hours?: number;
          actual_hours?: number;
          hourly_rate?: number;
          status?: 'new' | 'planned' | 'in-progress' | 'code-review' | 'testing-internal' | 'testing-client' | 'closed';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_assignments: {
        Row: {
          id: string;
          task_id: string;
          employee_id: string;
          allocated_hours: number;
          actual_hours: number;
          created_at: string;
          deadline?: string;
          deadline_type?: 'soft' | 'hard';
          deadline_reason?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
        };
        Insert: {
          id?: string;
          task_id: string;
          employee_id: string;
          allocated_hours: number;
          actual_hours?: number;
          created_at?: string;
          deadline?: string;
          deadline_type?: 'soft' | 'hard';
          deadline_reason?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
        };
        Update: {
          id?: string;
          task_id?: string;
          employee_id?: string;
          allocated_hours?: number;
          actual_hours?: number;
          created_at?: string;
          deadline?: string;
          deadline_type?: 'soft' | 'hard';
          deadline_reason?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
        };
      };
      task_categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          default_hours: number;
          default_hourly_rate: number;
          color: string;
          is_active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          default_hours?: number;
          default_hourly_rate?: number;
          color?: string;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          default_hours?: number;
          default_hourly_rate?: number;
          color?: string;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
        };
      };
      leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          type: 'vacation' | 'sick_leave' | 'personal_leave' | 'compensatory_leave';
          start_date: string;
          end_date: string;
          days_count: number;
          reason: string;
          status: 'pending' | 'approved' | 'rejected' | 'cancelled';
          approved_by?: string;
          approved_at?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          type: 'vacation' | 'sick_leave' | 'personal_leave' | 'compensatory_leave';
          start_date: string;
          end_date: string;
          days_count: number;
          reason: string;
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
          approved_by?: string;
          approved_at?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          type?: 'vacation' | 'sick_leave' | 'personal_leave' | 'compensatory_leave';
          start_date?: string;
          end_date?: string;
          days_count?: number;
          reason?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
          approved_by?: string;
          approved_at?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          requester_id: string;
          employee_id: string;
          project_id: string;
          date: string;
          start_time: string;
          end_time: string;
          duration_hours: number;
          task_description: string;
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          employee_id: string;
          project_id: string;
          date: string;
          start_time: string;
          end_time: string;
          duration_hours: number;
          task_description: string;
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          employee_id?: string;
          project_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          duration_hours?: number;
          task_description?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}