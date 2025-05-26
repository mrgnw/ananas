# Plan: Add Missing Authentication Methods

## Current State Analysis
- Users can have **password only** (traditional signup)
- Users can have **passkey only** (WebAuthn signup) 
- Users can have **both** (hybrid accounts)
- `password_hash` is optional in DB schema ✅
- Passkeys are stored separately in `passkeys` table ✅

## Implementation Plan

### Phase 1: Detection & UI Components
1. **Add helper functions** to detect account type
2. **Update user profile page** to show current auth methods
3. **Add action buttons** for missing auth methods

### Phase 2: Add Passkey to Password-Only Accounts
1. **Create API endpoint** `/api/auth/passkey/add` 
2. **Add passkey registration flow** for existing users
3. **Update user profile** with "Add Passkey" button

### Phase 3: Add Password to Passkey-Only Accounts  
1. **Create API endpoint** `/api/auth/password/add`
2. **Add password creation form** for existing users
3. **Update user profile** with "Add Password" button

### Phase 4: Enhanced Security Features
1. **List existing passkeys** with nicknames
2. **Remove individual passkeys** 
3. **Change password** functionality

## Detailed Implementation

### 1. Auth Method Detection Functions
```javascript
// Add to userStore or new auth utils
function getAuthMethods(user) {
  return {
    hasPassword: !!user.password_hash,
    hasPasskeys: user.passkeys?.length > 0,
    passkeyCount: user.passkeys?.length || 0
  };
}
```

### 2. Enhanced User Profile UI
```svelte
<!-- Add to user/+page.svelte -->
<div class="auth-methods">
  <h3>Authentication Methods</h3>
  
  {#if authMethods.hasPassword}
    <div class="auth-method">
      ✅ Password
      <button>Change Password</button>
    </div>
  {:else}
    <div class="auth-method">
      ❌ Password
      <button>Add Password</button>
    </div>
  {/if}
  
  {#if authMethods.hasPasskeys}
    <div class="auth-method">
      ✅ Passkeys ({authMethods.passkeyCount})
      <button>Manage Passkeys</button>
    </div>
  {:else}
    <div class="auth-method">
      ❌ Passkeys
      <button>Add Passkey</button>
    </div>
  {/if}
</div>
```

### 3. API Endpoints Needed
- `POST /api/auth/passkey/add` - Add passkey to existing account
- `POST /api/auth/password/add` - Add password to existing account  
- `POST /api/auth/password/change` - Change existing password
- `GET /api/auth/passkeys` - List user's passkeys
- `DELETE /api/auth/passkeys/[id]` - Remove specific passkey

### 4. Database Query Updates
```javascript
// Update getUserFromSession to include passkey info
export async function getUserFromSession(db, sessionToken) {
  const user = await db.select().from(users)...
  const userPasskeys = await db.select().from(passkeys)
    .where(eq(passkeys.user_id, user.id));
  
  return { ...user, passkeys: userPasskeys };
}
```

## Implementation Priority
1. **Auth method detection functions** 
2. **Enhanced user profile UI** to show current state
3. **Add passkey functionality** (seems most useful)
4. **Add password functionality**
5. **Enhanced security features**

## Technical Notes
- Leverage existing passkey registration flow for adding passkeys
- Password addition should require email verification for security
- Consider requiring current authentication (re-login) for sensitive operations
- Add audit logging for security method changes
- Ensure graceful handling of browser compatibility for passkeys