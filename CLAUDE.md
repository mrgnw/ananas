# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) in this repository.

## Project Overview

Ananas is a multi-language translation app built with SvelteKit that allows translating text to multiple languages at once. The app features:

- Translation to multiple target languages simultaneously
- Language selection and management
- Translation history
- Copy functionality for translations

## Technology Stack

- **SvelteKit**: Core framework with file-based routing
- **Svelte 5**: Front-end framework with state management 
- **shadcn-svelte**: UI component library
- **LocalStorage**: Client-side data persistence for user preferences and translation history
- **Cloudflare**: Deployment platform
- **WebAuthn**: Passkey authentication support for password-free login
- **Drizzle ORM**: Database ORM with SQLite backend

## Development Commands

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Check for type errors
bun run check

# Lint code
bun run lint

# Format code
bun run format

# Update language data
bun run update-language-data
bun run update-country-data
bun run update-data  # Update both

# Database migrations
bun run db:generate     # Generate new migration from schema changes
bun run db:migrate      # Apply migrations to development database (remote)
bun run db:migrate:prod # Apply migrations to production database (ananas-auth)
bun run db:local        # Apply migrations to local development database
```

## Project Structure

### Directory Layout
- `src/routes/`: SvelteKit pages and API endpoints
  - `+page.svelte`: Main translation interface
  - `api/`: Server endpoints (translate, auth, user preferences)
  - `auth/`: Authentication pages (login, signup)
  - `user/`, `history/`, `languages/`: Feature pages
- `src/lib/`: Shared components, stores, and utilities
  - `components/`: Reusable UI components
  - `stores/`: Svelte 5 state management
  - `server/`: Database schema and server utilities
- `src/jibs/`: Core translation components
- `drizzle/`: Database migrations and schema

### Key Components and Files

- **TranslationInput.svelte**: Main component for text input and translation request
- **MultiLangCard.svelte**: Displays translation results across multiple languages
- **Stores**:
  - `user.svelte.js`: Manages user preferences (selected languages, translators)
  - `translationHistory.svelte.js`: Manages translation history
- **API Routes**:
  - `/api/translate`: Server endpoint that handles translation requests
- **Utils**:
  - `languages.js`: Functions for language data handling, names, and filtering

### Data Flow

1. User inputs text into `TranslationInput` component
2. Text is sent to `/api/translate` endpoint with user's selected languages
3. API forwards request to translation backend with API key
4. Results are displayed in `MultiLangCard` component
5. Translations are stored in history using `translationHistoryStore`

## Authentication

The application supports dual authentication methods:

### Password Authentication
- Traditional email/password login with salted SHA-256 hashing
- Users can register and login with username/password

### Passkey Authentication (WebAuthn)
- Password-free authentication using device biometrics, PIN, or security keys
- Uses WebAuthn standard for secure, phishing-resistant authentication
- Requires browser support for `navigator.credentials` API
- Stores public keys and credential metadata in the database

### Database Schema
- **users**: Core user data (email, optional password_hash, username)
- **passkeys**: WebAuthn credential storage (public keys, device info)
- **auth_challenges**: Temporary challenge storage for WebAuthn flows
- **sessions**: Session management with token-based authentication

## Environment Variables

The application requires these environment variables:

### Translation API
- `VITE_OPENAI_API_KEY`: Required for translation functionality
- Translation backend: `https://ananas-api.xces.workers.dev`

### WebAuthn/Passkey Configuration
- `WEBAUTHN_RP_ID`: The Relying Party Identifier for WebAuthn (usually your domain)
  - For development: `localhost`
  - For production: `your-domain.com` (e.g., `auth-passkeys.ananas-8ek.pages.dev`)

## External Services

The application uses an external API for translations:
- Default backend: `https://ananas-api.xces.workers.dev`
- Requires `VITE_OPENAI_API_KEY` in environment variables

## Coding Practices

The codebase follows these practices:
- Svelte 5 state management with `$state`, `$derived`, etc.
- Component-based architecture with reusable UI components
- Client-side store management with localStorage persistence
- SvelteKit file-based routing

## Current Development Focus

Based on the todo.md file, current development focuses on:
- User authentication (basic and passkey)
- Language selection and persistence
- Translation functionality enhancements
- UI improvements for single language view