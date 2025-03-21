import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { hash } from "bcrypt";
import { randomUUID } from "crypto";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, email, password } = await request.json();
    
    // Basic validation
    if (!name || !email || !password) {
      return json({ message: "Missing required fields" }, { status: 400 });
    }
    
    if (password.length < 8) {
      return json({ message: "Password must be at least 8 characters long" }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await env.D1_DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(email)
      .first();
    
    if (existingUser) {
      return json({ message: "Email already in use" }, { status: 409 });
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create a unique ID for the user
    const userId = randomUUID();
    
    // Insert the user into the database
    await env.D1_DB.prepare(
      "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)"
    )
      .bind(userId, name, email, hashedPassword)
      .run();
    
    return json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return json({ message: "An error occurred during registration" }, { status: 500 });
  }
};
