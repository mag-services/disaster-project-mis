import { expect, test } from "vitest";
import {
  getAreaCouncilAttributeValueSum,
  getAttributes,
  getAttributeValueSum,
  getProvinceAttributeValueSum,
} from "./getAttributes";
import * as tabularData from "./fixtures/tabularData.json";

test("getAttributes returns the correct value", () => {
  expect(getAttributes(tabularData.results)).toEqual([
    "ecce",
    "primary",
    "secondary",
  ]);
});

test("getAttributeValueSum returns the correct value", () => {
  expect(getAttributeValueSum(tabularData.results, "ecce")).toEqual(2232);
  expect(getAttributeValueSum(tabularData.results, "primary")).toEqual(1735);
});

test("getProvinceAttributeValueSum returns the correct value", () => {
  expect(
    getProvinceAttributeValueSum(tabularData.results, "TAFEA", "ecce"),
  ).toEqual(334);
  expect(
    getProvinceAttributeValueSum(tabularData.results, "MALAMPA", "primary"),
  ).toEqual(71);
});

test("getAreaCouncilAttributeValueSum returns the correct value", () => {
  expect(
    getAreaCouncilAttributeValueSum(
      tabularData.results,
      "North West Malekula",
      "ecce",
    ),
  ).toEqual(11);
  expect(
    getAreaCouncilAttributeValueSum(
      tabularData.results,
      "North West Malekula",
      "primary",
    ),
  ).toEqual(8);
});
