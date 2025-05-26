# User Add Authentication Methods - Implementation Plan

## Overview
Add the ability for logged-in users to add additional authentication methods (passkey or password) to their existing account.

## Difficulty Assessment: Easy to Medium 🟢

### What's Already Available:
✅ Passkey registration/login APIs  
✅ Password hashing/validation  
✅ User authentication system  
✅ Database schema supports both auth methods  

### What We'd Need to Add:

#### 1. UI Components (Easy - ~30 mins)
```svelte
<!-- In /user page -->
<section class="security-settings">
  <h3>Security Options</h3>
  
  <div class="current-methods">
    <h4>Current Authentication Methods:</h4>
    {#if user.hasPasskey}
      <div class="auth-method">🔐 Passkey enabled</div>
    {/if}
    {#if user.hasPassword}
      <div class="auth-method">🔑 Password enabled</div>
    {/if}
  </div>
  
  <div class="add-methods">
    <h4>Add Authentication Method:</h4>
    {#if !user.hasPasskey}
      <button class="add-auth-btn" onclick={addPasskey}>🔐 Add Passkey</button>
    {/if}
    
    {#if !user.hasPassword}
      <button class="add-auth-btn" onclick={showPasswordForm}>🔑 Set Password</button>
    {/if}
  </div>
  
  {#if showPasswordSetup}
    <form onsubmit={handleSetPassword} class="password-setup">
      <div class="form-group">
        <label for="new-password">Create Password</label>
        <input 
          type="password" 
          id="new-password" 
          bind:value={newPassword} 
          placeholder="Create a password (min. 8 characters)"
          required
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Setting password...' : 'Set Password'}
      </button>
      <button type="button" onclick={() => showPasswordSetup = false}>Cancel</button>
    </form>
  {/if}
</section>
```

#### 2. API Endpoints (Medium - ~45 mins)

**`POST /api/user/add-passkey`**
- Reuse existing passkey registration flow
- Ensure user is authenticated
- Link passkey to existing user account

**`POST /api/user/set-password`** 
- Similar to signup but for existing user
- Hash password and update user record
- Validate password strength

**`GET /api/user/auth-methods`**
- Return what authentication methods user currently has
- Used to show/hide "Add" buttons

#### 3. Database Queries (Easy - ~15 mins)

**Check authentication methods:**
```sql
-- Check if user has passkeys
SELECT COUNT(*) as passkey_count FROM passkeys WHERE user_id = ?

-- Check if user has password  
SELECT password_hash FROM users WHERE id = ?
```

**Add authentication methods:**
```sql
-- Set password (update existing user)
UPDATE users SET password_hash = ? WHERE id = ?

-- Add passkey (insert new record)
INSERT INTO passkeys (user_id, credential_id, public_key, ...) VALUES (?, ?, ?, ...)
```

#### 4. Component Logic (Medium - ~30 mins)

**State management:**
```javascript
let showPasswordSetup = $state(false);
let newPassword = $state('');
let isLoading = $state(false);
let userAuthMethods = $state({ hasPassword: false, hasPasskey: false });

// Check current auth methods on load
async function loadAuthMethods() {
  const response = await fetch('/api/user/auth-methods');
  const methods = await response.json();
  userAuthMethods = methods;
}

// Add passkey
async function addPasskey() {
  // Reuse existing passkey registration logic
  // But skip user creation, just add to existing account
}

// Set password
async function handleSetPassword(e) {
  e.preventDefault();
  // Validate and set password for existing user
}
```

### Implementation Phases:

#### Phase 1: Auth Method Detection (30 mins)
1. Create `/api/user/auth-methods` endpoint
2. Add auth method checking to user page
3. Display current authentication methods

#### Phase 2: Add Passkey Functionality (45 mins)  
1. Create `/api/user/add-passkey` endpoint
2. Reuse existing passkey registration flow
3. Add "Add Passkey" button and handler
4. Test passkey addition flow

#### Phase 3: Set Password Functionality (30 mins)
1. Create `/api/user/set-password` endpoint  
2. Add password setup form and validation
3. Handle password creation for existing user
4. Test password setup flow

#### Phase 4: Polish & Error Handling (15 mins)
1. Add proper error messages
2. Handle edge cases (network failures, etc.)
3. Improve UI/UX
4. Add success feedback

### Security Considerations:

#### Re-authentication Required
- Require recent login before adding new auth methods
- Consider adding "confirm current method" step

#### Validation
- Ensure user owns the account before adding methods
- Validate password strength for new passwords
- Prevent adding duplicate passkeys

#### Error Handling
- Graceful failure if passkey registration fails
- Clear error messages for validation failures
- Rollback on partial failures

### Edge Cases to Handle:

1. **User with no auth methods** (shouldn't happen but...)
2. **Passkey registration failure** (device doesn't support, user cancels)
3. **Network failures** during setup
4. **User tries to add method they already have**
5. **Password validation failures**

### Files to Modify:

#### Frontend:
- `/src/routes/user/+page.svelte` - Add auth method management UI
- `/src/lib/stores/user.svelte.js` - Add auth method state management

#### Backend:
- `/src/routes/api/user/auth-methods/+server.js` - New endpoint
- `/src/routes/api/user/add-passkey/+server.js` - New endpoint  
- `/src/routes/api/user/set-password/+server.js` - New endpoint

#### Database:
- No schema changes needed (existing tables support this)

### Testing Scenarios:

1. **User with only password** → Add passkey
2. **User with only passkey** → Set password  
3. **User with both methods** → Show "all set" message
4. **Passkey registration failure** → Show error, don't break UI
5. **Password validation failure** → Show specific error message
6. **Network failure** → Graceful degradation

### Future Enhancements:

- **Remove authentication methods** (delete passkey, remove password)
- **Multiple passkeys** per user (different devices)
- **Two-factor authentication** requirements
- **Security audit log** (when methods were added/removed)
- **Recovery codes** as backup authentication method

### Estimated Total Time: ~2 hours

This feature would significantly improve the user experience by allowing flexible authentication setup after account creation, rather than forcing users to choose at signup time.