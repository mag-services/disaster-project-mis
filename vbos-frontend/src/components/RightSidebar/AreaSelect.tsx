import { useEffect, useMemo, startTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";
import useAreaCouncils from "@/hooks/useAreaCouncils";
import { useAreaStore } from "@/store/area-store";
import { useUiStore } from "@/store/ui-store";
import { featureCollection } from "@turf/helpers";
import { cn } from "@/lib/utils";

const PROVINCES = [
  "Malampa",
  "Penama",
  "Sanma",
  "Shefa",
  "Tafea",
  "Torba",
];

const AreaSelect = () => {
  const { provinces, acList, setProvinces, setAcList, setAcGeoJSON } =
    useAreaStore();
  const rightSidebarExpanded = useUiStore((s) => s.rightSidebarExpanded);
  const { data: areaCouncils, isPending: areaCouncilsIsLoading } =
    useAreaCouncils(provinces);

  const areaCouncilOptions = useMemo(
    () => areaCouncils?.features.map((i) => i.properties?.name as string) ?? [],
    [areaCouncils],
  );

  useEffect(() => {
    if (!areaCouncils) {
      setAcGeoJSON(featureCollection([]));
      return;
    }
    if (acList.length === 0) {
      setAcGeoJSON(areaCouncils);
    } else {
      const filtered = {
        ...areaCouncils,
        features: areaCouncils.features.filter((f) =>
          acList.includes((f.properties?.name as string) ?? ""),
        ),
      };
      setAcGeoJSON(filtered);
    }
  }, [areaCouncils, acList, setAcGeoJSON]);

  const toggleProvince = (p: string) => {
    startTransition(() => {
      const next = provinces.includes(p)
        ? provinces.filter((x) => x !== p)
        : [...provinces, p];
      setProvinces(next);
    });
  };

  const toggleAc = (name: string) => {
    startTransition(() => {
      const next = acList.includes(name)
        ? acList.filter((x) => x !== name)
        : [...acList, name];
      setAcList(next);
    });
  };

  const provinceLabel =
    provinces.length === 0
      ? "Select provinces"
      : provinces.length <= 2
        ? provinces.join(", ")
        : `${provinces.length} provinces`;

  const acLabel =
    acList.length === 0
      ? "Select area councils"
      : acList.length <= 2
        ? acList.join(", ")
        : `${acList.length} area councils`;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Administrative Area
      </h3>
      <div
        className={cn(
          rightSidebarExpanded ? "grid grid-cols-2 gap-4" : "space-y-2",
        )}
      >
        <div className="space-y-2">
          <Label>Province</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="glass-select-trigger w-full justify-between"
              >
                <span className="truncate">{provinceLabel}</span>
                <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)]">
              {PROVINCES.map((p) => (
                <DropdownMenuCheckboxItem
                  key={p}
                  checked={provinces.includes(p)}
                  onCheckedChange={() => toggleProvince(p)}
                >
                  {p}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {provinces.length > 0 && (
          <div className={cn("space-y-2", !rightSidebarExpanded && "pt-2")}>
            <Label>Area Council</Label>
            {areaCouncilsIsLoading ? (
              <div
                className="space-y-2"
                role="status"
                aria-label="Loading area councils"
              >
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="glass-select-trigger w-full justify-between"
                  >
                    <span className="truncate">{acLabel}</span>
                    <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)]">
                  {areaCouncilOptions.map((name) => (
                    <DropdownMenuCheckboxItem
                      key={name}
                      checked={acList.includes(name)}
                      onCheckedChange={() => toggleAc(name)}
                    >
                      {name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { AreaSelect };
