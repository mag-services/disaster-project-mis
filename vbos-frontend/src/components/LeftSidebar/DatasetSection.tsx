import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LayerSwitch } from "./LayerSwitch";
import { Dataset } from "@/types/api";
import { DATASET_TYPES } from "@/utils/datasetTypes";
import { useActiveLayerCount } from "@/hooks/useActiveLayerCount";
import { cn } from "@/lib/utils";

type DatasetSectionProps = {
  title:
    | "baseline"
    | "estimated_damage"
    | "aid_resources_needed"
    | "estimate_financial_damage";
  datasets: Dataset[];
};

export function DatasetSection({ title, datasets }: DatasetSectionProps) {
  const activeLayerCount = useActiveLayerCount(datasets);

  return (
    <AccordionItem
      value={title}
      className={cn(
        "rounded-lg border-0 bg-muted/30",
        "data-[state=open]:bg-muted/50",
      )}
    >
      <AccordionTrigger
        className={cn(
          "px-3 py-2 text-sm font-normal [&>svg]:shrink-0 [&>svg]:transition-transform [&>svg]:duration-200",
          "hover:no-underline hover:bg-muted/40",
          "rounded-md",
        )}
      >
        <span className="flex items-center gap-2">
          <span>{DATASET_TYPES[title]}</span>
          {activeLayerCount > 0 && (
            <span
              className={cn(
                "shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary",
                "text-primary",
              )}
            >
              {activeLayerCount}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-1.5 px-3 pb-2 pt-0">
          {datasets.map((dataset) => (
            <LayerSwitch
              key={`${dataset.dataType}-${dataset.id}`}
              dataType={dataset.dataType}
              id={dataset.id}
              title={dataset.name}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
