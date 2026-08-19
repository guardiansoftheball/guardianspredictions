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
  for (const [country, code] of Object.entries(COUNTRY_CODES)) {
    if (lower.includes(country.toLowerCase())) {
      return `https://flagcdn.com/w160/${code}.png`;
    }
  }
  return null;
}
