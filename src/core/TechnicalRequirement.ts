import { RequirementType } from "./Requirement.js";

export type TechnicalRequirementStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "review"
  | "completed";

export interface AcceptanceCriteria {
  id: string;
  description: string;
  technicalRequirementId: string;
}

export interface AcceptanceCriteriaInput {
  description: string;
}

export interface TechnicalRequirement {
  id: string;
  uniqueId: string; // e.g., TR-001
  projectId: string;
  title: string;
  description: string;
  type: RequirementType;
  technicalStack: string;
  status: TechnicalRequirementStatus;
  acceptanceCriteria: AcceptanceCriteria[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TechnicalRequirementInput {
  projectId: string;
  title: string;
  description: string;
  type: RequirementType;
  technicalStack: string;
  status?: TechnicalRequirementStatus;
  acceptanceCriteria?: AcceptanceCriteriaInput[];
}

export interface UpdateTechnicalRequirementInput {
  title?: string;
  description?: string;
  type?: RequirementType;
  technicalStack?: string;
  status?: TechnicalRequirementStatus;
  acceptanceCriteria?: AcceptanceCriteriaInput[];
}

export interface TechnicalRequirementDependency {
  id: string;
  dependentId: string;
  dependencyId: string;
}

export interface TechnicalRequirementDependencyInput {
  dependentId: string;
  dependencyId: string;
}
