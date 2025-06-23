import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { remember } from "@epic-web/remember"
import * as schema from "./schema"

// Create a Drizzle ORM instance
export const db = remember("db", () => {
	return drizzle(neon(process.env.DATABASE_URL!), { schema })
})
