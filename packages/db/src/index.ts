import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://meteor:meteor@localhost:5432/meteor";

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
export { schema };
export * from "./schema.js";
