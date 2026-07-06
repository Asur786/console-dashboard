/** Matches marketdimension table */
export interface MarketDimension {
  MarketId: number;
  Country: string;
  MarketType: string;
  RegionName: string;
  GlobalChannel: string;
  LocalChannel: string;
  GlobalRetailer: string;
  RetailBanner: string;
  KPIIndicator: number;
}

/** Matches productdimension table */
export interface ProductDimension {
  ProductId: number;
  Category: string;
  Manufacturer: string;
  Segment: string;
  SubSegment: string;
  Brand: string;
  SubBrand: string;
  GlobalPackFormat: string;
  PackType: string;
  SizeGroup: string;
  Size: string;
  PackQuantity: string;
  LocalPackFormat: string;
  BrandPackFormat: string;
  PackCount: string;
}

/**
 * Shared structure for:
 *   lfqfact | lqpfact | qtdfact | r12mfact | r13pfact
 */
export interface SalesFact {
  MarketID: number;
  ProductID: number;
  PeriodMonth: string;              // 'YYYY-MM'
  CurrentYearValueSales: number;
  CurrentYearVolumeSales: number;
  CurrentYearUnitSales: number;
  CurrentYearDollarSales: number;
  PreviousYearValueSales: number;
  PreviousYearVolumeSales: number;
  PreviousYearUnitSales: number;
  PreviousYearDollarSales: number;
  PeriodMonthKey: number;           // YYYYMM integer
}

export type Timeframe = 'R12M' | 'R13P' | 'QTD' | 'LFQ' | 'LQP';

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  R12M: 'Rolling 12 Months',
  R13P: 'Rolling 13 Periods',
  QTD: 'Quarter to Date',
  LFQ: 'Last Fiscal Quarter',
  LQP: 'Last Quarter Period',
};
