/**
 * Save / load map workspace to the server (per-user, database-backed).
 */
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LuLayoutTemplate, LuLoader, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/utils/toast";
import {
  applyWorkspace,
  captureWorkspace,
  parseWorkspaceValue,
} from "@/lib/workspaceSnapshot";
import {
  createMapWorkspace,
  deleteMapWorkspace,
  getMapWorkspace,
  listMapWorkspaces,
} from "@/api/mapWorkspaces";

const QK = ["map-workspaces"] as const;

export function WorkspaceMenu({ chrome }: { chrome?: boolean }) {
  const queryClient = useQueryClient();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const { data: items = [], isPending, isError, refetch } = useQuery({
    queryKey: QK,
    queryFn: listMapWorkspaces,
    enabled: popoverOpen,
  });

  const openSaveDialog = useCallback(() => {
    const d = new Date();
    setSaveName(`Layout ${d.toLocaleDateString(undefined, { dateStyle: "medium" })}`);
    setSaveOpen(true);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (name: string) => {
      const payload = captureWorkspace(name.trim());
      return createMapWorkspace(name.trim(), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK });
      setSaveOpen(false);
      toast.success("Workspace saved", "You can load it anytime from this menu.");
    },
    onError: (e: Error) => {
      toast.error("Could not save workspace", e.message);
    },
  });

  const loadMutation = useMutation({
    mutationFn: async (id: number) => {
      const raw = await getMapWorkspace(id);
      const parsed = parseWorkspaceValue(raw);
      if (!parsed.ok) throw new Error(parsed.error);
      await applyWorkspace(parsed.workspace);
    },
    onSuccess: () => {
      setPopoverOpen(false);
      toast.success("Workspace loaded", "Map and filters restored.");
    },
    onError: (e: Error) => {
      toast.error("Could not load workspace", e.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMapWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Workspace removed", "");
    },
    onError: (e: Error) => {
      toast.error("Could not delete workspace", e.message);
    },
  });

  const busy = saveMutation.isPending || loadMutation.isPending;

  return (
    <>
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Save workspace</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Shefa schools 2024"
              maxLength={120}
              disabled={saveMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Saves layers, scenario, filters, and map position to your account (server).
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!saveName.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate(saveName)}
            >
              {saveMutation.isPending ? (
                <>
                  <LuLoader className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Tooltip
          content="Save or load map layout to your account (stored on the server)"
          positioning={{ placement: "bottom" }}
          contentProps={{ className: "max-w-[18rem] text-balance" }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              className={cn(
                "drmis-touch-target h-11 min-h-11 shrink-0 rounded-none border-0 px-3 shadow-none md:min-h-11",
                chrome && "md:min-h-11",
              )}
              aria-label="Workspace: save or load"
              aria-expanded={popoverOpen}
            >
              <LuLayoutTemplate className="size-5 shrink-0 md:size-4" />
              <span className="ml-1.5 hidden text-xs font-medium sm:inline">Workspace</span>
            </Button>
          </PopoverTrigger>
        </Tooltip>
        <PopoverContent
          align="start"
          className="z-[1050] w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] flex flex-col overflow-hidden p-0"
        >
          <div className="border-b border-border px-3 py-2">
            <Button
              type="button"
              size="sm"
              className="w-full"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                openSaveDialog();
              }}
            >
              Save current layout…
            </Button>
          </div>
          <div className="overflow-y-auto px-2 py-2">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Saved layouts
            </p>
            {isPending && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <LuLoader className="size-4 animate-spin" />
                Loading…
              </div>
            )}
            {isError && (
              <div className="space-y-2 py-2 text-center text-sm">
                <p className="text-destructive">Could not load list.</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
                  Retry
                </Button>
              </div>
            )}
            {!isPending && !isError && items.length === 0 && (
              <p className="px-1 py-4 text-center text-xs text-muted-foreground">
                No saved workspaces yet. Save your current map to find it here.
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {items.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{w.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(w.updated_at).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="h-7 shrink-0 px-2 text-[11px]"
                    disabled={loadMutation.isPending || deleteMutation.isPending}
                    onClick={() => loadMutation.mutate(w.id)}
                  >
                    Load
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 text-destructive hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    aria-label={`Delete ${w.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete saved workspace “${w.name}”?`)) {
                        deleteMutation.mutate(w.id);
                      }
                    }}
                  >
                    <LuTrash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
