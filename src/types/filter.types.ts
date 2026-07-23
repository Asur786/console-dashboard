/** A single selectable option for any filter dropdown. */
export interface FilterOption {
  value: string;
  label: string;
}

/** One filter dimension (config-driven) with its selectable options. */
export interface FilterDimension {
  key: string;
  label: string;
  options: FilterOption[];
}
