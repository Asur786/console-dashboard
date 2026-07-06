/**
 * Formats a date string into a readable format.
 */
export const formatDate = (date: string | Date, locale = 'en-US'): string => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Formats a number as a currency string.
 */
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Truncates a string to a given length and appends an ellipsis.
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
};

/**
 * Returns initials from a full name (up to 2 characters).
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};
