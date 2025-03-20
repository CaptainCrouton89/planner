-- Create custom ENUMs
CREATE TYPE IF NOT EXISTS priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE IF NOT EXISTS requirement_type AS ENUM ('functional', 'technical', 'non-functional', 'user_story');
CREATE TYPE IF NOT EXISTS requirement_status AS ENUM ('draft', 'proposed', 'approved', 'rejected', 'implemented', 'verified');
CREATE TYPE IF NOT EXISTS status AS ENUM ('unassigned', 'assigned', 'in_progress', 'review', 'completed');

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id UUID,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority priority,
  position INTEGER
);

-- Requirements table
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type requirement_type NOT NULL,
  priority priority NOT NULL,
  status requirement_status NOT NULL DEFAULT 'draft',
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discovery sessions table
CREATE TABLE IF NOT EXISTS discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  stage TEXT NOT NULL,
  responses JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical Requirements Table
CREATE TABLE IF NOT EXISTS technical_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type requirement_type NOT NULL,
  technical_stack TEXT NOT NULL,
  status status NOT NULL DEFAULT 'unassigned',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE
);

-- Acceptance Criteria Table
CREATE TABLE IF NOT EXISTS acceptance_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  technical_requirement_id UUID NOT NULL REFERENCES technical_requirements(id) ON DELETE CASCADE
);

-- Technical Requirement Dependencies
CREATE TABLE IF NOT EXISTS technical_requirement_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID NOT NULL REFERENCES technical_requirements(id) ON DELETE CASCADE,
  dependency_id UUID NOT NULL REFERENCES technical_requirements(id) ON DELETE CASCADE
);

-- Technical Requirement Tags
CREATE TABLE IF NOT EXISTS technical_requirement_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technical_requirement_id UUID NOT NULL REFERENCES technical_requirements(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE
);

-- Functional Requirements Table
CREATE TABLE IF NOT EXISTS functional_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type requirement_type NOT NULL,
  priority priority NOT NULL,
  status status NOT NULL DEFAULT 'unassigned',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Functional Requirement Dependencies
CREATE TABLE IF NOT EXISTS functional_requirement_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID NOT NULL REFERENCES functional_requirements(id) ON DELETE CASCADE,
  dependency_id UUID NOT NULL REFERENCES functional_requirements(id) ON DELETE CASCADE,
  technical_dependency_id UUID REFERENCES technical_requirements(id) ON DELETE CASCADE
);

-- Functional Requirement Tags
CREATE TABLE IF NOT EXISTS functional_requirement_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  functional_requirement_id UUID NOT NULL REFERENCES functional_requirements(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE
); 