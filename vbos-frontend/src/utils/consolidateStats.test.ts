import { expect, test } from "vitest";
import * as tabularData from "./fixtures/tabularData.json";
import { consolidateStats } from "./consolidateStats";

test("consolidateStats", () => {
  expect(consolidateStats(tabularData.results, "province")).toEqual([
    { place: "MALAMPA", ecce: 104, primary: 71, secondary: 22 },
    { place: "SHEFA", ecce: 391, primary: 383, secondary: 165 },
    { place: "TAFEA", ecce: 334, primary: 221, secondary: 70 },
  ]);
});
