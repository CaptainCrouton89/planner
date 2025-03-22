-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_requirements CASCADE;
DROP TABLE IF EXISTS screens CASCADE;
DROP TABLE IF EXISTS api_endpoints CASCADE;
DROP TABLE IF EXISTS data_models CASCADE;
DROP TABLE IF EXISTS project_overviews CASCADE;
DROP TABLE IF EXISTS user_stories CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop existing enum types
DROP TYPE IF EXISTS priority CASCADE;
DROP TYPE IF EXISTS status CASCADE;

-- Create enum types
CREATE TYPE priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE status AS ENUM ('open', 'in progress', 'completed');

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  stage TEXT NOT NULL DEFAULT 'requirements'
);

-- Project Requirements table
CREATE TABLE project_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  priority priority,
  position INTEGER
);

-- User Stories table
CREATE TABLE user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Overview table
CREATE TABLE project_overviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tech_stack JSONB NOT NULL,
  shared_components JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status status NOT NULL DEFAULT 'open'
);

-- Data Models table
CREATE TABLE data_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  properties JSONB NOT NULL,
  relations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status status NOT NULL DEFAULT 'open'
);

-- API Endpoints table
CREATE TABLE api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  description TEXT,
  method TEXT NOT NULL,
  parameters JSONB NOT NULL,
  request_format TEXT NOT NULL,
  response_format TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status status NOT NULL DEFAULT 'open'
);

-- Screens table
CREATE TABLE screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status status NOT NULL DEFAULT 'open'
);

-- Add self-reference for tasks (parent-child relationship)
ALTER TABLE tasks 
  ADD CONSTRAINT tasks_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES tasks(id) 
  ON DELETE SET NULL;

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