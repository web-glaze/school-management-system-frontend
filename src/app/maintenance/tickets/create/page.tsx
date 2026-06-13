"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { locationService } from "@/services/maintenance.service";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocationStore, useComplaintStore, Location } from "@/store/maintenanceStore";
import apiClient from "@/services/api";
import { Building2, Layers, MapPin, ArrowUp, ArrowLeft, ArrowRight, AlertCircle, Flame, ShieldAlert, CheckCircle2, Undo, Loader2, Check, ChevronRight, ImagePlus, RefreshCw, Trash2, Plus } from "lucide-react";
export default function RaiseTicketPage() {
  const router = useRouter();
  const { createComplaints, loading: submitting } = useComplaintStore();
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await locationService.getDropdown();

        setLocations(response.data?.data || response.data || []);
      } finally {
        setLocationsLoading(false);
      }
    };

    loadLocations();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, issueId: number) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const currentIssue = issues.find((i) => i.id === issueId);

    const existingFiles = currentIssue?.attachments?.length || 0;

    if (existingFiles + files.length > 5) {
      toast.error("Maximum 5 files allowed per ticket");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiClient.post("/uploads/media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedFiles = response.data?.data?.files ?? [];

      console.log("UPLOAD RESPONSE", response.data);
      console.log("FILES", uploadedFiles);

      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? {
                ...issue,
                attachments: [
                  ...issue.attachments,
                  ...uploadedFiles.map((file: any) => ({
                    url: file.url,
                    type: file.type,
                  })),
                ],
              }
            : issue
        )
      );

      toast.success(`${uploadedFiles.length} ${uploadedFiles.length === 1 ? "file" : "files"} uploaded successfully`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const optionsToDisplay = useMemo(() => {
    if (locationsLoading) return [];
    return locations.filter((loc) => {
      if (currentParentId === null) {
        return !loc.parentId;
      }
      return loc.parentId === currentParentId;
    });
  }, [locations, currentParentId, locationsLoading]);

  const currentLevel = useMemo(() => {
    if (currentParentId === null) return 0;
    const idx = selectedPath.indexOf(currentParentId);
    return idx !== -1 ? idx + 1 : 0;
  }, [currentParentId, selectedPath]);

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

  const handleLocationClick = (loc: Location) => {
    const children = locations.filter((item) => item.parentId === loc.id);

    if (children.length > 0) {
      const newPath = [...selectedPath, loc.id];
      setSelectedPath(newPath);
      setCurrentParentId(loc.id);
    } else {
      let currentLevelIndex = 0;
      if (currentParentId !== null) {
        currentLevelIndex = selectedPath.indexOf(currentParentId) + 1;
      }
      const updated = selectedPath.slice(0, currentLevelIndex);
      updated[currentLevelIndex] = loc.id;
      setSelectedPath(updated);
    }
  };

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

  const isLeafSelected = useMemo(() => {
    if (selectedPath.length === 0) return false;
    const lastId = selectedPath[selectedPath.length - 1];
    const children = locations.filter((loc) => loc.parentId === lastId);
    return children.length === 0;
  }, [selectedPath, locations]);

  const locationPath = selectedPath
    .map((id) => locations.find((loc) => loc.id === id)?.name)
    .filter(Boolean)
    .join(" > ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalidIssue = issues.find((issue) => !issue.description.trim());

    if (invalidIssue) {
      toast.error("Please fill issue summary.");
      return;
    }

    const validIssues = issues.filter((issue) => issue.description.trim() !== "");

    if (!validIssues.length) {
      toast.error("Please add at least one issue.");
      return;
    }

    try {
      await createComplaints(
        validIssues.map((issue) => ({
          description: issue.description,
          priority: issue.priority,
          attachments: issue.attachments,
          locationType: locationPath,
          subLocation: selectedPath[selectedPath.length - 1],
        }))
      );

      toast.success(`${validIssues.length} ticket${validIssues.length > 1 ? "s" : ""} created successfully`);

      router.push("../tickets");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create tickets");
    }
  };

  const priorities = [
    {
      value: "LOW",
      label: "Low",
      icon: ArrowUp,
      borderColorClass: "hover:border-emerald-500/40 focus:border-emerald-500",
      activeBgClass: "border-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01]",
      colorClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      value: "MEDIUM",
      label: "Medium",
      icon: AlertCircle,
      borderColorClass: "hover:border-blue-500/40 focus:border-blue-500",
      activeBgClass: "border-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.01]",
      colorClass: "text-blue-600 dark:text-blue-400",
    },
    {
      value: "HIGH",
      label: "High",
      icon: Flame,
      borderColorClass: "hover:border-amber-500/40 focus:border-amber-500",
      activeBgClass: "border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.01]",
      colorClass: "text-amber-600 dark:text-amber-400",
    },
    {
      value: "URGENT",
      label: "Urgent",
      icon: ShieldAlert,
      borderColorClass: "hover:border-red-500/40 focus:border-red-500",
      activeBgClass: "border-red-500 bg-red-500/[0.03] dark:bg-red-500/[0.01]",
      colorClass: "text-red-600 dark:text-red-400",
    },
  ];

  const ActiveLevelIcon = levelMetadata.icon;

  const [issues, setIssues] = useState([
    {
      id: 1,
      description: "",
      priority: "MEDIUM",
      attachments: [] as {
        url: string;
        type: "IMAGE" | "VIDEO";
      }[],
    },
  ]);
  const addIssue = () => {
    setIssues((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: "",
        priority: "MEDIUM",
        attachments: [],
      },
    ]);
  };

  const removeIssue = (id: number) => {
    setIssues(issues.filter((issue) => issue.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between flex-col-reverse md:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Raise New Ticket</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">Follow the steps below to create a maintenance ticket quickly.</p>
          </div>
          <Link className="w-full md:w-auto" href="/maintenance/tickets">
            <Button variant="outline" className="gap-2 border-border/80 hover:bg-muted font-medium transition-all shadow-sm">
              <Undo size={16} /> Go Back
            </Button>
          </Link>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            <div className="flex flex-col items-center z-10 relative">
              <button
                type="button"
                onClick={() => selectedPath.length > 0 && setStep(1)}
                disabled={step === 1}
                className={`size-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                  step === 1 ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105" : "bg-muted border-border text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="size-5 stroke-[2.5]" /> : "1"}
              </button>
              <span className={`text-xs font-semibold mt-2.5 transition-colors ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>Select Location</span>
            </div>

            <div className="absolute left-[15%] right-[15%] top-5 h-[2px] bg-muted z-0">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: step === 1 ? "0%" : "100%" }} />
            </div>

            <div className="flex flex-col items-center z-10">
              <div
                className={`size-10 rounded-full flex items-center justify-center font-bold  border-2 transition-all ${
                  step === 2 ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105" : "bg-muted border-border text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold mt-2.5 transition-colors ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>Describe Issue</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden min-h-[420px] flex flex-col transition-all">
          <div className="border-b border-border/60 px-6 py-5 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">{step === 1 ? "Location Selection" : "Describe the Issue"}</h2>
                </div>
              </div>
              <div className="text-xs font-semibold text-muted-foreground bg-muted border border-border/60 px-3 py-1 rounded-full">Step {step}</div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex-1 flex flex-col">
            {step === 1 ? (
              /* ================== STEP 1: LOCATIONS ================== */
              <div className="space-y-8 flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                <div className="space-y-6">
                  {selectedPath.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/[0.02] dark:bg-primary/[0.005] rounded-xl border border-primary/10 text-xs animate-in fade-in duration-300">
                      <span className="text-muted-foreground font-semibold">Active Path:</span>
                      <span className="text-primary font-bold">Campus</span>
                      {selectedPath.map((id, index) => {
                        const name = locations.find((loc) => loc.id === id)?.name;
                        if (!name) return null;
                        return (
                          <div key={id} className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-200">
                            <ChevronRight className="size-3.5 text-muted-foreground/60" />
                            <span className={`font-semibold ${index === selectedPath.length - 1 ? "text-foreground font-bold" : "text-muted-foreground font-semibold"}`}>{name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {locationsLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                      <Loader2 className="size-9 text-primary animate-spin" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Loading structural catalog...</p>
                        <p className="text-xs text-muted-foreground">Contacting the maintenance server</p>
                      </div>
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/80">
                        <MapPin className="size-6 stroke-[1.5]" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">No Locations Available</h3>
                      <p className="text-muted-foreground mt-1 max-w-xs text-xs">There are no maintenance locations configured in the database yet.</p>
                    </div>
                  ) : (
                    /* Drill-down single level view selector */
                    <div className="space-y-5 animate-in fade-in duration-300" key={currentParentId}>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="size-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{currentLevel + 1}</span>
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
                                isSelected ? "border-primary bg-primary/[0.04] text-primary shadow-sm ring-1 ring-primary/30" : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40"
                              }`}
                            >
                              <div className={`size-9 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
                                <ActiveLevelIcon className="size-4.5" />
                              </div>
                              <div className="flex-1 min-w-0 pr-5">
                                <span className="block text-sm font-semibold truncate leading-normal text-foreground group-hover:text-primary transition-colors">{opt.name}</span>
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

                <div className="flex items-center justify-between pt-6 border-t border-border/80 mt-10">
                  {currentParentId !== null ? (
                    <Button type="button" variant="outline" onClick={handleBackLocation} className="gap-2 px-5">
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {isLeafSelected && (
                    <Button className="gap-2 px-5" type="button" onClick={() => setStep(2)}>
                      Continue to Details
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* ================== STEP 2: DETAILS ================== */
              <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                <div className="space-y-6">
                  <div className="flex flex-row items-center justify-between gap-3 px-4 py-3 bg-primary/[0.03] border border-primary/15 rounded-xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Selected Location</span>
                        <p className="text-sm font-semibold text-foreground truncate mt-0.5">{locationPath}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" type="button" onClick={() => setStep(1)} className="shrink-0 text-xs gap-1.5 h-8 px-3 border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all">
                      <RefreshCw className="size-3" />
                      Change
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-bold">Issues</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Add one or more issues at this location</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addIssue} className="gap-1.5 h-9 px-4 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-sm font-medium">
                        <Plus className="size-3.5" />
                        Add Issue
                      </Button>
                    </div>

                    {issues.map((issue, index) => (
                      <div key={issue.id} className="relative border border-border/70 rounded-2xl overflow-hidden bg-card transition-all hover:border-border">
                        <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border/60">
                          <div className="flex items-center gap-2.5">
                            <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{index + 1}</span>
                            <h3 className="text-sm font-bold text-foreground">Issue #{index + 1}</h3>
                          </div>
                          {issues.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeIssue(issue.id)}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2.5 py-1.5 rounded-lg hover:bg-destructive/5 font-medium"
                            >
                              <Trash2 className="size-3.5" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-5">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Issue Summary</Label>
                              <Textarea
                                placeholder="Describe the maintenance issue in detail..."
                                value={issue.description}
                                rows={5}
                                className="resize-none text-sm leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                                onChange={(e) => {
                                  setIssues(issues.map((i) => (i.id === issue.id ? { ...i, description: e.target.value } : i)));
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority Level</Label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {priorities.map((p) => {
                                  const Icon = p.icon;
                                  const isActive = issue.priority === p.value;
                                  return (
                                    <Button
                                      key={p.value}
                                      type="button"
                                      onClick={() => setIssues(issues.map((i) => (i.id === issue.id ? { ...i, priority: p.value } : i)))}
                                      className={`relative transition-all duration-200 ${isActive ? `${p.activeBgClass} ${p.colorClass} shadow-sm` : `border-border/60 text-muted-foreground bg-muted/20 ${p.borderColorClass}`}`}
                                    >
                                      <Icon className={`size-4 shrink-0 ${isActive ? p.colorClass : "text-muted-foreground"}`} />
                                      <span className={isActive ? p.colorClass : ""}>{p.label}</span>
                                      {isActive && <span className="absolute top-2 right-2 size-1 rounded-full bg-current opacity-70" />}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="hidden lg:flex items-stretch">
                            <div className="w-px bg-border/60 mx-1" />
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attach Photo</Label>

                              {issue.attachments.length === 0 ? (
                                <label
                                  htmlFor={`image-upload-${issue.id}`}
                                  className="group flex flex-col items-center justify-center gap-3 h-[120px] md:h-[150px] border-2 border-dashed border-border/60 rounded-xl cursor-pointer bg-muted/20 hover:bg-primary/[0.02] hover:border-primary/40 transition-all duration-200"
                                >
                                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <ImagePlus className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Click to upload photo</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                                  </div>
                                  <Input id={`image-upload-${issue.id}`} type="file" multiple accept="image/*,video/*" className="sr-only" onChange={(e) => handleImageUpload(e, issue.id)} />
                                </label>
                              ) : (
                                <div className="grid grid-cols-2 gap-3">
                                  {issue.attachments.map((file, idx) => (
                                    <div key={idx} className="relative rounded-xl overflow-hidden border border-border/60 group">
                                      {file.type === "IMAGE" ? <img src={file.url} alt={`Attachment ${idx}`} className="w-full h-[140px] object-cover" /> : <video src={file.url} className="w-full h-[140px] object-cover" />}

                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setIssues(
                                              issues.map((i) =>
                                                i.id === issue.id
                                                  ? {
                                                      ...i,
                                                      attachments: i.attachments.filter((_, attachmentIndex) => attachmentIndex !== idx),
                                                    }
                                                  : i
                                              )
                                            )
                                          }
                                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-medium"
                                        >
                                          <Trash2 className="size-4" />
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {issue.attachments.length < 5 && (
                                <label htmlFor={`image-add-${issue.id}`} className="flex items-center justify-center gap-2 h-12 border border-dashed rounded-xl cursor-pointer hover:bg-muted">
                                  <Plus className="size-4" />
                                  Add More Files
                                  <Input id={`image-add-${issue.id}`} type="file" multiple accept="image/*,video/*" className="sr-only" onChange={(e) => handleImageUpload(e, issue.id)} />
                                </label>
                              )}

                              {uploading && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Loader2 className="size-3.5 animate-spin text-primary" />
                                  Uploading...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border/80 mt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2 px-5">
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>

                  <Button type="submit" disabled={submitting || uploading} className="gap-2 px-5 h-12 font-semibold">
                    {uploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Uploading Image...
                      </>
                    ) : submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
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
