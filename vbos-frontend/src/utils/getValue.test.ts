import { expect, test } from "vitest";
import { getAreaCouncilValue, getProvinceValue } from "./getValue";
import * as tabularData from "./fixtures/tabularData.json";

test("getProvinceValue", () => {
  expect(getProvinceValue(tabularData.results, "MALAMPA")).toEqual(197);
});

test("getAreaCouncilValue", () => {
  expect(getAreaCouncilValue(tabularData.results, "Central Malekula")).toEqual(
    17,
  );
});
