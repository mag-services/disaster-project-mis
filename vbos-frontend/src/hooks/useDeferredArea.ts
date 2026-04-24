/**
 * Returns deferred province/ac and provinces/acList so heavy consumers (charts, map)
 * don't block the select UI. province/ac are first of array for backward compat.
 */
import { useDeferredValue } from "react";
import { useAreaStore } from "@/store/area-store";

export function useDeferredArea() {
  const province = useAreaStore((s) => s.province);
  const ac = useAreaStore((s) => s.ac);
  const provinces = useAreaStore((s) => s.provinces);
  const acList = useAreaStore((s) => s.acList);
  const deferredProvince = useDeferredValue(province);
  const deferredAc = useDeferredValue(ac);
  const deferredProvinces = useDeferredValue(provinces);
  const deferredAcList = useDeferredValue(acList);
  return {
    province: deferredProvince,
    ac: deferredAc,
    provinces: deferredProvinces,
    acList: deferredAcList,
  };
}
