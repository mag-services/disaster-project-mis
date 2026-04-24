/**
 * Highcharts theme: clean, minimal design matching reference aesthetic.
 * White background, extremely subtle grid, ample whitespace, legend on right.
 */
import { useMemo } from "react";
import type Highcharts from "highcharts";
import { useColorMode } from "@/components/ui/color-mode";
import { chartColors } from "@/components/colors";

const LIGHT = {
  chartBg: "#ffffff",
  text: "#1a1a1a",
  mutedText: "#5f7d95",
  gridLine: "rgba(0,0,0,0.05)",
  axisLine: "rgba(0,0,0,0.06)",
  tooltipBg: "#ffffff",
  tooltipBorder: "#d1d9e0",
  tooltipText: "#1a1a1a",
} as const;

const DARK = {
  chartBg: "transparent",
  text: "#e8ecf0",
  mutedText: "#8fb3cc",
  gridLine: "rgba(255,255,255,0.05)",
  axisLine: "rgba(255,255,255,0.06)",
  tooltipBg: "#122536",
  tooltipBorder: "#2a4a5f",
  tooltipText: "#e8ecf0",
} as const;

export function useHighchartsTheme(): Highcharts.Options {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";
  const c = isDark ? DARK : LIGHT;

  return useMemo(
    (): Highcharts.Options => ({
      accessibility: { enabled: false },
      chart: {
        backgroundColor: c.chartBg,
        style: { fontFamily: "var(--font-sans)" },
        spacing: [24, 20, 20, 24],
        plotBorderWidth: 0,
      },
      colors: [...chartColors],
      title: { style: { color: c.text, fontSize: "14px", fontWeight: "600" } },
      subtitle: { style: { color: c.mutedText, fontSize: "11px" } },
      xAxis: {
        lineColor: c.axisLine,
        tickColor: c.axisLine,
        lineWidth: 1,
        tickLength: 4,
        labels: { style: { color: c.mutedText, fontSize: "11px" } },
        title: { style: { color: c.text, fontSize: "11px" } },
        gridLineWidth: 0,
      },
      yAxis: {
        lineColor: c.axisLine,
        tickColor: c.axisLine,
        lineWidth: 1,
        tickLength: 4,
        labels: { style: { color: c.mutedText, fontSize: "11px" } },
        title: { style: { color: c.text, fontSize: "11px" } },
        gridLineColor: c.gridLine,
        gridLineWidth: 1,
      },
      legend: {
        itemStyle: { color: c.text, fontSize: "11px" },
        itemHoverStyle: { color: c.text },
        itemDistance: 12,
        symbolRadius: 4,
      },
      tooltip: {
        backgroundColor: c.tooltipBg,
        borderColor: c.tooltipBorder,
        borderWidth: 1,
        style: { color: c.tooltipText, fontSize: "12px" },
        borderRadius: 6,
        shadow: false,
        padding: 10,
      },
      plotOptions: {
        series: { borderWidth: 0 },
        bar: { borderWidth: 0, pointPadding: 0.1, groupPadding: 0.15 },
        line: {
          lineWidth: 2,
          marker: { radius: 4, symbol: "circle", lineWidth: 1, lineColor: "#ffffff" },
        },
        pie: { borderWidth: 0 },
      },
      credits: { enabled: false },
    }),
    [isDark],
  );
}
