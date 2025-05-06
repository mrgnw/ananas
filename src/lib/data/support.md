# Languages supported by DeepL but not m2m
```tsv
iso2  iso3  languageName
nb nob   Bokmål
```

# Languages supported by m2m but not DeepL
```tsv
iso2  iso3  languageName
af afr   Afrikaans
am amh   Amharic
ast      Asturian
az aze   Azerbaijani
ba    Bashkir
be bel   Belarusian
bn ben   Bangla
br    Breton
bs    Bosnian
ca cat   Catalan
None  ceb   Cebuano
cy    Welsh
fa fas   Persian
ff ful   Fula
fy    Western Frisian
ga    Irish
gd    Gaelic; Scottish Gaelic
gl    Galician
gu guj   Gujarati
ha hau   Hausa
he heb   Hebrew
hi hin   Hindi
hr hrv   Croatian
ht hat   Haitian Creole
hy hye   Armenian
ig ibo   Igbo
None  ilo   Ilocano
is    Icelandic
jv jav   Javanese
ka    Georgian
kk kaz   Kazakh
km khm   Khmer
kn kan   Kannada
lb    Luxembourgish; Letzeburgesch
lg lug   Luganda
ln lin   Lingala
lo lao   Lao
mg mlg   Malagasy
mk    Macedonian
ml mal   Malayalam
mn mon   Mongolian
mr mar   Marathi
ms msa   Malay
my mya   Burmese
ne nep   Nepali
no nor   Norwegian
ns    Northern Sotho
oc    Occitan (post 1500)
or ory   Odia
pa pan   Punjabi
ps pus   Pashto
sd snd   Sindhi
si sin   Sinhala
so som   Somali
sq sqi   Albanian
sr srp   Serbian
ss    Swati
su sun   Sundanese
sw swa   Swahili
ta tam   Tamil
th tha   Thai
tl tgl   Tagalog
tn tsn   Tswana
ur urd   Urdu
uz uzb   Uzbek
vi vie   Vietnamese
wo    Wolof
xh xho   Xhosa
yi    Yiddish
yo yor   Yoruba
zu zul   Zulu
```

# generated with
```py
import json

with open('src/lib/data/deepl-targets.json') as f:
    deepl = json.load(f)
with open('src/lib/data/m2m-support.json') as f:
    m2m = json.load(f)
with open('src/lib/data/wikidata-languages.json') as f:
    wikidata = json.load(f)

# Build lookup tables for iso1/iso3 to language info
iso1_map = {l.get('iso1'): l for l in wikidata if l.get('iso1')}
iso3_map = {l.get('iso'): l for l in wikidata if l.get('iso')}

# DeepL: get all language codes (normalize to lowercase, handle regional codes)
deepl_codes = set()
for entry in deepl:
    code = entry['language'].lower()
    base = code.split('-')[0]
    deepl_codes.add(base)

m2m_codes = set(m2m.keys())

only_deepl = deepl_codes - m2m_codes
only_m2m = m2m_codes - deepl_codes

def print_langs(codes, label):
    print(f"# {label}")
    print("iso2\tiso3\tlanguageName")
    for code in sorted(codes):
        lang = iso1_map.get(code) or iso3_map.get(code)
        # Try to get name from DeepL or m2m if not found in wikidata
        name = None
        iso2 = ''
        iso3 = ''
        if lang:
            name = lang['langLabel']
            iso2 = lang.get('iso1', '')
            iso3 = lang.get('iso', '')
        else:
            # Try DeepL
            for entry in deepl:
                base = entry['language'].lower().split('-')[0]
                if base == code:
                    name = entry.get('name', entry['language'])
                    iso2 = code
                    break
            # Try m2m
            if not name and code in m2m:
                name = m2m[code]
                iso2 = code
        print(f"{iso2}\t{iso3}\t{name}")

print_langs(only_deepl, "Languages supported by DeepL but not m2m")
print()
print_langs(only_m2m, "Languages supported by m2m but not DeepL")
```