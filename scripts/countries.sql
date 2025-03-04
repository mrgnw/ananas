-- SQLite schema for countries data
CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,      -- Wikidata ID
  name TEXT NOT NULL,       -- Country name in English
  code TEXT NOT NULL,       -- ISO 3166-1 alpha-2 code
  flag TEXT NOT NULL,       -- Emoji flag
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS country_languages (
  country_id TEXT NOT NULL,
  language_id TEXT NOT NULL,
  speakers INTEGER,         -- Number of speakers in thousands
  is_official BOOLEAN,      -- Whether it's an official language
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (country_id, language_id),
  FOREIGN KEY (country_id) REFERENCES countries(id),
  FOREIGN KEY (language_id) REFERENCES languages(iso)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_country_languages_language ON country_languages(language_id);

-- Views
CREATE VIEW IF NOT EXISTS v_country_languages AS
SELECT 
  c.name as country_name,
  c.code as country_code,
  c.flag as country_flag,
  l.langLabel as language_name,
  l.iso as language_code,
  cl.speakers as speakers_k,
  cl.is_official
FROM countries c
JOIN country_languages cl ON c.id = cl.country_id
JOIN languages l ON cl.language_id = l.iso
ORDER BY c.name, cl.speakers DESC NULLS LAST;