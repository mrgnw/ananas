<script>
import { translateLanguages, createTranslateLanguages } from '$jibs/deprecrated/translateLanguages.svelte.js';

// Test data
const testLanguages = {
  es: {
    label: 'Spanish',
    native: 'Español',
    rtl: false
  },
  ar: {
    label: 'Arabic',
    native: 'العربية',
    rtl: true
  },
  ja: {
    label: 'Japanese',
    native: '日本語',
    rtl: false
  }
};

// State for test results
let testResults = $state([]);

function addTestResult(test, result, details = '') {
  testResults = [...testResults, { test, result, details }];
}

// Test functions
function testAddLanguage() {
  try {
    translateLanguages.addLanguage('es', testLanguages.es);
    const added = translateLanguages.getLanguageInfo('es');
    if (added && added.label === testLanguages.es.label) {
      addTestResult('Add Language', 'PASS', 'Successfully added Spanish');
    } else {
      addTestResult('Add Language', 'FAIL', 'Language not added correctly');
    }
  } catch (error) {
    addTestResult('Add Language', 'ERROR', error.message);
  }
}

function testRemoveLanguage() {
  try {
    translateLanguages.addLanguage('ar', testLanguages.ar);
    translateLanguages.removeLanguage('ar');
    const removed = translateLanguages.getLanguageInfo('ar');
    if (!removed) {
      addTestResult('Remove Language', 'PASS', 'Successfully removed Arabic');
    } else {
      addTestResult('Remove Language', 'FAIL', 'Language still exists after removal');
    }
  } catch (error) {
    addTestResult('Remove Language', 'ERROR', error.message);
  }
}

function testLocalStorage() {
  try {
    // Clear and add test data
    translateLanguages.clearLanguages();
    translateLanguages.addLanguage('ja', testLanguages.ja);
    
    // Check if data is saved
    const savedUserLangs = JSON.parse(localStorage.getItem('user_langs') || '{}');
    const savedTgtLangs = JSON.parse(localStorage.getItem('tgt_langs') || '[]');
    
    if (savedUserLangs.ja && savedUserLangs.ja.label === testLanguages.ja.label) {
      addTestResult('LocalStorage (user_langs)', 'PASS', 'Data saved correctly');
    } else {
      addTestResult('LocalStorage (user_langs)', 'FAIL', 'Data not saved correctly');
    }

    if (savedTgtLangs.includes('ja')) {
      addTestResult('LocalStorage (tgt_langs)', 'PASS', 'Legacy format maintained');
    } else {
      addTestResult('LocalStorage (tgt_langs)', 'FAIL', 'Legacy format not maintained');
    }
  } catch (error) {
    addTestResult('LocalStorage', 'ERROR', error.message);
  }
}

function testMigration() {
  try {
    // Setup old format
    localStorage.clear();
    localStorage.setItem('tgt_langs', JSON.stringify(['fr', 'de']));
    
    // Force reload of store
    const newStore = createTranslateLanguages();
    
    // Check if migration happened
    const savedUserLangs = JSON.parse(localStorage.getItem('user_langs') || '{}');
    if (savedUserLangs.fr && savedUserLangs.de) {
      addTestResult('Migration', 'PASS', 'Successfully migrated from old format');
    } else {
      addTestResult('Migration', 'FAIL', 'Migration did not work as expected');
    }
  } catch (error) {
    addTestResult('Migration', 'ERROR', error.message);
  }
}

// Run all tests on mount
$effect.pre(() => {
  runAllTests();
});

function runAllTests() {
  testResults = []; // Clear previous results
  testAddLanguage();
  testRemoveLanguage();
  testLocalStorage();
  testMigration();
}
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Store Tests</h1>
  
  <button 
    class="bg-blue-500 text-white px-4 py-2 rounded mb-4"
    on:click={runAllTests}
  >
    Run Tests Again
  </button>

  <div class="space-y-2">
    {#each testResults as { test, result, details }}
      <div class="p-2 rounded" class:bg-green-100={result === 'PASS'} class:bg-red-100={result === 'FAIL'} class:bg-yellow-100={result === 'ERROR'}>
        <span class="font-bold">{test}:</span>
        <span class="ml-2" class:text-green-700={result === 'PASS'} class:text-red-700={result === 'FAIL'} class:text-yellow-700={result === 'ERROR'}>
          {result}
        </span>
        {#if details}
          <p class="text-sm text-gray-600 mt-1">{details}</p>
        {/if}
      </div>
    {/each}
  </div>

  <div class="mt-8">
    <h2 class="text-xl font-bold mb-2">Current Store State:</h2>
    <pre class="bg-gray-100 p-4 rounded overflow-auto">
      {JSON.stringify(translateLanguages.languages, null, 2)}
    </pre>
  </div>
</div>