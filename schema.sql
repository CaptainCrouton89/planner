-- Create status enum if it doesn't exist
DROP TYPE IF EXISTS status CASCADE;
CREATE TYPE status AS ENUM ('open', 'in progress', 'completed');

-- Add stage column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'requirements';

-- Add status column to project_overviews table
ALTER TABLE project_overviews 
ADD COLUMN IF NOT EXISTS status status NOT NULL DEFAULT 'open';

-- Add status column to data_models table
ALTER TABLE data_models 
ADD COLUMN IF NOT EXISTS status status NOT NULL DEFAULT 'open';

-- Add status column to api_endpoints table
ALTER TABLE api_endpoints 
ADD COLUMN IF NOT EXISTS status status NOT NULL DEFAULT 'open';

-- Add status column to screens table
ALTER TABLE screens 
ADD COLUMN IF NOT EXISTS status status NOT NULL DEFAULT 'open';
