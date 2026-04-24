import { TabularData } from "@/types/api";
import { getAttributes } from "./getAttributes";

type TimeSeriesDataPoint = {
  [key: string]: number | string | undefined;
  date: string;
  year: string;
  month?: string;
};

/**
 * Checks if the dataset has monthly variation (i.e., different months present).
 * Returns true if there are at least 2 different months in the dataset.
 *
 * @param data - Array of TabularData to check
 * @returns true if monthly variation exists, false if data is yearly only
 */
export function hasMonthlyVariation(data: TabularData[]): boolean {
  if (data.length === 0) return false;

  const uniqueMonths = new Set<string>();

  for (const item of data) {
    // Extract month from date (format: "2024-01-01" -> "01")
    const month = item.date.split("-")[1];
    uniqueMonths.add(month);

    // Early exit if we find variation
    if (uniqueMonths.size >= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Consolidates tabular data into time series format for line charts.
 * Groups by year or by month based on user preference and data availability.
 *
 * Note: The data should already be filtered by administrative area before
 * being passed to this function (e.g., via API filters).
 *
 * @param data - Array of TabularData to consolidate (pre-filtered by area if needed)
 * @param forceMonthly - If true, force monthly grouping (only works if data has monthly variation)
 * @returns Array of data points with date as x-axis and attributes as y-axis values
 *
 * @example
 * // Yearly data: [{ year: "2020", date: "2020-01-01", ecce: 1000, primary: 800 }, ...]
 * // Monthly data: [{ year: "2020", month: "2020-01", date: "2020-01-01", ecce: 100, primary: 80 }, ...]
 * consolidateTimeSeries(data, true)
 */
export function consolidateTimeSeries(
  data: TabularData[],
  forceMonthly = false,
): TimeSeriesDataPoint[] {
  const filteredData = data;
  const hasMonthly = hasMonthlyVariation(filteredData);
  // Use monthly grouping if forced AND data has monthly variation
  const isMonthly = forceMonthly && hasMonthly;

  // Group data by appropriate time period
  const timeMap = new Map<string, TabularData[]>();
  filteredData.forEach((item) => {
    // Use full date for monthly, year only for yearly
    const timeKey = isMonthly
      ? item.date.substring(0, 7) // "2024-01" for monthly
      : item.date.split("-")[0];   // "2024" for yearly

    if (!timeMap.has(timeKey)) {
      timeMap.set(timeKey, []);
    }
    timeMap.get(timeKey)!.push(item);
  });

  // Get all unique attributes
  const attributes = getAttributes(filteredData);

  // Build time series data points
  const timeSeries: TimeSeriesDataPoint[] = [];

  // Sort time periods chronologically
  const sortedTimes = Array.from(timeMap.keys()).sort();

  sortedTimes.forEach((timeKey) => {
    const timeData = timeMap.get(timeKey)!;

    // Use the actual date from the first data point in this time period
    const actualDate = timeData[0].date;

    const dataPoint: TimeSeriesDataPoint = isMonthly
      ? {
        year: timeKey.split("-")[0],
        month: timeKey,
        date: actualDate,
      }
      : {
        year: timeKey,
        date: actualDate,
      };

    // Calculate sum for each attribute in this time period
    attributes.forEach((attr) => {
      const sum = timeData
        .filter((item) => item.attribute === attr)
        .reduce((total, item) => total + (item.value || 0), 0);
      dataPoint[attr] = sum;
    });

    timeSeries.push(dataPoint);
  });

  return timeSeries;
}
