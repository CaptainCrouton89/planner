import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Define priority enum
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  parentId: uuid("parent_id"),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  priority: priorityEnum("priority"),
  position: integer("position"),
});

// Requirement type and status enums
export const requirementTypeEnum = pgEnum("requirement_type", [
  "functional",
  "technical",
  "non-functional",
  "user_story",
]);

export const requirementStatusEnum = pgEnum("requirement_status", [
  "draft",
  "approved",
  "implemented",
]);

// Requirements table
export const requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: requirementTypeEnum("type").notNull(),
  priority: priorityEnum("priority").notNull(),
  status: requirementStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Discovery sessions table
export const discoverySessions = pgTable("discovery_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  stage: text("stage").notNull(),
  responses: jsonb("responses").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Enums
export const statusEnum = pgEnum("status", [
  "unassigned",
  "assigned",
  "in_progress",
  "review",
  "completed",
]);

// Technical Requirements Table
export const technicalRequirements = pgTable("technical_requirements", {
  id: uuid("id").defaultRandom().primaryKey(),
  uniqueId: varchar("unique_id", { length: 20 }).notNull().unique(), // e.g., TR-001
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  type: requirementTypeEnum("type").notNull(),
  technicalStack: text("technical_stack").notNull(),
  status: statusEnum("status").default("unassigned").notNull(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Technical Requirement Dependencies (many-to-many)
export const technicalRequirementDependencies = pgTable(
  "technical_requirement_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dependentId: uuid("dependent_id")
      .notNull()
      .references(() => technicalRequirements.id, { onDelete: "cascade" }),
    dependencyId: uuid("dependency_id")
      .notNull()
      .references(() => technicalRequirements.id, { onDelete: "cascade" }),
  }
);
// Acceptance Criteria Table
export const acceptanceCriteria = pgTable("acceptance_criteria", {
  id: uuid("id").defaultRandom().primaryKey(),
  description: text("description").notNull(),
  technicalRequirementId: uuid("technical_requirement_id")
    .notNull()
    .references(() => technicalRequirements.id, { onDelete: "cascade" }),
});

// Functional Requirements Table
export const functionalRequirements = pgTable("functional_requirements", {
  id: uuid("id").defaultRandom().primaryKey(),
  uniqueId: varchar("unique_id", { length: 20 }).notNull().unique(), // e.g., FR-001
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  type: requirementTypeEnum("type").notNull(),
  priority: priorityEnum("priority").notNull(),
  status: statusEnum("status").default("unassigned").notNull(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Functional Requirement Dependencies (many-to-many)
export const functionalRequirementDependencies = pgTable(
  "functional_requirement_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dependentId: uuid("dependent_id")
      .notNull()
      .references(() => functionalRequirements.id, { onDelete: "cascade" }),
    dependencyId: uuid("dependency_id")
      .notNull()
      .references(() => functionalRequirements.id, { onDelete: "cascade" }),
    // Can also depend on technical requirements
    technicalDependencyId: uuid("technical_dependency_id").references(
      () => technicalRequirements.id,
      { onDelete: "cascade" }
    ),
  }
);

export const specs = pgTable("specs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types for use in the application
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Requirement = typeof requirements.$inferSelect;
export type NewRequirement = typeof requirements.$inferInsert;
export type DiscoverySession = typeof discoverySessions.$inferSelect;
export type NewDiscoverySession = typeof discoverySessions.$inferInsert;
export type TechnicalRequirement = typeof technicalRequirements.$inferSelect;
export type NewTechnicalRequirement = typeof technicalRequirements.$inferInsert;
export type FunctionalRequirement = typeof functionalRequirements.$inferSelect;
export type NewFunctionalRequirement =
  typeof functionalRequirements.$inferInsert;
export type AcceptanceCriteria = typeof acceptanceCriteria.$inferSelect;
export type NewAcceptanceCriteria = typeof acceptanceCriteria.$inferInsert;
export type TechnicalRequirementDependency =
  typeof technicalRequirementDependencies.$inferSelect;
export type NewTechnicalRequirementDependency =
  typeof technicalRequirementDependencies.$inferInsert;
export type FunctionalRequirementDependency =
  typeof functionalRequirementDependencies.$inferSelect;
export type NewFunctionalRequirementDependency =
  typeof functionalRequirementDependencies.$inferInsert;
