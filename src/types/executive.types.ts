export interface ExecFilterOption {
  value: string;
  label: string;
}

export interface ExecFilters {
  channel: string;
  category: string;
  retailer: string;
  country: string;
}

export interface ExecKpi {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  valueColor?: 'default' | 'green' | 'red';
}

export interface ExecFilterOptions {
  channels: ExecFilterOption[];
  categories: ExecFilterOption[];
  retailers: ExecFilterOption[];
  countries: ExecFilterOption[];
}
