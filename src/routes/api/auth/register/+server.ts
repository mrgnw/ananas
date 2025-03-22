import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { hash } from "bcrypt";
import { randomUUID } from "crypto";
import { Database } from "bun:sqlite"; // Use Bun's SQLite for local development

// Use Bun's SQLite database in development if D1_DB is not defined
const localDB = env.DATABASE_URL ? new Database(env.DATABASE_URL) : null;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return json({ message: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return json({ message: "Password must be at least 8 characters long" }, { status: 400 });
    }

    // Use localDB if D1_DB is not defined
    const db = env.D1_DB || localDB;
    if (!db) {
      console.error("No database connection available");
      return json({ message: "Database configuration error" }, { status: 500 });
    }

    // Check if user already exists
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      return json({ message: "Email already in use" }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create a unique ID for the user
    const userId = randomUUID();

    // Insert the user into the database
    db.prepare(
      "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)"
    ).run(userId, "default", email, hashedPassword);

    return json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return json({ message: "An error occurred during registration" }, { status: 500 });
  }
};
