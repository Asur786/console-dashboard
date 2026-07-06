<!-- fact -->
col_name	data_type	comment
yr_qtr_id	bigint	null
prd_strt_dt	string	null
prd_end_dt	string	null
prd_mnth_nm	string	null
yr_num	bigint	null
prd_qtr_nm	string	null
timeperiod_key	string	null
tmfrm_nm	string	null
cy_sls_val_lclccy_kg_prc	double	null
cy_sls_val_lclccy_unit_prc	double	null
prc_range_lc_kg_flg	bigint	null
prc_point_deep_dive_lc_kg_flg	bigint	null
prc_range_lc_unit_flg	bigint	null
prc_point_deep_dive_lc_unit_flg	bigint	null
updated_uom	string	null
col_uom	string	null
fact_kg_oz_ctry_pr	double	null
fact_unit_ctry_pr	double	null
period1	string	null
src_ind	string	null
cy_sls_units_qty	bigint	null
py_sls_units_qty	bigint	null
cy_sls_val_lclccy_amt_1	double	null
py_sls_val_lclccy_amt_1	double	null
cy_sls_val_usd_amt_1	double	null
py_sls_val_usd_amt_1	double	null
cy_sls_vol_qty	double	null
py_sls_vol_qty	double	null
cy_sls_val_lclccy_amt	double	null
py_sls_val_lclccy_amt	double	null
cy_sls_val_usd_amt	double	null
py_sls_val_usd_amt	double	null
cy_promo_sales_lc	double	null
cy_promo_sales_usd	double	null
py_promo_sales_lc	double	null
py_promo_sales_usd	double	null
cy_promo_vol	double	null
py_promo_vol	double	null
cy_promo_units	bigint	null
py_promo_units	bigint	null
dod_cy_vol	double	null
dod_py_vol	double	null
dod_cy_unit	double	null
dod_py_unit	double	null
lpf_sort_id	bigint	null
ctry_ctgy_prd_mnth_key	string	null
grams_range	string	null
product_dim_id	string	null
Geo_Channel_Id	string	null
Price_range_key	bigint	null

<!-- geodimension -->
col_name	data_type
ctry_val	string
rgn_nm	string
order_region	string
intnl_chnl_val	string
intnl_rtlr_val	string
order_channel	string
sctr_cdv	bigint
order_customer	string
order_banner	string
z_fact_key	bigint
mkt_typ_val	string
rgn_chnl_val	string
bnrr_val	string
order_mkt_typ_val	string
sctr_ctry_key	bigint
Geo_Channel_Id	string


<!-- lfqfact -->
col_name	data_type
MarketID	decimal(32,0)
ProductID	decimal(32,0)
PeriodMonth	string
CurrentYearValueSales	decimal(38,4)
CurrentYearVolumeSales	decimal(38,4)
CurrentYearUnitSales	decimal(38,4)
CurrentYearDollarSales	decimal(38,4)
PreviousYearValueSales	decimal(38,4)
PreviousYearVolumeSales	decimal(38,4)
PreviousYearUnitSales	decimal(38,4)
PreviousYearDollarSales	decimal(38,4)
PeriodMonthKey	int


<!-- lqpfact -->
col_name	data_type
MarketID	decimal(32,0)
ProductID	decimal(32,0)
PeriodMonth	string
CurrentYearValueSales	decimal(38,4)
CurrentYearVolumeSales	decimal(38,4)
CurrentYearUnitSales	decimal(38,4)
CurrentYearDollarSales	decimal(38,4)
PreviousYearValueSales	decimal(38,4)
PreviousYearVolumeSales	decimal(38,4)
PreviousYearUnitSales	decimal(38,4)
PreviousYearDollarSales	decimal(38,4)
PeriodMonthKey	int

<!-- marketdimension -->
col_name	data_type
MarketId	decimal(32,0)
Country	string
MarketType	string
RegionName	string
GlobalChannel	string
LocalChannel	string
GlobalRetailer	string
RetailBanner	string
KPIIndicator	int

<!-- productdimension -->
col_name	data_type
ProductId	decimal(32,0)
Category	string
Manufacturer	string
Segment	string
SubSegment	string
Brand	string
SubBrand	string
GlobalPackFormat	string
PackType	string
SizeGroup	string
Size	string
PackQuantity	string
LocalPackFormat	string
BrandPackFormat	string
PackCount	string

<!-- qtdfact -->

col_name	data_type
MarketID	decimal(32,0)
ProductID	decimal(32,0)
PeriodMonth	string
CurrentYearValueSales	decimal(38,4)
CurrentYearVolumeSales	decimal(38,4)
CurrentYearUnitSales	decimal(38,4)
CurrentYearDollarSales	decimal(38,4)
PreviousYearValueSales	decimal(38,4)
PreviousYearVolumeSales	decimal(38,4)
PreviousYearUnitSales	decimal(38,4)
PreviousYearDollarSales	decimal(38,4)
PeriodMonthKey	int

<!-- r12mfact -->
col_name	data_type
MarketID	decimal(32,0)
ProductID	decimal(32,0)
PeriodMonth	string
CurrentYearValueSales	decimal(38,4)
CurrentYearVolumeSales	decimal(38,4)
CurrentYearUnitSales	decimal(38,4)
CurrentYearDollarSales	decimal(38,4)
PreviousYearValueSales	decimal(38,4)
PreviousYearVolumeSales	decimal(38,4)
PreviousYearUnitSales	decimal(38,4)
PreviousYearDollarSales	decimal(38,4)
PeriodMonthKey	int

<!-- r13pfact -->
col_name	data_type
MarketID	decimal(32,0)
ProductID	decimal(32,0)
PeriodMonth	string
CurrentYearValueSales	decimal(38,4)
CurrentYearVolumeSales	decimal(38,4)
CurrentYearUnitSales	decimal(38,4)
CurrentYearDollarSales	decimal(38,4)
PreviousYearValueSales	decimal(38,4)
PreviousYearVolumeSales	decimal(38,4)
PreviousYearUnitSales	decimal(38,4)
PreviousYearDollarSales	decimal(38,4)
PeriodMonthKey	int

<!-- timeperiod -->
col_name	data_type
ctry_nm	string
ctgy_nm	string
prd_frqncy_cdv	string
tmfrm_nm	string
ref_prd_end_dt	string
ref_prd_mnth_nm	string
prd_strt_dt	string
prd_end_dt	string
prd_mnth_nm	string
last_avail_prd_flg	bigint
cy_pep_days	bigint
cy_cc_days	bigint
py_pep_days	bigint
py_cc_days	bigint
ctry_ctgy_prd_mnth_key	string
yr_num	bigint
prd_num	bigint
yr_mnth_frmt	string
pepqtr_yr_frmt	string

<!-- ytdfact -->
col_name	data_type
MarketID	decimal(32,0)
ProductID	decimal(32,0)
PeriodMonth	string
CurrentYearValueSales	decimal(38,4)
CurrentYearVolumeSales	decimal(38,4)
CurrentYearUnitSales	decimal(38,4)
CurrentYearDollarSales	decimal(38,4)
PreviousYearValueSales	decimal(38,4)
PreviousYearVolumeSales	decimal(38,4)
PreviousYearUnitSales	decimal(38,4)
PreviousYearDollarSales	decimal(38,4)
PeriodMonthKey	int