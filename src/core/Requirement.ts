export type RequirementType =
  | "functional"
  | "technical"
  | "non-functional"
  | "user_story";
export type RequirementPriority = "low" | "medium" | "high";
export type RequirementStatus = "draft" | "approved" | "implemented";

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
