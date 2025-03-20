import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres.bxcmbzsjuehbnpfykoiy:H1q3f9MG0WDcXoND@aws-0-us-west-1.pooler.supabase.com:6543/postgres",
  },
});
