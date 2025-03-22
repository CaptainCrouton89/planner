import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
/*

1. Make project (save to db)
2. Ask user for product requirements
3. Repeatedly refine product, gather all necessary app capabilities
4. Propose user stories (save to db)
5. Get user stories approved by the client
6. Propose tech stack, auth method, and shared components
7. Get approval for tech stack, auth method, and shared components (save to db)
8. Propose data models
9. Get data models approved by the client (save to db)
10. Make api endpoints (save to db)
11. Get api endpoints approved by the client
12. Propose screens
13. Get screens approved by the client
*/

// Define priority enum
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const statusEnum = pgEnum("status", [
  "open",
  "in progress",
  "completed",
]);

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  stage: text("stage").notNull().default("requirements"),
});

export const projectRequirements = pgTable("project_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  requirement: text("requirement").notNull(),
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

export const userStories = pgTable("user_stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const projectOverviews = pgTable("project_overviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  techStack: jsonb("tech_stack").notNull(), // e.g. ["react", "node.js", "express", "postgresql"]
  sharedComponents: jsonb("shared_components").notNull(), // e.g. [{ "name": "Button", "description": "A button component" }]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  status: statusEnum("status").notNull().default("open"),
});

export const dataModels = pgTable("data_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  properties: jsonb("properties").notNull(),
  relations: jsonb("relations").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  status: statusEnum("status").notNull().default("open"), // open, in progress, completed
});

export const apiEndpoints = pgTable("api_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  description: text("description"),
  method: text("method").notNull(),
  parameters: jsonb("parameters").notNull(),
  requestFormat: text("request_format").notNull(),
  responseFormat: text("response_format").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  status: statusEnum("status").notNull().default("open"),
});

export const screens = pgTable("screens", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  path: text("path").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  status: statusEnum("status").notNull().default("open"),
});

// Types for use in the application
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type UserStory = typeof userStories.$inferSelect;
export type NewUserStory = typeof userStories.$inferInsert;
export type DataModel = typeof dataModels.$inferSelect;
export type NewDataModel = typeof dataModels.$inferInsert;
export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type NewApiEndpoint = typeof apiEndpoints.$inferInsert;
export type Screen = typeof screens.$inferSelect;
export type NewScreen = typeof screens.$inferInsert;
export type ProjectOverview = typeof projectOverviews.$inferSelect;
export type NewProjectOverview = typeof projectOverviews.$inferInsert;
