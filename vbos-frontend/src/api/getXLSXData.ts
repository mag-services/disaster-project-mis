import { BlobType } from "@/types/data";
import * as HTTP from "./http";

/**
 * Downloads tabular dataset as XLSX file using the dedicated endpoint
 * @param id - The dataset ID
 * @param filters - Optional query parameters for filtering data
 * @returns Object containing blob, file extension, and MIME type
 */
export async function getXLSXData(
  id: number,
  filters?: URLSearchParams,
): Promise<BlobType> {
  const queryString = filters ? new URLSearchParams(filters).toString() : "";
  const url = `/api/v1/tabular/${id}/data-xlsx/${queryString ? `?${queryString}` : ""}`;

  const response = await HTTP.get(url);
  if (!response.ok) throw new Error(`Unable to fetch data from ${url}`);

  const blob = await response.blob();
  return {
    blob,
    extension: "xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
