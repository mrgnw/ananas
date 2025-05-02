# translateLanguages Store test

The following test cases verify the functionality of our new unified language store:

- Adding languages with metadata
- Removing languages
- LocalStorage persistence
- Migration from old format
- Reactivity with Svelte 5 runes

## Running Tests

1. Navigate to `/test` in your browser
2. The tests will run automatically on page load
3. You can re-run tests using the "Run Tests Again" button

## Expected Behavior

Each test should display either:
- ✅ PASS
- ❌ FAIL
- ⚠️ ERROR

## Test Cases Details

### Add Language
Tests adding Spanish with proper metadata:
```javascript
{
  es: {
    label: 'Spanish',
    native: 'Español',
    rtl: false
  }
}
```

### Remove Language
Tests adding Arabic and then removing it:
```javascript
translateLanguages.addLanguage('ar', {
  label: 'Arabic',
  native: 'العربية',
  rtl: true
});
translateLanguages.removeLanguage('ar');
```

### LocalStorage
Tests persistence by:
1. Clearing localStorage
2. Adding Japanese
3. Verifying both storage formats:
   - user_langs (new format)
   - tgt_langs (legacy format)

### Migration
Tests migration from old format:
1. Sets up old tgt_langs: ['fr', 'de']
2. Creates new store instance
3. Verifies migration to new format