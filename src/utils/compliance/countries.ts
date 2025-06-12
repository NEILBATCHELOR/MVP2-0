export interface RegionCountries {
  id: string;
  name: string;
  countries: Country[];
}

export interface Country {
  id: string;
  name: string;
}

export const regionCountries: RegionCountries[] = [
  {
    id: "africa_eastern",
    name: "Eastern Africa",
    countries: [
      { id: "bi", name: "Burundi" },
      { id: "km", name: "Comoros" },
      { id: "dj", name: "Djibouti" },
      { id: "er", name: "Eritrea" },
      { id: "et", name: "Ethiopia" },
      { id: "ke", name: "Kenya" },
      { id: "mg", name: "Madagascar" },
      { id: "mw", name: "Malawi" },
      { id: "mu", name: "Mauritius" },
      { id: "mz", name: "Mozambique" },
      { id: "rw", name: "Rwanda" },
      { id: "sc", name: "Seychelles" },
      { id: "so", name: "Somalia" },
      { id: "ss", name: "South Sudan" },
      { id: "tz", name: "Tanzania" },
      { id: "ug", name: "Uganda" },
      { id: "zm", name: "Zambia" },
      { id: "zw", name: "Zimbabwe" },
      { id: "yt", name: "Mayotte" },
    ],
  },
  {
    id: "africa_middle",
    name: "Middle Africa",
    countries: [
      { id: "ao", name: "Angola" },
      { id: "cm", name: "Cameroon" },
      { id: "cf", name: "Central African Republic" },
      { id: "td", name: "Chad" },
      { id: "cg", name: "Congo" },
      { id: "cd", name: "Democratic Republic of the Congo" },
      { id: "gq", name: "Equatorial Guinea" },
      { id: "ga", name: "Gabon" },
      { id: "st", name: "São Tomé and Príncipe" },
    ],
  },
  {
    id: "africa_northern",
    name: "Northern Africa",
    countries: [
      { id: "dz", name: "Algeria" },
      { id: "eg", name: "Egypt" },
      { id: "ly", name: "Libya" },
      { id: "ma", name: "Morocco" },
      { id: "sd", name: "Sudan" },
      { id: "tn", name: "Tunisia" },
      { id: "eh", name: "Western Sahara" },
    ],
  },
  {
    id: "africa_southern",
    name: "Southern Africa",
    countries: [
      { id: "bw", name: "Botswana" },
      { id: "sz", name: "Eswatini" },
      { id: "ls", name: "Lesotho" },
      { id: "na", name: "Namibia" },
      { id: "za", name: "South Africa" },
    ],
  },
  {
    id: "africa_western",
    name: "Western Africa",
    countries: [
      { id: "bj", name: "Benin" },
      { id: "bf", name: "Burkina Faso" },
      { id: "cv", name: "Cabo Verde" },
      { id: "ci", name: "Côte d'Ivoire" },
      { id: "gm", name: "Gambia" },
      { id: "gh", name: "Ghana" },
      { id: "gn", name: "Guinea" },
      { id: "gw", name: "Guinea-Bissau" },
      { id: "lr", name: "Liberia" },
      { id: "ml", name: "Mali" },
      { id: "mr", name: "Mauritania" },
      { id: "ne", name: "Niger" },
      { id: "ng", name: "Nigeria" },
      { id: "sn", name: "Senegal" },
      { id: "sl", name: "Sierra Leone" },
      { id: "tg", name: "Togo" },
    ],
  },
  {
    id: "americas_northern",
    name: "Northern America",
    countries: [
      { id: "ca", name: "Canada" },
      { id: "mx", name: "Mexico" },
      { id: "us", name: "United States of America" },
    ],
  },
  {
    id: "americas_central",
    name: "Central America",
    countries: [
      { id: "bz", name: "Belize" },
      { id: "cr", name: "Costa Rica" },
      { id: "sv", name: "El Salvador" },
      { id: "gt", name: "Guatemala" },
      { id: "hn", name: "Honduras" },
      { id: "ni", name: "Nicaragua" },
      { id: "pa", name: "Panama" },
    ],
  },
  {
    id: "americas_caribbean",
    name: "Caribbean",
    countries: [
      { id: "ag", name: "Antigua and Barbuda" },
      { id: "bs", name: "Bahamas" },
      { id: "bb", name: "Barbados" },
      { id: "cu", name: "Cuba" },
      { id: "dm", name: "Dominica" },
      { id: "do", name: "Dominican Republic" },
      { id: "gd", name: "Grenada" },
      { id: "ht", name: "Haiti" },
      { id: "jm", name: "Jamaica" },
      { id: "kn", name: "Saint Kitts and Nevis" },
      { id: "lc", name: "Saint Lucia" },
      { id: "vc", name: "Saint Vincent and the Grenadines" },
      { id: "tt", name: "Trinidad and Tobago" },
    ],
  },
  {
    id: "americas_south",
    name: "South America",
    countries: [
      { id: "ar", name: "Argentina" },
      { id: "bo", name: "Bolivia" },
      { id: "br", name: "Brazil" },
      { id: "cl", name: "Chile" },
      { id: "co", name: "Colombia" },
      { id: "ec", name: "Ecuador" },
      { id: "gy", name: "Guyana" },
      { id: "py", name: "Paraguay" },
      { id: "pe", name: "Peru" },
      { id: "sr", name: "Suriname" },
      { id: "uy", name: "Uruguay" },
      { id: "ve", name: "Venezuela" },
    ],
  },
  {
    id: "asia_central",
    name: "Central Asia",
    countries: [
      { id: "kz", name: "Kazakhstan" },
      { id: "kg", name: "Kyrgyzstan" },
      { id: "tj", name: "Tajikistan" },
      { id: "tm", name: "Turkmenistan" },
      { id: "uz", name: "Uzbekistan" },
    ],
  },
  {
    id: "asia_eastern",
    name: "Eastern Asia",
    countries: [
      { id: "cn", name: "China" },
      { id: "jp", name: "Japan" },
      { id: "mn", name: "Mongolia" },
      { id: "kp", name: "North Korea" },
      { id: "kr", name: "South Korea" },
    ],
  },
  {
    id: "asia_southeastern",
    name: "South-Eastern Asia",
    countries: [
      { id: "bn", name: "Brunei" },
      { id: "kh", name: "Cambodia" },
      { id: "id", name: "Indonesia" },
      { id: "la", name: "Laos" },
      { id: "my", name: "Malaysia" },
      { id: "mm", name: "Myanmar" },
      { id: "ph", name: "Philippines" },
      { id: "sg", name: "Singapore" },
      { id: "th", name: "Thailand" },
      { id: "tl", name: "Timor-Leste" },
      { id: "vn", name: "Vietnam" },
    ],
  },
  {
    id: "asia_southern",
    name: "Southern Asia",
    countries: [
      { id: "af", name: "Afghanistan" },
      { id: "bd", name: "Bangladesh" },
      { id: "bt", name: "Bhutan" },
      { id: "in", name: "India" },
      { id: "ir", name: "Iran" },
      { id: "mv", name: "Maldives" },
      { id: "np", name: "Nepal" },
      { id: "pk", name: "Pakistan" },
      { id: "lk", name: "Sri Lanka" },
    ],
  },
  {
    id: "asia_western",
    name: "Western Asia",
    countries: [
      { id: "am", name: "Armenia" },
      { id: "az", name: "Azerbaijan" },
      { id: "bh", name: "Bahrain" },
      { id: "cy", name: "Cyprus" },
      { id: "ge", name: "Georgia" },
      { id: "iq", name: "Iraq" },
      { id: "il", name: "Israel" },
      { id: "jo", name: "Jordan" },
      { id: "kw", name: "Kuwait" },
      { id: "lb", name: "Lebanon" },
      { id: "om", name: "Oman" },
      { id: "ps", name: "Palestine" },
      { id: "qa", name: "Qatar" },
      { id: "sa", name: "Saudi Arabia" },
      { id: "sy", name: "Syria" },
      { id: "tr", name: "Turkey" },
      { id: "ae", name: "United Arab Emirates" },
      { id: "ye", name: "Yemen" },
    ],
  },
  {
    id: "europe_eastern",
    name: "Eastern Europe",
    countries: [
      { id: "by", name: "Belarus" },
      { id: "bg", name: "Bulgaria" },
      { id: "cz", name: "Czechia" },
      { id: "hu", name: "Hungary" },
      { id: "md", name: "Moldova" },
      { id: "pl", name: "Poland" },
      { id: "ro", name: "Romania" },
      { id: "ru", name: "Russia" },
      { id: "sk", name: "Slovakia" },
      { id: "ua", name: "Ukraine" },
    ],
  },
  {
    id: "europe_northern",
    name: "Northern Europe",
    countries: [
      { id: "dk", name: "Denmark" },
      { id: "ee", name: "Estonia" },
      { id: "fi", name: "Finland" },
      { id: "is", name: "Iceland" },
      { id: "ie", name: "Ireland" },
      { id: "lv", name: "Latvia" },
      { id: "lt", name: "Lithuania" },
      { id: "no", name: "Norway" },
      { id: "se", name: "Sweden" },
      { id: "gb", name: "United Kingdom" },
    ],
  },
  {
    id: "europe_southern",
    name: "Southern Europe",
    countries: [
      { id: "al", name: "Albania" },
      { id: "ad", name: "Andorra" },
      { id: "ba", name: "Bosnia and Herzegovina" },
      { id: "hr", name: "Croatia" },
      { id: "gr", name: "Greece" },
      { id: "it", name: "Italy" },
      { id: "xk", name: "Kosovo" },
      { id: "mt", name: "Malta" },
      { id: "me", name: "Montenegro" },
      { id: "mk", name: "North Macedonia" },
      { id: "pt", name: "Portugal" },
      { id: "sm", name: "San Marino" },
      { id: "rs", name: "Serbia" },
      { id: "si", name: "Slovenia" },
      { id: "es", name: "Spain" },
      { id: "va", name: "Vatican City" },
    ],
  },
  {
    id: "europe_western",
    name: "Western Europe",
    countries: [
      { id: "at", name: "Austria" },
      { id: "be", name: "Belgium" },
      { id: "fr", name: "France" },
      { id: "de", name: "Germany" },
      { id: "li", name: "Liechtenstein" },
      { id: "lu", name: "Luxembourg" },
      { id: "nl", name: "Netherlands" },
    ],
  },
  {
    id: "oceania_australia_nz",
    name: "Australia and New Zealand",
    countries: [
      { id: "au", name: "Australia" },
      { id: "nz", name: "New Zealand" },
    ],
  },
  {
    id: "oceania_melanesia",
    name: "Melanesia",
    countries: [
      { id: "fj", name: "Fiji" },
      { id: "pg", name: "Papua New Guinea" },
      { id: "sb", name: "Solomon Islands" },
      { id: "vu", name: "Vanuatu" },
    ],
  },
  {
    id: "oceania_micronesia",
    name: "Micronesia",
    countries: [
      { id: "ki", name: "Kiribati" },
      { id: "mh", name: "Marshall Islands" },
      { id: "fm", name: "Micronesia" },
      { id: "nr", name: "Nauru" },
      { id: "pw", name: "Palau" },
    ],
  },
  {
    id: "oceania_polynesia",
    name: "Polynesia",
    countries: [
      { id: "ws", name: "Samoa" },
      { id: "to", name: "Tonga" },
      { id: "tv", name: "Tuvalu" },
    ],
  },
];

// Helper function to get all countries as a flat array
export const getAllCountries = (): Country[] => {
  return regionCountries.flatMap((region) => region.countries);
};

// Helper function to get country name from ID
export const getCountryNameById = (id: string): string => {
  const country = getAllCountries().find((country) => country.id === id);
  return country?.name || id;
};

// Helper function to get region name from ID
export const getRegionNameById = (id: string): string => {
  const region = regionCountries.find((region) => region.id === id);
  return region?.name || id;
};

// Helper function to get region for a country
export const getRegionForCountry = (countryId: string): string | null => {
  for (const region of regionCountries) {
    if (region.countries.some((country) => country.id === countryId)) {
      return region.id;
    }
  }
  return null;
};
