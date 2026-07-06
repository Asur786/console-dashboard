import React from 'react';
import { makeStyles, tokens, Label, Select } from '@fluentui/react-components';

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '130px',
  },
  label: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: tokens.colorNeutralForeground3,
  },
});

interface SelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

const FilterSelect: React.FC<FilterSelectProps> = ({ id, label, value, options, onChange }) => {
  const styles = useStyles();

  return (
    <div className={styles.wrapper}>
      <Label htmlFor={id} className={styles.label}>{label}</Label>
      <Select
        id={id}
        value={value}
        size="small"
        onChange={(_, data) => onChange(data.value)}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </Select>
    </div>
  );
};

export { FilterSelect };
