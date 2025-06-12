import { regionCountries } from '@/utils/compliance/countries';

export interface SanctionsList {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  programCodes: string[];
  countries: string[];
}

// Based on OFAC Sanctions Lists
export const sanctionsLists: SanctionsList[] = [
  {
    id: 'sdn',
    name: 'SDN List',
    description: 'Specially Designated Nationals and Blocked Persons List',
    lastUpdated: '2024-03-05',
    programCodes: ['SDN'],
    countries: ['DPRK', 'IRAN', 'SYRIA', 'CUBA', 'VENEZUELA']
  },
  {
    id: 'fse',
    name: 'Foreign Sanctions Evaders List',
    description: 'List of foreign individuals and entities determined to have violated U.S. sanctions',
    lastUpdated: '2024-01-15',
    programCodes: ['FSE-IR'],
    countries: ['IRAN', 'SYRIA']
  },
  {
    id: 'ns-isa',
    name: 'Non-SDN Iran Sanctions Act List',
    description: 'List of persons subject to secondary sanctions under Iran Sanctions Act',
    lastUpdated: '2024-01-15',
    programCodes: ['ISA'],
    countries: ['IRAN']
  },
  {
    id: 'ssi',
    name: 'Sectoral Sanctions Identifications List',
    description: 'List identifying persons operating in sectors of the Russian economy',
    lastUpdated: '2024-01-15',
    programCodes: ['UKRAINE-EO13662'],
    countries: ['RUSSIA']
  }
];

class SanctionsService {
  private lists: SanctionsList[] = sanctionsLists;

  getAllLists(): SanctionsList[] {
    return this.lists;
  }

  getListById(id: string): SanctionsList | undefined {
    return this.lists.find(list => list.id === id);
  }

  getCountriesForList(listId: string): string[] {
    const list = this.getListById(listId);
    return list ? list.countries : [];
  }

  // Maps OFAC country codes to our country IDs
  mapSanctionedCountriesToIds(listId: string): string[] {
    const sanctionedCountries = this.getCountriesForList(listId);
    return regionCountries
      .flatMap(region => region.countries)
      .filter(country => 
        sanctionedCountries.some(sanctioned => 
          country.name.toUpperCase().includes(sanctioned)
        )
      )
      .map(country => country.id);
  }

  generateRestrictionReason(listId: string): string {
    const list = this.getListById(listId);
    if (!list) return '';
    return `Restricted based on ${list.name} (${list.programCodes.join(', ')}) - Last updated: ${list.lastUpdated}`;
  }
}

export const sanctionsService = new SanctionsService(); 