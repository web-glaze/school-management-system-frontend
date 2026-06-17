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
import { Building2, Layers, MapPin, ArrowUp, ArrowLeft, ArrowRight, AlertCircle, Flame, ShieldAlert, CheckCircle2, Loader2, Check, ChevronRight, RefreshCw, Trash2, Plus, X, ImagePlus, Ticket, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function RaiseTicketPage() {
  const router = useRouter();
  const { createComplaints, loading: submitting } = useComplaintStore();
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  const [issues, setIssues] = useState([
    {
      id: 1,
      description: "",
      priority: "MEDIUM",
      attachments: [] as { url: string; type: "IMAGE" | "VIDEO" }[],
    },
  ]);

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
      toast.error("Maximum 5 files allowed per issue");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await apiClient.post("/uploads/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFiles = response.data?.data?.files ?? [];

      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? {
                ...issue,
                attachments: [...issue.attachments, ...uploadedFiles.map((file: any) => ({ url: file.url, type: file.type }))],
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
      if (currentParentId === null) return !loc.parentId;
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
        return { title: "Select Building / Block", subtitle: "Choose the main building or block", icon: Building2 };
      case 1:
        return { title: "Select Floor / Wing", subtitle: "Choose the specific floor or wing", icon: Layers };
      default:
        return { title: "Select Room / Area", subtitle: "Choose the exact room or area", icon: MapPin };
    }
  }, [currentLevel]);

  const handleLocationClick = (loc: Location) => {
    const children = locations.filter((item) => item.parentId === loc.id);
    if (children.length > 0) {
      setSelectedPath([...selectedPath, loc.id]);
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
    setCurrentParentId(updatedPath.length === 0 ? null : updatedPath[updatedPath.length - 1]);
  };

  const isLeafSelected = useMemo(() => {
    if (selectedPath.length === 0) return false;
    const lastId = selectedPath[selectedPath.length - 1];
    return locations.filter((loc) => loc.parentId === lastId).length === 0;
  }, [selectedPath, locations]);

  const locationPath = selectedPath
    .map((id) => locations.find((loc) => loc.id === id)?.name)
    .filter(Boolean)
    .join(" › ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (issues.find((issue) => !issue.description.trim())) {
      toast.error("Please fill in all issue descriptions.");
      return;
    }

    if (issues.find((issue) => issue.attachments.length === 0)) {
      toast.error("Each issue must have at least one image or video.");
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
    { value: "LOW", label: "Low", icon: ArrowUp, color: "emerald" },
    { value: "MEDIUM", label: "Medium", icon: AlertCircle, color: "blue" },
    { value: "HIGH", label: "High", icon: Flame, color: "amber" },
    { value: "URGENT", label: "Urgent", icon: ShieldAlert, color: "red" },
  ] as const;

  const priorityStyles: Record<string, { active: string; icon: string; indicator: string }> = {
    LOW: {
      active: "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100",
      icon: "text-emerald-500",
      indicator: "bg-emerald-500",
    },
    MEDIUM: {
      active: "border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100",
      icon: "text-blue-500",
      indicator: "bg-blue-500",
    },
    HIGH: {
      active: "border-amber-500 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100",
      icon: "text-amber-500",
      indicator: "bg-amber-500",
    },
    URGENT: {
      active: "border-red-500 bg-red-50 text-red-700 shadow-sm shadow-red-100",
      icon: "text-red-500",
      indicator: "bg-red-500",
    },
  };

  const ActiveLevelIcon = levelMetadata.icon;

  const addIssue = () => {
    setIssues((prev) => [...prev, { id: Date.now(), description: "", priority: "MEDIUM", attachments: [] }]);
  };

  const removeIssue = (id: number) => {
    setIssues(issues.filter((issue) => issue.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl w-full mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Raise a Ticket</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Report a maintenance issue in 2 quick steps.</p>
          </div>
          <Link href="/maintenance/tickets">
            <Button variant="outline" className="gap-2 h-9">
              <ArrowLeft className="size-3.5" />
              <span>Back</span>
            </Button>
          </Link>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`size-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-all duration-300 ${
                  step > 1 ? "bg-green-700 border-green-700  text-white" : step === 1 ? "bg-primary border-primary text-white" : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="size-4 stroke-[3]" /> : "1"}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-semibold transition-colors ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>Select Location</p>
                <p className="text-xs text-muted-foreground">Where is the issue?</p>
              </div>
            </div>
            <div className="flex-1 mx-3 h-0.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: step === 2 ? "100%" : "0%" }} />
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="hidden sm:block text-right">
                <p className={`text-sm font-semibold transition-colors ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}>Describe Issue</p>
                <p className="text-xs text-muted-foreground">What happened?</p>
              </div>
              <div
                className={`size-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-all duration-300 ${
                  step === 2 ? "bg-primary border-primary text-white" : "border-border bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl overflow-hidden">
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-left-3 duration-300">
              <div className="px-6 py-4 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">{levelMetadata.title}</h2>
                      <p className="text-xs text-muted-foreground">{levelMetadata.subtitle}</p>
                    </div>
                  </div>
                  {selectedPath.length > 0 && (
                    <Badge variant="outline" className="text-xs font-medium">
                      Level {currentLevel + 1}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {selectedPath.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 px-3 py-2.5 rounded-lg bg-muted/50 border text-xs">
                    <MapPin className="size-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground font-medium ml-0.5">Campus</span>
                    {selectedPath.map((id) => {
                      const name = locations.find((loc) => loc.id === id)?.name;
                      if (!name) return null;
                      return (
                        <span key={id} className="flex items-center gap-1">
                          <ChevronRight className="size-3 text-muted-foreground/50" />
                          <span className="font-semibold text-foreground">{name}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {locationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading locations…</p>
                  </div>
                ) : locations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                      <MapPin className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">No Locations Configured</p>
                      <p className="text-sm text-muted-foreground mt-1">Contact your administrator to set up locations.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 animate-in fade-in duration-200" key={currentParentId}>
                    {optionsToDisplay.map((opt) => {
                      const isSelected = selectedPath.includes(opt.id);
                      const hasChildren = locations.some((l) => l.parentId === opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleLocationClick(opt)}
                          className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm"
                          }`}
                        >
                          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
                            <ActiveLevelIcon className="size-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate transition-colors ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>{opt.name}</p>
                            {hasChildren && <p className="text-xs text-muted-foreground mt-0.5">Has sub-locations</p>}
                          </div>

                          {isSelected ? (
                            <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <Check className="size-3.5 text-white stroke-[3]" />
                            </div>
                          ) : (
                            hasChildren && <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-colors" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {currentParentId !== null ? (
                    <Button type="button" variant="outline" onClick={handleBackLocation} className="gap-2">
                      <ArrowLeft className="size-4" />
                      Go Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {isLeafSelected && (
                    <Button type="button" onClick={() => setStep(2)} className="gap-2">
                      Continue to Details
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="px-6 py-4 border-b bg-muted/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-foreground">Issue Details</h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{locationPath}</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" type="button" onClick={() => setStep(1)} className="gap-1.5 text-xs bg-white">
                    <RefreshCw className="size-3" />
                    Change
                  </Button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Issues
                      <Badge variant="secondary" className="ml-2 text-xs font-semibold">
                        {issues.length}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">You can report multiple issues at this location at once</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addIssue} className="gap-1.5 border-0 text-xs h-8 bg-primary text-white font-semibold hover:bg-primary-700 hover:text-white">
                    <Plus className="size-3.5" />
                    Add Issue
                  </Button>
                </div>
                <div className="space-y-4">
                  {issues.map((issue, index) => (
                    <div key={issue.id} className="rounded-xl border overflow-hidden bg-card shadow-xs">
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                        <div className="flex items-center gap-2.5">
                          <div className="size-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{index + 1}</div>
                          <span className="text-sm font-semibold text-foreground">Issue #{index + 1}</span>
                        </div>
                        {issues.length > 1 && (
                          <button type="button" onClick={() => removeIssue(issue.id)} className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/5">
                            <X className="size-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="p-4 sm:p-5 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Description
                              <span className="text-destructive ml-0.5">*</span>
                            </Label>

                            {issue.attachments.length < 5 && (
                              <label htmlFor={`upload-${issue.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer hover:underline">
                                {uploading ? (
                                  <>
                                    <Loader2 className="size-3 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <ImagePlus className="size-3.5" />
                                    Add Media
                                  </>
                                )}
                              </label>
                            )}
                          </div>

                          <Textarea
                            placeholder="Describe the maintenance issue clearly"
                            value={issue.description}
                            rows={4}
                            className="resize-none text-sm leading-relaxed"
                            onChange={(e) => setIssues(issues.map((i) => (i.id === issue.id ? { ...i, description: e.target.value } : i)))}
                          />

                          <Input id={`upload-${issue.id}`} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleImageUpload(e, issue.id)} disabled={uploading} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2 ">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attachments</Label>
                              <span className="text-xs bg-sky-200 px-3 py-0.5 rounded-full">{issue.attachments.length}/5 Files</span>
                            </div>

                            {issue.attachments.length > 0 ? (
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {issue.attachments.map((file, idx) => (
                                  <div key={idx} className="relative shrink-0 h-16 w-16 overflow-hidden rounded-xl border bg-muted group">
                                    {file.type === "IMAGE" ? <img src={file.url} alt="" className="h-full w-full object-cover" /> : <video src={file.url} className="h-full w-full object-cover" />}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setIssues(
                                          issues.map((i) =>
                                            i.id === issue.id
                                              ? {
                                                  ...i,
                                                  attachments: i.attachments.filter((_, ai) => ai !== idx),
                                                }
                                              : i
                                          )
                                        )
                                      }
                                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                      <Trash2 className="size-4 text-white" />
                                    </button>
                                  </div>
                                ))}

                                {issue.attachments.length < 5 && (
                                  <label htmlFor={`upload-${issue.id}`} className="shrink-0 h-16 min-w-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 text-muted-foreground" />}
                                  </label>
                                )}
                              </div>
                            ) : (
                              <label htmlFor={`upload-${issue.id}`} className="flex items-center gap-3 rounded-xl border border-dashed p-3 cursor-pointer hover:bg-muted/40 transition-colors">
                                <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                                  <ImagePlus className="size-5 text-muted-foreground" />
                                </div>

                                <div className="flex-1">
                                  <p className="text-sm font-medium">Upload Photos or Videos</p>

                                  <p className="text-xs text-muted-foreground">JPG, PNG, MP4 • Maximum 5 files</p>
                                </div>

                                <Plus className="size-4 text-muted-foreground" />
                              </label>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority Level</Label>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                              {priorities.map((p) => {
                                const Icon = p.icon;
                                const isActive = issue.priority === p.value;
                                const styles = priorityStyles[p.value];

                                return (
                                  <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setIssues(issues.map((i) => (i.id === issue.id ? { ...i, priority: p.value } : i)))}
                                    className={`flex-1 h-10 px-3 border rounded-full text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${isActive ? styles.active : "bg-muted hover:bg-muted/80"}`}
                                  >
                                    {p.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>

                  <Button type="submit" disabled={submitting || uploading} className="gap-2 px-6">
                    {uploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Uploading…
                      </>
                    ) : submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        {issues.length > 1 ? `Submit ${issues.length} Tickets` : "Submit Ticket"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}