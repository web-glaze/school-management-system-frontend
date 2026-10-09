"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar as CalendarIcon, ImagePlus, Inbox, Loader2, Plus, RotateCcw, Save, Settings2, Trash2 } from "lucide-react";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/store/profileStore";
import { profileService, type PersonProfileField, type PersonProfileSection, type ProfileEntity, type ProfileFieldType, type ProfileMedia } from "@/services/profile.service";

const MAX_MEDIA = 5;

const FIELD_TYPES: { value: ProfileFieldType; label: string }[] = [
  { value: "TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "YES_NO", label: "Yes / No" },
  { value: "MEDIA", label: "Images / Videos" },
];

const typeLabel = (type: ProfileFieldType) => FIELD_TYPES.find((t) => t.value === type)?.label ?? type;

type ApiErrorResponse = {
  message?: string | string[];
  errors?: Record<string, string>;
};

function getApiMessage(error: unknown, fallback = "Something went wrong") {
  const apiError = error as AxiosError<ApiErrorResponse>;
  const errors = apiError.response?.data?.errors;

  if (errors) {
    const first = Object.values(errors).find(Boolean);
    if (first) return first;
  }

  const message = apiError.response?.data?.message;
  if (Array.isArray(message)) return message[0] ?? fallback;

  return message ?? fallback;
}

async function safe(action: () => Promise<unknown>, success?: string) {
  try {
    await action();
    if (success) toast.success(success);
    return true;
  } catch (error) {
    toast.error(getApiMessage(error));
    return false;
  }
}

const parseOptions = (text: string) =>
  Array.from(
    new Set(
      text
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

function formatValue(field: PersonProfileField) {
  if (!field.value) return "—";

  if (field.type === "DATE") {
    const date = new Date(field.value);
    return Number.isNaN(date.getTime()) ? field.value : format(date, "dd MMM yyyy");
  }

  if (field.type === "YES_NO") return field.value === "YES" ? "Yes" : "No";

  return field.value;
}

// ======================
// Date input
// ======================

function DateInput({ value, onChange, invalid }: { value: string; onChange: (value: string) => void; invalid?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("h-10 w-full justify-start text-left font-normal", !value && "text-muted-foreground", invalid && "border-red-500")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(new Date(value), "dd MMM yyyy") : "Pick a date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          defaultMonth={value ? new Date(value) : new Date()}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ======================
// Images and videos grid
// ======================

function MediaGrid({
  media,
  editable,
  uploading,
  onOpen,
  onRemove,
  onUpload,
}: {
  media: ProfileMedia[];
  editable: boolean;
  uploading: boolean;
  onOpen: (index: number) => void;
  onRemove: (file: ProfileMedia) => void;
  onUpload: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-2">
      {media.map((file, index) => (
        <div key={file.id} className="relative h-20 w-20 overflow-hidden rounded-xl border bg-muted">
          <button type="button" onClick={() => onOpen(index)} className="h-full w-full">
            {file.type === "IMAGE" ? <img src={file.url} alt="" className="h-full w-full object-cover" /> : <video src={file.url} className="h-full w-full object-cover" />}
          </button>

          {editable && (
            <button type="button" onClick={() => onRemove(file)} title="Remove file" className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white transition-colors hover:bg-red-600">
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      ))}

      {editable && media.length < MAX_MEDIA && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (inputRef.current) inputRef.current.value = "";
              if (files.length) onUpload(files);
            }}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 min-w-20 items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:bg-muted disabled:opacity-50"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-5 text-muted-foreground" />}
          </button>
        </>
      )}

      {editable && <p className="w-full text-xs text-muted-foreground">Images and videos, up to {MAX_MEDIA} files</p>}
      {!editable && media.length === 0 && <p className="text-sm text-muted-foreground">No files</p>}
    </div>
  );
}

// ======================
// Name + type (+ options) form, used for custom fields and template fields
// ======================

function NewFieldRow({ onAdd, submitting }: { onAdd: (label: string, type: ProfileFieldType, options?: string[]) => Promise<boolean>; submitting: boolean }) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ProfileFieldType>("TEXT");
  const [optionsText, setOptionsText] = useState("");

  const submit = async () => {
    const cleanLabel = label.trim();

    if (!cleanLabel) {
      toast.error("Field name is required");
      return;
    }

    let options: string[] | undefined;

    if (type === "DROPDOWN") {
      options = parseOptions(optionsText);

      if (options.length === 0) {
        toast.error("Add at least one option");
        return;
      }
    }

    const ok = await onAdd(cleanLabel, type, options);

    if (ok) {
      setLabel("");
      setType("TEXT");
      setOptionsText("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
        <Input placeholder="Field name" value={label} onChange={(e) => setLabel(e.target.value)} className="h-10" />

        <Select value={type} onValueChange={(value) => setType(value as ProfileFieldType)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {type === "DROPDOWN" && <Textarea rows={2} className="resize-none" placeholder="Options, separated by commas" value={optionsText} onChange={(e) => setOptionsText(e.target.value)} />}

      <Button type="button" onClick={submit} disabled={submitting} className="gap-2">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add field
      </Button>
    </div>
  );
}

// ======================
// Template manager (sections and fields that apply to everyone)
// ======================

function TemplateManager({ entity, open, onOpenChange }: { entity: ProfileEntity; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { templates, templateLoading, fetchTemplate, createSection, updateSection, createTemplateField, updateTemplateField } = useProfileStore();
  const sections = templates[entity];
  const [newSection, setNewSection] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplate(entity).catch(() => toast.error("Failed to load template"));
    }
  }, [open, entity]);

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    const ok = await safe(action, success);
    setBusy(false);
    return ok;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="shrink-0 border-b px-5 py-4 sm:px-6">
          <DialogTitle className="text-lg">Manage template</DialogTitle>
          <DialogDescription>Sections and fields here apply to every {entity === "student" ? "student" : "teacher"}. Turning one off hides it but keeps the saved data.</DialogDescription>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex gap-2">
            <Input placeholder="New section name" value={newSection} onChange={(e) => setNewSection(e.target.value)} className="h-10" />
            <Button
              type="button"
              disabled={busy || !newSection.trim()}
              className="gap-2"
              onClick={async () => {
                const ok = await run(() => createSection(entity, { name: newSection.trim() }), "Section added");
                if (ok) setNewSection("");
              }}
            >
              <Plus className="size-4" />
              Add section
            </Button>
          </div>

          {templateLoading && sections.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id} className={cn("space-y-4 rounded-xl border p-4", !section.isActive && "opacity-60")}>
                <div className="flex items-center gap-3">
                  <Input
                    key={`${section.id}-${section.name}`}
                    defaultValue={section.name}
                    className="h-9 font-semibold"
                    onBlur={(e) => {
                      const name = e.target.value.trim();

                      if (!name) {
                        e.target.value = section.name;
                        return;
                      }

                      if (name !== section.name) run(() => updateSection(entity, section.id, { name }));
                    }}
                  />

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">Active</span>
                    <Switch checked={section.isActive} disabled={busy} onCheckedChange={(checked) => run(() => updateSection(entity, section.id, { isActive: checked }))} />
                  </div>
                </div>

                <div className="space-y-3">
                  {section.fields.map((field) => (
                    <div key={field.id} className={cn("space-y-2 rounded-lg bg-muted/30 p-3", !field.isActive && "opacity-60")}>
                      <div className="flex items-center gap-3">
                        <Input
                          key={`${field.id}-${field.label}`}
                          defaultValue={field.label}
                          className="h-9"
                          onBlur={(e) => {
                            const label = e.target.value.trim();

                            if (!label) {
                              e.target.value = field.label;
                              return;
                            }

                            if (label !== field.label) run(() => updateTemplateField(entity, field.id, { label }));
                          }}
                        />

                        <Badge variant="outline" className="shrink-0">
                          {typeLabel(field.type)}
                        </Badge>

                        <Switch checked={field.isActive} disabled={busy} onCheckedChange={(checked) => run(() => updateTemplateField(entity, field.id, { isActive: checked }))} />
                      </div>

                      {field.type === "DROPDOWN" && (
                        <Input
                          key={`${field.id}-${(field.options ?? []).join(",")}`}
                          defaultValue={(field.options ?? []).join(", ")}
                          className="h-9"
                          placeholder="Options, separated by commas"
                          onBlur={(e) => {
                            const options = parseOptions(e.target.value);

                            if (options.length === 0) {
                              toast.error("Add at least one option");
                              e.target.value = (field.options ?? []).join(", ");
                              return;
                            }

                            if (options.join(",") !== (field.options ?? []).join(",")) run(() => updateTemplateField(entity, field.id, { options }));
                          }}
                        />
                      )}
                    </div>
                  ))}

                  {section.fields.length === 0 && <p className="text-sm text-muted-foreground">No fields in this section yet.</p>}
                </div>

                <div className="border-t pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add a field to {section.name}</p>
                  <NewFieldRow submitting={busy} onAdd={(label, type, options) => run(() => createTemplateField(entity, { sectionId: section.id, label, type, options }), "Field added")} />
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-5 py-3 sm:px-6">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ======================
// Profile panel
// ======================

interface ProfilePanelProps {
  entity: ProfileEntity;
  mode: "edit" | "view";
  // edit mode: whose profile to load and edit
  personId?: string;
  // view mode: the data to show (the page fetches it), nothing can be changed
  sections?: PersonProfileSection[];
  loading?: boolean;
  canManageTemplate?: boolean;
}

type ConfirmTarget = { kind: "media"; id: string } | { kind: "field"; id: string; label: string } | null;

export default function ProfilePanel({ entity, mode, personId, sections, loading = false, canManageTemplate = true }: ProfilePanelProps) {
  const isEdit = mode === "edit";

  const { profile, profileLoading, fetchProfile, saveValues, createCustomField, updateCustomField, addMedia, removeMedia, clearProfile } = useProfileStore();

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ files: ProfileMedia[]; index: number } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmTarget>(null);
  const [confirming, setConfirming] = useState(false);
  const [addFieldSection, setAddFieldSection] = useState<string | null>(null);
  const [addingField, setAddingField] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  useEffect(() => {
    if (!isEdit || !personId) return;

    clearProfile();
    setEdits({});
    setFieldErrors({});
    setActiveSection("");

    fetchProfile(entity, personId).catch(() => toast.error("Failed to load profile"));

    return () => clearProfile();
  }, [isEdit, entity, personId]);

  const data: PersonProfileSection[] = isEdit ? profile : (sections ?? []);
  const isLoading = isEdit ? profileLoading && profile.length === 0 : loading;
  const current = data.find((section) => section.id === activeSection) ?? data[0];

  const allFields = useMemo(() => data.flatMap((section) => section.fields), [data]);

  const dirty = useMemo(() => {
    const byId = new Map(allFields.map((field) => [field.id, field]));

    return Object.entries(edits).filter(([id, value]) => byId.has(id) && value !== (byId.get(id)?.value ?? ""));
  }, [edits, allFields]);

  if (isEdit && !personId) return null;

  const getValue = (field: PersonProfileField) => edits[field.id] ?? field.value ?? "";

  const setEdit = (fieldId: string, value: string) => {
    setEdits((prev) => ({ ...prev, [fieldId]: value }));

    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => ({ ...prev, [fieldId]: "" }));
    }
  };

  const handleSave = async () => {
    if (!personId || dirty.length === 0) return;

    try {
      setSaving(true);
      setFieldErrors({});

      await saveValues(entity, personId, {
        values: dirty.map(([fieldId, value]) => ({
          fieldId,
          value: value.trim() === "" ? null : value,
        })),
      });

      setEdits({});
      toast.success("Profile saved successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const errors = apiError.response?.data?.errors;

      if (errors) {
        setFieldErrors(errors);

        const firstBad = data.find((section) => section.fields.some((field) => errors[field.id]));
        if (firstBad) setActiveSection(firstBad.id);

        toast.error("Please fix the highlighted fields");
      } else {
        toast.error(getApiMessage(error, "Failed to save profile"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setEdits({});
    setFieldErrors({});
  };

  const handleUpload = async (field: PersonProfileField, files: File[]) => {
    if (!personId) return;

    if (field.media.length + files.length > MAX_MEDIA) {
      toast.error(`Maximum ${MAX_MEDIA} files allowed per field`);
      return;
    }

    try {
      setUploadingField(field.id);

      const uploaded = await profileService.uploadMedia(entity, files);
      await addMedia(entity, personId, field.id, uploaded);

      toast.success(`${uploaded.length} ${uploaded.length === 1 ? "file" : "files"} uploaded successfully`);
    } catch (error) {
      toast.error(getApiMessage(error, "Failed to upload files"));
    } finally {
      setUploadingField(null);
    }
  };

  const handleConfirm = async () => {
    const target = confirm;

    if (!target || !personId) return;

    try {
      setConfirming(true);

      if (target.kind === "media") {
        await removeMedia(entity, personId, target.id);
        toast.success("File removed");
      } else {
        await updateCustomField(entity, personId, target.id, { isActive: false });

        setEdits((prev) => {
          const next = { ...prev };
          delete next[target.id];
          return next;
        });

        toast.success("Field removed");
      }

      setConfirm(null);
    } catch (error) {
      toast.error(getApiMessage(error));
    } finally {
      setConfirming(false);
    }
  };

  const handleAddCustomField = async (label: string, type: ProfileFieldType, options?: string[]) => {
    if (!personId || !addFieldSection) return false;

    setAddingField(true);

    const ok = await safe(() => createCustomField(entity, personId, { sectionId: addFieldSection, label, type, options }), "Field added");

    setAddingField(false);

    if (ok) setAddFieldSection(null);

    return ok;
  };

  const renderEditInput = (field: PersonProfileField) => {
    const value = getValue(field);
    const invalid = Boolean(fieldErrors[field.id]);

    switch (field.type) {
      case "LONG_TEXT":
        return <Textarea rows={3} className={cn("resize-none", invalid && "border-red-500")} value={value} onChange={(e) => setEdit(field.id, e.target.value)} />;

      case "NUMBER":
        return <Input type="number" inputMode="decimal" className={cn("h-10", invalid && "border-red-500")} value={value} onChange={(e) => setEdit(field.id, e.target.value)} />;

      case "DATE":
        return <DateInput value={value} invalid={invalid} onChange={(next) => setEdit(field.id, next)} />;

      case "DROPDOWN":
        return (
          <Select value={value} onValueChange={(next) => setEdit(field.id, next)}>
            <SelectTrigger className={cn("h-10 w-full", invalid && "border-red-500")}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "YES_NO":
        return (
          <Select value={value} onValueChange={(next) => setEdit(field.id, next)}>
            <SelectTrigger className={cn("h-10 w-full", invalid && "border-red-500")}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YES">Yes</SelectItem>
              <SelectItem value="NO">No</SelectItem>
            </SelectContent>
          </Select>
        );

      case "MEDIA":
        return (
          <MediaGrid
            media={field.media}
            editable
            uploading={uploadingField === field.id}
            onOpen={(index) => setLightbox({ files: field.media, index })}
            onRemove={(file) => setConfirm({ kind: "media", id: file.id })}
            onUpload={(files) => handleUpload(field, files)}
          />
        );

      default:
        return <Input className={cn("h-10", invalid && "border-red-500")} value={value} onChange={(e) => setEdit(field.id, e.target.value)} />;
    }
  };

  const renderReadOnly = (field: PersonProfileField) => {
    if (field.type === "MEDIA") {
      return <MediaGrid media={field.media} editable={false} uploading={false} onOpen={(index) => setLightbox({ files: field.media, index })} onRemove={() => {}} onUpload={() => {}} />;
    }

    return <p className="min-h-10 whitespace-pre-wrap rounded-md bg-muted/40 px-3 py-2 text-sm">{formatValue(field)}</p>;
  };

  return (
    <div className="space-y-5">
      {isEdit && canManageTemplate && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" className="gap-2" onClick={() => setTemplateOpen(true)}>
            <Settings2 className="size-4" />
            Manage template
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground/75">
            <Inbox className="size-6 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No information available</h3>
          <p className="mt-1.5 max-w-sm text-muted-foreground">{isEdit ? "No sections are set up yet. Use Manage template to add some." : "Nothing has been added to this profile yet."}</p>
        </div>
      ) : (
        <>
          <Tabs value={current?.id} onValueChange={setActiveSection}>
            <TabsList className="no-scrollbar w-full justify-start overflow-x-auto rounded-full bg-muted/60 p-1">
              {data.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="whitespace-nowrap rounded-full px-4 py-2 text-sm data-[state=active]:shadow-sm">
                  {section.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {current && (
            <div className="space-y-5 rounded-xl border bg-card p-5">
              {current.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fields in this section yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {current.fields.map((field) => {
                    const value = getValue(field);

                    return (
                      <div key={field.id} className={cn("space-y-2", (field.type === "LONG_TEXT" || field.type === "MEDIA") && "sm:col-span-2")}>
                        <div className="flex items-center justify-between gap-2">
                          <Label className="flex items-center gap-2">
                            {field.label}
                            {field.isCustom && (
                              <Badge variant="secondary" className="text-[10px]">
                                Custom
                              </Badge>
                            )}
                          </Label>

                          {isEdit && (
                            <div className="flex items-center gap-3">
                              {["DATE", "DROPDOWN", "YES_NO"].includes(field.type) && value && (
                                <button type="button" onClick={() => setEdit(field.id, "")} className="text-xs text-muted-foreground hover:text-foreground">
                                  Clear
                                </button>
                              )}

                              {field.isCustom && (
                                <button type="button" onClick={() => setConfirm({ kind: "field", id: field.id, label: field.label })} className="text-xs text-muted-foreground hover:text-destructive">
                                  Remove
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {isEdit ? renderEditInput(field) : renderReadOnly(field)}

                        {fieldErrors[field.id] && <p className="text-xs text-red-500">{fieldErrors[field.id]}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {isEdit && (
                <Button type="button" variant="outline" className="gap-2" onClick={() => setAddFieldSection(current.id)}>
                  <Plus className="size-4" />
                  Add custom field
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {isEdit && dirty.length > 0 && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg">
          <p className="text-sm font-medium">
            {dirty.length} unsaved {dirty.length === 1 ? "change" : "changes"}
          </p>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleDiscard} disabled={saving} className="gap-2">
              <RotateCcw className="size-4" />
              Discard
            </Button>

            <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Add a custom field for this one person */}
      <Dialog
        open={!!addFieldSection}
        onOpenChange={(open) => {
          if (!open) setAddFieldSection(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Add a custom field</DialogTitle>
          <DialogDescription>This field is added only to this {entity}. To add a field for everyone, use Manage template.</DialogDescription>

          <div className="mt-4">
            <NewFieldRow onAdd={handleAddCustomField} submitting={addingField} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove a file or a custom field */}
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !confirming) setConfirm(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">{confirm?.kind === "field" ? "Remove field?" : "Remove file?"}</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              {confirm?.kind === "field" ? `"${confirm.label}" will be removed from this ${entity}'s profile.` : "This file will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11" disabled={confirming}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={confirming}
              className="h-11 bg-destructive text-white hover:bg-destructive/90"
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Remove
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEdit && canManageTemplate && (
        <TemplateManager
          entity={entity}
          open={templateOpen}
          onOpenChange={(open) => {
            setTemplateOpen(open);

            // Pick up template changes in this person's profile.
            if (!open && personId) fetchProfile(entity, personId, true).catch(() => {});
          }}
        />
      )}

      <Lightbox
        open={!!lightbox}
        close={() => setLightbox(null)}
        index={lightbox?.index ?? 0}
        plugins={[Zoom, Thumbnails, Video]}
        carousel={{ finite: true }}
        slides={(lightbox?.files ?? []).map((file) =>
          file.type === "IMAGE"
            ? { src: file.url }
            : {
                type: "video",
                sources: [{ src: file.url, type: "video/mp4" }],
              }
        )}
      />
    </div>
  );
}
