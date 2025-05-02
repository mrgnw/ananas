// Centralized language support utility for translation services
import deeplTargets from '$lib/data/deepl-targets.json';
import m2mSupport from '$lib/data/m2m-support.json';
import wikidataLanguages from '$lib/data/wikidata-languages.json';

// Helper: Map DeepL language codes to ISO 639-1/3 (all lowercase for robustness)
const deeplIsoMap: Record<string, string[]> = {};
for (const entry of deeplTargets as Array<{ language: string }>) {
  // Lowercase the DeepL code and map to likely iso1/iso3
  const code = entry.language.toLowerCase();
  // Try to map to iso1 using wikidataLanguages
  let iso1: string | undefined = undefined;
  let iso3: string | undefined = undefined;
  // Handle special cases for DeepL codes with region (e.g. en-gb, pt-br)
  const baseCode = code.split('-')[0];
  // Find wikidata language with matching iso1
  const lang = wikidataLanguages.find(l => l.iso1 === baseCode);
  if (lang) {
    iso1 = lang.iso1;
    iso3 = lang.iso;
  }
  // Fallback: use baseCode as iso1 if not found
  deeplIsoMap[code] = [iso1, iso3, baseCode].filter(Boolean) as string[];
}

// Get all DeepL supported codes (ISO 639-1/3, all lowercase)
const deeplSupportedIso = new Set(
  Object.values(deeplIsoMap).flat().map((c) => c.toLowerCase())
);

// Get all m2m supported codes (ISO 639-1)
const m2mSupportedIso = new Set(Object.keys(m2mSupport));

// Get all wikidata language codes (ISO 639-3)
const wikidataIso3 = new Set(wikidataLanguages.map(l => l.iso));
const wikidataIso1 = new Set(wikidataLanguages.map(l => l.iso1).filter(Boolean));

// Map 3-letter codes to preferred DeepL codes for regional variants
export const deeplPreferredMap: Record<string, string> = {
  eng: 'en-us', // or 'en-gb' for traditional
  por: 'pt-br', // or 'pt-pt' for traditional
  zho: 'zh-hans', // or 'zh-hant' for traditional
};

// Map DeepL codes back to 3-letter codes
export const deeplReverseMap: Record<string, string> = {
  'en-gb': 'eng',
  'en-us': 'eng',
  'pt-pt': 'por',
  'pt-br': 'por',
  'zh-hans': 'zho',
  'zh-hant': 'zho',
};

// Check if a language is supported as a DeepL translation target
export function isDeepLSupported(code: string): boolean {
  if (!code) return false;
  code = code.toLowerCase();
  if (deeplSupportedIso.has(code)) return true;
  // Try to map iso3 to iso1
  const lang = wikidataLanguages.find(l => l.iso === code || l.iso1 === code);
  if (lang && lang.iso1 && deeplSupportedIso.has(lang.iso1.toLowerCase())) return true;
  return false;
}

// Check if a language is supported by m2m
export function isM2MSupported(code: string): boolean {
  if (!code) return false;
  code = code.toLowerCase();
  if (m2mSupportedIso.has(code)) return true;
  // Try to map iso3 to iso1
  const lang = wikidataLanguages.find(l => l.iso === code || l.iso1 === code);
  if (lang && lang.iso1 && m2mSupportedIso.has(lang.iso1)) return true;
  return false;
}

// Get language info by code (iso3 or iso1)
export function getLanguageInfo(code: string) {
  if (!code) return null;
  return wikidataLanguages.find(l => l.iso === code || l.iso1 === code) || null;
}

// List all DeepL supported languages (returns array of iso1 codes)
export function getAllDeepLSupported(): string[] {
  return Array.from(deeplSupportedIso);
}

// List all m2m supported languages (returns array of iso1 codes)
export function getAllM2MSupported(): string[] {
  return Array.from(m2mSupportedIso);
}

// List all wikidata languages (iso3)
export function getAllWikidataLanguages(): string[] {
  return wikidataLanguages.map(l => l.iso);
}

// Helper to get preferred DeepL code for a 3-letter or 2-letter code
export function getPreferredDeepLTarget(code: string): string | undefined {
  if (!code) return undefined;
  code = code.toLowerCase();
  // Try iso3
  if (deeplPreferredMap[code]) return deeplPreferredMap[code];
  // Try iso1
  const lang = wikidataLanguages.find(l => l.iso1 === code);
  if (lang && lang.iso && deeplPreferredMap[lang.iso]) return deeplPreferredMap[lang.iso];
  // Fallback: try to find a direct DeepL code
  if (deeplSupportedIso.has(code)) return code;
  return undefined;
}

// Helper to get 3-letter code from DeepL code
export function getIso3FromDeepLCode(deeplCode: string): string | undefined {
  if (!deeplCode) return undefined;
  deeplCode = deeplCode.toLowerCase();
  return deeplReverseMap[deeplCode];
}

// List all languages with supported translators
export function getAllLanguagesWithSupport() {
  return wikidataLanguages.map(l => {
    const code = l.iso;
    const supported_translators = [
      isM2MSupported(code) ? 'm2m' : null,
      isDeepLSupported(code) ? 'deepl' : null
    ].filter(Boolean);
    return {
      ...l,
      supported_translators
    };
  });
}

// Efficiently return all languages supported by at least one of the given translators
export function showCompatibleLanguages(translators: string[]) {
  // Precompute sets for each translator
  const deeplSet = new Set(getAllDeepLSupported().map(c => c.toLowerCase()));
  const m2mSet = new Set(getAllM2MSupported().map(c => c.toLowerCase()));

  return wikidataLanguages.filter(l => {
    const iso1 = l.iso1?.toLowerCase();
    const iso3 = l.iso?.toLowerCase();
    return (
      (translators.includes('deepl') && (iso1 && deeplSet.has(iso1))) ||
      (translators.includes('m2m') && (iso1 && m2mSet.has(iso1)))
    );
  });
}
