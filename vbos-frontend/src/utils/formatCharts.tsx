/** Compact format for large numbers (e.g. 27.9B, 1.2M) - for KPI cards, headers */
export function formatCompactNumber(value: number): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs < 1000) return `${sign}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (abs < 1e6) return `${sign}${(value / 1e3).toFixed(1)}K`;
  if (abs < 1e9) return `${sign}${(value / 1e6).toFixed(1)}M`;
  return `${sign}${(value / 1e9).toFixed(1)}B`;
}

// Custom formatter for Y-axis (format large numbers)
export const formatYAxisLabel = (value: number, key?: string) => {
  // Check if the axis key is 'year' to prevent special formatting
  if (key?.toString().toLowerCase() === "year") {
    return value.toString();
  }

  if (value === 0) {
    return "0";
  }
  if (Number(value)) {
    if (Math.abs(value) < 1000) return value.toLocaleString();
    if (Math.abs(value) < 1e6) return `${(value / 1e3).toFixed(1)}K`;
    if (Math.abs(value) < 1e9) return `${(value / 1e6).toFixed(1)}M`;
    return `${(value / 1e9).toFixed(1)}B`;
  }
  return value.toString();
};
