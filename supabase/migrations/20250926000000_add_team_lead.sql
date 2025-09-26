/*
  # Add team lead to projects

  1. Changes to projects table
    - Add `team_lead_id` (uuid, optional) → references users(id)

  2. Indexes
    - Index on team_lead_id for quick lookups

  3. Security
    - RLS policies remain unchanged
*/

-- Add team_lead_id column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'team_lead_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN team_lead_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for team_lead_id lookups
CREATE INDEX IF NOT EXISTS idx_projects_team_lead_id ON projects(team_lead_id) WHERE team_lead_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN projects.team_lead_id IS 'Тим-лид проекта (ссылка на users.id)';


