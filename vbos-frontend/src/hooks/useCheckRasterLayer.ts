import { useEffect, useState } from "react";

/**
 * Best-effort check that TiTiler can serve a raster for this dataset/year.
 * We probe a real tile URL — not `/tiles?f=json` (often 404 on vbos-titiler / titiler-local).
 * When using precomputed tiles, the check is skipped.
 */
export function useCheckRasterLayer(
  datasetUrlId: string,
  year: string,
  isPrecomputed = false,
) {
  const [isLoading, setIsloading] = useState(false);
  const [error, setError] = useState(false);
  const base = import.meta.env.VITE_TITILER_API ?? "";
  // z=0 single world tile — valid for WebMercatorQuad; confirms path + file exist
  const probeUrl = `${base}/dataset/${datasetUrlId}/years/${year}/tiles/WebMercatorQuad/0/0/0.png`;

  useEffect(() => {
    if (isPrecomputed) {
      setError(false);
      setIsloading(false);
      return;
    }
    if (!datasetUrlId || !base) {
      setError(true);
      setIsloading(false);
      return;
    }
    setIsloading(true);
    fetch(probeUrl, { method: "GET", cache: "no-store" })
      .then((res) => {
        setError(!res.ok);
        setIsloading(false);
      })
      .catch(() => {
        setError(true);
        setIsloading(false);
      });
  }, [probeUrl, isPrecomputed, datasetUrlId, base]);

  return { error: isPrecomputed ? false : error, isLoading: isPrecomputed ? false : isLoading };
}
