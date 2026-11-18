// Liga Profesional crests served from /public/teams/lpf. Keys are the labels
// used in market answers (lower-case), including common short names.
const LPF_CRESTS = {
  "argentinos juniors": "aaaj", "arg. juniors": "aaaj",
  "estudiantes rc": "aae",
  aldosivi: "caa",
  banfield: "cab",
  "barracas central": "cabc", barracas: "cabc",
  belgrano: "cabcor",
  boca: "cabj", "boca juniors": "cabj",
  "central córdoba": "cacc", "central cordoba": "cacc",
  "gimnasia mendoza": "gem",
  huracán: "cah", huracan: "cah",
  independiente: "cai",
  lanús: "cal", lanus: "cal",
  platense: "cap",
  "rosario central": "carc", "r. central": "carc",
  river: "carp", "river plate": "carp",
  sarmiento: "cas",
  "san lorenzo": "casla",
  tigre: "cat",
  talleres: "catc",
  "atlético tucumán": "catu", "atletico tucuman": "catu", "atl. tucumán": "catu",
  unión: "cau", union: "cau",
  vélez: "cavs", velez: "cavs", "vélez sarsfield": "cavs",
  gimnasia: "cge", "gimnasia la plata": "cge",
  "independiente rivadavia": "csir", "ind. rivadavia": "csir",
  riestra: "cdr",
  estudiantes: "edlp", "estudiantes de la plata": "edlp",
  instituto: "iacc",
  "newell's": "nob", "newell’s": "nob", newells: "nob",
  racing: "rc", "racing club": "rc",
  "defensa y justicia": "dyj", defensa: "dyj",
  "liga profesional": "lpf_main", lpf: "lpf_main",
};

const crestUrl = (file) => `/teams/lpf/${file}.webp`;

/** True when the URL is a club crest (draw with contain, no round crop). */
export const isCrest = (url) => typeof url === "string" && url.startsWith("/teams/");

const COUNTRY_CODES = {
  "Argentina": "ar",
  "Brazil": "br",
  "Mexico": "mx",
  "United States": "us",
  "Germany": "de",
  "Netherlands": "nl",
  "Spain": "es",
  "France": "fr",
  "Colombia": "co",
  "Uruguay": "uy",
  "Portugal": "pt",
  "Morocco": "ma",
  "Croatia": "hr",
  "Canada": "ca",
  "New Zealand": "nz",
  "Ecuador": "ec",
  "Paraguay": "py",
  "Iran": "ir",
  "Jordan": "jo",
  "Haiti": "ht",
  "England": "gb-eng",
  "Japan": "jp",
  "South Korea": "kr",
  "Australia": "au",
  "Italy": "it",
  "Belgium": "be",
  "Switzerland": "ch",
  "Denmark": "dk",
  "Poland": "pl",
  "Senegal": "sn",
  "Ghana": "gh",
  "Cameroon": "cm",
  "Nigeria": "ng",
  "Tunisia": "tn",
  "Saudi Arabia": "sa",
  "Qatar": "qa",
  "Chile": "cl",
  "Peru": "pe",
  "Venezuela": "ve",
  "Bolivia": "bo",
  "Costa Rica": "cr",
  "Honduras": "hn",
  "Panama": "pa",
  "Jamaica": "jm",
  "Serbia": "rs",
  "Wales": "gb-wls",
  "Scotland": "gb-sct",
  "Czech Republic": "cz",
  "Austria": "at",
  "Sweden": "se",
  "Norway": "no",
  "Ukraine": "ua",
  "Turkey": "tr",
  "Greece": "gr",
  "Romania": "ro",
  "Hungary": "hu",
  "Slovakia": "sk",
  "Slovenia": "si",
  "Albania": "al",
  "Iceland": "is",
  "Finland": "fi",
  "Ireland": "ie",
  "Israel": "il",
  "Egypt": "eg",
  "Algeria": "dz",
  "South Africa": "za",
  "China": "cn",
  "India": "in",
  "Cuba": "cu",
  "Dominican Republic": "do",
  "Trinidad and Tobago": "tt",
  "El Salvador": "sv",
  "Guatemala": "gt",
  "Cape Verde": "cv",
  "Uzbekistan": "uz",
  "Iraq": "iq",
  "Syria": "sy",
  "United Arab Emirates": "ae",
  "Bahrain": "bh",
  "Oman": "om",
  "Kuwait": "kw",
  "Thailand": "th",
  "Vietnam": "vn",
  "Indonesia": "id",
  "Malaysia": "my",
  "Philippines": "ph",
  "Singapore": "sg",
  "Taiwan": "tw",
  "Bangladesh": "bd",
  "Sri Lanka": "lk",
  "Nepal": "np",
  "Pakistan": "pk",
  "Afghanistan": "af",
};

/**
 * Returns a flag image URL for a country name, or null if not found.
 * Uses flagcdn.com (same source already used in the project).
 */
export function getFlag(name) {
  if (!name) return null;
  const crest = LPF_CRESTS[name.toLowerCase().trim()];
  if (crest) return crestUrl(crest);
  const code = COUNTRY_CODES[name];
  if (!code) return null;
  return `https://flagcdn.com/w160/${code}.png`;
}

/**
 * Tries to find a flag by scanning a text string for known country names.
 * Returns the first match found, or null.
 */
export function getFlagFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  // Longest names first so "Rosario Central" wins over "Central".
  const clubs = Object.keys(LPF_CRESTS).sort((a, b) => b.length - a.length);
  const club = clubs.find((name) => lower.includes(name));
  if (club) return crestUrl(LPF_CRESTS[club]);
  for (const [country, code] of Object.entries(COUNTRY_CODES)) {
    if (lower.includes(country.toLowerCase())) {
      return `https://flagcdn.com/w160/${code}.png`;
    }
  }
  return null;
}
