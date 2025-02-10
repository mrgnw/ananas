SELECT DISTINCT ?iso ?langLabel 
  (FLOOR(MAX(?nativeSpeakers_) / 1000) as ?nativeSpeakers_k)
  (GROUP_CONCAT(DISTINCT ?writingSystemLabel; separator=", ") as ?writingSystems)
  (GROUP_CONCAT(DISTINCT ?countryLabel; separator="|") as ?countries)
  (MIN(STRAFTER(STR(?unescoStatus), "Q")) as ?unescoStatus)
  (MIN(STRAFTER(STR(?ethnologueStatus), "Q")) as ?ethnologueStatus)
  (GROUP_CONCAT(DISTINCT ?nativeName; separator=", ") as ?nativeNames)
WHERE {
  # Performance hints
  hint:Query hint:optimizer "None" .
  
  # Core data - required fields
  ?lang wdt:P220 ?iso ;         # ISO 639-3 code
        wdt:P1098 ?nativeSpeakers_ ;  # Native speakers (L1)
        rdfs:label ?langLabel .
  FILTER(LANG(?langLabel) = "en")
  FILTER(?nativeSpeakers_ >= 1000000)
  
  # Optional fields in separate patterns for better performance
  OPTIONAL { 
    ?lang wdt:P282 ?writingSystem .
    ?writingSystem rdfs:label ?writingSystemLabel .
    FILTER(LANG(?writingSystemLabel) = "en")
  }
  
  OPTIONAL {
    ?lang wdt:P17 ?country .  # country
    ?country rdfs:label ?countryLabel .
    FILTER(LANG(?countryLabel) = "en")
  }
  
  # Status fields
  OPTIONAL { ?lang wdt:P1999 ?unescoStatus }  # UNESCO status
  OPTIONAL { ?lang wdt:P3823 ?ethnologueStatus }  # Ethnologue status
  OPTIONAL { ?lang wdt:P1705 ?nativeName }  # native name
}
GROUP BY ?iso ?langLabel
HAVING(MAX(?nativeSpeakers_) >= 1000000)
ORDER BY DESC(MAX(?nativeSpeakers_)) ?iso
LIMIT 200
