import { SvelteKitAuth } from "@auth/sveltekit";
import { D1Adapter } from "@auth/d1-adapter";
import Credentials from "@auth/core/providers/credentials";
import { env } from "$env/dynamic/private";
import { compare } from "bcrypt";

// Define user type for better type safety
interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
}

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Query the database for the user
          const user = await env.D1_DB.prepare(
            "SELECT * FROM users WHERE email = ?"
          )
            .bind(credentials.email)
            .first<UserRecord>();
          
          if (!user) return null;
          
          // Check password using bcrypt
          const isValidPassword = await compare(
            credentials.password,
            user.password
          );
          
          if (!isValidPassword) return null;
          
          // Return user data without sensitive information
          return {
            id: user.id,
            name: user.name,
            email: user.email
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      }
    }),
  ],
  adapter: D1Adapter(env.D1_DB),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/user/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  secret: env.AUTH_SECRET,
  trustHost: true,
  debug: env.NODE_ENV === "development",
});