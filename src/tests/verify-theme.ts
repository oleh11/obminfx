import { resolveTheme, readThemeMode, THEME_STORAGE_KEY, THEME_MODES } from '../theme';

let passed = 0;
let total = 0;
function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
  }
}

console.log('=== Starting Theme Tests ===\n');

assert(resolveTheme('system', true) === 'dark' && resolveTheme('system', false) === 'light', 'System follows the phone setting');
assert(resolveTheme('light', true) === 'light' && resolveTheme('dark', false) === 'dark', 'A chosen theme ignores the phone setting');
assert(THEME_MODES.join() === 'system,light,dark', 'Settings offers System, Light, Dark in that order');

// Minimal localStorage for Node
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = v; },
};
assert(readThemeMode() === 'system', 'New installs start on System');
store[THEME_STORAGE_KEY] = 'dark';
assert(readThemeMode() === 'dark', 'A saved choice is read back');
store[THEME_STORAGE_KEY] = 'purple';
assert(readThemeMode() === 'system', 'An unknown saved value falls back to System');
store['app_theme_mode_v1'] = 'dark';
delete store[THEME_STORAGE_KEY];
assert(readThemeMode() === 'system', 'The old v1 "dark" default is ignored');

console.log(`\n=== Theme Results: ${passed}/${total} Passed ===`);
if (passed !== total) throw new Error(`Theme tests failed: ${passed}/${total}`);
