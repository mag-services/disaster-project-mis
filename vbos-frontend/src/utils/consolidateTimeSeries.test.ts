import { expect, test } from "vitest";
import * as tabularData from "./fixtures/tabularData.json";
import { consolidateTimeSeries } from "./consolidateTimeSeries";

test("consolidateTimeSeries", () => {
  expect(consolidateTimeSeries(tabularData.results)).toEqual([
    {date: "2022-02-01", ecce: 712, primary: 551, secondary: 186, year: "2022"},
    {date: "2023-02-01", ecce: 1520, primary: 1184, secondary: 402, year: "2023"}
  ]);
});
