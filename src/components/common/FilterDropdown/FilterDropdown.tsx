import React from "react";
import {
  makeStyles,
  tokens,
  Select,
  Spinner,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  pill: {
    display: "flex",
    alignItems: "center",
    gap: "0px",
    borderRadius: "20px",
    overflow: "hidden",
    border: `1.5px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    transition: "box-shadow 0.15s",
    ":hover": {
      boxShadow: tokens.shadow4,
    },
  },
  pillActive: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
  },
  label: {
    padding: "5px 0 5px 14px",
    fontSize: "12.5px",
    fontWeight: "600",
    color: tokens.colorNeutralForeground3,
    whiteSpace: "nowrap",
    userSelect: "none",
  },
  select: {
    border: "none",
    backgroundColor: "transparent",
    minWidth: "100px",
    "& select": {
      border: "none",
      paddingLeft: "4px",
    },
  },
  close: {
    marginRight: "6px",
    cursor: "pointer",
    color: tokens.colorNeutralForeground3,
    display: "flex",
    alignItems: "center",
    ":hover": {
      color: tokens.colorStatusDangerForeground1,
    },
  },
});

export interface FilterDropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  /** Value that represents "no filter applied" — defaults to 'ALL' */
  defaultValue?: string;
  /** When true, the option list is still loading — show a loading state. */
  loading?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  defaultValue = "ALL",
  loading = false,
}) => {
  const styles = useStyles();
  const active = value !== defaultValue;
  const displayLabel = options.find((o) => o.value === value)?.label ?? value;

  if (loading) {
    return (
      <div className={styles.pill}>
        <span className={styles.label}>
          {label}:{" "}
          <strong style={{ color: tokens.colorNeutralForeground3 }}>
            <Spinner size="extra-tiny" label="Loading…" labelPosition="after" />
          </strong>
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.pill} ${active ? styles.pillActive : ""}`}>
      <span className={styles.label}>
        {label}:{" "}
        <strong
          style={{
            color: active
              ? tokens.colorBrandForeground1
              : tokens.colorNeutralForeground1,
          }}
        >
          {active ? displayLabel : "All"}
        </strong>
      </span>

      <Select
        className={styles.select}
        size="small"
        value={value}
        onChange={(_, d) => onChange(d.value)}
        appearance="underline"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>

      {active && (
        <span
          className={styles.close}
          role="button"
          tabIndex={0}
          onClick={() => onChange(defaultValue)}
          onKeyDown={(e) => e.key === "Enter" && onChange(defaultValue)}
          aria-label={`Clear ${label} filter`}
        >
          <DismissRegular fontSize={14} />
        </span>
      )}
    </div>
  );
};

export { FilterDropdown };
