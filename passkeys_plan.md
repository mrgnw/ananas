# Plan to Implement Passkeys Authentication

This plan outlines the steps needed to add Passkey (WebAuthn) authentication to the existing SvelteKit application, leveraging Drizzle ORM and Cloudflare D1, drawing inspiration from the `SvelteKit-Drizzle-Cloudflare-Passkeys.md` example.

## 1. Backend Setup

### 1.1. Database Schema (`src/lib/server/schema.ts`)
    - **Define `User` Table:** If not already present, create a `users` table to store user information (e.g., `id`, `username`).
    - **Define `Passkey` Table:** Create a `passkeys` table to store WebAuthn credentials, including fields like:
        - `id` (Primary Key)
        - `user_id` (Foreign Key linking to `users` table)
        - `public_key` (Stored appropriately, e.g., as `BLOB` or base64 text)
        - `webauthn_user_id` (Unique identifier for the credential)
        - `counter` (Signature counter)
        - `device_type`
        - `backed_up` (Boolean)
        - `transports` (List of transport methods)
        - `created_at` (Timestamp)
    - **Define Relationships:** Ensure proper foreign key constraints between `users` and `passkeys`.

### 1.2. Install Dependencies
    - Add WebAuthn libraries: `bun add @simplewebauthn/server @simplewebauthn/browser`

### 1.3. API Endpoints (`src/routes/api/auth/...`)
    - **Registration:**
        - `POST /api/auth/register`: Generate registration options using `@simplewebauthn/server`, including a challenge. Store the challenge temporarily (e.g., in a secure cookie or short-lived DB record).
        - `POST /api/auth/register/verify`: Verify the registration response from the browser using `@simplewebauthn/server`. If valid:
            - Create a new User record.
            - Create a new Passkey record linked to the user.
            - Log the user in by setting a secure, HTTP-only session cookie containing the user ID.
    - **Login:**
        - `POST /api/auth/login`: Generate authentication options using `@simplewebauthn/server`, including a challenge. Store the challenge.
        - `POST /api/auth/login/verify`: Verify the authentication response from the browser. If valid:
            - Check the signature counter.
            - Set a secure, HTTP-only session cookie containing the user ID.
            - Update the passkey counter in the database.
    - **Logout:**
        - `POST /api/auth/logout`: Clear the session cookie.

### 1.4. Session Handling (Cookies)
    - Use secure, HTTP-only cookies to store a session identifier (e.g., user ID) after successful authentication.
    - Cookies should have appropriate attributes (`Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`).

### 1.5. Server Hooks (`src/hooks.server.ts`)
    - Implement the `handle` hook to:
        - Read the session cookie on incoming requests.
        - If the cookie exists, attempt to retrieve the corresponding user from the database using the ID from the cookie.
        - Attach the retrieved user information (or `null` if no valid session) to `event.locals.user`.

### 1.6. Environment Configuration (`.env`, `wrangler.json`)
    - Define required environment variables for SimpleWebAuthn (e.g., `RP_ID`, `RP_ORIGIN`).
    - Ensure these are accessible in the Cloudflare deployment via `wrangler.json` secrets or variables.

## 2. Frontend Implementation

### 2.1. Root Layout (`+layout.server.ts` & `+layout.svelte`)
    - **`+layout.server.ts`:** Load the user session data from `event.locals` (populated by `hooks.server.ts`).
    - **`+layout.svelte`:** Receive the user data via `$page.data.user` and make it available to child components (e.g., storing in a `$state` variable or using it directly).

### 2.2. Registration UI (`src/routes/register/+page.svelte` or similar)
    - Form with username input.
    - Button to initiate registration.
    - On button click:
        - Fetch registration options from `/api/auth/register`.
        - Use `@simplewebauthn/browser`'s `startRegistration()` function with the received options.
        - Send the browser's response to `/api/auth/register/verify`.
        - Handle success (e.g., redirect to dashboard) or error messages.

### 2.3. Login UI (`src/routes/login/+page.svelte` or component)
    - Button to initiate login.
    - On button click:
        - Fetch authentication options from `/api/auth/login`.
        - Use `@simplewebauthn/browser`'s `startAuthentication()` function.
        - Send the browser's response to `/api/auth/login/verify`.
        - Handle success or error.

### 2.4. Authentication State Component (`src/lib/components/AuthButton.svelte` or similar)
    - Conditionally display Login/Register buttons or User Info/Logout button based on the user state from `$page.data.user`.
    - Trigger relevant API calls (logout, navigate to login/register).

## 3. Database Migration

### 3.1. Generate Migration
    - Run `bunx drizzle-kit generate` after updating the schema.

### 3.2. Apply Migrations
    - Apply locally: `bunx drizzle-kit migrate`
    - Apply remotely: `bunx wrangler d1 migrations apply <database_name> --remote`

## 4. Testing & Refinement
    - Test registration and login flows thoroughly on different browsers/devices.
    - Test session persistence and logout.
    - Refine error handling and user feedback.
