export interface ExecFilterOption {
  value: string;
  label: string;
}

/** Selected filter values keyed by dimension key (config-driven). */
export type ExecFilters = Record<string, string>;

export interface ExecKpi {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  valueColor?: 'default' | 'green' | 'red';
}
