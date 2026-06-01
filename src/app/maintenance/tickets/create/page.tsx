"use client";

import { logError } from "@/lib/api-helpers";
import { notify } from "@/lib/notify";
import { imageUrl as resolveImageUrl } from "@/lib/image-url";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {Upload,} from "lucide-react";

import {
  Building2,
  Layers,
  MapPin,
  Map,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Flame,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Undo,
  Loader2,
  Check,
  ChevronRight,
  Plus,
} from "lucide-react";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Location {
  id: string;
  name: string;
  parentId?: string | null;
}

// One complaint item inside a ticket. A ticket can carry many items so a
// user with several issues in the same location only files one ticket.
interface IssueItem {
  id: string;
  description: string;
  priority: string;
  imageUrl?: string;
  uploading?: boolean;
}

function newIssue(): IssueItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tmp-${Math.random().toString(36).slice(2)}`,
    description: "",
    priority: "MEDIUM",
    imageUrl: "",
  };
}

export default function RaiseTicketPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);

  // Multi-item issues. Always has at least one row.
  const [items, setItems] = useState<IssueItem[]>([newIssue()]);

  // Backwards-compatible aliases — first item's description/priority/image
  // are still the "primary" fields, so existing rendering code keeps working.
  const description = items[0]?.description ?? "";
  const priority = items[0]?.priority ?? "MEDIUM";
  const imageUrl = items[0]?.imageUrl ?? "";

  const setDescription = (v: string) =>
    setItems((prev) => prev.map((it, i) => (i === 0 ? { ...it, description: v } : it)));
  const setPriority = (v: string) =>
    setItems((prev) => prev.map((it, i) => (i === 0 ? { ...it, priority: v } : it)));
  const setImageUrl = (v: string) =>
    setItems((prev) => prev.map((it, i) => (i === 0 ? { ...it, imageUrl: v } : it)));

  const updateItem = (id: string, patch: Partial<IssueItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addItem = () => setItems((prev) => [...prev, newIssue()]);

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.id !== id)));

  // Drill-down and Path State
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  /* FETCH LOCATIONS */
  const fetchLocations = async () => {
    try {
      setLocationsLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/api/locations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLocations(
        Array.isArray(response.data) ? response.data : response.data.data || [],
      );
    } catch (error) {
      logError("tickets.create.fetchLocations", error);
    } finally {
      setLocationsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout( ()=>{
    fetchLocations();},0);
  }, []);

  const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    setUploading(true);

    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}/api/uploads/image`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    // Defensive: backend wraps in { data: { url } }, but tolerate both shapes
    // (and a future bare-string url) so a shape change doesn't crash the form.
    const rawData = response.data;
    const inner = (rawData && (rawData.data ?? rawData)) || {};
    const uploadedUrl: string | undefined =
      typeof inner === "string" ? inner : inner.url ?? inner.path;

    if (!uploadedUrl) {
      throw new Error("Upload succeeded but server returned no URL");
    }

    setImageUrl(uploadedUrl);

    notify.success("Image uploaded");
  } catch (error) {
    logError("tickets.create.upload", error);

    notify.error("Failed to upload image");
  } finally {
    setUploading(false);
  }
};

  /* COMPUTE ACTIVE VISIBLE OPTIONS */
  const optionsToDisplay = useMemo(() => {
    if (locationsLoading) return [];
    return locations.filter((loc) => {
      if (currentParentId === null) {
        return !loc.parentId;
      }
      return loc.parentId === currentParentId;
    });
  }, [locations, currentParentId, locationsLoading]);

  /* COMPUTE CURRENT TRAVERSED LEVEL INDEX */
  const currentLevel = useMemo(() => {
    if (currentParentId === null) return 0;
    const idx = selectedPath.indexOf(currentParentId);
    return idx !== -1 ? idx + 1 : 0;
  }, [currentParentId, selectedPath]);

  /* COMPUTE METADATA FOR ACTIVE DISPLAYED LEVEL */
  const levelMetadata = useMemo(() => {
    switch (currentLevel) {
      case 0:
        return {
          title: "Primary Location",
          icon: Building2,
        };
      case 1:
        return {
          title: "Sub Location",
          icon: Layers,
        };
      default:
        return {
          title: "Sub Location",
          icon: MapPin,
        };
    }
  }, [currentLevel]);

  /* HANDLE CARD CLICK (DRILL DOWN OR SELECT LEAF) */
  const handleLocationClick = (loc: Location) => {
    const children = locations.filter((item) => item.parentId === loc.id);

    if (children.length > 0) {
      // Has nested sub-locations: Drill down
      const newPath = [...selectedPath, loc.id];
      setSelectedPath(newPath);
      setCurrentParentId(loc.id);
    } else {
      // Leaf node (no children): Select it at the current depth
      let currentLevelIndex = 0;
      if (currentParentId !== null) {
        currentLevelIndex = selectedPath.indexOf(currentParentId) + 1;
      }
      const updated = selectedPath.slice(0, currentLevelIndex);
      updated[currentLevelIndex] = loc.id;
      setSelectedPath(updated);
    }
  };

  /* GO BACK ONE LEVEL */
  const handleBackLocation = () => {
    if (selectedPath.length === 0) return;

    const updatedPath = selectedPath.slice(0, -1);

    setSelectedPath(updatedPath);

    if (updatedPath.length === 0) {
      setCurrentParentId(null);
    } else {
      setCurrentParentId(updatedPath[updatedPath.length - 1]);
    }
  };

  /* CHECK IF A LEAF HAS BEEN SELECTED */
  const isLeafSelected = useMemo(() => {
    if (selectedPath.length === 0) return false;
    const lastId = selectedPath[selectedPath.length - 1];
    const children = locations.filter((loc) => loc.parentId === lastId);
    return children.length === 0;
  }, [selectedPath, locations]);

  /* BUILD LOCATION PATH */
  const locationPath = selectedPath
    .map((id) => locations.find((loc) => loc.id === id)?.name)
    .filter(Boolean)
    .join(" > ");

  /* SUBMIT COMPLAINT */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trim and drop empty rows. At least one valid description required.
    const cleanItems = items
      .map((it) => ({
        description: it.description.trim(),
        priority: it.priority,
        imageUrl: it.imageUrl?.trim() || undefined,
      }))
      .filter((it) => it.description.length > 0);

    if (cleanItems.length === 0) {
      notify.error("Please describe at least one issue.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/complaints`,
        {
          // Legacy fields populated from the first item so older readers
          // keep working — backend mirrors these onto the parent row.
          description: cleanItems[0].description,
          priority: cleanItems[0].priority,
          imageUrl: cleanItems[0].imageUrl,
          // New multi-item payload — backend will fan these out into rows.
          items: cleanItems,
          locationType: locationPath,
          subLocation: selectedPath[selectedPath.length - 1],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setItems([newIssue()]);
      router.push("../tickets");
    } catch (error) {
      logError("tickets.create.submit", error);
      notify.error("Failed to register complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* PER-ITEM IMAGE UPLOAD */
  const handleItemImageUpload = async (
    itemId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      updateItem(itemId, { uploading: true });
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/api/uploads/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const rawData = response.data;
      const inner = (rawData && (rawData.data ?? rawData)) || {};
      const uploadedUrl: string | undefined =
        typeof inner === "string" ? inner : inner.url ?? inner.path;

      if (!uploadedUrl) {
        throw new Error("Upload succeeded but server returned no URL");
      }

      updateItem(itemId, { imageUrl: uploadedUrl, uploading: false });
    } catch (error) {
      logError("tickets.create.itemUpload", error);
      updateItem(itemId, { uploading: false });
      notify.error("Failed to upload image");
    }
  };

  const priorities = [
    {
      value: "LOW",
      label: "Low",
      description: "Minor issue that can be scheduled for resolution later.",
      icon: ArrowUp,
      borderColorClass: "hover:border-emerald-500/40 focus:border-emerald-500",
      activeBgClass:
        "border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01]",
      colorClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      value: "MEDIUM",
      label: "Medium",
      description: "Standard maintenance request requiring normal attention.",
      icon: AlertCircle,
      borderColorClass: "hover:border-blue-500/40 focus:border-blue-500",
      activeBgClass:
        "border-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.01]",
      colorClass: "text-blue-600 dark:text-blue-400",
    },
    {
      value: "HIGH",
      label: "High",
      description: "Requires priority attention. Could cause disruption.",
      icon: Flame,
      borderColorClass: "hover:border-amber-500/40 focus:border-amber-500",
      activeBgClass:
        "border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.01]",
      colorClass: "text-amber-600 dark:text-amber-400",
    },
    {
      value: "URGENT",
      label: "Urgent",
      description:
        "Immediate action required. High-risk safety or core system hazard.",
      icon: ShieldAlert,
      borderColorClass: "hover:border-red-500/40 focus:border-red-500",
      activeBgClass: "border-red-500 bg-red-500/[0.03] dark:bg-red-500/[0.01]",
      colorClass: "text-red-600 dark:text-red-400",
    },
  ];

  const ActiveLevelIcon = levelMetadata.icon;

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Raise New Ticket
            </h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Follow our simple steps to report maintenance problems around
              campus.
            </p>
          </div>
          <Link href="/maintenance/tickets">
            <Button
              variant="outline"
              className="gap-2 border-border/80 hover:bg-muted font-medium transition-all shadow-sm"
            >
              <Undo size={16} /> Go Back
            </Button>
          </Link>
        </div>

        {/* Step progress tracker */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            {/* Step 1 Node */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => selectedPath.length > 0 && setStep(1)}
                disabled={step === 1}
                className={`size-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                  step === 1
                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "bg-primary/10 border-primary/20 text-primary cursor-pointer hover:bg-primary/20"
                }`}
              >
                {step > 1 ? <Check className="size-5 stroke-[2.5]" /> : "1"}
              </button>
              <span
                className={`text-xs font-semibold mt-2.5 transition-colors ${step === 1 ? "text-primary" : "text-muted-foreground"}`}
              >
                Select Location
              </span>
            </div>

            {/* Connecting Progress Line */}
            <div className="absolute left-[15%] right-[15%] top-5 h-[2px] bg-muted -z-0">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: step === 1 ? "0%" : "100%" }}
              />
            </div>

            {/* Step 2 Node */}
            <div className="flex flex-col items-center z-10">
              <div
                className={`size-10 rounded-full flex items-center justify-center font-bold  border-2 transition-all ${
                  step === 2
                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                2
              </div>
              <span
                className={`text-xs font-semibold mt-2.5 transition-colors ${step === 2 ? "text-primary" : "text-muted-foreground"}`}
              >
                Describe Issue
              </span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden min-h-[420px] flex flex-col transition-all">
          {/* Form Card Header */}
          <div className="border-b border-border/60 px-6 py-5 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {step === 1 ? (
                    <Map className="size-5 text-primary" />
                  ) : (
                    <Sparkles className="size-5 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {step === 1
                      ? "Location Selection"
                      : "Describe the Maintenance Issue"}
                  </h2>
                </div>
              </div>
              <div className="text-xs font-semibold text-muted-foreground bg-muted border border-border/60 px-3 py-1 rounded-full">
                Step {step} of 2
              </div>
            </div>
          </div>

          {/* Form Card Body */}
          <div className="p-6 md:p-8 flex-1 flex flex-col">
            {step === 1 ? (
              /* ================== STEP 1: LOCATIONS ================== */
              <div className="space-y-8 flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                <div className="space-y-6">
                  {/* Real-time Breadcrumb Path display */}
                  {selectedPath.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/[0.02] dark:bg-primary/[0.005] rounded-xl border border-primary/10 text-xs animate-in fade-in duration-300">
                      <span className="text-muted-foreground font-semibold">
                        Active Path:
                      </span>
                      <span className="text-primary font-bold">Campus</span>
                      {selectedPath.map((id, index) => {
                        const name = locations.find(
                          (loc) => loc.id === id,
                        )?.name;
                        if (!name) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-200"
                          >
                            <ChevronRight className="size-3.5 text-muted-foreground/60" />
                            <span
                              className={`font-semibold ${
                                index === selectedPath.length - 1
                                  ? "text-foreground font-bold"
                                  : "text-muted-foreground font-semibold"
                              }`}
                            >
                              {name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {locationsLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                      <Loader2 className="size-9 text-primary animate-spin" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Loading structural catalog...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Contacting the maintenance server
                        </p>
                      </div>
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/80">
                        <MapPin className="size-6 stroke-[1.5]" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">
                        No Locations Available
                      </h3>
                      <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                        There are no maintenance locations configured in the
                        database yet.
                      </p>
                    </div>
                  ) : (
                    /* Drill-down single level view selector */
                    <div
                      className="space-y-5 animate-in fade-in duration-300"
                      key={currentParentId}
                    >
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="size-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                            {currentLevel + 1}
                          </span>
                          {levelMetadata.title}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pl-7">
                        {optionsToDisplay.map((opt) => {
                          const isSelected = selectedPath.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleLocationClick(opt)}
                              className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${
                                isSelected
                                  ? "border-primary bg-primary/[0.04] text-primary shadow-sm ring-1 ring-primary/30"
                                  : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40"
                              }`}
                            >
                              <div
                                className={`size-9 rounded-lg flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                }`}
                              >
                                <ActiveLevelIcon className="size-4.5" />
                              </div>
                              <div className="flex-1 min-w-0 pr-5">
                                <span className="block text-sm font-semibold truncate leading-normal text-foreground group-hover:text-primary transition-colors">
                                  {opt.name}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-in zoom-in duration-200">
                                  <div className="size-5 rounded-full bg-primary flex items-center justify-center text-white">
                                    <Check className="size-3 stroke-[3]" />
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Continue Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-border/80 mt-10">
                  {currentParentId !== null ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackLocation}
                      className="gap-2 px-5"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {isLeafSelected && (
                    <Button
                      className="gap-2 px-5"
                      type="button"
                      onClick={() => setStep(2)}
                    >
                      Continue to Details
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* ================== STEP 2: DETAILS ================== */
              <form
                onSubmit={handleSubmit}
                className="space-y-6 flex-1 flex flex-col justify-between animate-in fade-in duration-200"
              >
                <div className="space-y-6">
                  {/* Context Path Summary */}
                  <div className="bg-primary/[0.02] dark:bg-primary/[0.005] border border-primary/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="size-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Target Location
                        </span>
                        <p className="text-xs font-bold text-foreground mt-0.5">
                          {locationPath}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setStep(1)}
                    >
                      Change Location
                    </Button>
                  </div>

                  {/* Multi-item issues list. Each row is one complaint inside
                     this single ticket. Add/remove rows freely. */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">
                        Issues ({items.length})
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addItem}
                        className="gap-1.5 h-8 text-xs"
                      >
                        <Plus className="size-3.5" />
                        Add Another Issue
                      </Button>
                    </div>

                    {items.map((it, idx) => (
                      <div
                        key={it.id}
                        className="rounded-xl border border-border/70 bg-card p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Issue {idx + 1}
                          </span>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(it.id)}
                              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 gap-1"
                            >
                              <Undo className="size-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={it.description}
                            onChange={(e) =>
                              updateItem(it.id, { description: e.target.value })
                            }
                            placeholder="e.g. AC leaking in room 202, tap broken, lock stuck etc."
                            className="min-h-[90px] rounded-lg border-border/80 focus-visible:ring-primary focus-visible:border-primary text-xs p-3 leading-relaxed"
                          />
                        </div>

                        {/* Priority cards (compact) */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Priority</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {priorities.map((p) => {
                              const isSelected = it.priority === p.value;
                              const Icon = p.icon;
                              return (
                                <button
                                  key={p.value}
                                  type="button"
                                  onClick={() =>
                                    updateItem(it.id, { priority: p.value })
                                  }
                                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                                    isSelected
                                      ? p.activeBgClass +
                                        " shadow-sm ring-1 ring-primary/10"
                                      : "border-border bg-card hover:bg-muted/30"
                                  }`}
                                >
                                  <div
                                    className={`size-6 rounded-md flex items-center justify-center ${
                                      isSelected
                                        ? "bg-card shadow-sm border"
                                        : "bg-muted"
                                    }`}
                                  >
                                    <Icon className={`size-3.5 ${p.colorClass}`} />
                                  </div>
                                  <span className="text-[11px] font-semibold text-foreground">
                                    {p.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Per-item image upload */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Image (optional)</Label>
                          {!it.imageUrl ? (
                            <div className="border-2 border-dashed rounded-lg p-4 text-center bg-muted/10">
                              <input
                                id={`item-image-${it.id}`}
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleItemImageUpload(it.id, e)
                                }
                                className="hidden"
                              />
                              <label
                                htmlFor={`item-image-${it.id}`}
                                className="cursor-pointer inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
                              >
                                <Upload className="size-3.5" />
                                {it.uploading ? "Uploading..." : "Upload image"}
                              </label>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="rounded-lg overflow-hidden border">
                                <img
                                  // The upload returns a relative path like
                                  // /uploads/general/<file>.png. The helper
                                  // prepends NEXT_PUBLIC_API_URL so the
                                  // browser hits the backend (port 3000)
                                  // instead of the frontend (port 3001).
                                  src={resolveImageUrl(it.imageUrl)}
                                  alt="Preview"
                                  className="w-full max-h-56 object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateItem(it.id, { imageUrl: "" })
                                }
                                className="text-xs text-rose-600 hover:bg-rose-50 h-7 px-2"
                              >
                                Remove image
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-5 border-t border-border/80 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2 px-5"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="gap-2 px-5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
