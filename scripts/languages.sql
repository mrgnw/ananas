SELECT DISTINCT ?iso ?langLabel 
  (FLOOR(MAX(?nativeSpeakers_) / 1000) as ?nativeSpeakers_k)
  (GROUP_CONCAT(DISTINCT ?writingSystemLabel; separator=", ") as ?writingSystems)
  (GROUP_CONCAT(DISTINCT ?familyLabel; separator=", ") as ?families)
  (GROUP_CONCAT(DISTINCT ?countryLabel; separator="|") as ?countries)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?unescoStatus), "Q"); separator=", ") as ?unescoStatus)
  (GROUP_CONCAT(DISTINCT STRAFTER(STR(?ethnologueStatus), "Q"); separator=", ") as ?ethnologueStatus)
  (GROUP_CONCAT(DISTINCT ?nativeName; separator=", ") as ?nativeNames)
WHERE {
  ?lang wdt:P220 ?iso.  # ISO 639-3 code
  
  # Basic info
  ?lang rdfs:label ?langLabel.
  FILTER(LANG(?langLabel) = "en")
  
  # Native speakers (L1)
  ?lang wdt:P1098 ?nativeSpeakers_ .
  FILTER(?nativeSpeakers_ >= 1000000)
  
  # Classification and identifiers
  OPTIONAL { 
    ?lang wdt:P282 ?writingSystem.
    ?writingSystem rdfs:label ?writingSystemLabel.
    FILTER(LANG(?writingSystemLabel) = "en")
  }
  OPTIONAL {
    ?lang wdt:P1394 ?family.  # language family
    ?family rdfs:label ?familyLabel.
    FILTER(LANG(?familyLabel) = "en")
  }
  
  # Geographic and cultural info
  OPTIONAL {
    ?lang wdt:P17 ?country.  # country
    ?country rdfs:label ?countryLabel.
    FILTER(LANG(?countryLabel) = "en")
  }
  
  # Status and classification
  OPTIONAL { ?lang wdt:P1999 ?unescoStatus }  # UNESCO status
  OPTIONAL { ?lang wdt:P3823 ?ethnologueStatus }  # Ethnologue status
  OPTIONAL { ?lang wdt:P1705 ?nativeName }  # native name
}
GROUP BY ?iso ?langLabel
HAVING(MAX(?nativeSpeakers_) >= 1000000)
ORDER BY DESC(MAX(?nativeSpeakers_)) ?iso
LIMIT 200
