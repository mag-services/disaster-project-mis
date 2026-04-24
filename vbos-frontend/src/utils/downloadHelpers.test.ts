import { expect, test } from "vitest";
import { getRasterFileUrl, sanitizeFilename } from "./downloadHelpers";

test("getRasterFileUrl returns correct URL", () => {
  expect(getRasterFileUrl("ngbi", 2024)).toBe(
    "https://syd1.digitaloceanspaces.com/mis-geotiff-storage/production/raster/ngbi_2024.vrt",
  );
});

test("sanitizeFilename returns correct string", () => {
  expect(sanitizeFilename("Number Schools 2024")).toBe("Number_Schools_2024");
});
