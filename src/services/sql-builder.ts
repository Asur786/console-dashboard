/**
 * Generic SQL Query Builder with parameterized conditions.
 *
 * Produces a SQL string plus a parameter map compatible with the
 * Databricks SQL Statement Execution API's `parameters` field.
 *
 * Usage:
 *   const { sql, params } = new SqlQueryBuilder()
 *     .select(['SUM(f.CurrentYearDollarSales) AS cy_dollar_sales'])
 *     .from('r12mfact f')
 *     .join('marketdimension m', 'f.MarketID = m.MarketId')
 *     .join('productdimension p', 'f.ProductID = p.ProductId')
 *     .whereIf(channel, 'm.GlobalChannel', channel)
 *     .whereIf(category, 'p.Category', category)
 *     .build();
 */

/* ------------------------------------------------------------------ */
/*  Databricks native parameter type                                   */
/* ------------------------------------------------------------------ */
export interface SqlParam {
  name: string;
  value: string;
  type: 'STRING' | 'INT' | 'DOUBLE' | 'DECIMAL' | 'BOOLEAN';
}

/* ------------------------------------------------------------------ */
/*  Build result                                                       */
/* ------------------------------------------------------------------ */
export interface SqlBuildResult {
  /** The SQL string with `:paramName` placeholders */
  sql: string;
  /** Parameter array for the Databricks API */
  params: SqlParam[];
}

/* ------------------------------------------------------------------ */
/*  Builder                                                            */
/* ------------------------------------------------------------------ */
export class SqlQueryBuilder {
  private _selects: string[]  = [];
  private _from    = '';
  private _joins: string[]    = [];
  private _wheres: string[]   = [];
  private _groupBy: string[]  = [];
  private _orderBy: string[]  = [];
  private _limit?: number;
  private _params: SqlParam[] = [];
  private _paramIdx           = 0;

  /* ---- SELECT ---------------------------------------------------- */
  select(columns: string[]): this {
    this._selects.push(...columns);
    return this;
  }

  /* ---- FROM ------------------------------------------------------ */
  from(table: string): this {
    this._from = table;
    return this;
  }

  /* ---- JOIN ------------------------------------------------------ */
  join(table: string, on: string, type: 'JOIN' | 'LEFT JOIN' | 'CROSS JOIN' = 'JOIN'): this {
    this._joins.push(`${type} ${table} ON ${on}`);
    return this;
  }

  crossJoin(table: string): this {
    this._joins.push(`CROSS JOIN ${table}`);
    return this;
  }

  /* ---- WHERE (always added) -------------------------------------- */
  where(condition: string): this {
    this._wheres.push(condition);
    return this;
  }

  /**
   * Add a parameterized equality condition.
   * Always included in the WHERE clause.
   */
  whereEquals(column: string, value: string, type: SqlParam['type'] = 'STRING'): this {
    const name = this._nextParam();
    this._wheres.push(`${column} = :${name}`);
    this._params.push({ name, value, type });
    return this;
  }

  /**
   * Add a parameterized equality condition **only** when `value` is
   * truthy and not the sentinel `'ALL'`.
   *
   * This is the primary method for dashboard filters — empty/ALL
   * filters are silently skipped, producing no WHERE predicate.
   */
  whereIf(
    value: string | undefined | null,
    column: string,
    type: SqlParam['type'] = 'STRING',
  ): this {
    if (!value || value === 'ALL') return this;
    return this.whereEquals(column, value, type);
  }

  /* ---- GROUP BY -------------------------------------------------- */
  groupBy(columns: string[]): this {
    this._groupBy.push(...columns);
    return this;
  }

  /* ---- ORDER BY -------------------------------------------------- */
  orderBy(column: string, dir: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBy.push(`${column} ${dir}`);
    return this;
  }

  /* ---- LIMIT ----------------------------------------------------- */
  limit(n: number): this {
    this._limit = n;
    return this;
  }

  /* ---- RAW CTE prefix -------------------------------------------- */
  private _ctes: string[] = [];
  withCte(name: string, body: string): this {
    this._ctes.push(`${name} AS (\n${body}\n)`);
    return this;
  }

  /* ---- BUILD ----------------------------------------------------- */
  build(): SqlBuildResult {
    const parts: string[] = [];

    if (this._ctes.length) {
      parts.push(`WITH ${this._ctes.join(',\n')}`);
    }

    parts.push(`SELECT\n  ${this._selects.join(',\n  ')}`);
    parts.push(`FROM ${this._from}`);

    if (this._joins.length) {
      parts.push(this._joins.join('\n'));
    }

    if (this._wheres.length) {
      parts.push(`WHERE ${this._wheres.join('\n  AND ')}`);
    }

    if (this._groupBy.length) {
      parts.push(`GROUP BY ${this._groupBy.join(', ')}`);
    }

    if (this._orderBy.length) {
      parts.push(`ORDER BY ${this._orderBy.join(', ')}`);
    }

    if (this._limit !== undefined) {
      parts.push(`LIMIT ${this._limit}`);
    }

    return {
      sql: parts.join('\n'),
      params: [...this._params],
    };
  }

  /* ---- internals ------------------------------------------------- */
  private _nextParam(): string {
    return `p${++this._paramIdx}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Convenience: build a filtered query in one call                    */
/* ------------------------------------------------------------------ */
export interface DashboardFilterInput {
  channel?:  string;
  category?: string;
  retailer?: string;
  country?:  string;
}

/**
 * Applies the standard four dashboard filter predicates to a builder.
 * Skips any filter set to `'ALL'` or `undefined`.
 */
export function applyDashboardFilters(
  builder: SqlQueryBuilder,
  filters: DashboardFilterInput,
): SqlQueryBuilder {
  return builder
    .whereIf(filters.channel,  'm.GlobalChannel')
    .whereIf(filters.category, 'p.Category')
    .whereIf(filters.retailer, 'm.GlobalRetailer')
    .whereIf(filters.country,  'm.Country');
}
