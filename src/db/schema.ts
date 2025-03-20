import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
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

// Define relationships
export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  technicalRequirements: many(technicalRequirements),
  functionalRequirements: many(functionalRequirements),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
  }),
  children: many(tasks, {
    relationName: "parent_child",
  }),
}));

// Enums
export const statusEnum = pgEnum("status", [
  "unassigned",
  "assigned",
  "in_progress",
  "review",
  "completed",
]);
export const requirementTypeEnum = pgEnum("requirement_type", [
  // Technical Requirement Types
  "foundation",
  "backend",
  "frontend",
  "database",
  "integration",
  // Functional Requirement Types
  "core",
  "enhancement",
  "security",
  "reporting",
  "user_interface",
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

// Technical Requirements Relations
export const technicalRequirementsRelations = relations(
  technicalRequirements,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [technicalRequirements.projectId],
      references: [projects.id],
    }),
    dependencies: many(technicalRequirementDependencies, {
      relationName: "dependent",
    }),
    dependentOn: many(technicalRequirementDependencies, {
      relationName: "dependency",
    }),
    acceptanceCriteria: many(acceptanceCriteria),
    tags: many(technicalRequirementTags),
  })
);

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

// Technical Requirement Dependencies Relations
export const technicalRequirementDependenciesRelations = relations(
  technicalRequirementDependencies,
  ({ one }) => ({
    dependent: one(technicalRequirements, {
      fields: [technicalRequirementDependencies.dependentId],
      references: [technicalRequirements.id],
      relationName: "dependent",
    }),
    dependency: one(technicalRequirements, {
      fields: [technicalRequirementDependencies.dependencyId],
      references: [technicalRequirements.id],
      relationName: "dependency",
    }),
  })
);

// Acceptance Criteria Table
export const acceptanceCriteria = pgTable("acceptance_criteria", {
  id: uuid("id").defaultRandom().primaryKey(),
  description: text("description").notNull(),
  technicalRequirementId: uuid("technical_requirement_id")
    .notNull()
    .references(() => technicalRequirements.id, { onDelete: "cascade" }),
});

// Acceptance Criteria Relations
export const acceptanceCriteriaRelations = relations(
  acceptanceCriteria,
  ({ one }) => ({
    technicalRequirement: one(technicalRequirements, {
      fields: [acceptanceCriteria.technicalRequirementId],
      references: [technicalRequirements.id],
    }),
  })
);

// Tags for Technical Requirements
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

// Technical Requirement Tags (many-to-many)
export const technicalRequirementTags = pgTable("technical_requirement_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  technicalRequirementId: uuid("technical_requirement_id")
    .notNull()
    .references(() => technicalRequirements.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
});

// Technical Requirement Tags Relations
export const technicalRequirementTagsRelations = relations(
  technicalRequirementTags,
  ({ one }) => ({
    technicalRequirement: one(technicalRequirements, {
      fields: [technicalRequirementTags.technicalRequirementId],
      references: [technicalRequirements.id],
    }),
    tag: one(tags, {
      fields: [technicalRequirementTags.tagId],
      references: [tags.id],
    }),
  })
);

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

// Functional Requirements Relations
export const functionalRequirementsRelations = relations(
  functionalRequirements,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [functionalRequirements.projectId],
      references: [projects.id],
    }),
    dependencies: many(functionalRequirementDependencies, {
      relationName: "functional_dependent",
    }),
    dependentOn: many(functionalRequirementDependencies, {
      relationName: "functional_dependency",
    }),
    tags: many(functionalRequirementTags),
  })
);

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

// Functional Requirement Dependencies Relations
export const functionalRequirementDependenciesRelations = relations(
  functionalRequirementDependencies,
  ({ one }) => ({
    dependent: one(functionalRequirements, {
      fields: [functionalRequirementDependencies.dependentId],
      references: [functionalRequirements.id],
      relationName: "functional_dependent",
    }),
    dependency: one(functionalRequirements, {
      fields: [functionalRequirementDependencies.dependencyId],
      references: [functionalRequirements.id],
      relationName: "functional_dependency",
    }),
    technicalDependency: one(technicalRequirements, {
      fields: [functionalRequirementDependencies.technicalDependencyId],
      references: [technicalRequirements.id],
    }),
  })
);

// Functional Requirement Tags (many-to-many)
export const functionalRequirementTags = pgTable(
  "functional_requirement_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    functionalRequirementId: uuid("functional_requirement_id")
      .notNull()
      .references(() => functionalRequirements.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  }
);

// Functional Requirement Tags Relations
export const functionalRequirementTagsRelations = relations(
  functionalRequirementTags,
  ({ one }) => ({
    functionalRequirement: one(functionalRequirements, {
      fields: [functionalRequirementTags.functionalRequirementId],
      references: [functionalRequirements.id],
    }),
    tag: one(tags, {
      fields: [functionalRequirementTags.tagId],
      references: [tags.id],
    }),
  })
);

// Types for use in the application
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TechnicalRequirement = typeof technicalRequirements.$inferSelect;
export type NewTechnicalRequirement = typeof technicalRequirements.$inferInsert;
export type FunctionalRequirement = typeof functionalRequirements.$inferSelect;
export type NewFunctionalRequirement =
  typeof functionalRequirements.$inferInsert;
export type AcceptanceCriteria = typeof acceptanceCriteria.$inferSelect;
export type NewAcceptanceCriteria = typeof acceptanceCriteria.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type TechnicalRequirementDependency =
  typeof technicalRequirementDependencies.$inferSelect;
export type NewTechnicalRequirementDependency =
  typeof technicalRequirementDependencies.$inferInsert;
export type FunctionalRequirementDependency =
  typeof functionalRequirementDependencies.$inferSelect;
export type NewFunctionalRequirementDependency =
  typeof functionalRequirementDependencies.$inferInsert;
export type FunctionalRequirementTag =
  typeof functionalRequirementTags.$inferSelect;
export type NewFunctionalRequirementTag =
  typeof functionalRequirementTags.$inferInsert;
export type TechnicalRequirementTag =
  typeof technicalRequirementTags.$inferSelect;
export type NewTechnicalRequirementTag =
  typeof technicalRequirementTags.$inferInsert;
