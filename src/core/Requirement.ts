export type RequirementType =
  | "functional"
  | "technical"
  | "non-functional"
  | "user_story";
export type RequirementPriority = "low" | "medium" | "high" | "critical";
export type RequirementStatus =
  | "draft"
  | "proposed"
  | "approved"
  | "rejected"
  | "implemented"
  | "verified";

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RequirementInput {
  projectId: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  tags?: string[];
}

export interface UpdateRequirementInput {
  title?: string;
  description?: string;
  type?: RequirementType;
  priority?: RequirementPriority;
  status?: RequirementStatus;
  tags?: string[];
}

export interface DiscoverySession {
  id: string;
  projectId: string;
  domain: string;
  stage: DiscoveryStage;
  responses: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export type DiscoveryStage =
  | "initial"
  | "stakeholders"
  | "features"
  | "constraints"
  | "quality"
  | "finalize";

export interface DiscoveryInput {
  projectId: string;
  domain: string;
  stage: DiscoveryStage;
  previousResponses?: string;
}

export interface DiscoveryResponse {
  questions: string[];
  suggestions: string[];
  nextStage?: DiscoveryStage;
}

export interface DiscoveryProcessInput {
  projectId: string;
  stage: DiscoveryStage;
  domain: string;
  response: string;
  previousResponses?: string;
}
