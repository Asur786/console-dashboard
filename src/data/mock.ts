import type { MarketDimension, ProductDimension, SalesFact } from '../types/schema.types';

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (seeded) — keeps mock data consistent
// ---------------------------------------------------------------------------
function rnd(seed: number): number {
  return (Math.sin(seed * 9301 + 49297) + 1) / 2;
}

// ---------------------------------------------------------------------------
// Dimension data — marketdimension
// ---------------------------------------------------------------------------
export const MARKETS: readonly MarketDimension[] = [
  { MarketId: 1, Country: 'United States',  MarketType: 'Modern Trade',    RegionName: 'North America', GlobalChannel: 'Supermarket',  LocalChannel: 'Grocery',      GlobalRetailer: 'Walmart',       RetailBanner: 'SuperCenter',        KPIIndicator: 1 },
  { MarketId: 2, Country: 'United States',  MarketType: 'E-Commerce',      RegionName: 'North America', GlobalChannel: 'Online',       LocalChannel: 'Online',       GlobalRetailer: 'Amazon',        RetailBanner: 'Amazon',             KPIIndicator: 1 },
  { MarketId: 3, Country: 'United Kingdom', MarketType: 'Modern Trade',    RegionName: 'Europe',        GlobalChannel: 'Hypermarket',  LocalChannel: 'Grocery',      GlobalRetailer: 'Tesco',         RetailBanner: 'Tesco Express',      KPIIndicator: 1 },
  { MarketId: 4, Country: 'United Kingdom', MarketType: 'Traditional Trade',RegionName: 'Europe',       GlobalChannel: 'Convenience',  LocalChannel: 'Convenience',  GlobalRetailer: 'Sainsbury',     RetailBanner: 'Local',              KPIIndicator: 0 },
  { MarketId: 5, Country: 'Germany',        MarketType: 'Modern Trade',    RegionName: 'Europe',        GlobalChannel: 'Hypermarket',  LocalChannel: 'Grocery',      GlobalRetailer: 'REWE',          RetailBanner: 'REWE City',          KPIIndicator: 1 },
  { MarketId: 6, Country: 'France',         MarketType: 'Modern Trade',    RegionName: 'Europe',        GlobalChannel: 'Supermarket',  LocalChannel: 'Grocery',      GlobalRetailer: 'Carrefour',     RetailBanner: 'Carrefour Market',   KPIIndicator: 1 },
  { MarketId: 7, Country: 'Australia',      MarketType: 'Modern Trade',    RegionName: 'APAC',          GlobalChannel: 'Supermarket',  LocalChannel: 'Grocery',      GlobalRetailer: 'Woolworths',    RetailBanner: 'Woolworths Metro',   KPIIndicator: 1 },
  { MarketId: 8, Country: 'Australia',      MarketType: 'E-Commerce',      RegionName: 'APAC',          GlobalChannel: 'Online',       LocalChannel: 'Online',       GlobalRetailer: 'Amazon AU',     RetailBanner: 'Amazon AU',          KPIIndicator: 1 },
];

// ---------------------------------------------------------------------------
// Dimension data — productdimension
// ---------------------------------------------------------------------------
export const PRODUCTS: readonly ProductDimension[] = [
  { ProductId: 1,  Category: 'Beverages',      Manufacturer: 'HydraCo',      Segment: 'Water',      SubSegment: 'Still',     Brand: 'AquaPure',     SubBrand: 'Classic',    GlobalPackFormat: 'Bottle', PackType: 'PET',       SizeGroup: 'Large',   Size: '1.5L',  PackQuantity: '6',  LocalPackFormat: 'Bottle', BrandPackFormat: 'AquaPure 1.5L',  PackCount: '6x1.5L' },
  { ProductId: 2,  Category: 'Beverages',      Manufacturer: 'HydraCo',      Segment: 'Water',      SubSegment: 'Sparkling', Brand: 'FizzFlow',     SubBrand: 'Berry',      GlobalPackFormat: 'Can',    PackType: 'Aluminium', SizeGroup: 'Small',   Size: '500ml', PackQuantity: '24', LocalPackFormat: 'Can',    BrandPackFormat: 'FizzFlow 500ml', PackCount: '24x500ml' },
  { ProductId: 3,  Category: 'Beverages',      Manufacturer: 'NaturaDrinks', Segment: 'Juice',      SubSegment: 'Citrus',    Brand: 'FruitFirst',   SubBrand: 'Orange',     GlobalPackFormat: 'Carton', PackType: 'Tetra',     SizeGroup: 'Medium',  Size: '1L',    PackQuantity: '12', LocalPackFormat: 'Carton', BrandPackFormat: 'FruitFirst 1L',  PackCount: '12x1L' },
  { ProductId: 4,  Category: 'Beverages',      Manufacturer: 'NaturaDrinks', Segment: 'Juice',      SubSegment: 'Tropical',  Brand: 'CitrusBurst',  SubBrand: 'Mango',      GlobalPackFormat: 'Pouch',  PackType: 'Flexible',  SizeGroup: 'Small',   Size: '250ml', PackQuantity: '6',  LocalPackFormat: 'Pouch',  BrandPackFormat: 'CitrusBurst 250ml', PackCount: '6x250ml' },
  { ProductId: 5,  Category: 'Snacks',         Manufacturer: 'CrunchCo',     Segment: 'Chips',      SubSegment: 'Potato',    Brand: 'CrunchMaster', SubBrand: 'Sea Salt',   GlobalPackFormat: 'Bag',    PackType: 'Flexible',  SizeGroup: 'Regular', Size: '150g',  PackQuantity: '12', LocalPackFormat: 'Bag',    BrandPackFormat: 'CrunchMaster 150g', PackCount: '12x150g' },
  { ProductId: 6,  Category: 'Snacks',         Manufacturer: 'CrunchCo',     Segment: 'Crackers',   SubSegment: 'Baked',     Brand: 'ThinBites',    SubBrand: 'Cheese',     GlobalPackFormat: 'Box',    PackType: 'Cardboard', SizeGroup: 'Regular', Size: '200g',  PackQuantity: '8',  LocalPackFormat: 'Box',    BrandPackFormat: 'ThinBites 200g', PackCount: '8x200g' },
  { ProductId: 7,  Category: 'Snacks',         Manufacturer: 'NibbleCo',     Segment: 'Nuts',       SubSegment: 'Mixed',     Brand: 'NutriNuts',    SubBrand: 'Mixed',      GlobalPackFormat: 'Bag',    PackType: 'Flexible',  SizeGroup: 'Large',   Size: '250g',  PackQuantity: '6',  LocalPackFormat: 'Bag',    BrandPackFormat: 'NutriNuts 250g', PackCount: '6x250g' },
  { ProductId: 8,  Category: 'Snacks',         Manufacturer: 'NibbleCo',     Segment: 'Popcorn',    SubSegment: 'Butter',    Brand: 'PopKing',      SubBrand: 'Butter',     GlobalPackFormat: 'Bag',    PackType: 'Flexible',  SizeGroup: 'Small',   Size: '100g',  PackQuantity: '18', LocalPackFormat: 'Bag',    BrandPackFormat: 'PopKing 100g', PackCount: '18x100g' },
  { ProductId: 9,  Category: 'Dairy',          Manufacturer: 'MilkRight',    Segment: 'Yogurt',     SubSegment: 'Flavoured', Brand: 'CreamTop',     SubBrand: 'Strawberry', GlobalPackFormat: 'Cup',    PackType: 'Plastic',   SizeGroup: 'Regular', Size: '400g',  PackQuantity: '4',  LocalPackFormat: 'Cup',    BrandPackFormat: 'CreamTop 400g', PackCount: '4x400g' },
  { ProductId: 10, Category: 'Dairy',          Manufacturer: 'MilkRight',    Segment: 'Cheese',     SubSegment: 'Hard',      Brand: 'MeltRight',    SubBrand: 'Cheddar',    GlobalPackFormat: 'Block',  PackType: 'Waxed',     SizeGroup: 'Regular', Size: '300g',  PackQuantity: '8',  LocalPackFormat: 'Block',  BrandPackFormat: 'MeltRight 300g', PackCount: '8x300g' },
  { ProductId: 11, Category: 'Dairy',          Manufacturer: 'MilkRight',    Segment: 'Butter',     SubSegment: 'Salted',    Brand: 'GoldenSpread', SubBrand: 'Classic',    GlobalPackFormat: 'Block',  PackType: 'Foil',      SizeGroup: 'Regular', Size: '250g',  PackQuantity: '10', LocalPackFormat: 'Block',  BrandPackFormat: 'GoldenSpread 250g', PackCount: '10x250g' },
  { ProductId: 12, Category: 'Personal Care',  Manufacturer: 'CareCo',       Segment: 'Hair Care',  SubSegment: 'Shampoo',   Brand: 'SilkShine',    SubBrand: 'Argan Oil',  GlobalPackFormat: 'Bottle', PackType: 'HDPE',      SizeGroup: 'Large',   Size: '400ml', PackQuantity: '1',  LocalPackFormat: 'Bottle', BrandPackFormat: 'SilkShine 400ml', PackCount: '1x400ml' },
];

// ---------------------------------------------------------------------------
// Generation parameters
// ---------------------------------------------------------------------------

/** Market size multiplier — US is the largest market */
const MARKET_SIZE: Record<number, number> = {
  1: 3.2, 2: 2.1, 3: 1.8, 4: 0.8,
  5: 1.6, 6: 1.5, 7: 1.4, 8: 0.9,
};

/** Product base values per record (USD value, volume units, unit count) */
const PRODUCT_BASE: Record<number, { value: number; vol: number; units: number }> = {
  1:  { value: 180_000, vol: 35_000, units: 12_000 },
  2:  { value: 140_000, vol: 28_000, units: 18_000 },
  3:  { value: 120_000, vol: 22_000, units:  8_000 },
  4:  { value:  80_000, vol: 15_000, units:  9_000 },
  5:  { value: 100_000, vol: 12_000, units:  6_000 },
  6:  { value:  70_000, vol: 10_000, units:  5_000 },
  7:  { value:  90_000, vol:  8_000, units:  4_000 },
  8:  { value:  50_000, vol:  6_000, units:  7_000 },
  9:  { value: 110_000, vol: 18_000, units: 10_000 },
  10: { value:  85_000, vol: 14_000, units:  5_500 },
  11: { value:  75_000, vol: 12_000, units:  6_500 },
  12: { value:  60_000, vol:  5_000, units:  3_000 },
};

/** YoY growth rate per product */
const PRODUCT_GROWTH: Record<number, number> = {
  1:  0.08,   2: 0.15,  3:  0.03,  4: -0.02,
  5:  0.12,   6: 0.05,  7:  0.18,  8:  0.20,
  9:  0.06,  10: -0.04, 11:  0.09, 12:  0.11,
};

/** Monthly seasonality index (Jan–Dec) */
const SEASONALITY = [0.75, 0.78, 0.88, 0.95, 1.05, 1.15, 1.20, 1.18, 1.10, 1.05, 0.90, 1.35];

/** All 12 months in scope */
export const ALL_PERIODS: string[] = Array.from({ length: 12 }, (_, i) =>
  `2024-${String(i + 1).padStart(2, '0')}`
);

/** Periods covered by each timeframe */
export const TIMEFRAME_PERIODS: Record<string, string[]> = {
  R12M: ALL_PERIODS,
  R13P: ALL_PERIODS,
  QTD:  ALL_PERIODS.slice(9),   // Oct–Dec
  LFQ:  ALL_PERIODS.slice(9),   // Oct–Dec
  LQP:  ALL_PERIODS.slice(9),   // Oct–Dec
};

// ---------------------------------------------------------------------------
// Fact generation
// ---------------------------------------------------------------------------
function buildFact(
  marketId: number,
  productId: number,
  periodMonth: string
): SalesFact {
  const monthIdx = parseInt(periodMonth.slice(5), 10) - 1;
  const seasonal = SEASONALITY[monthIdx] ?? 1;
  const mSize    = MARKET_SIZE[marketId] ?? 1;
  const base     = PRODUCT_BASE[productId] ?? { value: 50_000, vol: 5_000, units: 3_000 };
  const noise    = rnd(marketId * 997 + productId * 101 + monthIdx * 13);
  const growth   = PRODUCT_GROWTH[productId] ?? 0.05;

  const noiseFactor = 0.80 + noise * 0.40;           // ±20% noise
  const cyValue  = Math.round(base.value  * mSize * seasonal * noiseFactor);
  const cyVol    = Math.round(base.vol    * mSize * seasonal * noiseFactor);
  const cyUnits  = Math.round(base.units  * mSize * seasonal * noiseFactor);
  const pyValue  = Math.round(cyValue  / (1 + growth));
  const pyVol    = Math.round(cyVol    / (1 + growth));
  const pyUnits  = Math.round(cyUnits  / (1 + growth));

  const [year, month] = periodMonth.split('-').map(Number);

  return {
    MarketID: marketId,
    ProductID: productId,
    PeriodMonth: periodMonth,
    CurrentYearValueSales:    cyValue,
    CurrentYearVolumeSales:   cyVol,
    CurrentYearUnitSales:     cyUnits,
    CurrentYearDollarSales:   cyValue,
    PreviousYearValueSales:   pyValue,
    PreviousYearVolumeSales:  pyVol,
    PreviousYearUnitSales:    pyUnits,
    PreviousYearDollarSales:  pyValue,
    PeriodMonthKey:           year * 100 + month,
  };
}

/** Returns all fact records for the given timeframe. Lazily generated. */
export function getMockFacts(timeframe: string): SalesFact[] {
  const periods = TIMEFRAME_PERIODS[timeframe] ?? ALL_PERIODS;
  const facts: SalesFact[] = [];
  for (const market of MARKETS) {
    for (const product of PRODUCTS) {
      for (const period of periods) {
        facts.push(buildFact(market.MarketId, product.ProductId, period));
      }
    }
  }
  return facts;
}
