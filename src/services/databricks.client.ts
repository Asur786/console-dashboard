import axios from 'axios';
import type { SqlParam } from './sql-builder';

/**
 * Databricks SQL Statement Execution API client.
 *
 * Required env vars (set in .env):
 *   VITE_DATABRICKS_HOST        e.g. https://adb-123456789.0.azuredatabricks.net
 *   VITE_DATABRICKS_TOKEN       Personal Access Token or Service Principal token
 *   VITE_DATABRICKS_WAREHOUSE   SQL Warehouse ID
 *   VITE_DATABRICKS_CATALOG     Unity Catalog name  (default: "main")
 *   VITE_DATABRICKS_SCHEMA      Schema / database   (default: "default")
 */

const DATABRICKS_HOST      = import.meta.env.VITE_DATABRICKS_HOST      ?? '';
const DATABRICKS_TOKEN     = import.meta.env.VITE_DATABRICKS_TOKEN     ?? '';
const DATABRICKS_WAREHOUSE = import.meta.env.VITE_DATABRICKS_WAREHOUSE ?? '';
const DATABRICKS_CATALOG   = import.meta.env.VITE_DATABRICKS_CATALOG   ?? 'main';
const DATABRICKS_SCHEMA    = import.meta.env.VITE_DATABRICKS_SCHEMA    ?? 'default';

/** Whether the Databricks connection is configured. */
export function isDatabricksConfigured(): boolean {
  return !!(DATABRICKS_HOST && DATABRICKS_TOKEN && DATABRICKS_WAREHOUSE);
}

const client = axios.create({
  baseURL: DATABRICKS_HOST ? `${DATABRICKS_HOST}/api/2.0` : undefined,
  timeout: 30_000,
  headers: {
    Authorization: `Bearer ${DATABRICKS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

/* ------------------------------------------------------------------ */
/*  Databricks SQL Statement Execution API types                      */
/* ------------------------------------------------------------------ */
interface SqlColumn {
  name: string;
  type_name: string;
}

interface SqlStatementResponse {
  status: { state: string };
  manifest: { schema: { columns: SqlColumn[] } };
  result: { data_array: string[][] };
}

export interface SqlRow {
  [column: string]: string | number | null;
}

/* ------------------------------------------------------------------ */
/*  executeQuery                                                       */
/* ------------------------------------------------------------------ */
/**
 * Execute a SQL statement against the configured Databricks SQL Warehouse
 * and return typed rows.
 *
 * Supports Databricks native parameters (`:paramName` placeholders).
 * Each row is an object keyed by column alias.
 * Numeric columns are parsed from their string representation.
 */
export async function executeQuery(
  sql: string,
  params: SqlParam[] = [],
): Promise<SqlRow[]> {
  const body: Record<string, unknown> = {
    warehouse_id: DATABRICKS_WAREHOUSE,
    catalog: DATABRICKS_CATALOG,
    schema: DATABRICKS_SCHEMA,
    statement: sql,
    wait_timeout: '30s',
    disposition: 'INLINE',
    format: 'JSON_ARRAY',
  };

  if (params.length > 0) {
    body.parameters = params.map(p => ({
      name: p.name,
      value: p.value,
      type: p.type,
    }));
  }

  const response = await client.post<SqlStatementResponse>(
    '/sql/statements',
    body,
  );

  const { status, manifest, result } = response.data;

  if (status.state !== 'SUCCEEDED') {
    throw new Error(`Databricks query failed with state: ${status.state}`);
  }

  const columns = manifest.schema.columns;
  const numericTypes = new Set([
    'DECIMAL', 'DOUBLE', 'FLOAT', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'LONG',
  ]);

  return result.data_array.map(row => {
    const obj: SqlRow = {};
    columns.forEach((col, i) => {
      const raw = row[i];
      if (raw === null || raw === undefined) {
        obj[col.name] = null;
      } else if (numericTypes.has(col.type_name.toUpperCase())) {
        obj[col.name] = Number(raw);
      } else {
        obj[col.name] = raw;
      }
    });
    return obj;
  });
}
