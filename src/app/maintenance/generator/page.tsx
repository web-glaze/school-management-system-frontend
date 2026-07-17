"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import type { DateRange } from "react-day-picker";
import { AxiosError } from "axios";
import {
  Zap,
  Calendar as CalendarIcon,
  CalendarRange,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  MoreVertical,
  ArrowLeft,
  Clock,
  Fuel,
  Droplet,
  MapPin,
  Gauge,
  Factory,
  // ChevronRight,
  TrendingUp,
  AlertTriangle,
  LogIn,
  LogOut,
  Droplets,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useMemo, useState } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { useGeneratorStore, type Generator, type GeneratorRunningLog, type DieselConsumptionLog, type CoolantLevelLog } from "@/store/maintenanceStore";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};
const LOW_FUEL_THRESHOLD_LITERS = 50;
function formatDateOnly(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcRunningHours(date: string, start: string, stop: string) {
  if (!date || !start || !stop) return "";

  const startDate = new Date(`${date}T${start}:00`);
  let stopDate = new Date(`${date}T${stop}:00`);

  if (stopDate <= startDate) {
    stopDate = new Date(stopDate.getTime() + 24 * 60 * 60 * 1000);
  }

  const totalMinutes = Math.floor((stopDate.getTime() - startDate.getTime()) / (1000 * 60));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;

  return `${hours} hr ${minutes} min`;
}

function formatRunningHours(hoursDecimal: number) {
  const totalMinutes = Math.round(hoursDecimal * 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;

  return `${hours} hr ${minutes} min`;
}

function coolantBadgeVariant(level: CoolantLevelLog["coolantLevel"]) {
  switch (level) {
    case "FULL":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "LOW":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "REFILLED":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "";
  }
}

function coolantLabel(level: CoolantLevelLog["coolantLevel"]) {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

function extractApiError(error: unknown, fallback: string) {
  const err = error as AxiosError<ApiErrorResponse>;
  const fieldErrors = err?.response?.data?.errors;
  const message = fieldErrors ? Object.values(fieldErrors)[0] : err?.response?.data?.message;
  return { fieldErrors: fieldErrors ?? null, message: message || fallback };
}

function to12hLabel(time24: string) {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${period}`;
}

function parseTime24(value: string) {
  if (!value) return { hour12: "", minute: "", period: "AM" as const };
  const [hStr, mStr] = value.split(":");
  let h = parseInt(hStr, 10);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return { hour12: String(h).padStart(2, "0"), minute: mStr ?? "00", period };
}

function buildTime24(hour12: string, minute: string, period: "AM" | "PM") {
  if (!hour12 || !minute) return "";
  let h = parseInt(hour12, 10) % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function TimePickerPopover({
  value,
  onChange,
  icon,
  placeholder,
  fullWidth = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  placeholder: string;
  fullWidth?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hourText, setHourText] = useState("");
  const [minuteText, setMinuteText] = useState("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  function handleOpenChange(next: boolean) {
    if (next) {
      const parsed = parseTime24(value);
      setHourText(parsed.hour12);
      setMinuteText(parsed.minute);
      setPeriod(parsed.period);
    }

    setOpen(next);
  }

  function commit(h: string, m: string, p: "AM" | "PM") {
    if (!h || !m) return;
    onChange(buildTime24(h, m, p));
  }

  function clampHour(raw: string) {
    if (!raw) return "";
    const n = Math.min(12, Math.max(1, parseInt(raw, 10) || 1));
    return String(n).padStart(2, "0");
  }

  function clampMinute(raw: string) {
    if (!raw) return "";
    const n = Math.min(59, Math.max(0, parseInt(raw, 10) || 0));
    return String(n).padStart(2, "0");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("justify-start gap-1.5 font-normal", fullWidth ? "h-11 w-full" : "h-9 px-3 text-xs", !value && "text-muted-foreground", className)}>
          {icon}
          {value ? to12hLabel(value) : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center gap-1.5">
          <Input
            inputMode="numeric"
            maxLength={2}
            value={hourText}
            onChange={(e) => setHourText(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={() => {
              const hh = clampHour(hourText);
              setHourText(hh);
              commit(hh, minuteText, period);
            }}
            placeholder="HH"
            className="h-9 w-14 text-center text-xs"
          />

          <span className="text-xs text-muted-foreground">:</span>

          <Input
            inputMode="numeric"
            maxLength={2}
            value={minuteText}
            onChange={(e) => setMinuteText(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={() => {
              const mm = clampMinute(minuteText);
              setMinuteText(mm);
              commit(hourText, mm, period);
            }}
            placeholder="MM"
            className="h-9 w-14 text-center text-xs"
          />

          <Select
            value={period}
            onValueChange={(p) => {
              setPeriod(p as "AM" | "PM");
              commit(hourText, minuteText, p as "AM" | "PM");
            }}
          >
            <SelectTrigger type="button" className="h-9 w-17 px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setHourText("");
              setMinuteText("");
              onChange("");
              setOpen(false);
            }}
            className="text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            Clear
          </button>

          <Button
            type="button"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => {
              commit(clampHour(hourText), clampMinute(minuteText), period);
              setOpen(false);
            }}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  disableFuture = true,
  hasError = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disableFuture?: boolean;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(`${value}T00:00:00`) : undefined;
  const isValidDate = selectedDate && isValid(selectedDate);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className={cn("w-full justify-start gap-2 font-normal", !isValidDate && "text-muted-foreground", hasError && "border-destructive text-destructive")}>
          <CalendarIcon className="size-4 shrink-0" />
          {isValidDate ? format(selectedDate as Date, "dd MMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Calendar
          mode="single"
          selected={isValidDate ? selectedDate : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
          disabled={disableFuture ? (date) => date > new Date() : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-500 mt-1">{message}</p>;
}

function IconAction({ label, onClick, className, children }: { label: string; onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className={className} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export default function GeneratorPage() {
  const authorized = usePermission("generator.read");

  const [selectedGenerator, setSelectedGenerator] = useState<Generator | null>(null);

  if (authorized === null) {
    return null;
  }

  return (
    <DashboardLayout>
      <TooltipProvider delayDuration={200}>
        {selectedGenerator ? <GeneratorDetail generator={selectedGenerator} onBack={() => setSelectedGenerator(null)} /> : <GeneratorList onSelect={setSelectedGenerator} />}
      </TooltipProvider>
    </DashboardLayout>
  );
}

function GeneratorList({ onSelect }: { onSelect: (generator: Generator) => void }) {
  const { generators, loading, fetchGenerators, createGenerator, updateGenerator, deleteGenerator } = useGeneratorStore();

  const [name, setName] = useState("");
  const [generatorNo, setGeneratorNo] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const [editName, setEditName] = useState("");
  const [editGeneratorNo, setEditGeneratorNo] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editManufacturer, setEditManufacturer] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editingGenerator, setEditingGenerator] = useState<Generator | null>(null);
  const [deletingGenerator, setDeletingGenerator] = useState<Generator | null>(null);

  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerators();
  }, []);

  const resetCreateForm = () => {
    setName("");
    setGeneratorNo("");
    setLocation("");
    setCapacity("");
    setManufacturer("");
    setCreateErrors({});
  };

  const isCreateValid = name.trim() && generatorNo.trim() && location.trim() && capacity.trim() && manufacturer.trim();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreateValid) return;

    try {
      await createGenerator({
        name: name.trim(),
        generatorNo: generatorNo.trim(),
        location: location.trim(),
        capacity: capacity.trim(),
        manufacturer: manufacturer.trim(),
      });

      resetCreateForm();
      setAddOpen(false);

      toast.success("Generator created successfully");
    } catch (error) {
      const { fieldErrors, message } = extractApiError(error, "Failed to create generator");
      if (fieldErrors) setCreateErrors(fieldErrors);
      toast.error(message);
    }
  };

  const isEditValid = editName.trim() && editGeneratorNo.trim() && editLocation.trim() && editCapacity.trim() && editManufacturer.trim();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGenerator || !isEditValid) return;

    try {
      await updateGenerator(editingGenerator.id, {
        name: editName.trim(),
        generatorNo: editGeneratorNo.trim(),
        location: editLocation.trim(),
        capacity: editCapacity.trim(),
        manufacturer: editManufacturer.trim(),
      });

      setEditOpen(false);
      setEditingGenerator(null);

      toast.success("Generator updated successfully");
    } catch (error) {
      const { fieldErrors, message } = extractApiError(error, "Failed to update generator");
      if (fieldErrors) setEditErrors(fieldErrors);
      toast.error(message);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deletingGenerator) return;

    try {
      setDeletingId(deletingGenerator.id);

      await deleteGenerator(deletingGenerator.id);

      setDeleteOpen(false);
      setDeletingGenerator(null);

      toast.success("Generator deleted successfully");
    } catch (error) {
      const { message } = extractApiError(error, "Failed to delete generator");
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (generator: Generator) => {
    setEditingGenerator(generator);
    setEditName(generator.name);
    setEditGeneratorNo(generator.generatorNo);
    setEditLocation(generator.location || "");
    setEditCapacity(generator.capacity || "");
    setEditManufacturer(generator.manufacturer || "");
    setEditErrors({});
    setEditOpen(true);
  };

  const openDeleteDialog = (generator: Generator) => {
    setDeletingGenerator(generator);
    setDeleteOpen(true);
  };

  const hasEditChanges =
    editingGenerator &&
    (editName !== editingGenerator.name ||
      editGeneratorNo !== editingGenerator.generatorNo ||
      editLocation !== (editingGenerator.location || "") ||
      editCapacity !== (editingGenerator.capacity || "") ||
      editManufacturer !== (editingGenerator.manufacturer || ""));

  const filteredGenerators = generators.filter((generator) => generator.name.toLowerCase().includes(search.toLowerCase()) || generator.generatorNo.toLowerCase().includes(search.toLowerCase()));
  const siteFuelStock = generators.reduce<{ value: number; updatedAt: string; generatorName: string } | null>((latest, g) => {
    const gAny = g as Generator & { latestFuelStock?: number | null; latestFuelStockUpdatedAt?: string | null };
    if (gAny.latestFuelStock === undefined || gAny.latestFuelStock === null || !gAny.latestFuelStockUpdatedAt) return latest;
    if (!latest || new Date(gAny.latestFuelStockUpdatedAt) > new Date(latest.updatedAt)) {
      return { value: Number(gAny.latestFuelStock), updatedAt: gAny.latestFuelStockUpdatedAt, generatorName: g.name };
    }
    return latest;
  }, null);

  const isSiteFuelLow = siteFuelStock !== null && siteFuelStock.value < LOW_FUEL_THRESHOLD_LITERS;

  return (
    <div className="space-y-8">
      <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Generators</h1>
          <p className="text-muted-foreground">Manage generators and their monitoring logs</p>
        </div>

        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 px-5">
              <Plus className="size-4" />
              Add Generator
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-115 p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="size-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Create Generator</DialogTitle>
                  <DialogDescription>Add a new generator to monitor</DialogDescription>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 p-6">
              <FieldGroup>
                <Field>
                  <Label htmlFor="generator-name">Generator Name</Label>
                  <Input
                    id="generator-name"
                    placeholder="Main Building Generator..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setCreateErrors((p) => ({ ...p, name: "" }));
                    }}
                    className={cn(createErrors.name && "border-destructive focus-visible:ring-destructive")}
                    required
                  />
                  <FieldError message={createErrors.name} />
                </Field>

                <Field>
                  <Label htmlFor="generator-no">Generator No.</Label>
                  <Input
                    id="generator-no"
                    placeholder="GEN-001..."
                    value={generatorNo}
                    onChange={(e) => {
                      setGeneratorNo(e.target.value);
                      setCreateErrors((p) => ({ ...p, generatorNo: "" }));
                    }}
                    className={cn(createErrors.generatorNo && "border-destructive focus-visible:ring-destructive")}
                    required
                  />
                  <FieldError message={createErrors.generatorNo} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <Label htmlFor="generator-location">Location</Label>
                    <Input
                      id="generator-location"
                      placeholder="Basement..."
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setCreateErrors((p) => ({ ...p, location: "" }));
                      }}
                      className={cn(createErrors.location && "border-destructive focus-visible:ring-destructive")}
                      required
                    />
                    <FieldError message={createErrors.location} />
                  </Field>

                  <Field>
                    <Label htmlFor="generator-capacity">Capacity</Label>
                    <Input
                      id="generator-capacity"
                      placeholder="125 ltr"
                      value={capacity}
                      onChange={(e) => {
                        setCapacity(e.target.value);
                        setCreateErrors((p) => ({ ...p, capacity: "" }));
                      }}
                      className={cn(createErrors.capacity && "border-destructive focus-visible:ring-destructive")}
                      required
                    />
                    <FieldError message={createErrors.capacity} />
                  </Field>
                </div>

                <Field>
                  <Label htmlFor="generator-manufacturer">Manufacturer</Label>
                  <Input
                    id="generator-manufacturer"
                    placeholder="Kirloskar, Cummins..."
                    value={manufacturer}
                    onChange={(e) => {
                      setManufacturer(e.target.value);
                      setCreateErrors((p) => ({ ...p, manufacturer: "" }));
                    }}
                    className={cn(createErrors.manufacturer && "border-destructive focus-visible:ring-destructive")}
                    required
                  />
                  <FieldError message={createErrors.manufacturer} />
                </Field>
              </FieldGroup>

              <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </DialogClose>

                <Button type="submit" disabled={loading || !isCreateValid} className="w-full sm:w-auto sm:min-w-32.5 gap-2 px-5">
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      Create
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className={cn("flex items-center justify-between gap-4 rounded-md border px-5 py-3.5", isSiteFuelLow ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-card")}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", isSiteFuelLow ? "bg-destructive/10" : "bg-primary/10")}>
            {isSiteFuelLow ? <AlertTriangle className="size-4.5 text-destructive" /> : <Fuel className="size-4.5 text-primary" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Fuel Stock</p>
            <p className="text-xs text-muted-foreground truncate">{siteFuelStock ? `Last updated ${formatDateOnly(siteFuelStock.updatedAt)} · ${siteFuelStock.generatorName}` : "No diesel logs recorded yet"}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xl font-bold text-foreground">{siteFuelStock ? `${siteFuelStock.value.toFixed(2)} L` : "—"}</div>
          {isSiteFuelLow && (
            <Badge variant="outline" className="mt-0.5 bg-destructive/10 text-destructive border-destructive/20">
              Low stock
            </Badge>
          )}
        </div>
      </div>

      <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-87.5 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input type="text" placeholder="Search by name or generator number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
          </div>
        </div>

        {loading && generators.length === 0 ? (
          <div className="space-y-4">
            <div className="flex gap-4 border-b border-border/50 pb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-6 flex-1" />
              ))}
            </div>
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="flex gap-4 py-2 border-b border-border/20">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            ))}
          </div>
        ) : filteredGenerators.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
              <Inbox className="size-6 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No generators created yet.</h3>
            <p className="text-muted-foreground mt-1.5 max-w-sm">No matching records were found in the database. Check search queries or reset parameters.</p>
          </div>
        ) : (
          <Table className="table-auto">
            <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 px-4 text-foreground/80 min-w-32">Name</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-4 text-foreground/80 min-w-40">Generator No.</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4 text-foreground/80 min-w-32">Location</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4 text-foreground/80 min-w-28">Capacity</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 px-4 text-foreground/80 min-w-32">Manufacturer</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-4 pr-4 sm:pr-6 text-foreground/80 text-right w-14 md:w-24 sticky right-0 bg-gray-50 dark:bg-muted/15 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                  <span className="md:block">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/30">
              {filteredGenerators.map((generator) => (
                <TableRow key={generator.id} className="hover:bg-muted/20 transition-colors cursor-pointer group" onClick={() => onSelect(generator)}>
                  <TableCell className="py-4 pl-6 pr-4  max-w-40">
                    <div className="flex items-center gap-3">

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-base leading-tight truncate" title={generator.name}>
                          {generator.name}
                        </p>
                        <p className="text-sm text-foreground/50 truncate" title={generator.generatorCode}>
                          {generator.generatorCode}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-4  max-w-45">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-foreground text-base leading-tight group-hover:text-primary transition-colors truncate min-w-0" title={generator.generatorNo}>
                        {generator.generatorNo}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-4 text-sm text-muted-foreground  max-w-40">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* <MapPin className="size-4 text-muted-foreground/80 shrink-0" /> */}
                      <span className="truncate" title={generator.location}>
                        {generator.location}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-4 text-sm text-muted-foreground  max-w-32">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* <Gauge className="size-4 text-muted-foreground/80 shrink-0" /> */}
                      <span className="truncate" title={generator.capacity}>
                        {generator.capacity} ltr
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-4 text-sm text-muted-foreground  max-w-40">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* <Factory className="size-4 text-muted-foreground/80 shrink-0" /> */}
                      <span className="truncate" title={generator.manufacturer}>
                        {generator.manufacturer}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 pl-4 pr-4 sm:pr-6 text-right  w-14 md:w-24 bg-card sticky right-0 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0" onClick={(e) => e.stopPropagation()}>
                    <div className="hidden md:flex justify-end gap-1">
                      <IconAction label="Edit Generator" className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all" onClick={() => openEditDialog(generator)}>
                        <Pencil className="size-5" />
                      </IconAction>

                      <IconAction label="Delete Generator" className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => openDeleteDialog(generator)}>
                        <Trash2 className="size-5" />
                      </IconAction>

                      {/* <IconAction label="View Logs" className="size-10 rounded-lg text-muted-foreground group-hover:text-primary transition-all" onClick={() => onSelect(generator)}>
                          <ChevronRight className="size-5" />
                        </IconAction> */}
                    </div>
                    <div className="md:hidden flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-9" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="size-5" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          {/* <DropdownMenuItem onClick={() => onSelect(generator)}>
                              <Factory className="mr-2 size-4" />
                              View Logs
                            </DropdownMenuItem> */}

                          <DropdownMenuItem onClick={() => openEditDialog(generator)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => openDeleteDialog(generator)} className="text-destructive">
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Generator */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-115 p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Edit Generator</DialogTitle>
                <DialogDescription>Update generator details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label htmlFor="edit-generator-name">Generator Name</Label>
                <Input
                  id="edit-generator-name"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditErrors((p) => ({ ...p, name: "" }));
                  }}
                  className={cn(editErrors.name && "border-destructive focus-visible:ring-destructive")}
                  required
                />
                <FieldError message={editErrors.name} />
              </Field>

              <Field>
                <Label htmlFor="edit-generator-no">Generator No.</Label>
                <Input
                  id="edit-generator-no"
                  value={editGeneratorNo}
                  onChange={(e) => {
                    setEditGeneratorNo(e.target.value);
                    setEditErrors((p) => ({ ...p, generatorNo: "" }));
                  }}
                  className={cn(editErrors.generatorNo && "border-destructive focus-visible:ring-destructive")}
                  required
                />
                <FieldError message={editErrors.generatorNo} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <Label htmlFor="edit-generator-location">Location</Label>
                  <Input
                    id="edit-generator-location"
                    value={editLocation}
                    onChange={(e) => {
                      setEditLocation(e.target.value);
                      setEditErrors((p) => ({ ...p, location: "" }));
                    }}
                    className={cn(editErrors.location && "border-destructive focus-visible:ring-destructive")}
                    required
                  />
                  <FieldError message={editErrors.location} />
                </Field>

                <Field>
                  <Label htmlFor="edit-generator-capacity">Capacity</Label>
                  <Input
                    id="edit-generator-capacity"
                    value={editCapacity}
                    onChange={(e) => {
                      setEditCapacity(e.target.value);
                      setEditErrors((p) => ({ ...p, capacity: "" }));
                    }}
                    className={cn(editErrors.capacity && "border-destructive focus-visible:ring-destructive")}
                    required
                  />
                  <FieldError message={editErrors.capacity} />
                </Field>
              </div>

              <Field>
                <Label htmlFor="edit-generator-manufacturer">Manufacturer</Label>
                <Input
                  id="edit-generator-manufacturer"
                  value={editManufacturer}
                  onChange={(e) => {
                    setEditManufacturer(e.target.value);
                    setEditErrors((p) => ({ ...p, manufacturer: "" }));
                  }}
                  className={cn(editErrors.manufacturer && "border-destructive focus-visible:ring-destructive")}
                  required
                />
                <FieldError message={editErrors.manufacturer} />
              </Field>
            </FieldGroup>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !isEditValid || !hasEditChanges} className="w-full sm:w-auto sm:min-w-32.5 gap-2 px-5">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="size-4" />
                    Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Generator */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete Generator?</AlertDialogTitle>

            <AlertDialogDescription className="text-center wrap-break-word">
              This action cannot be undone. This will permanently remove <span className="inline-block max-w-60 truncate align-bottom font-semibold text-foreground">{deletingGenerator?.name}</span> along with all of its
              logs.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="h-11 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={!!deletingId} className="h-11 w-full sm:w-auto bg-destructive text-white hover:bg-destructive/90">
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete Generator
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type LogType = "running" | "diesel" | "coolant";

function GeneratorDetail({ generator, onBack }: { generator: Generator; onBack: () => void }) {
  const { runningLogs, dieselLogs, coolantLogs, logsLoading, fetchRunningLogs, addRunningLog, deleteRunningLog, fetchDieselLogs, addDieselLog, deleteDieselLog, fetchCoolantLogs, addCoolantLog, deleteCoolantLog } =
    useGeneratorStore();

  const [tab, setTab] = useState<LogType>("running");

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1));

  useEffect(() => {
    fetchRunningLogs(generator.id);
    fetchDieselLogs(generator.id);
    fetchCoolantLogs(generator.id);
  }, [generator.id]);

  function applyFilters() {
    setAppliedDateRange(dateRange);
  }

  function clearFilters() {
    setDateRange(undefined);
    setAppliedDateRange(undefined);
  }

  function dateLabel() {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${dateRange.from.toLocaleDateString("en-IN")} – ${dateRange.to.toLocaleDateString("en-IN")}`;
      }

      return dateRange.from.toLocaleDateString("en-IN");
    }

    return "Custom range";
  }

  const [runningOpen, setRunningOpen] = useState(false);
  const [runDate, setRunDate] = useState("");
  const [runStart, setRunStart] = useState("");
  const [runStop, setRunStop] = useState("");
  const [runRemarks, setRunRemarks] = useState("");
  const [runSaving, setRunSaving] = useState(false);
  const [runErrors, setRunErrors] = useState<Record<string, string>>({});

  const computedHours = useMemo(() => calcRunningHours(runDate, runStart, runStop), [runDate, runStart, runStop]);

  const resetRunningForm = () => {
    setRunDate("");
    setRunStart("");
    setRunStop("");
    setRunRemarks("");
    setRunErrors({});
  };

  const handleAddRunningLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runDate || !runStart || !runStop || !computedHours) return;

    try {
      setRunSaving(true);

      await addRunningLog(generator.id, {
        date: new Date(runDate).toISOString(),
        startTime: new Date(`${runDate}T${runStart}:00`).toISOString(),
        stopTime: new Date(`${runDate}T${runStop}:00`).toISOString(),
        totalRunningHours: (() => {
          const startDate = new Date(`${runDate}T${runStart}:00`);
          let stopDate = new Date(`${runDate}T${runStop}:00`);

          if (stopDate <= startDate) {
            stopDate = new Date(stopDate.getTime() + 24 * 60 * 60 * 1000);
          }

          return (stopDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        })(),
        remarks: runRemarks.trim() || undefined,
      });

      resetRunningForm();
      setRunningOpen(false);
      toast.success("Running log added successfully");
    } catch (error) {
      const { fieldErrors, message } = extractApiError(error, "Failed to add running log");
      if (fieldErrors) setRunErrors(fieldErrors);
      toast.error(message);
    } finally {
      setRunSaving(false);
    }
  };

  const [dieselOpen, setDieselOpen] = useState(false);
  const [dieselDate, setDieselDate] = useState("");
  const [dieselRefilled, setDieselRefilled] = useState("");
  const [fuelLeft, setFuelLeft] = useState("");
  const [dieselRemarks, setDieselRemarks] = useState("");
  const [dieselSaving, setDieselSaving] = useState(false);
  const [dieselErrors, setDieselErrors] = useState<Record<string, string>>({});

const capacity = parseFloat(generator.capacity ?? "0");
  const isDieselValid = dieselDate && dieselRefilled.trim() !== "" && fuelLeft.trim() !== "" && parseFloat(dieselRefilled) <= capacity;

  const resetDieselForm = () => {
    setDieselDate("");
    setDieselRefilled("");
    setFuelLeft("");
    setDieselRemarks("");
    setDieselErrors({});
  };

  const handleAddDieselLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDieselValid) return;

    if (parseFloat(dieselRefilled) > capacity) {
      setDieselErrors((p) => ({
        ...p,
        dieselRefilled: `Cannot refill more than generator capacity (${capacity} L).`,
      }));
      return;
    }

    try {
      setDieselSaving(true);

      await addDieselLog(generator.id, {
        date: new Date(dieselDate).toISOString(),
        dieselRefilled: parseFloat(dieselRefilled),
        fuelLeftInStock: parseFloat(fuelLeft),
        remarks: dieselRemarks.trim() || undefined,
      });

      resetDieselForm();
      setDieselOpen(false);
      toast.success("Diesel log added successfully");
    } catch (error) {
      const { fieldErrors, message } = extractApiError(error, "Failed to add diesel log");
      if (fieldErrors) setDieselErrors(fieldErrors);
      toast.error(message);
    } finally {
      setDieselSaving(false);
    }
  };

  const [coolantOpen, setCoolantOpen] = useState(false);
  const [coolantDate, setCoolantDate] = useState("");
  const [coolantLevel, setCoolantLevel] = useState<CoolantLevelLog["coolantLevel"] | "">("");
  const [coolantQty, setCoolantQty] = useState("");
  const [coolantRemarks, setCoolantRemarks] = useState("");
  const [coolantSaving, setCoolantSaving] = useState(false);
  const [coolantErrors, setCoolantErrors] = useState<Record<string, string>>({});

  const isCoolantValid = coolantDate && coolantLevel && (coolantLevel !== "REFILLED" || coolantQty.trim() !== "");

  const resetCoolantForm = () => {
    setCoolantDate("");
    setCoolantLevel("");
    setCoolantQty("");
    setCoolantRemarks("");
    setCoolantErrors({});
  };

  const handleAddCoolantLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCoolantValid || !coolantLevel) return;

    try {
      setCoolantSaving(true);

      await addCoolantLog(generator.id, {
        date: new Date(coolantDate).toISOString(),
        coolantLevel,
        quantityAdded: coolantQty.trim() ? parseFloat(coolantQty) : undefined,
        remarks: coolantRemarks.trim() || undefined,
      });

      resetCoolantForm();
      setCoolantOpen(false);
      toast.success("Coolant log added successfully");
    } catch (error) {
      const { fieldErrors, message } = extractApiError(error, "Failed to add coolant log");
      if (fieldErrors) setCoolantErrors(fieldErrors);
      toast.error(message);
    } finally {
      setCoolantSaving(false);
    }
  };

  const filteredRunningLogs = useMemo(() => {
    let logs = [...runningLogs];

    if (appliedDateRange?.from) {
      const from = new Date(appliedDateRange.from);
      from.setHours(0, 0, 0, 0);

      const to = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(appliedDateRange.from);
      to.setHours(23, 59, 59, 999);

      logs = logs.filter((log) => {
        const d = new Date(log.date);
        return d >= from && d <= to;
      });
    }

    return logs;
  }, [runningLogs, appliedDateRange]);

  const filteredDieselLogs = useMemo(() => {
    let logs = [...dieselLogs];

    if (appliedDateRange?.from) {
      const from = new Date(appliedDateRange.from);
      from.setHours(0, 0, 0, 0);

      const to = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(appliedDateRange.from);
      to.setHours(23, 59, 59, 999);

      logs = logs.filter((log) => {
        const d = new Date(log.date);
        return d >= from && d <= to;
      });
    }

    return logs;
  }, [dieselLogs, appliedDateRange]);

  const filteredCoolantLogs = useMemo(() => {
    let logs = [...coolantLogs];

    if (appliedDateRange?.from) {
      const from = new Date(appliedDateRange.from);
      from.setHours(0, 0, 0, 0);

      const to = appliedDateRange.to ? new Date(appliedDateRange.to) : new Date(appliedDateRange.from);
      to.setHours(23, 59, 59, 999);

      logs = logs.filter((log) => {
        const d = new Date(log.date);
        return d >= from && d <= to;
      });
    }

    return logs;
  }, [coolantLogs, appliedDateRange]);

  const stats = useMemo(() => {
    const totalRunningHours = filteredRunningLogs.reduce((sum, log) => sum + Number(log.totalRunningHours || 0), 0);

    const totalDieselRefilled = filteredDieselLogs.reduce((sum, log) => sum + Number(log.dieselRefilled || 0), 0);

    const latestDieselLog = filteredDieselLogs.length ? [...filteredDieselLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;

    const fuelBeforeRefill = latestDieselLog ? Number(latestDieselLog.fuelLeftInStock) - Number(latestDieselLog.dieselRefilled) : null;

    const totalCoolantRefilled = filteredCoolantLogs.reduce((sum, log) => (log.coolantLevel === "REFILLED" ? sum + Number(log.quantityAdded || 0) : sum), 0);

    const coolantRefillCount = filteredCoolantLogs.filter((log) => log.coolantLevel === "REFILLED").length;

    return {
      totalRunningHours,
      totalDieselRefilled,
      fuelBeforeRefill,
      latestDieselLogDate: latestDieselLog?.date ?? null,
      totalCoolantRefilled,
      coolantRefillCount,
    };
  }, [filteredRunningLogs, filteredDieselLogs, filteredCoolantLogs]);

  const [deleteTarget, setDeleteTarget] = useState<{ type: LogType; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [detailsTarget, setDetailsTarget] = useState<{ type: "running"; log: GeneratorRunningLog } | { type: "diesel"; log: DieselConsumptionLog } | { type: "coolant"; log: CoolantLevelLog } | null>(null);

  const handleDeleteLog = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      if (deleteTarget.type === "running") await deleteRunningLog(generator.id, deleteTarget.id);
      if (deleteTarget.type === "diesel") await deleteDieselLog(generator.id, deleteTarget.id);
      if (deleteTarget.type === "coolant") await deleteCoolantLog(generator.id, deleteTarget.id);

      toast.success("Log deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      const { message } = extractApiError(error, "Failed to delete log");
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 mb-10">
        <Button variant="ghost" size="sm" className="w-fit gap-2 text-muted-foreground -ml-2" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to Generators
        </Button>

        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{generator.name}</h1>
            </div>
          </div>

          {/* ── Filter panel ── */}
          <div className="flex justify-end items-center gap-2 mb-4">
            {appliedDateRange?.from && (
              <Button variant="ghost" size="lg" className="h-auto p-0 text-base font-medium  hover:text-sky-400" onClick={clearFilters}>
                Clear
              </Button>
            )}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("gap-2", appliedDateRange?.from && "border-sky-400 bg-sky-50 text-sky-700 ring-1 ring-sky-200")}>
                  <CalendarIcon className="size-4" />

                  {appliedDateRange?.from
                    ? appliedDateRange.to
                      ? `${format(appliedDateRange.from, "dd MMM yyyy")} - ${format(appliedDateRange.to, "dd MMM yyyy")}`
                      : format(appliedDateRange.from, "dd MMM yyyy")
                    : "Date Filter"}
                </Button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-fit max-w-[calc(100vw-2rem)] p-2">
                <Calendar
                  mode="range"
                  numberOfMonths={typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 2}
                  selected={dateRange}
                  onSelect={setDateRange}
                  month={month}
                  onMonthChange={setMonth}
                  disabled={(date) => date > new Date()}
                  className="text-sm"
                  classNames={{
                    months: "flex flex-col sm:flex-row gap-3",
                    month: "space-y-3 w-full",
                    caption: "flex justify-center pt-1 relative items-center",
                    table: "w-full border-collapse",
                    head_row: "flex",
                    row: "flex w-full mt-2",
                    head_cell: "flex-1 text-xs",
                    cell: "flex-1 aspect-square p-0",
                    day: "h-full w-full text-sm sm:h-8 sm:w-8",
                  }}
                />

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange(undefined);
                      clearFilters();
                    }}
                  >
                    Clear
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      applyFilters();
                      setCalendarOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* ---------------- Summary Cards ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Running Hours</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {(() => {
                const totalMinutes = Math.round(stats.totalRunningHours * 60);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;

                if (hours === 0) return `${minutes} min`;
                if (minutes === 0) return `${hours} hr`;

                return `${hours} hr ${minutes} min`;
              })()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              across {filteredRunningLogs.length} logged run{filteredRunningLogs.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Diesel Refilled</CardTitle>
            <Fuel className="size-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalDieselRefilled.toFixed(2)} L</div>
            <p className="text-xs text-muted-foreground mt-1">
              across {filteredDieselLogs.length} refill{filteredDieselLogs.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Coolant Refilled</CardTitle>
            <Droplets className="size-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalCoolantRefilled.toFixed(2)} L</div>
            <p className="text-xs text-muted-foreground mt-1">
              across {stats.coolantRefillCount} refill{stats.coolantRefillCount === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Tabs value={tab} onValueChange={(v) => setTab(v as LogType)}>
        <TabsList className="mb-4 flex w-full md:w-auto md:self-start md:mr-auto">
          <TabsTrigger value="running" className="gap-2">
            <Clock className="size-4" />
            <span className="hidden sm:inline">Running Log</span>
          </TabsTrigger>
          <TabsTrigger value="diesel" className="gap-2">
            <Fuel className="size-4" />
            <span className="hidden sm:inline">Diesel Consumption</span>
          </TabsTrigger>
          <TabsTrigger value="coolant" className="gap-2">
            <Droplet className="size-4" />
            <span className="hidden sm:inline">Coolant Level</span>
          </TabsTrigger>
        </TabsList>

        {/* ---------------- Running Log ---------------- */}
        <TabsContent value="running">
          <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground">Generator Running Log</h3>
                <p className="text-sm text-muted-foreground">Record the operational hours of the generator</p>
              </div>

              <Dialog
                open={runningOpen}
                onOpenChange={(open) => {
                  setRunningOpen(open);
                  if (!open) resetRunningForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2 px-5 w-full sm:w-auto">
                    <Plus className="size-4" />
                    Add Entry
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-115 p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
                  <div className="border-b px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="size-5 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg">Add Running Log</DialogTitle>
                        <DialogDescription>Record today&apos;s operating hours</DialogDescription>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleAddRunningLog} className="space-y-6 p-6">
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="run-date">Date</Label>
                        <DatePicker
                          id="run-date"
                          value={runDate}
                          onChange={(v) => {
                            setRunDate(v);
                            setRunErrors((p) => ({ ...p, date: "" }));
                          }}
                          placeholder="Select date"
                          hasError={!!runErrors.date}
                        />
                        <FieldError message={runErrors.date} />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field>
                          <Label htmlFor="run-start">Start Time</Label>
                          <TimePickerPopover
                            value={runStart}
                            onChange={(v) => {
                              setRunStart(v);
                              setRunErrors((p) => ({ ...p, startTime: "" }));
                            }}
                            icon={<LogIn className="size-4" />}
                            placeholder="Select time"
                            fullWidth
                          />
                          <FieldError message={runErrors.startTime} />
                        </Field>

                        <Field>
                          <Label htmlFor="run-stop">Stop Time</Label>
                          <TimePickerPopover
                            value={runStop}
                            onChange={(v) => {
                              setRunStop(v);
                              setRunErrors((p) => ({ ...p, stopTime: "" }));
                            }}
                            icon={<LogOut className="size-4" />}
                            placeholder="Select time"
                            fullWidth
                          />
                          <FieldError message={runErrors.stopTime} />
                        </Field>
                      </div>

                      <Field>
                        <Label htmlFor="run-hours">Total Running Hours</Label>
                        <Input id="run-hours" value={computedHours} disabled placeholder="Calculated automatically" />
                      </Field>

                      <Field>
                        <Label htmlFor="run-remarks">Remarks</Label>
                        <Textarea id="run-remarks" placeholder="Optional notes..." value={runRemarks} onChange={(e) => setRunRemarks(e.target.value)} />
                      </Field>
                    </FieldGroup>

                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                      <DialogClose asChild>
                        <Button variant="outline" type="button" className="w-full sm:w-auto">
                          Cancel
                        </Button>
                      </DialogClose>

                      <Button type="submit" disabled={runSaving || !computedHours} className="w-full sm:w-auto sm:min-w-32.5 gap-2 px-5">
                        {runSaving ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <LogTable loading={logsLoading && runningLogs.length === 0} empty={runningLogs.length === 0} emptyLabel="No running log entries yet." headers={["Date", "Start", "Stop", "Total Hours", "Remarks", "Actions"]}>
              {filteredRunningLogs.map((log: GeneratorRunningLog) => (
                <TableRow key={log.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setDetailsTarget({ type: "running", log })}>
                  <TableCell className="py-4 pl-6 pr-4 text-sm max-w-32">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CalendarIcon className="size-4 text-muted-foreground/80 shrink-0" />
                      <span className="truncate">{formatDateOnly(log.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground max-w-24 truncate">{formatTimeOnly(log.startTime)}</TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground max-w-24 truncate">{formatTimeOnly(log.stopTime)}</TableCell>
                  <TableCell className="py-4 px-4 text-sm font-semibold text-foreground max-w-28 truncate">{formatRunningHours(Number(log.totalRunningHours))}</TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground max-w-50 truncate">{log.remarks || <span className="text-foreground/40">&mdash;</span>}</TableCell>
                  <TableCell className="py-4 pl-4 pr-4 sm:pr-6 text-right bg-card sticky right-0 shadow-lg sm:shadow-none border-l border-border/40 sm:border-l-0" onClick={(e) => e.stopPropagation()}>
                    <IconAction
                      label="Delete Entry"
                      className="size-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                      onClick={() => setDeleteTarget({ type: "running", id: log.id })}
                    >
                      <Trash2 className="size-4.5" />
                    </IconAction>
                  </TableCell>
                </TableRow>
              ))}
            </LogTable>
          </div>
        </TabsContent>

        {/* ---------------- Diesel Consumption Log ---------------- */}
        <TabsContent value="diesel">
          <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground">Diesel Consumption Log</h3>
                <p className="text-sm text-muted-foreground">Track fuel refilling and daily fuel balance</p>
              </div>

              <Dialog
                open={dieselOpen}
                onOpenChange={(open) => {
                  setDieselOpen(open);
                  if (!open) resetDieselForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2 px-5 w-full sm:w-auto">
                    <Plus className="size-4" />
                    Add Entry
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-115 p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
                  <div className="border-b px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Fuel className="size-5 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg">Add Diesel Log</DialogTitle>
                        <DialogDescription>Record refill and remaining stock</DialogDescription>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleAddDieselLog} className="space-y-6 p-6">
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="diesel-date">Date</Label>
                        <DatePicker
                          id="diesel-date"
                          value={dieselDate}
                          onChange={(v) => {
                            setDieselDate(v);
                            setDieselErrors((p) => ({ ...p, date: "" }));
                          }}
                          placeholder="Select date"
                          hasError={!!dieselErrors.date}
                        />
                        <FieldError message={dieselErrors.date} />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field>
                          <Label htmlFor="diesel-refilled">Diesel Refilled (L)</Label>
                          <Input
                            id="diesel-refilled"
                            type="number"
                            step="0.01"
                            min="0"
                            max={parseFloat(generator.capacity ?? "0")}
                            placeholder={`Max ${generator.capacity} L`}
                            value={dieselRefilled}
                            onChange={(e) => {
                              const value = e.target.value;
                              const capacity = parseFloat(generator.capacity ?? "0");

                              setDieselRefilled(value);

                              if (value !== "" && parseFloat(value) > capacity) {
                                setDieselErrors((p) => ({
                                  ...p,
                                  dieselRefilled: `Cannot refill more than generator capacity (${capacity} L).`,
                                }));
                              } else {
                                setDieselErrors((p) => ({
                                  ...p,
                                  dieselRefilled: "",
                                }));
                              }
                            }}
                            className={cn(dieselErrors.dieselRefilled && "border-destructive focus-visible:ring-destructive")}
                            required
                          />
                          <FieldError message={dieselErrors.dieselRefilled} />
                        </Field>

                        <Field>
                          <Label htmlFor="fuel-left">Fuel Left in Stock (L)</Label>
                          <Input
                            id="fuel-left"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={fuelLeft}
                            onChange={(e) => {
                              setFuelLeft(e.target.value);
                              setDieselErrors((p) => ({
                                ...p,
                                fuelLeftInStock: "",
                              }));
                            }}
                            className={cn(dieselErrors.fuelLeftInStock && "border-destructive focus-visible:ring-destructive")}
                            required
                          />
                          <FieldError message={dieselErrors.fuelLeftInStock} />
                        </Field>
                      </div>

                      <Field>
                        <Label htmlFor="diesel-remarks">Remarks</Label>
                        <Textarea id="diesel-remarks" placeholder="Optional notes..." value={dieselRemarks} onChange={(e) => setDieselRemarks(e.target.value)} />
                      </Field>
                    </FieldGroup>

                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                      <DialogClose asChild>
                        <Button variant="outline" type="button" className="w-full sm:w-auto">
                          Cancel
                        </Button>
                      </DialogClose>

                      <Button type="submit" disabled={dieselSaving || !isDieselValid} className="w-full sm:w-auto sm:min-w-32.5 gap-2 px-5">
                        {dieselSaving ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <LogTable
              loading={logsLoading && dieselLogs.length === 0}
              empty={dieselLogs.length === 0}
              emptyLabel="No diesel log entries yet."
              headers={["Date", "Refilled (L)", "Stock Left (L)", "In Generator (L)", "Remarks", "Actions"]}
            >
              {filteredDieselLogs.map((log: DieselConsumptionLog) => {
                const lowStock = Number(log.fuelLeftInStock) < LOW_FUEL_THRESHOLD_LITERS;
                return (
                  <TableRow key={log.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setDetailsTarget({ type: "diesel", log })}>
                    <TableCell className="py-4 pl-6 pr-4 text-sm max-w-32">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CalendarIcon className="size-4 text-muted-foreground/80 shrink-0" />
                        <span className="truncate">{formatDateOnly(log.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-sm font-semibold text-foreground max-w-28 truncate">{Number(log.dieselRefilled).toFixed(2)} L</TableCell>
                    <TableCell className="py-4 px-4 text-sm max-w-36">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("text-muted-foreground truncate", lowStock && "text-destructive font-medium")}>{Number(log.fuelLeftInStock).toFixed(2)} L</span>
                        {lowStock && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 shrink-0">
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4 text-sm text-muted-foreground max-w-32 truncate">
                      {(log as DieselConsumptionLog & { fuelLeftInGenerator?: number | null }).fuelLeftInGenerator != null ? (
                        `${Number((log as DieselConsumptionLog & { fuelLeftInGenerator?: number | null }).fuelLeftInGenerator).toFixed(2)} L`
                      ) : (
                        <span className="text-foreground/40">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-4 text-sm text-muted-foreground max-w-50 truncate">{log.remarks || <span className="text-foreground/40">&mdash;</span>}</TableCell>
                    <TableCell className="py-4 pl-4 pr-4 sm:pr-6 text-right bg-card sticky right-0 shadow-lg sm:shadow-none border-l border-border/40 sm:border-l-0" onClick={(e) => e.stopPropagation()}>
                      <IconAction
                        label="Delete Entry"
                        className="size-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => setDeleteTarget({ type: "diesel", id: log.id })}
                      >
                        <Trash2 className="size-4.5" />
                      </IconAction>
                    </TableCell>
                  </TableRow>
                );
              })}
            </LogTable>
          </div>
        </TabsContent>

        {/* ---------------- Coolant Level Log ---------------- */}
        <TabsContent value="coolant">
          <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground">Coolant Level Monitoring</h3>
                <p className="text-sm text-muted-foreground">Daily inspection of the coolant level</p>
              </div>

              <Dialog
                open={coolantOpen}
                onOpenChange={(open) => {
                  setCoolantOpen(open);
                  if (!open) resetCoolantForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2 px-5 w-full sm:w-auto">
                    <Plus className="size-4" />
                    Add Entry
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-115 p-0 overflow-hidden gap-0 max-h-[90vh] overflow-y-auto">
                  <div className="border-b px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Droplet className="size-5 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg">Add Coolant Log</DialogTitle>
                        <DialogDescription>Record today&apos;s coolant inspection</DialogDescription>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleAddCoolantLog} className="space-y-6 p-6">
                    <FieldGroup>
                      <Field>
                        <Label htmlFor="coolant-date">Date</Label>
                        <DatePicker
                          id="coolant-date"
                          value={coolantDate}
                          onChange={(v) => {
                            setCoolantDate(v);
                            setCoolantErrors((p) => ({ ...p, date: "" }));
                          }}
                          placeholder="Select date"
                          hasError={!!coolantErrors.date}
                        />
                        <FieldError message={coolantErrors.date} />
                      </Field>

                      <Field>
                        <Label htmlFor="coolant-level">Coolant Level</Label>
                        <Select
                          value={coolantLevel}
                          onValueChange={(v) => {
                            setCoolantLevel(v as CoolantLevelLog["coolantLevel"]);
                            setCoolantErrors((p) => ({ ...p, coolantLevel: "" }));
                          }}
                        >
                          <SelectTrigger id="coolant-level" type="button" className={cn("w-full", coolantErrors.coolantLevel && "border-destructive")}>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FULL">Full</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="REFILLED">Refilled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError message={coolantErrors.coolantLevel} />
                      </Field>

                      {/* Quantity Added: only relevant (and only shown/required) when level = Refilled.
                          For Full / Low there's nothing to log here, so the field stays hidden. */}
                      {coolantLevel === "REFILLED" && (
                        <Field>
                          <Label htmlFor="coolant-qty">Quantity Added (L)</Label>
                          <Input
                            id="coolant-qty"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={coolantQty}
                            onChange={(e) => {
                              setCoolantQty(e.target.value);
                              setCoolantErrors((p) => ({ ...p, quantityAdded: "" }));
                            }}
                            className={cn(coolantErrors.quantityAdded && "border-destructive focus-visible:ring-destructive")}
                            required
                          />
                          <FieldError message={coolantErrors.quantityAdded} />
                        </Field>
                      )}

                      <Field>
                        <Label htmlFor="coolant-remarks">Remarks</Label>
                        <Textarea id="coolant-remarks" placeholder="Optional notes..." value={coolantRemarks} onChange={(e) => setCoolantRemarks(e.target.value)} />
                      </Field>
                    </FieldGroup>

                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                      <DialogClose asChild>
                        <Button variant="outline" type="button" className="w-full sm:w-auto">
                          Cancel
                        </Button>
                      </DialogClose>

                      <Button type="submit" disabled={coolantSaving || !isCoolantValid} className="w-full sm:w-auto sm:min-w-32.5 gap-2 px-5">
                        {coolantSaving ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <LogTable loading={logsLoading && coolantLogs.length === 0} empty={coolantLogs.length === 0} emptyLabel="No coolant log entries yet." headers={["Date", "Level", "Quantity Added", "Remarks", "Actions"]}>
              {filteredCoolantLogs.map((log: CoolantLevelLog) => (
                <TableRow key={log.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setDetailsTarget({ type: "coolant", log })}>
                  <TableCell className="py-4 pl-6 pr-4 text-sm max-w-32">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CalendarIcon className="size-4 text-muted-foreground/80 shrink-0" />
                      <span className="truncate">{formatDateOnly(log.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 max-w-28">
                    <Badge variant="outline" className={cn("truncate max-w-full", coolantBadgeVariant(log.coolantLevel))}>
                      {coolantLabel(log.coolantLevel)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground max-w-32 truncate">
                    {log.quantityAdded ? `${Number(log.quantityAdded).toFixed(2)} L` : <span className="text-foreground/40">&mdash;</span>}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground max-w-50 truncate">{log.remarks || <span className="text-foreground/40">&mdash;</span>}</TableCell>
                  <TableCell className="py-4 pl-4 pr-4 sm:pr-6 text-right bg-card sticky right-0 shadow-lg sm:shadow-none border-l border-border/40 sm:border-l-0" onClick={(e) => e.stopPropagation()}>
                    <IconAction
                      label="Delete Entry"
                      className="size-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                      onClick={() => setDeleteTarget({ type: "coolant", id: log.id })}
                    >
                      <Trash2 className="size-4.5" />
                    </IconAction>
                  </TableCell>
                </TableRow>
              ))}
            </LogTable>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Log Entry (shared) */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete Entry?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">This action cannot be undone. This will permanently remove this log entry.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="h-11 w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLog} disabled={deleting} className="h-11 w-full sm:w-auto bg-destructive text-white hover:bg-destructive/90">
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete Entry
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Log Entry Details (shared) — lets you see everything a truncated table row hides,
          especially useful on mobile where columns get cut down. */}
      <Dialog open={!!detailsTarget} onOpenChange={(open) => !open && setDetailsTarget(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-105 p-0 overflow-hidden gap-0 max-h-[90vh] flex flex-col">
          <div className="border-b px-6 py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {detailsTarget?.type === "running" && <Clock className="size-5 text-primary" />}
                {detailsTarget?.type === "diesel" && <Fuel className="size-5 text-primary" />}
                {detailsTarget?.type === "coolant" && <Droplet className="size-5 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {detailsTarget?.type === "running" && "Running Log Details"}
                  {detailsTarget?.type === "diesel" && "Diesel Log Details"}
                  {detailsTarget?.type === "coolant" && "Coolant Log Details"}
                </DialogTitle>
                <DialogDescription>Full entry details</DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            {detailsTarget?.type === "running" && (
              <>
                <DetailRow label="Date" value={formatDateOnly(detailsTarget.log.date)} icon={<CalendarIcon className="size-4" />} />
                <DetailRow label="Start Time" value={formatTimeOnly(detailsTarget.log.startTime)} icon={<LogIn className="size-4" />} />
                <DetailRow label="Stop Time" value={formatTimeOnly(detailsTarget.log.stopTime)} icon={<LogOut className="size-4" />} />
                <DetailRow label="Total Running Hours" value={formatRunningHours(Number(detailsTarget.log.totalRunningHours))} icon={<Clock className="size-4" />} />
                <DetailRow label="Remarks" value={detailsTarget.log.remarks || "—"} multiline />
              </>
            )}

            {detailsTarget?.type === "diesel" && (
              <>
                <DetailRow label="Date" value={formatDateOnly(detailsTarget.log.date)} icon={<CalendarIcon className="size-4" />} />
                <DetailRow label="Diesel Refilled" value={`${Number(detailsTarget.log.dieselRefilled).toFixed(2)} L`} icon={<Fuel className="size-4" />} />
                <DetailRow label="Fuel Left in Stock (site)" value={`${Number(detailsTarget.log.fuelLeftInStock).toFixed(2)} L`} icon={<Gauge className="size-4" />} />
                {(detailsTarget.log as DieselConsumptionLog & { fuelLeftInGenerator?: number | null }).fuelLeftInGenerator != null && (
                  <DetailRow
                    label="Fuel Left Inside Generator"
                    value={`${Number((detailsTarget.log as DieselConsumptionLog & { fuelLeftInGenerator?: number | null }).fuelLeftInGenerator).toFixed(2)} L`}
                    icon={<Droplets className="size-4" />}
                  />
                )}
                <DetailRow label="Fuel Level Before Refill" value={`${(Number(detailsTarget.log.fuelLeftInStock) - Number(detailsTarget.log.dieselRefilled)).toFixed(2)} L`} icon={<Droplets className="size-4" />} />
                <DetailRow label="Remarks" value={detailsTarget.log.remarks || "—"} multiline />
              </>
            )}

            {detailsTarget?.type === "coolant" && (
              <>
                <DetailRow label="Date" value={formatDateOnly(detailsTarget.log.date)} icon={<CalendarIcon className="size-4" />} />
                <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-b-0">
                  <span className="text-sm text-muted-foreground shrink-0">Coolant Level</span>
                  <Badge variant="outline" className={cn("text-sm", coolantBadgeVariant(detailsTarget.log.coolantLevel))}>
                    {coolantLabel(detailsTarget.log.coolantLevel)}
                  </Badge>
                </div>
                {detailsTarget.log.coolantLevel === "REFILLED" && (
                  <DetailRow label="Quantity Added" value={detailsTarget.log.quantityAdded ? `${Number(detailsTarget.log.quantityAdded).toFixed(2)} L` : "—"} icon={<Droplet className="size-4" />} />
                )}
                <DetailRow label="Remarks" value={detailsTarget.log.remarks || "—"} multiline />
              </>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0">
            <DialogClose asChild>
              <Button variant="outline" type="button" className="w-full sm:w-auto">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value, icon, multiline = false }: { label: string; value: string; icon?: React.ReactNode; multiline?: boolean }) {
  return (
    <div className={cn("flex gap-4 py-2 border-b border-border/40 last:border-b-0", multiline ? "flex-col" : "items-center justify-between")}>
      <span className="text-sm text-muted-foreground shrink-0 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={cn("text-sm font-medium text-foreground wrap-break-word", multiline ? "text-left" : "text-right")}>{value}</span>
    </div>
  );
}

function LogTable({ loading, empty, emptyLabel, headers, children }: { loading: boolean; empty: boolean; emptyLabel: string; headers: string[]; children: React.ReactNode }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-border/50 pb-3">
          {headers.map((h) => (
            <Skeleton key={h} className="h-6 flex-1" />
          ))}
        </div>
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex gap-4 py-2 border-b border-border/20">
            {headers.map((h, i) => (
              <Skeleton key={i} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
          <Inbox className="size-6 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{emptyLabel}</h3>
        <p className="text-muted-foreground mt-1.5 max-w-sm">Add your first entry to start tracking this log.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
        <TableRow className="hover:bg-transparent">
          {headers.map((h, i) => (
            <TableHead
              key={h}
              className={cn(
                "font-bold text-xs uppercase tracking-wider py-4 px-4 text-foreground/80",
                i === 0 && "pl-6",
                i === headers.length - 1 && "pl-4 pr-4 sm:pr-6 text-right sticky right-0 bg-gray-50 dark:bg-muted/15 shadow-lg sm:shadow-none border-l border-border/40 sm:border-l-0"
              )}
            >
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/30">{children}</TableBody>
    </Table>
  );
}