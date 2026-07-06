import type { ExecKpi, ExecFilters } from '../../../types/executive.types';

/**
 * Returns mock KPI values for the Executive Summary page.
 * Filter options are sourced from FilterService (services/filter.service.ts),
 * not hardcoded here.
 */
export function getExecKpis(_filters: ExecFilters): ExecKpi[] {
  return [
    {
      id: 'dollar-sales',
      label: 'Dollar Sales',
      value: '$4.8B',
      sublabel: 'GTM',
      valueColor: 'green',
    },
    {
      id: 'dollar-share',
      label: 'Dollar Share',
      value: '51.2%',
      sublabel: 'GTM',
      valueColor: 'green',
    },
    {
      id: 'volume-share',
      label: 'Volume Share',
      value: '4.7B',
      sublabel: 'GTM',
      valueColor: 'default',
    },
    {
      id: 'distribution',
      label: 'Distribution',
      value: '88.3%',
      sublabel: 'GTM',
      valueColor: 'default',
    },
    {
      id: 'yoy-growth',
      label: 'YoY Growth',
      value: '+3.2%',
      sublabel: 'GTM',
      valueColor: 'green',
    },
  ];
}
