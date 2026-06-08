"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { ImagePlus, RefreshCw, Trash2, Plus } from "lucide-react";
import { Building2, Layers, MapPin, ArrowUp, ArrowLeft, ArrowRight, AlertCircle, Flame, ShieldAlert, CheckCircle2, Undo, Loader2, Check, ChevronRight, Sparkles, UserCog, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocationStore, useComplaintStore, useTechnicianStore, Location } from "@/store/maintenanceStore";
import apiClient from "@/services/api";

const TEMPLATES = [
  { label: "Tap / Water", text: "The tap/water supply is not working properly. Water is either not flowing or is leaking continuously." },
  { label: "Light issue", text: "The light/tube light is not working. The fitting may need replacement or there is an electrical fault." },
  { label: "AC not cooling", text: "The air conditioner is running but not cooling the room. Requires inspection and servicing." },
  { label: "Door / Lock", text: "The door lock is damaged/not functioning. The door cannot be properly locked or opened." },
  { label: "WiFi issue", text: "WiFi connectivity is not available or the signal is very weak in this area. Requires network inspection." },
  { label: "Electrical", text: "There is an electrical fault / sparking noticed. Needs urgent attention from an electrician." },
];

export default function RaiseTicketPage() {
  const router = useRouter();
  const { locations, loading: locationsLoading, fetchLocations } = useLocationStore();
  const { createComplaints, loading: submitting } = useComplaintStore();
  const { technicians, fetchTechnicians } = useTechnicianStore();
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [userRole] = useState<string>(() => {
    if (typeof window === "undefined") return "user";
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return (u.role || "user").toLowerCase();
    } catch {
      return "user";
    }
  });

  useEffect(() => {
    fetchLocations();
    if (userRole === "admin" || userRole === "superadmin" || userRole === "manager") {
      fetchTechnicians();
    }
  }, []);

  const canAssignTechnician = userRole === "admin" || userRole === "superadmin" || userRole === "manager";

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, issueId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post("/uploads/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, imageUrl: response.data.data.url } : i)));
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const currentLevel = useMemo(() => {
    if (currentParentId === null) return 0;
    return selectedPath.indexOf(currentParentId) + 1;
  }, [currentParentId, selectedPath]);

  const levelMetadata = useMemo(() => {
    switch (currentLevel) {
      case 0:
        return { label: "Primary Location", icon: Building2 };
      case 1:
        return { label: "Block / Wing", icon: Layers };
      case 2:
        return { label: "Floor", icon: Layers };
      default:
        return { label: "Sub Location", icon: MapPin };
    }
  }, [currentLevel]);

  const handleLocationClick = (loc: Location) => {
    const children = locations.filter((item) => item.parentId === loc.id);
    if (children.length > 0) {
      setSelectedPath([...selectedPath, loc.id]);
      setCurrentParentId(loc.id);
    } else {
      let idx = 0;
      if (currentParentId !== null) idx = selectedPath.indexOf(currentParentId) + 1;
      const updated = selectedPath.slice(0, idx);
      updated[idx] = loc.id;
      setSelectedPath(updated);
    }
  };

  const handleBackLocation = () => {
    if (selectedPath.length === 0) return;
    const updated = selectedPath.slice(0, -1);
    setSelectedPath(updated);
    setCurrentParentId(updated.length === 0 ? null : updated[updated.length - 1]);
  };

  const isLeafSelected = useMemo(() => {
    if (selectedPath.length === 0) return false;
    const lastId = selectedPath[selectedPath.length - 1];
    return locations.filter((loc) => loc.parentId === lastId).length === 0;
  }, [selectedPath, locations]);

  const locationPath = selectedPath
    .map((id) => locations.find((loc) => loc.id === id)?.name)
    .filter(Boolean)
    .join(" > ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (issues.find((i) => !i.description.trim())) {
      toast.error("Please fill all issue summaries.");
      return;
    }
    const valid = issues.filter((i) => i.description.trim());
    if (!valid.length) {
      toast.error("Please add at least one issue.");
      return;
    }
    try {
      await createComplaints(
        valid.map((i) => ({
          description: i.description,
          priority: i.priority,
          imageUrl: i.imageUrl,
          locationType: locationPath,
          subLocation: selectedPath[selectedPath.length - 1],
          ...(i.technicianId ? { technicianId: i.technicianId } : {}),
        }))
      );
      toast.success(`${valid.length} ticket${valid.length > 1 ? "s" : ""} created successfully`);
      router.push("../tickets");
    } catch {
      toast.error("Failed to create tickets");
    }
  };

  const priorities = [
    { value: "LOW", label: "Low", icon: ArrowUp, activeBg: "bg-emerald-50 border-emerald-400", color: "text-emerald-600" },
    { value: "MEDIUM", label: "Medium", icon: AlertCircle, activeBg: "bg-blue-50 border-blue-400", color: "text-blue-600" },
    { value: "HIGH", label: "High", icon: Flame, activeBg: "bg-amber-50 border-amber-400", color: "text-amber-600" },
    { value: "URGENT", label: "Urgent", icon: ShieldAlert, activeBg: "bg-red-50 border-red-400", color: "text-red-600" },
  ];

  const ActiveLevelIcon = levelMetadata.icon;
  const [issues, setIssues] = useState([{ id: 1, description: "", imageUrl: "", priority: "MEDIUM", technicianId: "" }]);
  const addIssue = () => setIssues((p) => [...p, { id: Date.now(), description: "", imageUrl: "", priority: "MEDIUM", technicianId: "" }]);
  const removeIssue = (id: number) => setIssues(issues.filter((i) => i.id !== id));

  return (
    <DashboardLayout>
      <div className="space-y-5 w-full">
        
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Raise New Ticket</h1>
            <p className="text-muted-foreground mt-1 text-sm">Follow the steps below to create a maintenance ticket.</p>
          </div>
          <Link href="/maintenance/tickets">
            <Button variant="outline" size="sm" className="gap-1.5 font-medium shrink-0">
              <Undo size={14} /> Go Back
            </Button>
          </Link>
        </div>

        
        <div className="bg-card rounded-xl px-6 py-5 shadow-sm">
          <div className="flex items-start justify-center gap-0 relative max-w-sm mx-auto">
            
            <div className="flex flex-col items-center gap-2 z-10 w-28">
              <button
                type="button"
                onClick={() => step > 1 && setStep(1)}
                className={`size-9 rounded-full flex items-center justify-center font-bold border-2 transition-all text-sm ${
                  step === 1 ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-white border-border text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="size-4 stroke-[3]" /> : "1"}
              </button>
              <span className={`text-xs font-semibold text-center ${step === 1 ? "text-primary" : "text-muted-foreground"}`}>Select Location</span>
            </div>

            
            <div className="absolute left-[calc(50%-64px)] right-[calc(50%-64px)] top-[18px] h-[2px] bg-muted z-0">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: step > 1 ? "100%" : "0%" }} />
            </div>

            
            <div className="flex flex-col items-center gap-2 z-10 w-28">
              <div
                className={`size-9 rounded-full flex items-center justify-center font-bold border-2 transition-all text-sm ${
                  step === 2 ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-white border-border text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold text-center ${step === 2 ? "text-primary" : "text-muted-foreground"}`}>Issue Details</span>
            </div>
          </div>
        </div>

        
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-r from-primary/[0.06] to-sky-50/60 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                {step === 1
                  ? <MapPin className="size-4 text-primary" />
                  : <FileText className="size-4 text-primary" />}
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-foreground leading-none">{step === 1 ? "Select Location" : "Describe the Issue"}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{step === 1 ? "Choose where the issue occurred" : "Add issue details and attach photos"}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary bg-white border border-primary/25 px-3 py-1 rounded-full shadow-sm">Step {step} of 2</span>
          </div>

          <div className="p-5 md:p-6">
            {step === 1 ? (
              /* ─── STEP 1 ─── */
              <div className="space-y-5">
                {selectedPath.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-primary/[0.04] rounded-lg text-xs">
                    <span className="text-muted-foreground font-semibold">Path:</span>
                    <span className="text-primary font-bold">Campus</span>
                    {selectedPath.map((id, index) => {
                      const name = locations.find((loc) => loc.id === id)?.name;
                      if (!name) return null;
                      return (
                        <div key={id} className="flex items-center gap-1">
                          <ChevronRight className="size-3 text-muted-foreground/60" />
                          <span className={`font-semibold ${index === selectedPath.length - 1 ? "text-foreground" : "text-muted-foreground"}`}>{name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {locationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">Loading locations...</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{currentLevel + 1}</span>
                      <p className="text-sm font-semibold text-foreground">{levelMetadata.label}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {locations
                        .filter((loc) => loc.parentId === (currentParentId ?? null))
                        .map((opt) => {
                          const isSelected = selectedPath.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleLocationClick(opt)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all group ${
                                isSelected
                                  ? "bg-primary/5 border-2 border-primary shadow-sm"
                                  : "bg-white border border-slate-200 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-sky-50/60"
                              }`}
                            >
                              <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
                                <ActiveLevelIcon className="size-4" />
                              </div>
                              <span className="text-sm font-semibold flex-1 truncate">{opt.name}</span>
                              {isSelected && (
                                <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                  <Check className="size-3 stroke-[3] text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  {currentParentId !== null ? (
                    <Button type="button" variant="outline" size="sm" onClick={handleBackLocation} className="gap-1.5">
                      <ArrowLeft className="size-3.5" /> Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  {isLeafSelected && (
                    <Button type="button" onClick={() => setStep(2)} className="gap-2 h-10 px-5 font-semibold">
                      Continue to Details <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* ─── STEP 2 ─── */
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Selected location banner */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <MapPin className="size-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selected Location</p>
                      <p className="text-sm font-bold text-foreground truncate mt-0.5">{locationPath}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" type="button" onClick={() => setStep(1)} className="shrink-0 text-xs gap-1.5 h-8 px-3 hover:border-primary/40 hover:text-primary font-semibold">
                    <RefreshCw className="size-3" /> Change
                  </Button>
                </div>

                {/* Issues section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Layers className="size-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-foreground leading-none">Issues</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Add one or more issues at this location</p>
                      </div>
                    </div>
                    <Button type="button" size="sm" onClick={addIssue} className="gap-1.5 h-8 px-3.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none rounded-lg">
                      <Plus className="size-3.5" /> Add Issue
                    </Button>
                  </div>

                  {issues.map((issue, index) => (
                    <div key={issue.id} className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">

                      {/* Issue header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="size-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-sm">{index + 1}</span>
                          <span className="text-sm font-bold text-foreground">Issue #{index + 1}</span>
                        </div>
                        {issues.length > 1 && (
                          <button type="button" onClick={() => removeIssue(issue.id)} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-50 font-semibold">
                            <Trash2 className="size-3" /> Remove
                          </button>
                        )}
                      </div>

                      {/* Quick Templates — full-width chip row */}
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Sparkles className="size-3.5 text-primary" />
                          <span className="text-xs font-bold text-foreground">Quick Templates</span>
                          <span className="text-[10px] text-muted-foreground ml-1">— tap to auto-fill description</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {TEMPLATES.map((t) => (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() => setIssues(issues.map((i) => (i.id === issue.id ? { ...i, description: t.text } : i)))}
                              className={[
                                "flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all",
                                issue.description === t.text
                                  ? "bg-primary text-white shadow-md scale-[0.97]"
                                  : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:ring-primary/40 hover:text-primary hover:shadow-md",
                              ].join(" ")}
                            >
                              {issue.description === t.text && <Check className="size-3 stroke-[3]" />}
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2 cards — Details + Photo */}
                      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-3 items-stretch">

                        {/* Card: Description + Priority + Assign */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
                          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                            <FileText className="size-3.5 text-primary" />
                            <span className="text-xs font-bold text-foreground">Issue Details</span>
                          </div>
                          <Textarea
                            placeholder="Describe the issue in detail..."
                            value={issue.description}
                            rows={5}
                            className="resize-none text-sm leading-relaxed placeholder:text-muted-foreground/40 bg-slate-50 border border-slate-200 focus-visible:ring-primary/30 focus-visible:bg-white rounded-lg flex-1 transition-colors"
                            onChange={(e) => setIssues(issues.map((i) => (i.id === issue.id ? { ...i, description: e.target.value } : i)))}
                          />
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {priorities.map((p) => {
                                const Icon = p.icon;
                                const isActive = issue.priority === p.value;
                                return (
                                  <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setIssues(issues.map((i) => (i.id === issue.id ? { ...i, priority: p.value } : i)))}
                                    className={[
                                      "flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-bold transition-all select-none border",
                                      isActive ? `${p.activeBg} ${p.color} border-transparent shadow-sm` : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-primary/8 hover:text-primary hover:border-primary/30",
                                    ].join(" ")}
                                  >
                                    <Icon className="size-3" />
                                    {p.label}
                                    {isActive && <Check className="size-3 stroke-[3]" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {canAssignTechnician && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                <UserCog className="size-3 text-primary/70" />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Technician</p>
                                <span className="text-[10px] text-muted-foreground/50">(optional)</span>
                              </div>
                              <select
                                value={issue.technicianId}
                                onChange={(e) => setIssues(issues.map((i) => (i.id === issue.id ? { ...i, technicianId: e.target.value } : i)))}
                                className="w-full h-9 rounded-lg bg-slate-50 border border-slate-200 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                              >
                                <option value="">-- Select technician --</option>
                                {technicians.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}{t.technicianCode ? ` (${t.technicianCode})` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Card: Photo Upload */}
                        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2.5">
                          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                            <ImagePlus className="size-3.5 text-primary" />
                            <span className="text-xs font-bold text-foreground">Attach Photo</span>
                          </div>
                          {!issue.imageUrl ? (
                            <label
                              htmlFor={`img-${issue.id}`}
                              className="group flex flex-col items-center justify-center gap-3 flex-1 border-2 border-dashed border-primary/20 rounded-xl cursor-pointer bg-sky-50/50 hover:bg-primary/5 hover:border-primary/40 transition-all min-h-[160px]"
                            >
                              <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <ImagePlus className="size-5 text-primary/70 group-hover:text-primary transition-colors" />
                              </div>
                              <div className="text-center px-3">
                                <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Click to upload</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, WEBP · 10MB</p>
                              </div>
                              <Input id={`img-${issue.id}`} type="file" accept="image/*" className="sr-only" onChange={(e) => handleImageUpload(e, issue.id)} />
                            </label>
                          ) : (
                            <div className="relative rounded-xl overflow-hidden group flex-1 min-h-[160px] shadow-sm">
                              <img src={issue.imageUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label htmlFor={`img-rep-${issue.id}`} className="flex items-center gap-1 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-lg cursor-pointer">
                                  <RefreshCw className="size-3" /> Replace
                                  <Input id={`img-rep-${issue.id}`} type="file" accept="image/*" className="sr-only" onChange={(e) => handleImageUpload(e, issue.id)} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setIssues(issues.map((i) => (i.id === issue.id ? { ...i, imageUrl: "" } : i)))}
                                  className="flex items-center gap-1 text-xs font-semibold text-white bg-red-500/70 hover:bg-red-500 px-2.5 py-1.5 rounded-lg"
                                >
                                  <Trash2 className="size-3" /> Delete
                                </button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/40 backdrop-blur-sm">
                                <p className="text-xs text-white/90 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="size-3" /> Photo attached
                                </p>
                              </div>
                            </div>
                          )}
                          {uploading && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Loader2 className="size-3.5 animate-spin text-primary" /> Uploading...
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1.5">
                    <ArrowLeft className="size-3.5" /> Back
                  </Button>
                  <Button type="submit" disabled={submitting || uploading} className="gap-2 px-6 h-10 font-semibold">
                    {uploading ? <><Loader2 className="size-4 animate-spin" /> Uploading...</>
                      : submitting ? <><Loader2 className="size-4 animate-spin" /> Submitting...</>
                      : <><CheckCircle2 className="size-4" /> Submit Ticket</>}
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
