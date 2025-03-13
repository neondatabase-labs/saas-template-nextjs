import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// This function will programmatically create the todos table if it doesn't exist
export async function runMigrations() {
  try {
    // Create a Neon SQL client
    const neonClient = neon(process.env.DATABASE_URL!)

    // Create a Drizzle ORM instance
    const migrationClient = drizzle(neonClient)

    console.log("Checking if users table exists...")

    // Check if the users table exists
    const usersTableExists = await migrationClient.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `)

    // If the users table doesn't exist, create it
    if (!usersTableExists.rows[0]?.exists) {
      console.log("Creating users table...")

      await migrationClient.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `)

      // Insert some sample users
      await migrationClient.execute(`
        INSERT INTO users (name, email, avatar_url)
        VALUES 
          ('Alex Johnson', 'alex@example.com', 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random'),
          ('Sam Taylor', 'sam@example.com', 'https://ui-avatars.com/api/?name=Sam+Taylor&background=random'),
          ('Jordan Lee', 'jordan@example.com', 'https://ui-avatars.com/api/?name=Jordan+Lee&background=random'),
          ('Casey Smith', 'casey@example.com', 'https://ui-avatars.com/api/?name=Casey+Smith&background=random');
      `)

      console.log("Users table created successfully with sample data!")
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
          assigned_user_id INTEGER REFERENCES users(id)
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

      // Check if assigned_user_id column exists
      const assignedUserIdColumnExists = await migrationClient.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'todos'
          AND column_name = 'assigned_user_id'
        );
      `)

      // If the column doesn't exist, add it
      if (!assignedUserIdColumnExists.rows[0]?.exists) {
        console.log("Adding assigned_user_id column to todos table...")

        await migrationClient.execute(`
          ALTER TABLE todos
          ADD COLUMN assigned_user_id INTEGER REFERENCES users(id);
        `)

        console.log("assigned_user_id column added successfully!")
      } else {
        console.log("assigned_user_id column already exists.")
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

    return true
  } catch (error) {
    console.error("Migration failed:", error)
    return false
  }
}

