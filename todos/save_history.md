# Plan: Make Translation History Accessible Across Sessions

## Current State Analysis
- ✅ **Database schema exists** - `translation_history` table with user association
- ✅ **API endpoints exist** - GET/POST/DELETE `/api/translate/history`
- ✅ **Server functions exist** - `saveTranslation`, `getUserTranslationHistory`, etc.
- ✅ **Client store syncs** - `translationsStore` saves to DB when authenticated
- ❌ **Issue**: History is lost when switching devices/browsers/sessions

## Problem Statement
Currently translation history is:
1. **Stored in localStorage** - tied to specific browser/device
2. **Synced to database** when logged in, but not loaded back effectively
3. **Lost across sessions** - fresh browser = empty history initially

## Goal
Make translation history **persistent across sessions** while keeping it **simple and performant**.

## Implementation Plan

### Phase 1: Improve History Loading Strategy
**Current**: History only loads from DB on specific pages (history page)
**Target**: History loads automatically on app initialization when authenticated

#### Changes Needed:
1. **Update `+layout.server.ts`** - Load recent translations (last 20-50) alongside user data
2. **Update `translationsStore`** - Initialize from server data instead of just localStorage
3. **Keep localStorage as cache** - For offline access and performance

### Phase 2: Smart Sync Strategy
**Current**: Always saves to DB, basic merge on login
**Target**: Efficient bi-directional sync with conflict resolution

#### Changes Needed:
1. **Timestamp-based sync** - Only sync translations newer than last known sync
2. **Batch operations** - Bulk save/load for performance
3. **Optimistic updates** - Local-first with background sync

### Phase 3: Simple History Limits
**Current**: Loads all history at once
**Target**: Load last 80 translations by default

#### Changes Needed:
1. **Limit to 80 translations** - Recent translations only for performance
2. **Simple loading** - No pagination or infinite scroll yet
3. **Future: Export functionality** - For users who need full history access

## Technical Implementation

### 1. Enhanced Layout Server Load
```typescript
// src/routes/+layout.server.ts
export const load = async ({ locals, platform }) => {
  let recentTranslations = null;
  
  if (locals.user && platform?.env?.DB) {
    const db = initDB(platform.env.DB);
    // Load last 80 translations for full history display
    recentTranslations = await getUserTranslationHistory(db, locals.user.id, { limit: 80 });
  }
  
  return {
    user: locals.user,
    userPreferences,
    recentTranslations
  };
};
```

### 2. Updated Translations Store
```javascript
// src/lib/stores/translationsStore.svelte.js
let translations = $state({
  history: [],
  loading: false,
  lastSyncTimestamp: null
});

// Initialize from server data first, then localStorage
function initializeFromServerData(serverTranslations) {
  if (serverTranslations?.length > 0) {
    translations.history = serverTranslations;
    translations.lastSyncTimestamp = Date.now();
    save(); // Update localStorage cache
  }
}

// Modified addTranslation - optimistic updates
async function addTranslation(translation) {
  // 1. Add to local state immediately (optimistic)
  translations.history.unshift(translation);
  
  // 2. Keep only last 80 translations in memory
  if (translations.history.length > 80) {
    translations.history = translations.history.slice(0, 80);
  }
  
  save();

  // 3. Sync to server in background
  if (userStore.user.auth.isAuthenticated) {
    syncToServer(translation);
  }
}

// Enhanced removeTranslation - sync to database
async function removeTranslation(index) {
  const translationToRemove = translations.history[index];
  
  // 1. Remove from local state immediately (optimistic)
  translations.history.splice(index, 1);
  save();
  
  // 2. Sync deletion to server if authenticated
  if (userStore.user.auth.isAuthenticated && translationToRemove?.id) {
    try {
      await fetch(`/api/translate/history/${translationToRemove.id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete translation from server:', error);
      // Could add rollback logic here if needed
    }
  }
}
```

### 3. Simple History API
```javascript
// src/routes/api/translate/history/+server.js
export async function GET({ locals, platform }) {
  // Simple: just return last 80 translations
  const db = initDB(platform.env.DB);
  const translations = await getUserTranslationHistory(db, locals.user.id, { limit: 80 });
  
  return json({ translations });
}
```

### 4. New API Endpoint for Individual Deletion
```javascript
// src/routes/api/translate/history/[id]/+server.js
import { json } from '@sveltejs/kit';
import { initDB, isD1Available } from '$lib/server/db';
import { deleteTranslation } from '$lib/server/translation-history';

export async function DELETE({ params, locals, platform }) {
  if (!locals.user || !locals.user.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isD1Available(platform)) {
    return json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const db = initDB(platform.env.DB);
    await deleteTranslation(db, params.id, locals.user.id);
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting translation:', error);
    return json({ error: 'Failed to delete translation' }, { status: 500 });
  }
}
```

### 5. Updated Translation History Functions
```javascript
// src/lib/server/translation-history.js
export async function getUserTranslationHistory(db, userId, options = {}) {
  const { limit = 80 } = options;
  
  // Simple query - just get the most recent translations
  return await db
    .select()
    .from(translationHistory)
    .where(eq(translationHistory.user_id, userId))
    .orderBy(desc(translationHistory.created_at))
    .limit(limit);
}

// New function to delete individual translation
export async function deleteTranslation(db, translationId, userId) {
  // Security: ensure user can only delete their own translations
  return await db
    .delete(translationHistory)
    .where(
      and(
        eq(translationHistory.id, translationId),
        eq(translationHistory.user_id, userId)
      )
    );
}
```

## Migration Strategy

### Step 1: Backward Compatible Changes
- Add server data initialization without breaking current localStorage flow
- Ensure existing users don't lose their local history

### Step 2: Enhanced Sync
- Implement timestamp-based incremental sync
- Add conflict resolution for simultaneous edits
- **Fix delete functionality** - Remove translations from database too

### Step 3: Performance Optimizations
- Add pagination to history page
- Implement virtual scrolling for large histories

## Performance Considerations

### Database
- **Index on `user_id` and `created_at`** for fast queries
- **Limit to 80 translations** - Keep queries fast and simple
- **Future: Archive old translations** for users with huge histories

### Client
- **80 item limit** - Fast rendering, reasonable memory usage
- **Background sync** - Don't block UI for saves
- **localStorage caching** - Fast offline access

### Cloudflare D1
- **Simple queries** - No complex pagination logic
- **Efficient indexing** - Fast lookups by user
- **Future: Cleanup jobs** - Archive or delete very old translations

## Success Metrics
1. **History persistence** - Users see history across sessions ✅
2. **Fast initial load** - App loads quickly with recent history ✅
3. **Offline resilience** - Works without internet connection ✅
4. **Sync reliability** - No lost translations during conflicts ✅

## Implementation Priority
1. **Phase 1** - Basic cross-session history with 80 item limit (high impact, low complexity)
2. **Phase 2** - Smart sync strategy (medium impact, medium complexity)  
3. **Future** - Export functionality for full history access
4. **Future** - Archive/cleanup for very old translations

Start with Phase 1 for immediate user benefit. The 80 item limit keeps it simple while covering 99% of use cases.