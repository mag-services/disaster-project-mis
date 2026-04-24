import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import API from "@/api";
import { createIncidentAlert } from "@/api/createIncidentAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/utils/toast";
import { LuChevronLeft, LuChevronRight, LuLoader, LuUpload, LuX } from "react-icons/lu";

type AlertType =
  | "cyclone"
  | "earthquake"
  | "flood"
  | "volcano"
  | "weather"
  | "hazard"
  | "wildfire"
  | "drought"
  | "operational";
type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

const ALERT_TYPES: { value: AlertType; label: string }[] = [
  { value: "cyclone", label: "Cyclone" },
  { value: "earthquake", label: "Earthquake" },
  { value: "flood", label: "Flood" },
  { value: "volcano", label: "Volcano" },
  { value: "weather", label: "Weather" },
  { value: "hazard", label: "General hazard" },
  { value: "wildfire", label: "Wildfire" },
  { value: "drought", label: "Drought" },
  { value: "operational", label: "Operational update" },
];

const ALERT_SEVERITIES: { value: AlertSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "info", label: "Info" },
];

interface NewIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewIncidentDialog({ open, onOpenChange }: NewIncidentDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<AlertType>("cyclone");
  const [severity, setSeverity] = useState<AlertSeverity>("high");
  const [province, setProvince] = useState<string>("");
  const [areaCouncil, setAreaCouncil] = useState<string>("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: provincesGeoJson } = useQuery({
    queryKey: ["incident-provinces"],
    queryFn: () => API.getProvinces(),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const { data: areaCouncilsGeoJson } = useQuery({
    queryKey: ["incident-area-councils", province],
    queryFn: () => API.getAreaCouncils(province),
    enabled: open && !!province,
    staleTime: 5 * 60_000,
  });

  const provinceOptions = useMemo(() => {
    const names = (provincesGeoJson?.features ?? [])
      .map((f) => f.properties?.name)
      .filter((n): n is string => !!n);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [provincesGeoJson]);

  const areaCouncilOptions = useMemo(() => {
    const names = (areaCouncilsGeoJson?.features ?? [])
      .map((f) => f.properties?.name)
      .filter((n): n is string => !!n);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [areaCouncilsGeoJson]);

  const reset = () => {
    setStep(1);
    setType("cyclone");
    setSeverity("high");
    setProvince("");
    setAreaCouncil("");
    setTitle("");
    setSummary("");
    setPhoto(null);
    setPhotoPreview("");
    setIsSubmitting(false);
  };

  const close = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const canStep1 = !!type && !!severity;
  const canStep2 = !!province;
  const canSubmit = title.trim().length > 2 && summary.trim().length > 5;

  const onPhotoChange = (file?: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      toast.error("Invalid photo format", "Use JPEG, PNG, GIF or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo too large", "Maximum upload size is 5 MB.");
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await createIncidentAlert({
        title: title.trim(),
        summary: summary.trim(),
        type,
        severity,
        province_name: province || undefined,
        area_council_name: areaCouncil || undefined,
        issued_at: new Date().toISOString(),
        photo,
      });
      await queryClient.invalidateQueries({ queryKey: ["live-alerts"] });
      toast.success("Incident created", "Alert has been published to the live feed.");
      close(false);
    } catch (e) {
      toast.error("Failed to create incident", String(e instanceof Error ? e.message : e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New incident</SheetTitle>
          <SheetDescription>
            Step {step} of 3 — create a live operational alert for duty teams.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Incident type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AlertType)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {ALERT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as AlertSeverity)}>
                  <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>
                    {ALERT_SEVERITIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Province</Label>
                <Select
                  value={province || "__none__"}
                  onValueChange={(v) => {
                    const next = v === "__none__" ? "" : v;
                    setProvince(next);
                    setAreaCouncil("");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                  <SelectContent>
                    {provinceOptions.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Area council (optional)</Label>
                <Select
                  value={areaCouncil || "__none__"}
                  onValueChange={(v) => setAreaCouncil(v === "__none__" ? "" : v)}
                  disabled={!province}
                >
                  <SelectTrigger><SelectValue placeholder={province ? "Select area council" : "Choose province first"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {areaCouncilOptions.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incident-title">Incident title</Label>
                <Input
                  id="incident-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyclone alert escalation in Tafea"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incident-summary">Summary</Label>
                <textarea
                  id="incident-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe incident, impacts, and immediate actions."
                />
              </div>
              <div className="space-y-2">
                <Label>Attach photo (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
                  />
                  {photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview("");
                      }}
                    >
                      <LuX className="size-4" />
                    </Button>
                  )}
                </div>
                {photoPreview && (
                  <div className="overflow-hidden rounded-md border border-border">
                    <img src={photoPreview} alt="Incident attachment preview" className="max-h-44 w-full object-cover" />
                  </div>
                )}
                {!photoPreview && (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <LuUpload className="size-3.5" /> Add site evidence photo (max 5 MB).
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border">
          <div className="flex w-full items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || isSubmitting}
            >
              <LuChevronLeft className="size-4" />
              Back
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2) || isSubmitting}
              >
                Next
                <LuChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={!canSubmit || isSubmitting}>
                {isSubmitting && <LuLoader className="size-4 animate-spin" />}
                {isSubmitting ? "Submitting…" : "Publish incident"}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
