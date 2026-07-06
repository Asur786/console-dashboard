/** A single selectable option for any filter dropdown. */
export interface FilterOption {
  value: string;
  label: string;
}

/** Aggregated options for all four dashboard filter axes. */
export interface DashboardFilterOptions {
  channels: FilterOption[];
  categories: FilterOption[];
  retailers: FilterOption[];
  countries: FilterOption[];
}
