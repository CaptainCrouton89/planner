import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create Drizzle instance with our schema
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from "./schema.js";
