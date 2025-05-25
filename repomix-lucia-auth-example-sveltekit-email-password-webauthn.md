This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where content has been compressed (code blocks are separated by ⋮---- delimiter), security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

## Additional Info

# Directory Structure
```
src/
  lib/
    client/
      webauthn.ts
    server/
      2fa.ts
      db.ts
      email-verification.ts
      email.ts
      encryption.ts
      password-reset.ts
      password.ts
      rate-limit.ts
      session.ts
      totp.ts
      user.ts
      utils.ts
      webauthn.ts
  routes/
    2fa/
      passkey/
        register/
          +page.server.ts
          +page.svelte
        +page.server.ts
        +page.svelte
        +server.ts
      reset/
        +page.server.ts
        +page.svelte
      security-key/
        register/
          +page.server.ts
          +page.svelte
        +page.server.ts
        +page.svelte
        +server.ts
      setup/
        +page.server.ts
        +page.svelte
      totp/
        setup/
          +page.server.ts
          +page.svelte
        +page.server.ts
        +page.svelte
      +server.ts
    api/
      webauthn/
        challenge/
          +server.ts
    forgot-password/
      +page.server.ts
      +page.svelte
    login/
      passkey/
        +server.ts
      +page.server.ts
      +page.svelte
    recovery-code/
      +page.server.ts
      +page.svelte
    reset-password/
      2fa/
        passkey/
          +page.server.ts
          +page.svelte
          +server.ts
        recovery-code/
          +page.server.ts
          +page.svelte
        security-key/
          +page.server.ts
          +page.svelte
          +server.ts
        totp/
          +page.server.ts
          +page.svelte
        +server.ts
      verify-email/
        +page.server.ts
        +page.svelte
      +page.server.ts
      +page.svelte
    settings/
      +page.server.ts
      +page.svelte
    signup/
      +page.server.ts
      +page.svelte
    verify-email/
      +page.server.ts
      +page.svelte
    +layout.svelte
    +page.server.ts
    +page.svelte
  app.d.ts
  app.html
  hooks.server.ts
.env.example
.gitignore
.npmrc
.prettierignore
.prettierrc
LICENSE
package.json
README.md
setup.sql
svelte.config.js
tsconfig.json
vite.config.ts
```

# Files

## File: src/lib/client/webauthn.ts
````typescript
import { decodeBase64 } from "@oslojs/encoding";
import { ObjectParser } from "@pilcrowjs/object-parser";
⋮----
export async function createChallenge(): Promise<Uint8Array>
````

## File: src/lib/server/2fa.ts
````typescript
import { db } from "./db";
import { generateRandomRecoveryCode } from "./utils";
import { ExpiringTokenBucket } from "./rate-limit";
import { decryptToString, encryptString } from "./encryption";
⋮----
import type { User } from "./user";
⋮----
export function resetUser2FAWithRecoveryCode(userId: number, recoveryCode: string): boolean
⋮----
// Note: In Postgres and MySQL, these queries should be done in a transaction using SELECT FOR UPDATE
⋮----
// Compare old recovery code to ensure recovery code wasn't updated.
⋮----
export function get2FARedirect(user: User): string
⋮----
export function getPasswordReset2FARedirect(user: User): string
````

## File: src/lib/server/db.ts
````typescript
import sqlite3 from "better-sqlite3";
import { SyncDatabase } from "@pilcrowjs/db-query";
⋮----
import type { SyncAdapter } from "@pilcrowjs/db-query";
⋮----
// Explicitly convert to Uint8Array since SvelteKit's serialization
// doesn't support Node Buffer (even though it's just a sub-class
// of Uint8Array)
⋮----
class Database extends SyncDatabase<sqlite3.RunResult>
⋮----
public inTransaction(): boolean
````

## File: src/lib/server/email-verification.ts
````typescript
import { generateRandomOTP } from "./utils";
import { db } from "./db";
import { ExpiringTokenBucket } from "./rate-limit";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";
⋮----
import type { RequestEvent } from "@sveltejs/kit";
⋮----
export function getUserEmailVerificationRequest(userId: number, id: string): EmailVerificationRequest | null
⋮----
export function createEmailVerificationRequest(userId: number, email: string): EmailVerificationRequest
⋮----
export function deleteUserEmailVerificationRequest(userId: number): void
⋮----
export function sendVerificationEmail(email: string, code: string): void
⋮----
export function setEmailVerificationRequestCookie(event: RequestEvent, request: EmailVerificationRequest): void
⋮----
export function deleteEmailVerificationRequestCookie(event: RequestEvent): void
⋮----
export function getUserEmailVerificationRequestFromRequest(event: RequestEvent): EmailVerificationRequest | null
⋮----
export interface EmailVerificationRequest {
	id: string;
	userId: number;
	code: string;
	email: string;
	expiresAt: Date;
}
````

## File: src/lib/server/email.ts
````typescript
import { db } from "./db";
⋮----
export function verifyEmailInput(email: string): boolean
⋮----
export function checkEmailAvailability(email: string): boolean
````

## File: src/lib/server/encryption.ts
````typescript
import { decodeBase64 } from "@oslojs/encoding";
import { createCipheriv, createDecipheriv } from "crypto";
import { DynamicBuffer } from "@oslojs/binary";
⋮----
import { ENCRYPTION_KEY } from "$env/static/private";
⋮----
export function encrypt(data: Uint8Array): Uint8Array
⋮----
export function encryptString(data: string): Uint8Array
⋮----
export function decrypt(encrypted: Uint8Array): Uint8Array
⋮----
export function decryptToString(data: Uint8Array): string
````

## File: src/lib/server/password-reset.ts
````typescript
import { db } from "./db";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { generateRandomOTP } from "./utils";
import { sha256 } from "@oslojs/crypto/sha2";
⋮----
import type { RequestEvent } from "@sveltejs/kit";
import type { User } from "./user";
⋮----
export function createPasswordResetSession(token: string, userId: number, email: string): PasswordResetSession
⋮----
export function validatePasswordResetSessionToken(token: string): PasswordResetSessionValidationResult
⋮----
export function setPasswordResetSessionAsEmailVerified(sessionId: string): void
⋮----
export function setPasswordResetSessionAs2FAVerified(sessionId: string): void
⋮----
export function invalidateUserPasswordResetSessions(userId: number): void
⋮----
export function validatePasswordResetSessionRequest(event: RequestEvent): PasswordResetSessionValidationResult
⋮----
export function setPasswordResetSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void
⋮----
export function deletePasswordResetSessionTokenCookie(event: RequestEvent): void
⋮----
export function sendPasswordResetEmail(email: string, code: string): void
⋮----
export interface PasswordResetSession {
	id: string;
	userId: number;
	email: string;
	expiresAt: Date;
	code: string;
	emailVerified: boolean;
	twoFactorVerified: boolean;
}
⋮----
export type PasswordResetSessionValidationResult =
	| { session: PasswordResetSession; user: User }
	| { session: null; user: null };
````

## File: src/lib/server/password.ts
````typescript
import { hash, verify } from "@node-rs/argon2";
import { sha1 } from "@oslojs/crypto/sha1";
import { encodeHexLowerCase } from "@oslojs/encoding";
⋮----
export async function hashPassword(password: string): Promise<string>
⋮----
export async function verifyPasswordHash(hash: string, password: string): Promise<boolean>
⋮----
export async function verifyPasswordStrength(password: string): Promise<boolean>
````

## File: src/lib/server/rate-limit.ts
````typescript
export class RefillingTokenBucket<_Key>
⋮----
constructor(max: number, refillIntervalSeconds: number)
⋮----
public check(key: _Key, cost: number): boolean
⋮----
public consume(key: _Key, cost: number): boolean
⋮----
export class Throttler<_Key>
⋮----
constructor(timeoutSeconds: number[])
⋮----
public consume(key: _Key): boolean
⋮----
public reset(key: _Key): void
⋮----
export class ExpiringTokenBucket<_Key>
⋮----
constructor(max: number, expiresInSeconds: number)
⋮----
interface RefillBucket {
	count: number;
	refilledAt: number;
}
⋮----
interface ExpiringBucket {
	count: number;
	createdAt: number;
}
⋮----
interface ThrottlingCounter {
	timeout: number;
	updatedAt: number;
}
````

## File: src/lib/server/session.ts
````typescript
import { db } from "./db";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
⋮----
import type { User } from "./user";
import type { RequestEvent } from "@sveltejs/kit";
⋮----
export function validateSessionToken(token: string): SessionValidationResult
⋮----
export function invalidateSession(sessionId: string): void
⋮----
export function invalidateUserSessions(userId: number): void
⋮----
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void
⋮----
export function deleteSessionTokenCookie(event: RequestEvent): void
⋮----
export function generateSessionToken(): string
⋮----
export function createSession(token: string, userId: number, flags: SessionFlags): Session
⋮----
export function setSessionAs2FAVerified(sessionId: string): void
⋮----
export interface SessionFlags {
	twoFactorVerified: boolean;
}
⋮----
export interface Session extends SessionFlags {
	id: string;
	expiresAt: Date;
	userId: number;
}
⋮----
type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
````

## File: src/lib/server/totp.ts
````typescript
import { db } from "./db";
import { decrypt, encrypt } from "./encryption";
import { ExpiringTokenBucket, RefillingTokenBucket } from "./rate-limit";
⋮----
export function getUserTOTPKey(userId: number): Uint8Array | null
⋮----
export function updateUserTOTPKey(userId: number, key: Uint8Array): void
⋮----
export function deleteUserTOTPKey(userId: number): void
````

## File: src/lib/server/user.ts
````typescript
import { db } from "./db";
import { decryptToString, encryptString } from "./encryption";
import { hashPassword } from "./password";
import { generateRandomRecoveryCode } from "./utils";
⋮----
export function verifyUsernameInput(username: string): boolean
⋮----
export async function createUser(email: string, username: string, password: string): Promise<User>
⋮----
export async function updateUserPassword(userId: number, password: string): Promise<void>
⋮----
export function updateUserEmailAndSetEmailAsVerified(userId: number, email: string): void
⋮----
export function setUserAsEmailVerifiedIfEmailMatches(userId: number, email: string): boolean
⋮----
export function getUserPasswordHash(userId: number): string
⋮----
export function getUserRecoverCode(userId: number): string
⋮----
export function resetUserRecoveryCode(userId: number): string
⋮----
export function getUserFromEmail(email: string): User | null
⋮----
export interface User {
	id: number;
	email: string;
	username: string;
	emailVerified: boolean;
	registeredTOTP: boolean;
	registeredSecurityKey: boolean;
	registeredPasskey: boolean;
	registered2FA: boolean;
}
````

## File: src/lib/server/utils.ts
````typescript
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
⋮----
export function generateRandomOTP(): string
⋮----
export function generateRandomRecoveryCode(): string
````

## File: src/lib/server/webauthn.ts
````typescript
import { encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "./db";
⋮----
export function createWebAuthnChallenge(): Uint8Array
⋮----
export function verifyWebAuthnChallenge(challenge: Uint8Array): boolean
⋮----
export function getUserPasskeyCredentials(userId: number): WebAuthnUserCredential[]
⋮----
export function getPasskeyCredential(credentialId: Uint8Array): WebAuthnUserCredential | null
⋮----
export function getUserPasskeyCredential(userId: number, credentialId: Uint8Array): WebAuthnUserCredential | null
⋮----
export function createPasskeyCredential(credential: WebAuthnUserCredential): void
⋮----
export function deleteUserPasskeyCredential(userId: number, credentialId: Uint8Array): boolean
⋮----
export function getUserSecurityKeyCredentials(userId: number): WebAuthnUserCredential[]
⋮----
export function getUserSecurityKeyCredential(userId: number, credentialId: Uint8Array): WebAuthnUserCredential | null
⋮----
export function createSecurityKeyCredential(credential: WebAuthnUserCredential): void
⋮----
export function deleteUserSecurityKeyCredential(userId: number, credentialId: Uint8Array): boolean
⋮----
export interface WebAuthnUserCredential {
	id: Uint8Array;
	userId: number;
	name: string;
	algorithmId: number;
	publicKey: Uint8Array;
}
````

## File: src/routes/2fa/passkey/register/+page.server.ts
````typescript
import { fail, redirect } from "@sveltejs/kit";
import { get2FARedirect } from "$lib/server/2fa";
import { bigEndian } from "@oslojs/binary";
import {
	parseAttestationObject,
	AttestationStatementFormat,
	parseClientDataJSON,
	coseAlgorithmES256,
	coseEllipticCurveP256,
	ClientDataType,
	coseAlgorithmRS256
} from "@oslojs/webauthn";
import { ECDSAPublicKey, p256 } from "@oslojs/crypto/ecdsa";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyWebAuthnChallenge, createPasskeyCredential, getUserPasskeyCredentials } from "$lib/server/webauthn";
import { setSessionAs2FAVerified } from "$lib/server/session";
import { RSAPublicKey } from "@oslojs/crypto/rsa";
import { SqliteError } from "better-sqlite3";
⋮----
import type { WebAuthnUserCredential } from "$lib/server/webauthn";
import type {
	AttestationStatement,
	AuthenticatorData,
	ClientData,
	COSEEC2PublicKey,
	COSERSAPublicKey
} from "@oslojs/webauthn";
import type { Actions, RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
⋮----
// TODO: Update host
⋮----
// TODO: Update origin
⋮----
// We don't have to worry about race conditions since queries are synchronous
````

## File: src/routes/2fa/passkey/register/+page.svelte
````
<script lang="ts">
	import { encodeBase64 } from "@oslojs/encoding";
	import { createChallenge } from "$lib/client/webauthn";
	import { enhance } from "$app/forms";

	import type { ActionData, PageData } from "./$types";

	export let data: PageData;
	export let form: ActionData;

	let encodedAttestationObject: string | null = null;
	let encodedClientDataJSON: string | null = null;
</script>

<h1>Register passkey</h1>
<button
	disabled={encodedAttestationObject !== null && encodedClientDataJSON !== null}
	on:click={async () => {
		const challenge = await createChallenge();

		const credential = await navigator.credentials.create({
			publicKey: {
				challenge,
				user: {
					displayName: data.user.username,
					id: data.credentialUserId,
					name: data.user.email
				},
				rp: {
					name: "SvelteKit WebAuthn example"
				},
				pubKeyCredParams: [
					{
						alg: -7,
						type: "public-key"
					},
					{
						alg: -257,
						type: "public-key"
					}
				],
				attestation: "none",
				authenticatorSelection: {
					userVerification: "required",
					residentKey: "required",
					requireResidentKey: true
				},
				excludeCredentials: data.credentials.map((credential) => {
					return {
						id: credential.id,
						type: "public-key"
					};
				})
			}
		});

		if (!(credential instanceof PublicKeyCredential)) {
			throw new Error("Failed to create public key");
		}
		if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
			throw new Error("Unexpected error");
		}

		encodedAttestationObject = encodeBase64(new Uint8Array(credential.response.attestationObject));
		encodedClientDataJSON = encodeBase64(new Uint8Array(credential.response.clientDataJSON));
	}}>Create credential</button
>
<form method="post" use:enhance>
	<label for="form-register-credential.name">Credential name</label>
	<input id="form-register-credential.name" name="name" />
	<input type="hidden" name="attestation_object" value={encodedAttestationObject} />
	<input type="hidden" name="client_data_json" value={encodedClientDataJSON} />
	<button disabled={encodedAttestationObject === null && encodedClientDataJSON === null}>Continue</button>
	<p>{form?.message ?? ""}</p>
</form>
````

## File: src/routes/2fa/passkey/+page.server.ts
````typescript
import { redirect } from "@sveltejs/kit";
import { get2FARedirect } from "$lib/server/2fa";
import { getUserPasskeyCredentials } from "$lib/server/webauthn";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
````

## File: src/routes/2fa/passkey/+page.svelte
````
<script lang="ts">
	import { goto } from "$app/navigation";
	import { encodeBase64 } from "@oslojs/encoding";
	import { createChallenge } from "$lib/client/webauthn";

	import type { PageData } from "./$types";

	export let data: PageData;

	let message = "";
</script>

<h1>Authenticate with passkeys</h1>
<div>
	<button
		on:click={async () => {
			const challenge = await createChallenge();

			const credential = await navigator.credentials.get({
				publicKey: {
					challenge,
					userVerification: "discouraged",
					allowCredentials: data.credentials.map((credential) => {
						return {
							id: credential.id,
							type: "public-key"
						};
					})
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				throw new Error("Failed to create public key");
			}
			if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
				throw new Error("Unexpected error");
			}

			const response = await fetch("/2fa/passkey", {
				method: "POST",
				body: JSON.stringify({
					credential_id: encodeBase64(new Uint8Array(credential.rawId)),
					signature: encodeBase64(new Uint8Array(credential.response.signature)),
					authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
					client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
				})
			});

			if (response.ok) {
				goto("/");
			} else {
				message = await response.text();
			}
		}}>Authenticate</button
	>
	<p>{message}</p>
</div>
<a href="/2fa/reset">Use recovery code</a>

{#if data.user.registeredTOTP}
	<a href="/2fa/totp">Use authenticator apps</a>
{/if}
{#if data.user.registeredSecurityKey}
	<a href="/2fa/security-key">Use security keys</a>
{/if}
````

## File: src/routes/2fa/passkey/+server.ts
````typescript
import {
	parseClientDataJSON,
	coseAlgorithmES256,
	ClientDataType,
	coseAlgorithmRS256,
	createAssertionSignatureMessage,
	parseAuthenticatorData
} from "@oslojs/webauthn";
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { ObjectParser } from "@pilcrowjs/object-parser";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyWebAuthnChallenge, getUserPasskeyCredential } from "$lib/server/webauthn";
import { setSessionAs2FAVerified } from "$lib/server/session";
import { decodePKCS1RSAPublicKey, sha256ObjectIdentifier, verifyRSASSAPKCS1v15Signature } from "@oslojs/crypto/rsa";
import { sha256 } from "@oslojs/crypto/sha2";
⋮----
import type { AuthenticatorData, ClientData } from "@oslojs/webauthn";
import type { RequestEvent } from "./$types";
⋮----
export async function POST(event: RequestEvent)
⋮----
// TODO: Update host
⋮----
// TODO: Update origin
````

## File: src/routes/2fa/reset/+page.server.ts
````typescript
import { recoveryCodeBucket, resetUser2FAWithRecoveryCode } from "$lib/server/2fa";
import { fail, redirect } from "@sveltejs/kit";
⋮----
import type { Actions, RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
````

## File: src/routes/2fa/reset/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	export let form: ActionData;
</script>

<h1>Recover your account</h1>
<form method="post" use:enhance>
	<label for="form-totp.code">Recovery code</label>
	<input id="form-totp.code" name="code" required /><br />
	<button>Verify</button>
	<p>{form?.message ?? ""}</p>
</form>
````

## File: src/routes/2fa/security-key/register/+page.server.ts
````typescript
import { fail, redirect } from "@sveltejs/kit";
import { get2FARedirect } from "$lib/server/2fa";
import { bigEndian } from "@oslojs/binary";
import {
	parseAttestationObject,
	AttestationStatementFormat,
	parseClientDataJSON,
	coseAlgorithmES256,
	coseEllipticCurveP256,
	ClientDataType,
	coseAlgorithmRS256
} from "@oslojs/webauthn";
import { ECDSAPublicKey, p256 } from "@oslojs/crypto/ecdsa";
import { decodeBase64 } from "@oslojs/encoding";
import {
	verifyWebAuthnChallenge,
	createSecurityKeyCredential,
	getUserSecurityKeyCredentials
} from "$lib/server/webauthn";
import { setSessionAs2FAVerified } from "$lib/server/session";
import { RSAPublicKey } from "@oslojs/crypto/rsa";
import { SqliteError } from "better-sqlite3";
⋮----
import type { WebAuthnUserCredential } from "$lib/server/webauthn";
import type {
	AttestationStatement,
	AuthenticatorData,
	ClientData,
	COSEEC2PublicKey,
	COSERSAPublicKey
} from "@oslojs/webauthn";
import type { Actions, RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
⋮----
// TODO: Update host
⋮----
// TODO: Update origin
⋮----
// We don't have to worry about race conditions since queries are synchronous
````

## File: src/routes/2fa/security-key/register/+page.svelte
````
<script lang="ts">
	import { encodeBase64 } from "@oslojs/encoding";
	import { createChallenge } from "$lib/client/webauthn";
	import { enhance } from "$app/forms";

	import type { ActionData, PageData } from "./$types";

	export let data: PageData;
	export let form: ActionData;

	let encodedAttestationObject: string | null = null;
	let encodedClientDataJSON: string | null = null;
</script>

<h1>Register security key</h1>
<button
	disabled={encodedAttestationObject !== null && encodedClientDataJSON !== null}
	on:click={async () => {
		const challenge = await createChallenge();

		const credential = await navigator.credentials.create({
			publicKey: {
				challenge,
				user: {
					displayName: data.user.username,
					id: data.credentialUserId,
					name: data.user.email
				},
				rp: {
					name: "SvelteKit WebAuthn example"
				},
				pubKeyCredParams: [
					{
						alg: -7,
						type: "public-key"
					},
					{
						alg: -257,
						type: "public-key"
					}
				],
				attestation: "none",
				authenticatorSelection: {
					userVerification: "discouraged",
					residentKey: "discouraged",
					requireResidentKey: false,
					authenticatorAttachment: "cross-platform"
				},
				excludeCredentials: data.credentials.map((credential) => {
					return {
						id: credential.id,
						type: "public-key"
					};
				})
			}
		});

		if (!(credential instanceof PublicKeyCredential)) {
			throw new Error("Failed to create public key");
		}
		if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
			throw new Error("Unexpected error");
		}

		encodedAttestationObject = encodeBase64(new Uint8Array(credential.response.attestationObject));
		encodedClientDataJSON = encodeBase64(new Uint8Array(credential.response.clientDataJSON));
	}}>Create credential</button
>
<form method="post" use:enhance>
	<label for="form-register-credential.name">Credential name</label>
	<input id="form-register-credential.name" name="name" />
	<input type="hidden" name="attestation_object" value={encodedAttestationObject} />
	<input type="hidden" name="client_data_json" value={encodedClientDataJSON} />
	<button disabled={encodedAttestationObject === null && encodedClientDataJSON === null}>Continue</button>
	<p>{form?.message ?? ""}</p>
</form>
````

## File: src/routes/2fa/security-key/+page.server.ts
````typescript
import { redirect } from "@sveltejs/kit";
import { get2FARedirect } from "$lib/server/2fa";
import { getUserSecurityKeyCredentials } from "$lib/server/webauthn";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
````

## File: src/routes/2fa/security-key/+page.svelte
````
<script lang="ts">
	import { goto } from "$app/navigation";
	import { encodeBase64 } from "@oslojs/encoding";
	import { createChallenge } from "$lib/client/webauthn";

	import type { PageData } from "./$types";

	export let data: PageData;

	let message = "";
</script>

<h1>Authenticate with security keys</h1>
<div>
	<button
		on:click={async () => {
			const challenge = await createChallenge();

			const credential = await navigator.credentials.get({
				publicKey: {
					challenge,
					userVerification: "discouraged",
					allowCredentials: data.credentials.map((credential) => {
						return {
							id: credential.id,
							type: "public-key"
						};
					})
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				throw new Error("Failed to create public key");
			}
			if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
				throw new Error("Unexpected error");
			}

			const response = await fetch("/2fa/security-key", {
				method: "POST",
				body: JSON.stringify({
					credential_id: encodeBase64(new Uint8Array(credential.rawId)),
					signature: encodeBase64(new Uint8Array(credential.response.signature)),
					authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
					client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
				})
			});

			if (response.ok) {
				goto("/");
			} else {
				message = await response.text();
			}
		}}>Authenticate</button
	>
	<p>{message}</p>
</div>
<a href="/2fa/reset">Use recovery code</a>

{#if data.user.registeredTOTP}
	<a href="/2fa/totp">Use authenticator apps</a>
{/if}
{#if data.user.registeredPasskey}
	<a href="/2fa/passkey">Use passkeys</a>
{/if}
````

## File: src/routes/2fa/security-key/+server.ts
````typescript
import {
	parseClientDataJSON,
	coseAlgorithmES256,
	ClientDataType,
	coseAlgorithmRS256,
	createAssertionSignatureMessage,
	parseAuthenticatorData
} from "@oslojs/webauthn";
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { ObjectParser } from "@pilcrowjs/object-parser";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyWebAuthnChallenge, getUserSecurityKeyCredential } from "$lib/server/webauthn";
import { setSessionAs2FAVerified } from "$lib/server/session";
import { decodePKCS1RSAPublicKey, sha256ObjectIdentifier, verifyRSASSAPKCS1v15Signature } from "@oslojs/crypto/rsa";
import { sha256 } from "@oslojs/crypto/sha2";
⋮----
import type { AuthenticatorData, ClientData } from "@oslojs/webauthn";
import type { RequestEvent } from "./$types";
⋮----
export async function POST(event: RequestEvent)
⋮----
// TODO: Update host
⋮----
// TODO: Update origin
````

## File: src/routes/2fa/setup/+page.server.ts
````typescript
import { redirect } from "@sveltejs/kit";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
````

## File: src/routes/2fa/setup/+page.svelte
````
<h1>Set up two-factor authentication</h1>
<ul>
	<li><a href="/2fa/totp/setup">Authenticator apps</a></li>
	<li><a href="/2fa/passkey/register">Passkeys</a></li>
	<li><a href="/2fa/security-key/register">Security keys</a></li>
</ul>
````

## File: src/routes/2fa/totp/setup/+page.server.ts
````typescript
import { createTOTPKeyURI, verifyTOTP } from "@oslojs/otp";
import { fail, redirect } from "@sveltejs/kit";
import { decodeBase64, encodeBase64 } from "@oslojs/encoding";
import { totpUpdateBucket, updateUserTOTPKey } from "$lib/server/totp";
import { setSessionAs2FAVerified } from "$lib/server/session";
import { renderSVG } from "uqr";
import { get2FARedirect } from "$lib/server/2fa";
⋮----
import type { Actions, RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
````

## File: src/routes/2fa/totp/setup/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData, PageData } from "./$types";

	export let data: PageData;
	export let form: ActionData;
</script>

<h1>Set up authenticator app</h1>
<div style="width:200px; height: 200px;">
	{@html data.qrcode}
</div>
<form method="post" use:enhance>
	<input name="key" value={data.encodedTOTPKey} hidden required />
	<label for="form-totp.code">Verify the code from the app</label>
	<input id="form-totp.code" name="code" required /><br />
	<button>Save</button>
	<p>{form?.message ?? ""}</p>
</form>
````

## File: src/routes/2fa/totp/+page.server.ts
````typescript
import { totpBucket, getUserTOTPKey } from "$lib/server/totp";
import { fail, redirect } from "@sveltejs/kit";
import { verifyTOTP } from "@oslojs/otp";
import { setSessionAs2FAVerified } from "$lib/server/session";
⋮----
import type { Actions, RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
````

## File: src/routes/2fa/totp/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData, PageData } from "./$types";

	export let data: PageData;
	export let form: ActionData;
</script>

<h1>Authenticate with authenticator app</h1>
<p>Enter the code from your app.</p>
<form method="post" use:enhance>
	<label for="form-totp.code">Code</label>
	<input id="form-totp.code" name="code" autocomplete="one-time-code" required /><br />
	<button>Verify</button>
	<p>{form?.message ?? ""}</p>
</form>
<a href="/2fa/reset">Use recovery code</a>

{#if data.user.registeredPasskey}
	<a href="/2fa/passkey">Use passkeys</a>
{/if}
{#if data.user.registeredSecurityKey}
	<a href="/2fa/security-key">Use security keys</a>
{/if}
````

## File: src/routes/2fa/+server.ts
````typescript
import { get2FARedirect } from "$lib/server/2fa";
import { redirect } from "@sveltejs/kit";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export function GET(event: RequestEvent): Response
````

## File: src/routes/api/webauthn/challenge/+server.ts
````typescript
import { createWebAuthnChallenge } from "$lib/server/webauthn";
import { encodeBase64 } from "@oslojs/encoding";
import { RefillingTokenBucket } from "$lib/server/rate-limit";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export async function POST(event: RequestEvent)
⋮----
// TODO: Assumes X-Forwarded-For is always included.
````

## File: src/routes/forgot-password/+page.server.ts
````typescript
import { verifyEmailInput } from "$lib/server/email";
import { getUserFromEmail } from "$lib/server/user";
import {
	createPasswordResetSession,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie
} from "$lib/server/password-reset";
import { RefillingTokenBucket } from "$lib/server/rate-limit";
import { generateSessionToken } from "$lib/server/session";
import { fail, redirect } from "@sveltejs/kit";
⋮----
import type { Actions, RequestEvent } from "./$types";
⋮----
async function action(event: RequestEvent)
⋮----
// TODO: Assumes X-Forwarded-For is always included.
````

## File: src/routes/forgot-password/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	export let form: ActionData;
</script>

<h1>Forgot your password?</h1>
<form method="post" use:enhance>
	<label for="form-forgot.email">Email</label>
	<input type="email" id="form-forgot.email" name="email" required value={form?.email ?? ""} /><br />
	<button>Send</button>
	<p>{form?.message ?? ""}</p>
</form>
<a href="/login">Sign in</a>
````

## File: src/routes/login/passkey/+server.ts
````typescript
import {
	parseClientDataJSON,
	coseAlgorithmES256,
	ClientDataType,
	parseAuthenticatorData,
	createAssertionSignatureMessage,
	coseAlgorithmRS256
} from "@oslojs/webauthn";
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { ObjectParser } from "@pilcrowjs/object-parser";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyWebAuthnChallenge, getPasskeyCredential } from "$lib/server/webauthn";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/session";
import { sha256 } from "@oslojs/crypto/sha2";
import { decodePKCS1RSAPublicKey, sha256ObjectIdentifier, verifyRSASSAPKCS1v15Signature } from "@oslojs/crypto/rsa";
⋮----
import type { RequestEvent } from "./$types";
import type { ClientData, AuthenticatorData } from "@oslojs/webauthn";
import type { SessionFlags } from "$lib/server/session";
⋮----
// Stricter rate limiting can be omitted here since creating challenges are rate-limited
export async function POST(context: RequestEvent): Promise<Response>
⋮----
// TODO: Update host
⋮----
// TODO: Update origin
````

## File: src/routes/login/+page.server.ts
````typescript
import { fail, redirect } from "@sveltejs/kit";
import { verifyEmailInput } from "$lib/server/email";
import { getUserFromEmail, getUserPasswordHash } from "$lib/server/user";
import { RefillingTokenBucket, Throttler } from "$lib/server/rate-limit";
import { verifyPasswordHash } from "$lib/server/password";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/session";
import { get2FARedirect } from "$lib/server/2fa";
⋮----
import type { SessionFlags } from "$lib/server/session";
import type { Actions, PageServerLoadEvent, RequestEvent } from "./$types";
⋮----
export function load(event: PageServerLoadEvent)
⋮----
async function action(event: RequestEvent)
⋮----
// TODO: Assumes X-Forwarded-For is always included.
````

## File: src/routes/login/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";
	import { createChallenge } from "$lib/client/webauthn";
	import { encodeBase64 } from "@oslojs/encoding";
	import { goto } from "$app/navigation";

	import type { ActionData } from "./$types";

	export let form: ActionData;

	let passkeyErrorMessage = "";
</script>

<h1>Sign in</h1>
<form method="post" use:enhance>
	<label for="form-login.email">Email</label>
	<input
		type="email"
		id="form-login.email"
		name="email"
		autocomplete="username"
		required
		value={form?.email ?? ""}
	/><br />
	<label for="form-login.password">Password</label>
	<input type="password" id="form-login.password" name="password" autocomplete="current-password" required /><br />
	<button>Continue</button>
	<p>{form?.message ?? ""}</p>
</form>
<div>
	<button
		on:click={async () => {
			const challenge = await createChallenge();

			const credential = await navigator.credentials.get({
				publicKey: {
					challenge,
					userVerification: "required"
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				throw new Error("Failed to create public key");
			}
			if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
				throw new Error("Unexpected error");
			}

			const response = await fetch("/login/passkey", {
				method: "POST",
				// this example uses JSON but you can use something like CBOR to get something more compact
				body: JSON.stringify({
					credential_id: encodeBase64(new Uint8Array(credential.rawId)),
					signature: encodeBase64(new Uint8Array(credential.response.signature)),
					authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
					client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
				})
			});

			if (response.ok) {
				goto("/");
			} else {
				passkeyErrorMessage = await response.text();
			}
		}}>Sign in with passkeys</button
	>
	<p>{passkeyErrorMessage}</p>
</div>
<a href="/signup">Create an account</a>
<a href="/forgot-password">Forgot password?</a>
````

## File: src/routes/recovery-code/+page.server.ts
````typescript
import { getUserRecoverCode } from "$lib/server/user";
import { redirect } from "@sveltejs/kit";
import { get2FARedirect } from "$lib/server/2fa";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
````

## File: src/routes/recovery-code/+page.svelte
````
<script lang="ts">
	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<h1>Recovery code</h1>
<p>Your recovery code is: {data.recoveryCode}</p>
<p>You can use this recovery code if you lose access to your second factors.</p>
<a href="/">Next</a>
````

## File: src/routes/reset-password/2fa/passkey/+page.server.ts
````typescript
import { redirect } from "@sveltejs/kit";
import { getPasswordReset2FARedirect } from "$lib/server/2fa";
import { getUserPasskeyCredentials } from "$lib/server/webauthn";
import { validatePasswordResetSessionRequest } from "$lib/server/password-reset";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
````

## File: src/routes/reset-password/2fa/passkey/+page.svelte
````
<script lang="ts">
	import { goto } from "$app/navigation";
	import { encodeBase64 } from "@oslojs/encoding";
	import { createChallenge } from "$lib/client/webauthn";

	import type { PageData } from "./$types";

	export let data: PageData;

	let message = "";
</script>

<h1>Authenticate with passkeys</h1>
<div>
	<button
		on:click={async () => {
			const challenge = await createChallenge();

			const credential = await navigator.credentials.get({
				publicKey: {
					challenge,
					userVerification: "discouraged",
					allowCredentials: data.credentials.map((credential) => {
						return {
							id: credential.id,
							type: "public-key"
						};
					})
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				throw new Error("Failed to create public key");
			}
			if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
				throw new Error("Unexpected error");
			}

			const response = await fetch("/reset-password/2fa/passkey", {
				method: "POST",
				body: JSON.stringify({
					credential_id: encodeBase64(new Uint8Array(credential.rawId)),
					signature: encodeBase64(new Uint8Array(credential.response.signature)),
					authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
					client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
				})
			});

			if (response.ok) {
				goto("/reset-password");
			} else {
				message = await response.text();
			}
		}}>Authenticate</button
	>
	<p>{message}</p>
</div>
<a href="/reset-password/2fa/recovery-code">Use recovery code</a>
{#if data.user.registeredSecurityKey}
	<a href="/reset-password/2fa/security-key">Use security keys</a>
{/if}
{#if data.user.registeredTOTP}
	<a href="/reset-password/2fa/totp">Use authenticator apps</a>
{/if}
````

## File: src/routes/reset-password/2fa/passkey/+server.ts
````typescript
import {
	parseClientDataJSON,
	coseAlgorithmES256,
	ClientDataType,
	coseAlgorithmRS256,
	createAssertionSignatureMessage,
	parseAuthenticatorData
} from "@oslojs/webauthn";
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { ObjectParser } from "@pilcrowjs/object-parser";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyWebAuthnChallenge, getUserPasskeyCredential } from "$lib/server/webauthn";
import { decodePKCS1RSAPublicKey, sha256ObjectIdentifier, verifyRSASSAPKCS1v15Signature } from "@oslojs/crypto/rsa";
import { sha256 } from "@oslojs/crypto/sha2";
import { setPasswordResetSessionAs2FAVerified, validatePasswordResetSessionRequest } from "$lib/server/password-reset";
⋮----
import type { AuthenticatorData, ClientData } from "@oslojs/webauthn";
import type { RequestEvent } from "./$types";
⋮----
export async function POST(event: RequestEvent)
⋮----
// TODO: Update host
⋮----
// TODO: Update origin
````

## File: src/routes/reset-password/2fa/recovery-code/+page.server.ts
````typescript
import { validatePasswordResetSessionRequest } from "$lib/server/password-reset";
import { fail, redirect } from "@sveltejs/kit";
import { recoveryCodeBucket, resetUser2FAWithRecoveryCode } from "$lib/server/2fa";
⋮----
import type { Actions, RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
````

## File: src/routes/reset-password/2fa/recovery-code/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	export let form: ActionData;
</script>

<h1>Use your recovery code</h1>
<form method="post" use:enhance>
	<label for="form-recovery-code.code">Recovery code</label>
	<input id="form-recovery-code.code" name="code" required /><br />
	<button>Verify</button>
	<p>{form?.message ?? ""}</p>
</form>
````

## File: src/routes/reset-password/2fa/security-key/+page.server.ts
````typescript
import { redirect } from "@sveltejs/kit";
import { getPasswordReset2FARedirect } from "$lib/server/2fa";
import { getUserSecurityKeyCredentials } from "$lib/server/webauthn";
import { validatePasswordResetSessionRequest } from "$lib/server/password-reset";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
````

## File: src/routes/reset-password/2fa/security-key/+page.svelte
````
<script lang="ts">
	import { goto } from "$app/navigation";
	import { encodeBase64 } from "@oslojs/encoding";
	import { createChallenge } from "$lib/client/webauthn";

	import type { PageData } from "./$types";

	export let data: PageData;

	let message = "";
</script>

<h1>Authenticate with security keys</h1>
<div>
	<button
		on:click={async () => {
			const challenge = await createChallenge();

			const credential = await navigator.credentials.get({
				publicKey: {
					challenge,
					userVerification: "discouraged",
					allowCredentials: data.credentials.map((credential) => {
						return {
							id: credential.id,
							type: "public-key"
						};
					})
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				throw new Error("Failed to create public key");
			}
			if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
				throw new Error("Unexpected error");
			}

			const response = await fetch("/reset-password/2fa/security-key", {
				method: "POST",
				body: JSON.stringify({
					credential_id: encodeBase64(new Uint8Array(credential.rawId)),
					signature: encodeBase64(new Uint8Array(credential.response.signature)),
					authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
					client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
				})
			});

			if (response.ok) {
				goto("/reset-password");
			} else {
				message = await response.text();
			}
		}}>Authenticate</button
	>
	<p>{message}</p>
</div>
<a href="/reset-password/2fa/recovery-code">Use recovery code</a>
{#if data.user.registeredPasskey}
	<a href="/reset-password/2fa/passkey">Use passkeys</a>
{/if}
{#if data.user.registeredTOTP}
	<a href="/reset-password/2fa/totp">Use authenticator apps</a>
{/if}
````

## File: src/routes/reset-password/2fa/security-key/+server.ts
````typescript
import {
	parseClientDataJSON,
	coseAlgorithmES256,
	ClientDataType,
	coseAlgorithmRS256,
	createAssertionSignatureMessage,
	parseAuthenticatorData
} from "@oslojs/webauthn";
import { decodePKIXECDSASignature, decodeSEC1PublicKey, p256, verifyECDSASignature } from "@oslojs/crypto/ecdsa";
import { ObjectParser } from "@pilcrowjs/object-parser";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyWebAuthnChallenge, getUserSecurityKeyCredential } from "$lib/server/webauthn";
import { decodePKCS1RSAPublicKey, sha256ObjectIdentifier, verifyRSASSAPKCS1v15Signature } from "@oslojs/crypto/rsa";
import { sha256 } from "@oslojs/crypto/sha2";
import { setPasswordResetSessionAs2FAVerified, validatePasswordResetSessionRequest } from "$lib/server/password-reset";
⋮----
import type { AuthenticatorData, ClientData } from "@oslojs/webauthn";
import type { RequestEvent } from "./$types";
⋮----
export async function POST(event: RequestEvent)
⋮----
// TODO: Update host
⋮----
// TODO: Update origin
````

## File: src/routes/reset-password/2fa/totp/+page.server.ts
````typescript
import { verifyTOTP } from "@oslojs/otp";
import { validatePasswordResetSessionRequest, setPasswordResetSessionAs2FAVerified } from "$lib/server/password-reset";
import { totpBucket, getUserTOTPKey } from "$lib/server/totp";
import { fail, redirect } from "@sveltejs/kit";
import { getPasswordReset2FARedirect } from "$lib/server/2fa";
⋮----
import type { Actions, RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
````

## File: src/routes/reset-password/2fa/totp/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData, PageData } from "./$types";

	export let data: PageData;
	export let form: ActionData;
</script>

<h1>Authenticate with authenticator app</h1>
<p>Enter the code from your app.</p>
<form method="post" use:enhance>
	<label for="form-totp.code">Code</label>
	<input id="form-totp.code" name="code" required /><br />
	<button>Verify</button>
	<p>{form?.message ?? ""}</p>
</form>
<a href="/reset-password/2fa/recovery-code">Use recovery code</a>
{#if data.user.registeredSecurityKey}
	<a href="/reset-password/2fa/security-key">Use security keys</a>
{/if}
{#if data.user.registeredPasskey}
	<a href="/reset-password/2fa/passkey">Use passkeys</a>
{/if}
````

## File: src/routes/reset-password/2fa/+server.ts
````typescript
import { getPasswordReset2FARedirect } from "$lib/server/2fa";
import { validatePasswordResetSessionRequest } from "$lib/server/password-reset";
⋮----
import type { RequestEvent } from "./$types";
⋮----
export async function GET(event: RequestEvent)
````

## File: src/routes/reset-password/verify-email/+page.server.ts
````typescript
import {
	validatePasswordResetSessionRequest,
	setPasswordResetSessionAsEmailVerified
} from "$lib/server/password-reset";
import { ExpiringTokenBucket } from "$lib/server/rate-limit";
import { setUserAsEmailVerifiedIfEmailMatches } from "$lib/server/user";
import { fail, redirect } from "@sveltejs/kit";
⋮----
import type { Actions, RequestEvent } from "./$types";
import { getPasswordReset2FARedirect } from "$lib/server/2fa";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
````

## File: src/routes/reset-password/verify-email/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData, PageData } from "./$types";

	export let data: PageData;
	export let form: ActionData;
</script>

<h1>Verify your email address</h1>
<p>We sent an 8-digit code to {data.email}.</p>
<form method="post" use:enhance>
	<label for="form-verify.code">Code</label>
	<input id="form-verify.code" name="code" required />
	<button>verify</button>
	<p>{form?.message ?? ""}</p>
</form>
````

## File: src/routes/reset-password/+page.server.ts
````typescript
import {
	deletePasswordResetSessionTokenCookie,
	invalidateUserPasswordResetSessions,
	validatePasswordResetSessionRequest
} from "$lib/server/password-reset";
import { fail, redirect } from "@sveltejs/kit";
import { verifyPasswordStrength } from "$lib/server/password";
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from "$lib/server/session";
import { updateUserPassword } from "$lib/server/user";
import { getPasswordReset2FARedirect } from "$lib/server/2fa";
⋮----
import type { Actions, RequestEvent } from "./$types";
import type { SessionFlags } from "$lib/server/session";
⋮----
export async function load(event: RequestEvent)
⋮----
async function action(event: RequestEvent)
````

## File: src/routes/reset-password/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	export let form: ActionData;
</script>

<h1>Enter your new password</h1>
<form method="post" use:enhance>
	<label for="form-reset.password">Password</label>
	<input type="password" id="form-reset.password" name="password" autocomplete="new-password" required /><br />
	<button>Reset password</button>
	<p>{form?.message ?? ""}</p>
</form>
````

## File: src/routes/settings/+page.server.ts
````typescript
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from "$lib/server/email-verification";
import { fail, redirect } from "@sveltejs/kit";
import { checkEmailAvailability, verifyEmailInput } from "$lib/server/email";
import { verifyPasswordHash, verifyPasswordStrength } from "$lib/server/password";
import { getUserPasswordHash, getUserRecoverCode, resetUserRecoveryCode, updateUserPassword } from "$lib/server/user";
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from "$lib/server/session";
import {
	deleteUserPasskeyCredential,
	deleteUserSecurityKeyCredential,
	getUserPasskeyCredentials,
	getUserSecurityKeyCredentials
} from "$lib/server/webauthn";
import { decodeBase64 } from "@oslojs/encoding";
import { get2FARedirect } from "$lib/server/2fa";
import { deleteUserTOTPKey, totpUpdateBucket } from "$lib/server/totp";
import { ExpiringTokenBucket } from "$lib/server/rate-limit";
⋮----
import type { Actions, RequestEvent } from "./$types";
import type { SessionFlags } from "$lib/server/session";
⋮----
export async function load(event: RequestEvent)
⋮----
async function updatePasswordAction(event: RequestEvent)
⋮----
async function updateEmailAction(event: RequestEvent)
⋮----
async function disconnectTOTPAction(event: RequestEvent)
⋮----
async function deletePasskeyAction(event: RequestEvent)
⋮----
async function deleteSecurityKeyAction(event: RequestEvent)
⋮----
async function regenerateRecoveryCodeAction(event: RequestEvent)
````

## File: src/routes/settings/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";
	import { encodeBase64 } from "@oslojs/encoding";

	import type { PageData, ActionData } from "./$types";

	export let data: PageData;
	export let form: ActionData;
</script>

<header>
	<a href="/">Home</a>
	<a href="/settings">Settings</a>
</header>
<main>
	<h1>Settings</h1>
	<section>
		<h2>Update email</h2>
		<p>Your email: {data.user.email}</p>
		<form method="post" use:enhance action="?/update_email">
			<label for="form-email.email">New email</label>
			<input type="email" id="form-email.email" name="email" required /><br />
			<button>Update</button>
			<p>{form?.email?.message ?? ""}</p>
		</form>
	</section>
	<section>
		<h2>Update password</h2>
		<form method="post" use:enhance action="?/update_password">
			<label for="form-password.password">Current password</label>
			<input type="password" id="form-email.password" name="password" autocomplete="current-password" required /><br />
			<label for="form-password.new-password">New password</label>
			<input
				type="password"
				id="form-password.new-password"
				name="new_password"
				autocomplete="new-password"
				required
			/><br />
			<button>Update</button>
			<p>{form?.password?.message ?? ""}</p>
		</form>
	</section>
	<section>
		<h2>Authenticator app</h2>
		{#if data.user.registeredTOTP}
			<a href="/2fa/totp/setup">Update TOTP</a>
			<form method="post" use:enhance action="?/disconnect_totp">
				<button>Disconnect</button>
			</form>
		{:else}
			<a href="/2fa/totp/setup">Set up TOTP</a>
		{/if}
	</section>
	<section>
		<h2>Passkeys</h2>
		<p>Passkeys are WebAuthn credentials that validate your identity using your device.</p>
		<ul>
			{#each data.passkeyCredentials as credential}
				<li>
					<p>{credential.name}</p>
					<form method="post" use:enhance action="?/delete_passkey">
						<input type="hidden" name="credential_id" value={encodeBase64(credential.id)} />
						<button> Delete </button>
					</form>
				</li>
			{/each}
		</ul>
		<a href="/2fa/passkey/register">Add</a>
	</section>
	<section>
		<h2>Security keys</h2>
		<p>Security keys are WebAuthn credentials that can only be used for two-factor authentication.</p>
		<ul>
			{#each data.securityKeyCredentials as credential}
				<li>
					<p>{credential.name}</p>
					<form method="post" use:enhance action="?/delete_security_key">
						<input type="hidden" name="credential_id" value={encodeBase64(credential.id)} />
						<button>Delete</button>
					</form>
				</li>
			{/each}
		</ul>
		<a href="/2fa/security-key/register">Add</a>
	</section>
	{#if data.recoveryCode !== null}
		<section>
			<h1>Recovery code</h1>
			<p>Your recovery code is: {data.recoveryCode}}</p>
			<form method="post" use:enhance action="?/regenerate_recovery_code">
				<button>Generate new code</button>
			</form>
		</section>
	{/if}
</main>
````

## File: src/routes/signup/+page.server.ts
````typescript
import { fail, redirect } from "@sveltejs/kit";
import { checkEmailAvailability, verifyEmailInput } from "$lib/server/email";
import { createUser, verifyUsernameInput } from "$lib/server/user";
import { RefillingTokenBucket } from "$lib/server/rate-limit";
import { verifyPasswordStrength } from "$lib/server/password";
import { createSession, generateSessionToken, setSessionTokenCookie } from "$lib/server/session";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie
} from "$lib/server/email-verification";
import { get2FARedirect } from "$lib/server/2fa";
⋮----
import type { SessionFlags } from "$lib/server/session";
import type { Actions, PageServerLoadEvent, RequestEvent } from "./$types";
⋮----
export function load(event: PageServerLoadEvent)
⋮----
async function action(event: RequestEvent)
⋮----
// TODO: Assumes X-Forwarded-For is always included.
````

## File: src/routes/signup/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData } from "./$types";

	export let form: ActionData;
</script>

<h1>Create an account</h1>
<p>Your username must be at least 3 characters long and your password must be at least 8 characters long.</p>
<form method="post" use:enhance>
	<label for="form-signup.username">Username</label>
	<input
		id="form-signup.username"
		name="username"
		required
		value={form?.username ?? ""}
		minlength="4"
		maxlength="31"
	/><br />
	<label for="form-signup.email">Email</label>
	<input
		type="email"
		id="form-signup.email"
		name="email"
		autocomplete="username"
		required
		value={form?.email ?? ""}
	/><br />
	<label for="form-signup.password">Password</label>
	<input type="password" id="form-signup.password" name="password" autocomplete="new-password" required /><br />
	<button>Continue</button>
	<p>{form?.message ?? ""}</p>
</form>
<a href="/login">Sign in</a>
````

## File: src/routes/verify-email/+page.server.ts
````typescript
import { fail, redirect } from "@sveltejs/kit";
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from "$lib/server/email-verification";
import { invalidateUserPasswordResetSessions } from "$lib/server/password-reset";
import { updateUserEmailAndSetEmailAsVerified } from "$lib/server/user";
import { ExpiringTokenBucket } from "$lib/server/rate-limit";
⋮----
import type { Actions, RequestEvent } from "./$types";
⋮----
export async function load(event: RequestEvent)
⋮----
// Note: We don't need rate limiting since it takes time before requests expire
⋮----
async function verifyCode(event: RequestEvent)
⋮----
async function resendEmail(event: RequestEvent)
````

## File: src/routes/verify-email/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { ActionData, PageData } from "./$types";

	export let data: PageData;
	export let form: ActionData;
</script>

<h1>Verify your email address</h1>
<p>We sent an 8-digit code to {data.email}.</p>
<form method="post" use:enhance action="?/verify">
	<label for="form-verify.code">Code</label>
	<input id="form-verify.code" name="code" required />
	<button>Verify</button>
	<p>{form?.verify?.message ?? ""}</p>
</form>
<form method="post" use:enhance action="?/resend">
	<button>Resend code</button>
	<p>{form?.resend?.message ?? ""}</p>
</form>
<a href="/settings">Change your email</a>
````

## File: src/routes/+layout.svelte
````
<svelte:head>
	<title>Email and password example with 2FA and WebAuthn in SvelteKit</title>
</svelte:head>

<slot />
````

## File: src/routes/+page.server.ts
````typescript
import { fail, redirect } from "@sveltejs/kit";
import { deleteSessionTokenCookie, invalidateSession } from "$lib/server/session";
import { get2FARedirect } from "$lib/server/2fa";
⋮----
import type { Actions, PageServerLoadEvent, RequestEvent } from "./$types";
⋮----
export function load(event: PageServerLoadEvent)
⋮----
async function action(event: RequestEvent)
````

## File: src/routes/+page.svelte
````
<script lang="ts">
	import { enhance } from "$app/forms";

	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<header>
	<a href="/">Home</a>
	<a href="/settings">Settings</a>
</header>
<main>
	<h1>Hi {data.user.username}!</h1>
	<form method="post" use:enhance>
		<button>Sign out</button>
	</form>
</main>
````

## File: src/app.d.ts
````typescript
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { User } from "$lib/server/user";
import type { Session } from "$lib/server/session";
⋮----
// interface Error {}
interface Locals {
			user: User | null;
			session: Session | null;
		}
// interface PageData {}
// interface PageState {}
// interface Platform {}
````

## File: src/app.html
````html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
````

## File: src/hooks.server.ts
````typescript
import { RefillingTokenBucket } from "$lib/server/rate-limit";
import { validateSessionToken, setSessionTokenCookie, deleteSessionTokenCookie } from "$lib/server/session";
import { sequence } from "@sveltejs/kit/hooks";
⋮----
import type { Handle } from "@sveltejs/kit";
⋮----
const rateLimitHandle: Handle = async (
⋮----
// Note: Assumes X-Forwarded-For will always be defined.
⋮----
const authHandle: Handle = async (
````

## File: .env.example
````
ENCRYPTION_KEY=""
````

## File: .gitignore
````
node_modules

# Output
.output
.vercel
/.svelte-kit
/build

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.*
!.env.example
!.env.test

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

sqlite.db
````

## File: .npmrc
````
engine-strict=true
````

## File: .prettierignore
````
# Package Managers
package-lock.json
pnpm-lock.yaml
yarn.lock
````

## File: .prettierrc
````
{
	"useTabs": true,
	"trailingComma": "none",
	"printWidth": 120,
	"plugins": ["prettier-plugin-svelte"],
	"overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
````

## File: LICENSE
````
Copyright (c) 2024 pilcrowOnPaper and contributors

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE
FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY
DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
````

## File: package.json
````json
{
	"name": "example-sveltekit-email-password-webauthn",
	"version": "0.0.1",
	"private": true,
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
		"lint": "prettier --check .",
		"format": "prettier --write ."
	},
	"devDependencies": {
		"@sveltejs/adapter-auto": "^3.0.0",
		"@sveltejs/kit": "^2.0.0",
		"@sveltejs/vite-plugin-svelte": "^3.0.0",
		"@types/better-sqlite3": "^7.6.11",
		"prettier": "^3.1.1",
		"prettier-plugin-svelte": "^3.1.2",
		"svelte": "^4.2.7",
		"svelte-check": "^4.0.0",
		"typescript": "^5.0.0",
		"vite": "^5.0.3"
	},
	"type": "module",
	"dependencies": {
		"@node-rs/argon2": "^1.8.3",
		"@oslojs/binary": "^1.0.0",
		"@oslojs/crypto": "^1.0.1",
		"@oslojs/encoding": "^1.1.0",
		"@oslojs/otp": "^1.0.0",
		"@oslojs/webauthn": "^1.0.0",
		"@pilcrowjs/db-query": "^0.0.2",
		"@pilcrowjs/object-parser": "^0.0.4",
		"better-sqlite3": "^11.3.0",
		"uqr": "^0.1.2"
	}
}
````

## File: README.md
````markdown
# Email and password example with 2FA and WebAuthn in SvelteKit

Built with SQLite.

- Password checks with HaveIBeenPwned
- Sign in with passkeys
- Email verification
- 2FA with TOTP
- 2FA recovery codes
- 2FA with passkeys and security keys
- Password reset with 2FA
- Login throttling and rate limiting

Emails are just logged to the console. Rate limiting is implemented using JavaScript `Map`.

## Initialize project

Create `sqlite.db` and run `setup.sql`.

```
sqlite3 sqlite.db
```

Create a .env file. Generate a 128 bit (16 byte) string, base64 encode it, and set it as `ENCRYPTION_KEY`.

```bash
ENCRYPTION_KEY="L9pmqRJnO1ZJSQ2svbHuBA=="
```

> You can use OpenSSL to quickly generate a secure key.
>
> ```bash
> openssl rand --base64 16
> ```

Install dependencies and run the application:

```
pnpm i
pnpm dev
```

## Notes

- We do not consider user enumeration to be a real vulnerability so please don't open issues on it. If you really need to prevent it, just don't use emails.
- This example does not handle unexpected errors gracefully.
- There are some major code duplications (specifically for 2FA) to keep the codebase simple.
- TODO: Passkeys will only work when hosted on `localhost:5173`. Update the host and origin values before deploying.
- TODO: You may need to rewrite some queries and use transactions to avoid race conditions when using MySQL, Postgres, etc.
- TODO: This project relies on the `X-Forwarded-For` header for getting the client's IP address.
- TODO: Logging should be implemented.
````

## File: setup.sql
````sql
CREATE TABLE user (
    id INTEGER NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    recovery_code BLOB NOT NULL
);

CREATE INDEX email_index ON user(email);

CREATE TABLE session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    expires_at INTEGER NOT NULL,
    two_factor_verified INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE email_verification_request (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE TABLE password_reset_session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    email_verified INTEGER NOT NULL NOT NULL DEFAULT 0,
    two_factor_verified INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE totp_credential (
    id INTEGER NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES user(id),
    key BLOB NOT NULL
);

CREATE TABLE passkey_credential (
    id BLOB NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    name TEXT NOT NULL,
    algorithm INTEGER NOT NULL,
    public_key BLOB NOT NULL
);

CREATE TABLE security_key_credential (
    id BLOB NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id),
    name TEXT NOT NULL,
    algorithm INTEGER NOT NULL,
    public_key BLOB NOT NULL
);
````

## File: svelte.config.js
````javascript
/** @type {import('@sveltejs/kit').Config} */
⋮----
// Consult https://kit.svelte.dev/docs/integrations#preprocessors
// for more information about preprocessors
preprocess: vitePreprocess(),
⋮----
// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
// See https://kit.svelte.dev/docs/adapters for more information about adapters.
adapter: adapter()
````

## File: tsconfig.json
````json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
	// Path aliases are handled by https://kit.svelte.dev/docs/configuration#alias
	// except $lib which is handled by https://kit.svelte.dev/docs/configuration#files
	//
	// If you want to overwrite includes/excludes, make sure to copy over the relevant includes/excludes
	// from the referenced tsconfig.json - TypeScript does not merge them in
}
````

## File: vite.config.ts
````typescript
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
````
