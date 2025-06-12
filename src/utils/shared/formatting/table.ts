export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export const sortData = <T>(data: T[], sortConfig: SortConfig | null): T[] => {
  if (!sortConfig) return data;

  return [...data].sort((a: any, b: any) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
};

export const filterData = <T>(data: T[], filters: Record<string, any>): T[] => {
  return data.filter((item: any) => {
    return Object.entries(filters).every(([key, value]) => {
      // Handle array filters (like type)
      if (Array.isArray(value)) {
        if (!value.length) return true;
        return value.includes(item[key]);
      }

      // Handle date range filters
      if (value && (value.from || value.to)) {
        const itemDate = new Date(item[key]);
        if (value.from && value.to) {
          return itemDate >= value.from && itemDate <= value.to;
        } else if (value.from) {
          return itemDate >= value.from;
        } else if (value.to) {
          return itemDate <= value.to;
        }
      }

      return true;
    });
  });
};

export const searchData = <T>(
  data: T[],
  searchQuery: string,
  searchableColumns: string[],
): T[] => {
  if (!searchQuery) return data;
  const query = searchQuery.toLowerCase();

  return data.filter((item: any) => {
    return searchableColumns.some((column) => {
      const value = item[column];
      if (typeof value === "string") {
        return value.toLowerCase().includes(query);
      }
      return false;
    });
  });
};
