import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// This function will programmatically create the needed tables if they don't exist
export async function runMigrations() {
  try {
    // Create a Neon SQL client
    const neonClient = neon(process.env.DATABASE_URL!)

    // Create a Drizzle ORM instance
    const migrationClient = drizzle(neonClient)

    // Check if neon_auth schema exists
    const neonAuthSchemaExists = await migrationClient.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata
        WHERE schema_name = 'neon_auth'
      );
    `)

    // Create neon_auth schema if it doesn't exist
    if (!neonAuthSchemaExists.rows[0]?.exists) {
      console.log("Creating neon_auth schema...")
      await migrationClient.execute(`CREATE SCHEMA IF NOT EXISTS neon_auth;`)
      console.log("neon_auth schema created successfully!")
    }

    // Checking if user_metrics table exists
    console.log("Checking if user_metrics table exists...")
    const userMetricsTableExists = await migrationClient.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'user_metrics'
      );
    `)

    // If the user_metrics table doesn't exist, create it
    if (!userMetricsTableExists.rows[0]?.exists) {
      console.log("Creating user_metrics table...")

      await migrationClient.execute(`
        CREATE TABLE IF NOT EXISTS user_metrics (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES neon_auth.users_sync(id),
          todos_created INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `)

      console.log("user_metrics table created successfully!")
    }

    console.log("Checking if projects table exists...")

    // Check if the projects table exists
    const projectsTableExists = await migrationClient.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'projects'
      );
    `)

    // If the projects table doesn't exist, create it
    if (!projectsTableExists.rows[0]?.exists) {
      console.log("Creating projects table...")

      await migrationClient.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT '#4f46e5',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `)

      console.log("Projects table created successfully!")
    }

    console.log("Checking if todos table exists...")

    // Check if the todos table exists
    const todosTableExists = await migrationClient.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'todos'
      );
    `)

    // If the table doesn't exist, create it
    if (!todosTableExists.rows[0]?.exists) {
      console.log("Creating todos table...")

      await migrationClient.execute(`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          text TEXT NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT false,
          due_date TIMESTAMP,
          project_id INTEGER REFERENCES projects(id),
          assigned_user_id TEXT REFERENCES neon_auth.users_sync(id)
        );
      `)

      console.log("Todos table created successfully!")
    } else {
      // Check if project_id column exists
      const projectIdColumnExists = await migrationClient.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'todos'
          AND column_name = 'project_id'
        );
      `)

      // If the column doesn't exist, add it
      if (!projectIdColumnExists.rows[0]?.exists) {
        console.log("Adding project_id column to todos table...")

        await migrationClient.execute(`
          ALTER TABLE todos
          ADD COLUMN project_id INTEGER REFERENCES projects(id);
        `)

        console.log("project_id column added successfully!")
      } else {
        console.log("project_id column already exists.")
      }

      // Check assigned_user_id column type and update if needed
      const assignedUserIdTypeResult = await migrationClient.execute(`
        SELECT data_type 
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'todos'
        AND column_name = 'assigned_user_id';
      `)

      if (assignedUserIdTypeResult.rows.length > 0) {
        const currentType = assignedUserIdTypeResult.rows[0]?.data_type

        // If assigned_user_id is INTEGER, we need to change it to TEXT
        if (currentType === 'integer') {
          console.log("Updating assigned_user_id column type from INTEGER to TEXT...")

          // Drop the column and recreate it with TEXT type
          await migrationClient.execute(
            `ALTER TABLE todos DROP COLUMN assigned_user_id;`,
          )
          await migrationClient.execute(
            `ALTER TABLE todos ADD COLUMN assigned_user_id TEXT REFERENCES neon_auth.users_sync(id);`,
          )

          console.log("assigned_user_id column type updated successfully!")
        }
      } else {
        // If assigned_user_id column doesn't exist, add it
        console.log("Adding assigned_user_id column to todos table...")

        await migrationClient.execute(`
          ALTER TABLE todos
          ADD COLUMN assigned_user_id TEXT REFERENCES neon_auth.users_sync(id);
        `)

        console.log("assigned_user_id column added successfully!")
      }

      // Check if due_date column exists
      const dueDateColumnExists = await migrationClient.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'todos'
          AND column_name = 'due_date'
        );
      `)

      // If the column doesn't exist, add it
      if (!dueDateColumnExists.rows[0]?.exists) {
        console.log("Adding due_date column to todos table...")

        await migrationClient.execute(`
          ALTER TABLE todos
          ADD COLUMN due_date TIMESTAMP;
        `)

        console.log("due_date column added successfully!")
      } else {
        console.log("due_date column already exists.")
      }
    }

    // Check if users table exists and drop it if it does since we're using neon_auth.users_sync now
    const usersTableExists = await migrationClient.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `)

    if (usersTableExists.rows[0]?.exists) {
      console.log("Dropping users table since we're using neon_auth.users_sync...")
      
      // First drop any references from todos table if they exist
      const referencesExist = await migrationClient.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = 'public'
          AND table_name = 'todos'
          AND constraint_name LIKE '%assigned_user_id%'
        );
      `)
      
      if (referencesExist.rows[0]?.exists) {
        await migrationClient.execute(`
          ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_assigned_user_id_fkey;
        `)
      }
      
      // Now drop the users table
      await migrationClient.execute(`DROP TABLE IF EXISTS users;`)
      console.log("users table dropped successfully!")
    }

    return true
  } catch (error) {
    console.error("Migration failed:", error)
    return false
  }
}
