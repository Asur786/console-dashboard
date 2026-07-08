# Databricks notebook source
# MAGIC %md
# MAGIC # Build Gold Layer — AI Insights Console POC
# MAGIC
# MAGIC **Purpose:** Creates two Gold Delta tables from existing Unity Catalog silver tables.
# MAGIC
# MAGIC | Gold Table | Role |
# MAGIC |---|---|
# MAGIC | `gold_kpi_summary` | Pre-aggregated KPI metrics — Genie's primary query target |
# MAGIC | `gold_business_context` | KPI definitions, thresholds, templates — Genie's knowledge base |
# MAGIC
# MAGIC **Prerequisites:**
# MAGIC - Unity Catalog enabled
# MAGIC - Silver tables exist in `workspace.default`:
# MAGIC   `r12mfact`, `qtdfact`, `ytdfact`, `marketdimension`, `productdimension`
# MAGIC - Cluster has write access to the target catalog/schema

# COMMAND ----------

# ============================================================
# CONFIGURATION — adjust if catalog/schema names differ
# ============================================================

SILVER_CATALOG = "workspace"
SILVER_SCHEMA  = "default"
GOLD_CATALOG   = "workspace"
GOLD_SCHEMA    = "gold"

silver = f"{SILVER_CATALOG}.{SILVER_SCHEMA}"
gold   = f"{GOLD_CATALOG}.{GOLD_SCHEMA}"

# Create gold schema if it doesn't exist
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {GOLD_CATALOG}.{GOLD_SCHEMA}")
print(f"Schema ready: {gold}")

# COMMAND ----------

from pyspark.sql import functions as F
from pyspark.sql.window import Window
from pyspark.sql.types import (
    StructType, StructField,
    StringType, DoubleType, TimestampType
)

# COMMAND ----------
# MAGIC %md
# MAGIC ## Gold Table 1: `gold_kpi_summary`
# MAGIC
# MAGIC Grain: `(time_frame, country, global_channel, global_retailer, category, brand)`
# MAGIC
# MAGIC Source: R12M + QTD + YTD fact tables × marketdimension × productdimension

# COMMAND ----------

# ----------------------------------------------------------
# 1a. Load dimension tables
# ----------------------------------------------------------
market_dim = spark.table(f"{silver}.marketdimension").select(
    F.col("MarketId"),
    F.col("Country"),
    F.col("RegionName"),
    F.col("GlobalChannel"),
    F.col("GlobalRetailer"),
    F.col("MarketType"),
    F.col("KPIIndicator"),
)

product_dim = spark.table(f"{silver}.productdimension").select(
    F.col("ProductId"),
    F.col("Category"),
    F.col("Manufacturer"),
    F.col("Brand"),
    F.col("Segment"),
    F.col("SubSegment"),
)

# ----------------------------------------------------------
# 1b. Stack all three fact tables with a time_frame label
# ----------------------------------------------------------
def load_fact(table_name: str, time_frame_label: str):
    """Load a fact table and tag it with the reporting time frame."""
    return (
        spark.table(f"{silver}.{table_name}")
        .withColumn("time_frame", F.lit(time_frame_label))
        .select(
            "time_frame",
            F.col("MarketID"),
            F.col("ProductID"),
            F.col("PeriodMonth"),
            F.col("PeriodMonthKey"),
            F.col("CurrentYearDollarSales").cast("double").alias("cy_dollar_sales"),
            F.col("PreviousYearDollarSales").cast("double").alias("py_dollar_sales"),
            F.col("CurrentYearVolumeSales").cast("double").alias("cy_volume_sales"),
            F.col("PreviousYearVolumeSales").cast("double").alias("py_volume_sales"),
            F.col("CurrentYearUnitSales").cast("double").alias("cy_unit_sales"),
            F.col("PreviousYearUnitSales").cast("double").alias("py_unit_sales"),
            F.col("CurrentYearValueSales").cast("double").alias("cy_value_sales"),
            F.col("PreviousYearValueSales").cast("double").alias("py_value_sales"),
        )
    )


fact_union = (
    load_fact("r12mfact", "R12M")
    .union(load_fact("qtdfact", "QTD"))
    .union(load_fact("ytdfact", "YTD"))
)

# ----------------------------------------------------------
# 1c. Join with dimension tables
# ----------------------------------------------------------
enriched = (
    fact_union
    .join(market_dim,  fact_union["MarketID"]  == market_dim["MarketId"],  "left")
    .join(product_dim, fact_union["ProductID"] == product_dim["ProductId"], "left")
)

# ----------------------------------------------------------
# 1d. Aggregate to dashboard-filter grain
# ----------------------------------------------------------
group_cols = [
    "time_frame",
    "Country", "RegionName", "GlobalChannel",
    "GlobalRetailer", "MarketType",
    "Category", "Manufacturer", "Brand", "Segment",
]

agg = enriched.groupBy(group_cols).agg(
    # Sales aggregates
    F.sum("cy_dollar_sales").alias("cy_dollar_sales"),
    F.sum("py_dollar_sales").alias("py_dollar_sales"),
    F.sum("cy_volume_sales").alias("cy_volume_sales"),
    F.sum("py_volume_sales").alias("py_volume_sales"),
    F.sum("cy_unit_sales").alias("cy_unit_sales"),
    F.sum("py_unit_sales").alias("py_unit_sales"),
    F.sum("cy_value_sales").alias("cy_value_sales"),
    F.sum("py_value_sales").alias("py_value_sales"),

    # Distribution numerator — markets with KPIIndicator = 1
    F.countDistinct(
        F.when(F.col("KPIIndicator") == 1, F.col("MarketID"))
    ).alias("dist_present_markets"),

    # Distribution denominator — all distinct markets in this grain
    F.countDistinct("MarketID").alias("total_market_count"),

    # Most recent period month in this grain
    F.max("PeriodMonth").alias("period_month"),
)

# ----------------------------------------------------------
# 1e. Compute totals per time_frame for share calculations
# ----------------------------------------------------------
window_tf = Window.partitionBy("time_frame")

kpi_summary = (
    agg
    # Grand totals (denominator for share KPIs)
    .withColumn("total_cy_dollar_sales", F.sum("cy_dollar_sales").over(window_tf))
    .withColumn("total_cy_volume_sales", F.sum("cy_volume_sales").over(window_tf))

    # ---- YoY Growth % ----
    .withColumn(
        "dollar_sales_yoy_growth_pct",
        F.when(
            F.col("py_dollar_sales") > 0,
            F.round(
                (F.col("cy_dollar_sales") - F.col("py_dollar_sales"))
                / F.col("py_dollar_sales") * 100,
                2,
            ),
        ).otherwise(F.lit(None).cast("double")),
    )
    .withColumn(
        "volume_yoy_growth_pct",
        F.when(
            F.col("py_volume_sales") > 0,
            F.round(
                (F.col("cy_volume_sales") - F.col("py_volume_sales"))
                / F.col("py_volume_sales") * 100,
                2,
            ),
        ).otherwise(F.lit(None).cast("double")),
    )
    .withColumn(
        "unit_yoy_growth_pct",
        F.when(
            F.col("py_unit_sales") > 0,
            F.round(
                (F.col("cy_unit_sales") - F.col("py_unit_sales"))
                / F.col("py_unit_sales") * 100,
                2,
            ),
        ).otherwise(F.lit(None).cast("double")),
    )

    # ---- Share % ----
    .withColumn(
        "dollar_share_pct",
        F.when(
            F.col("total_cy_dollar_sales") > 0,
            F.round(F.col("cy_dollar_sales") / F.col("total_cy_dollar_sales") * 100, 2),
        ).otherwise(F.lit(0.0)),
    )
    .withColumn(
        "volume_share_pct",
        F.when(
            F.col("total_cy_volume_sales") > 0,
            F.round(F.col("cy_volume_sales") / F.col("total_cy_volume_sales") * 100, 2),
        ).otherwise(F.lit(0.0)),
    )

    # ---- Distribution % ----
    .withColumn(
        "distribution_pct",
        F.when(
            F.col("total_market_count") > 0,
            F.round(F.col("dist_present_markets") / F.col("total_market_count") * 100, 2),
        ).otherwise(F.lit(0.0)),
    )

    # ---- Trend Indicator ----
    .withColumn(
        "trend_indicator",
        F.when(F.col("dollar_sales_yoy_growth_pct") > 2,  F.lit("Growing"))
         .when(F.col("dollar_sales_yoy_growth_pct") < -2, F.lit("Declining"))
         .otherwise(F.lit("Stable")),
    )

    # ---- Growth Strength ----
    .withColumn(
        "growth_strength",
        F.when(F.col("dollar_sales_yoy_growth_pct") >= 10,          F.lit("Strong Growth"))
         .when(F.col("dollar_sales_yoy_growth_pct").between(2, 10), F.lit("Moderate Growth"))
         .when(F.col("dollar_sales_yoy_growth_pct").between(-2, 2), F.lit("Stable"))
         .when(F.col("dollar_sales_yoy_growth_pct").between(-10, -2), F.lit("Moderate Decline"))
         .otherwise(F.lit("Strong Decline")),
    )

    # ---- Audit ----
    .withColumn("updated_at", F.current_timestamp())

    # Rename dimension columns to snake_case
    .withColumnRenamed("Country",       "country")
    .withColumnRenamed("RegionName",    "region_name")
    .withColumnRenamed("GlobalChannel", "global_channel")
    .withColumnRenamed("GlobalRetailer","global_retailer")
    .withColumnRenamed("MarketType",    "market_type")
    .withColumnRenamed("Category",      "category")
    .withColumnRenamed("Manufacturer",  "manufacturer")
    .withColumnRenamed("Brand",         "brand")
    .withColumnRenamed("Segment",       "segment")

    # Drop intermediate totals (not needed by Genie — already used for share)
    .drop("total_cy_dollar_sales", "total_cy_volume_sales",
          "dist_present_markets",  "total_market_count")
)

# ----------------------------------------------------------
# 1f. Write to Gold schema as a Delta table
# ----------------------------------------------------------
(
    kpi_summary
    .write
    .format("delta")
    .mode("overwrite")
    .option("overwriteSchema", "true")
    .saveAsTable(f"{gold}.gold_kpi_summary")
)

print(f"✓  gold_kpi_summary written to {gold}.gold_kpi_summary")
kpi_summary.printSchema()
display(kpi_summary.limit(5))

# COMMAND ----------
# MAGIC %md
# MAGIC ## Gold Table 2: `gold_business_context`
# MAGIC
# MAGIC Static reference table — one row per KPI.
# MAGIC Gives Genie the business rules, thresholds, and insight templates it needs
# MAGIC to produce accurate, business-language narratives.

# COMMAND ----------

business_context_schema = StructType([
    StructField("kpi_id",                   StringType(), False),
    StructField("kpi_name",                 StringType(), False),
    StructField("kpi_definition",           StringType(), True),
    StructField("business_meaning",         StringType(), True),
    StructField("calculation_formula",      StringType(), True),
    StructField("source_tables",            StringType(), True),
    StructField("source_columns",           StringType(), True),
    StructField("unit_of_measure",          StringType(), True),
    StructField("threshold_strong_growth",  DoubleType(), True),
    StructField("threshold_moderate_growth",DoubleType(), True),
    StructField("threshold_decline",        DoubleType(), True),
    StructField("insight_template_growth",  StringType(), True),
    StructField("insight_template_decline", StringType(), True),
    StructField("insight_template_stable",  StringType(), True),
    StructField("business_rule",            StringType(), True),
    StructField("genie_guidance",           StringType(), True),
])

# Each tuple = one KPI row
business_context_rows = [

    # ---- Dollar Sales ----
    (
        "KPI_001",
        "Dollar Sales",
        "Sum of CurrentYearDollarSales from r12mfact / qtdfact / ytdfact "
        "joined with marketdimension and productdimension.",
        "Total revenue generated in USD for the selected market/product combination "
        "in the selected time frame. This is the headline revenue KPI.",
        "SUM(CurrentYearDollarSales)",
        "r12mfact, qtdfact, ytdfact",
        "CurrentYearDollarSales, PreviousYearDollarSales",
        "USD",
        10.0,   # strong growth threshold %
        2.0,    # moderate growth threshold %
        -2.0,   # decline threshold %
        "Dollar sales are growing strongly — revenue momentum is positive across channels.",
        "Dollar sales are declining — review pricing, distribution, and competitive activity.",
        "Dollar sales are broadly stable — no significant change vs prior year.",
        "Always compare CY vs PY. Show YoY growth %. Attribute growth to channel or category when possible.",
        "Dollar Sales is the primary revenue metric. Compare CY vs PY and highlight percentage change. "
        "If growing, attribute to channel or category. If declining, recommend investigation of "
        "distribution, pricing, or competitive pressure.",
    ),

    # ---- Volume Sales ----
    (
        "KPI_002",
        "Volume Sales",
        "Sum of CurrentYearVolumeSales — physical quantity sold in kg or equivalent unit.",
        "Physical volume of product sold, independent of price. "
        "Divergence between volume and dollar sales reveals pricing or mix effects.",
        "SUM(CurrentYearVolumeSales)",
        "r12mfact, qtdfact, ytdfact",
        "CurrentYearVolumeSales, PreviousYearVolumeSales",
        "KG or equivalent",
        8.0,
        2.0,
        -2.0,
        "Volume is growing — physical offtake is expanding. Consumers are buying more.",
        "Volume is declining — consumption may be falling or consumers are trading down to smaller pack sizes.",
        "Volume is stable — no significant change in physical offtake.",
        "Compare volume trend against dollar trend. "
        "If dollars grow but volume declines → price-driven growth (premiumisation). "
        "If volume grows but dollars decline → volume-driven share gain at lower price points.",
        "When dollar sales and volume sales diverge, always explain the difference in terms of "
        "pricing or mix effects. This is one of the most valuable insights Genie can surface.",
    ),

    # ---- Dollar Share ----
    (
        "KPI_003",
        "Dollar Share",
        "Filtered CY Dollar Sales ÷ Total CY Dollar Sales across all markets and products × 100.",
        "This segment's percentage contribution to total dollar sales. Measures relative market position.",
        "SUM(filtered.CurrentYearDollarSales) / SUM(total.CurrentYearDollarSales) × 100",
        "r12mfact, marketdimension, productdimension",
        "CurrentYearDollarSales",
        "%",
        1.0,    # +1 percentage point gain = strong
        0.2,    # +0.2 pp = moderate
        -0.2,   # -0.2 pp = decline
        "Dollar share is gaining — this segment is outperforming the total market.",
        "Dollar share is declining — this segment is growing slower than the overall market.",
        "Dollar share is holding — this segment is growing at the same rate as the market.",
        "Dollar share is a relative metric. A gain means this segment grows faster than average.",
        "Always contextualise share within the selected filter context. "
        "If Category=BEVERAGES is selected, share = Beverages' % of total portfolio dollar sales. "
        "Compare share change direction with YoY growth direction.",
    ),

    # ---- Volume Share ----
    (
        "KPI_004",
        "Volume Share",
        "Filtered CY Volume Sales ÷ Total CY Volume Sales across all markets × 100.",
        "This segment's physical volume as a % of total volume sold. "
        "Useful for understanding physical presence vs value presence.",
        "SUM(filtered.CurrentYearVolumeSales) / SUM(total.CurrentYearVolumeSales) × 100",
        "r12mfact, marketdimension, productdimension",
        "CurrentYearVolumeSales",
        "%",
        1.0,
        0.2,
        -0.2,
        "Volume share is gaining — physical presence is expanding.",
        "Volume share is declining — physical presence is shrinking relative to the market.",
        "Volume share is stable.",
        "Compare volume share vs dollar share. "
        "Dollar share > volume share → price premium positioning. "
        "Volume share > dollar share → lower price point positioning.",
        "The gap between volume share and dollar share is a price positioning signal. "
        "Genie should surface this comparison when both KPIs are available.",
    ),

    # ---- Distribution ----
    (
        "KPI_005",
        "Distribution",
        "Count of distinct markets with KPIIndicator = 1 ÷ Total distinct markets × 100.",
        "The percentage of measured market outlets where this product is present and selling. "
        "Distribution is a leading indicator — it precedes sales performance.",
        "COUNT(DISTINCT MarketId WHERE KPIIndicator=1) / COUNT(DISTINCT MarketId) × 100",
        "r12mfact, marketdimension",
        "KPIIndicator, MarketId",
        "%",
        2.0,
        0.5,
        -0.5,
        "Distribution is expanding — the product is gaining presence in new markets.",
        "Distribution is contracting — the product is being de-listed or losing shelf presence.",
        "Distribution is stable.",
        "Distribution above 80% is well-established. Below 50% indicates significant risk or opportunity.",
        "Distribution is a causal metric. "
        "If sales decline AND distribution declines → root cause is likely de-listing. "
        "If sales decline but distribution is stable → root cause is likely rate-of-sale decline. "
        "Always pair distribution insight with a sales trend.",
    ),

    # ---- YoY Growth ----
    (
        "KPI_006",
        "YoY Growth",
        "(CurrentYearDollarSales - PreviousYearDollarSales) ÷ PreviousYearDollarSales × 100.",
        "Year-over-Year percentage change in dollar sales. "
        "The primary performance diagnostic — tells whether the business is growing or shrinking "
        "vs the same period last year.",
        "(SUM(CY_Dollar_Sales) - SUM(PY_Dollar_Sales)) / SUM(PY_Dollar_Sales) × 100",
        "r12mfact, qtdfact, ytdfact",
        "CurrentYearDollarSales, PreviousYearDollarSales",
        "%",
        10.0,
        2.0,
        -2.0,
        "Strong year-on-year growth — the business is in a positive momentum phase.",
        "Year-on-year decline — the business is underperforming vs prior year. Investigate root causes.",
        "Year-on-year performance is broadly flat.",
        "Growth above 10% is strong. 2–10% is moderate. -2% to +2% is stable. Below -2% requires investigation.",
        "When YoY growth is negative, Genie should investigate and surface possible causes: "
        "channel performance decline, distribution loss, competitive pressure, or pricing erosion. "
        "When YoY growth is strongly positive, attribute to the strongest-performing channel, "
        "country, or category in the filtered data.",
    ),
]

business_context_df = (
    spark.createDataFrame(business_context_rows, business_context_schema)
    .withColumn("updated_at", F.current_timestamp())
)

(
    business_context_df
    .write
    .format("delta")
    .mode("overwrite")
    .option("overwriteSchema", "true")
    .saveAsTable(f"{gold}.gold_business_context")
)

print(f"✓  gold_business_context written to {gold}.gold_business_context")
display(business_context_df)

# COMMAND ----------
# MAGIC %md
# MAGIC ## Verification

# COMMAND ----------

print("=== gold_kpi_summary ===")
spark.sql(f"SELECT COUNT(*) AS row_count FROM {gold}.gold_kpi_summary").show()
spark.sql(f"""
    SELECT time_frame, COUNT(*) AS rows
    FROM {gold}.gold_kpi_summary
    GROUP BY time_frame
    ORDER BY time_frame
""").show()

print("=== gold_business_context ===")
spark.sql(f"SELECT kpi_id, kpi_name, unit_of_measure FROM {gold}.gold_business_context").show()

# COMMAND ----------
# MAGIC %md
# MAGIC ## Next Step — Genie Space Setup
# MAGIC
# MAGIC Add these two tables to your Genie Space:
# MAGIC
# MAGIC 1. `workspace.gold.gold_kpi_summary`  — Genie's primary data source
# MAGIC 2. `workspace.gold.gold_business_context` — Genie's business knowledge base
# MAGIC
# MAGIC Suggested Genie Space instructions:
# MAGIC > "You are a CPG/FMCG business analyst. Use gold_kpi_summary for metrics and
# MAGIC > gold_business_context for KPI definitions and thresholds.
# MAGIC > Always compare current year vs prior year. Explain trends in business language.
# MAGIC > When performance is negative, suggest root cause investigation areas."
