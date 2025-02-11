SELECT DISTINCT ?iso ?iso1 ?langLabel 
  (FLOOR(MAX(?nativeSpeakers_) / 1000) as ?nativeSpeakers_k)
  (GROUP_CONCAT(DISTINCT ?writingSystemLabel; separator=", ") as ?writingSystems)
  (GROUP_CONCAT(DISTINCT ?countryLabel; separator="|") as ?countries)
  (MIN(STRAFTER(STR(?unescoStatus), "Q")) as ?unescoStatus)
  (MIN(STRAFTER(STR(?ethnologueStatus), "Q")) as ?ethnologueStatus)
  (GROUP_CONCAT(DISTINCT ?nativeName; separator=", ") as ?nativeNames)
  (MAX(?isRTL) as ?rtl)
WHERE {
  # Core data
  ?lang wdt:P220 ?iso ;
        wdt:P1098 ?nativeSpeakers_ ;
        rdfs:label ?langLabel .
  FILTER(LANG(?langLabel) = "en")
  FILTER(?nativeSpeakers_ >= 1000000)
  
  # ISO 639-1 code (optional)
  OPTIONAL { ?lang wdt:P218 ?iso1 }
  
  # Optional data
  OPTIONAL { 
    ?lang wdt:P282 ?writingSystem .
    ?writingSystem rdfs:label ?writingSystemLabel .
    FILTER(LANG(?writingSystemLabel) = "en")
  }
  OPTIONAL {
    ?lang wdt:P17 ?country .
    ?country rdfs:label ?countryLabel .
    FILTER(LANG(?countryLabel) = "en")
  }
  
  # RTL detection based on writing system
  OPTIONAL {
    ?lang wdt:P282 ?writingSystem .
    VALUES ?rtlSystem { 
      wd:Q8196 # Arabic script
      wd:Q9288 # Hebrew alphabet
      wd:Q28564 # Persian alphabet
      wd:Q47577 # N'Ko script
      wd:Q1137511 # Mandaic alphabet
      wd:Q1137469 # Samaritan script
      wd:Q1137466 # Syriac alphabet
    }
    BIND(IF(?writingSystem = ?rtlSystem, true, false) as ?isRTL)
  }
  
  # Status and names
  OPTIONAL { ?lang wdt:P1999 ?unescoStatus }
  OPTIONAL { ?lang wdt:P3823 ?ethnologueStatus }
  OPTIONAL { ?lang wdt:P1705 ?nativeName }
}
GROUP BY ?iso ?iso1 ?langLabel
HAVING(MAX(?nativeSpeakers_) >= 1000000)
ORDER BY DESC(MAX(?nativeSpeakers_)) ?iso
LIMIT 200
