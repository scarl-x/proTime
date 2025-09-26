/*
  # Add deadline support to task_assignments and time_slots tables

  1. Add deadline fields to task_assignments table:
     - `deadline` (date) - deadline date for this assignment
     - `deadline_type` (text) - 'soft' or 'hard' deadline type
     - `deadline_reason` (text) - reason for deadline
     - `priority` (text) - priority for this assignment: 'low', 'medium', 'high', 'urgent'

  2. Add deadline fields to time_slots table:
     - `deadline` (date) - deadline date
     - `deadline_type` (text) - 'soft' or 'hard' deadline type
     - `is_assigned_by_admin` (boolean) - whether slot was assigned by admin
     - `deadline_reason` (text) - reason for deadline

  3. Add indexes for deadline queries
  4. Add constraints for deadline types and priorities
*/

-- Add deadline fields to task_assignments table
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS deadline date,
ADD COLUMN IF NOT EXISTS deadline_type text CHECK (deadline_type IN ('soft', 'hard')),
ADD COLUMN IF NOT EXISTS deadline_reason text,
ADD COLUMN IF NOT EXISTS priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium';

-- Add deadline fields to time_slots table
ALTER TABLE time_slots 
ADD COLUMN IF NOT EXISTS deadline date,
ADD COLUMN IF NOT EXISTS deadline_type text CHECK (deadline_type IN ('soft', 'hard')),
ADD COLUMN IF NOT EXISTS is_assigned_by_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deadline_reason text;

-- Create indexes for deadline queries
CREATE INDEX IF NOT EXISTS idx_task_assignments_deadline ON task_assignments(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_assignments_priority ON task_assignments(priority);
CREATE INDEX IF NOT EXISTS idx_time_slots_deadline ON time_slots(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_slots_assigned_by_admin ON time_slots(is_assigned_by_admin);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_task_assignments_deadline_employee ON task_assignments(deadline, employee_id) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_slots_deadline_status ON time_slots(deadline, status) WHERE deadline IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN task_assignments.deadline IS 'Deadline date for this task assignment';
COMMENT ON COLUMN task_assignments.deadline_type IS 'Type of deadline: soft (can be exceeded) or hard (strict)';
COMMENT ON COLUMN task_assignments.deadline_reason IS 'Reason or justification for the deadline';
COMMENT ON COLUMN task_assignments.priority IS 'Priority level for this assignment: low, medium, high, urgent';

COMMENT ON COLUMN time_slots.deadline IS 'Deadline date for the time slot';
COMMENT ON COLUMN time_slots.deadline_type IS 'Type of deadline: soft (can be exceeded) or hard (strict)';
COMMENT ON COLUMN time_slots.is_assigned_by_admin IS 'Whether the time slot was assigned by an administrator';
COMMENT ON COLUMN time_slots.deadline_reason IS 'Reason or justification for the deadline';
