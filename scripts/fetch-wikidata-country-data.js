/**
 * Fetches country data from Wikidata, including:
 * - ISO 3166-1 alpha-2 codes
 * - Official/primary languages
 * - Language speaker counts
 * - Flag emoji
 * 
 * Run with: bun run fetch:countries
 */

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

const QUERY = `
SELECT DISTINCT ?country ?countryLabel ?isoCode ?iso3Code ?flagImage
(GROUP_CONCAT(DISTINCT ?nativeName; separator="|") as ?nativeNames)
(GROUP_CONCAT(DISTINCT ?lang; separator="|") as ?languages)
(GROUP_CONCAT(DISTINCT ?langLabel; separator="|") as ?languageLabels)
(GROUP_CONCAT(DISTINCT ?langIso; separator="|") as ?languageIsos)
(GROUP_CONCAT(DISTINCT ?langIso1; separator="|") as ?languageIso1s)
(GROUP_CONCAT(DISTINCT ?speakers; separator="|") as ?speakerCounts)
WHERE {
  ?country wdt:P31 wd:Q3624078 .  # Instance of: sovereign state
  ?country wdt:P297 ?isoCode .     # ISO 3166-1 alpha-2 code
  ?country wdt:P298 ?iso3Code .    # ISO 3166-1 alpha-3 code
  
  # Get official native name (P1448)
  OPTIONAL {
    ?country wdt:P1448 ?nativeName .
  }
  
  # Get flag image
  OPTIONAL { ?country wdt:P41 ?flagImage . }
  
  # Get official languages
  OPTIONAL {
    ?country wdt:P37 ?lang .       # Official language
    ?lang rdfs:label ?langLabel .  
    FILTER(LANG(?langLabel) = "en")
    
    # Get ISO codes for languages
    OPTIONAL { ?lang wdt:P220 ?langIso }   # ISO 639-3 code
    OPTIONAL { ?lang wdt:P218 ?langIso1 }  # ISO 639-1 code
    
    # Get speaker counts where available
    OPTIONAL { 
      ?lang wdt:P1098 ?speakers .  # Number of speakers
    }
  }
  
  # Get English labels
  SERVICE wikibase:label { 
    bd:serviceParam wikibase:language "en" .
  }
}
GROUP BY ?country ?countryLabel ?isoCode ?iso3Code ?flagImage
ORDER BY ?isoCode
`;

async function fetchWikidataCountries() {
  const response = await fetch(WIKIDATA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'Ananas Language Learning App/1.0'
    },
    body: 'query=' + encodeURIComponent(QUERY)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Process the results into a more usable format
  let countries = data.results.bindings.map(country => {
    const languages = country.languages?.value.split('|').filter(Boolean) || [];
    const languageLabels = country.languageLabels?.value.split('|').filter(Boolean) || [];
    const languageIsos = country.languageIsos?.value.split('|').filter(Boolean) || [];
    const languageIso1s = country.languageIso1s?.value.split('|').filter(Boolean) || [];
    const speakerCounts = country.speakerCounts?.value.split('|').map(Number).filter(Boolean) || [];
    
    // Create language objects with labels, ISO codes and speaker counts
    let languagesWithData = languages.map((lang, index) => ({
      id: lang.split('/').pop(),
      name: languageLabels[index],
      iso: languageIsos[index],
      iso1: languageIso1s[index] || null,
      speakers: speakerCounts[index] || null,
      speakers_m: speakerCounts[index] ? +(speakerCounts[index] / 1000000).toFixed(1) : null
    }));

    // Sort languages by id for idempotency
    languagesWithData.sort((a, b) => {
      if (!a.id && !b.id) return 0;
      if (!a.id) return 1;
      if (!b.id) return -1;
      return a.id.localeCompare(b.id);
    });

    return {
      wikidata_id: country.country.value.split('/').pop(),
      name: country.countryLabel.value,
      native_name: country.nativeNames?.value.split('|')[0] || null,
      iso: country.isoCode.value.toLowerCase(),
      iso3: country.iso3Code.value.toLowerCase(),
      flag: String.fromCodePoint(
        ...country.isoCode.value
          .toUpperCase()
          .split('')
          .map(char => char.charCodeAt(0) + 127397)
      ),
      languages: languagesWithData
    };
  });

  // Remove duplicate countries by wikidata_id
  const seen = new Set();
  countries = countries.filter(country => {
    if (seen.has(country.wikidata_id)) return false;
    seen.add(country.wikidata_id);
    return true;
  });

  // Ensure languages are sorted by id, then name for stability
  countries.forEach(country => {
    country.languages.sort((a, b) => {
      if (a.id && b.id) {
        const cmp = a.id.localeCompare(b.id);
        if (cmp !== 0) return cmp;
      }
      if (a.name && b.name) return a.name.localeCompare(b.name);
      if (a.name) return -1;
      if (b.name) return 1;
      return 0;
    });
  });

  // Sort countries by name for idempotency and readability
  countries.sort((a, b) => a.name.localeCompare(b.name));

  // Write the results to a JSON file
  await Bun.write(
    './src/lib/data/wikidata-countries.json', 
    JSON.stringify(countries, null, 2)
  );
  
  console.log(`Wrote ${countries.length} countries to wikidata-countries.json`);
}

fetchWikidataCountries().catch(console.error);