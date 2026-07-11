"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarDays, Calendar, Inbox, Loader2, Pencil, Plus, Search, Trash2, MoreVertical } from "lucide-react";
import { useAcademicStore } from "@/store/academicStore";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useState } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface Section {
  id: string;
  sectionCode: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SectionsPage() {
  const { sections, loading, fetchSections, createSection, updateSection, deleteSection } = useAcademicStore();

  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");

  const [isActive, setIsActive] = useState(true);
  const [editIsActive, setEditIsActive] = useState(true);

  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [deleteSectionOpen, setDeleteSectionOpen] = useState(false);

  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [deletingSection, setDeletingSection] = useState<Section | null>(null);

  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createSection({
        name,
        isActive,
      });

      setName("");
      setIsActive(true);

      setFormErrors({});
      setAddSectionOpen(false);

      toast.success("Section created successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        setFormErrors(errors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to create section");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSection) return;

    try {
      await updateSection(editingSection.id, {
        name: editName,
        isActive: editIsActive,
      });

      setEditSectionOpen(false);
      setEditingSection(null);

      toast.success("Section updated successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        setEditErrors(errors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to update section");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deletingSection) return;

    try {
      setDeletingId(deletingSection.id);

      await deleteSection(deletingSection.id);

      setDeleteSectionOpen(false);
      setDeletingSection(null);

      toast.success("Section deleted successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors?.session) {
        toast.error(errors.session);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to delete section");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (section: Section) => {
    setEditingSection(section);
    setEditName(section.name);
    setEditIsActive(section.isActive);
    setEditErrors({});
    setEditSectionOpen(true);
  };

  const openDeleteDialog = (section: Section) => {
    setDeletingSection(section);
    setDeleteSectionOpen(true);
  };

  const authorized = usePermission("section.read");

  if (authorized === null) {
    return null;
  }

  const clearFormError = (field: string) => {
    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const clearEditError = (field: string) => {
    setEditErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const isSectionChanged = editingSection && (editName.trim() !== editingSection.name || editIsActive !== editingSection.isActive);

  const filteredSections = sections.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.sectionCode.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sections</h1>
            <p className="text-muted-foreground">Manage sections</p>
          </div>

          <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add Section
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="size-5 text-primary" />
                  </div>

                  <div>
                    <DialogTitle className="text-lg">Create Section</DialogTitle>

                    <DialogDescription>Add a new Section</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-6 p-6">
                <FieldGroup>
                  <Field>
                    <Label>Section Name</Label>

                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearFormError("name");
                      }}
                      className=""
                    />
                    {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                  </Field>

                  <Field>
                    <Label>Active Section</Label>

                    <div className="mt-3">
                      <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                  </Field>
                </FieldGroup>

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button type="submit" disabled={loading} className="min-w-32.5 gap-2 px-5">
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

        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-87.5 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <Input type="text" placeholder="Search by section name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
            </div>
          </div>

          {loading && sections.length === 0 ? (
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-border/50 pb-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 bg-muted rounded flex-1 animate-pulse" />
                ))}
              </div>

              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="flex gap-4 py-2 border-b border-border/20">
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>

              <h3 className="text-lg font-bold text-foreground">{sections.length === 0 ? "No sections created yet." : "No sections found."}</h3>

              <p className="text-muted-foreground mt-1.5 max-w-sm">{sections.length === 0 ? "Add your first section to get started." : `Try adjusting your search or filters.`}</p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table className="table-auto">
                <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-45">Section</TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Code</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 w-20 sm:w-24">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30 hidden lg:table-cell">Created At</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-4 sm:pr-6 text-foreground/80 text-right w-14 md:w-24 sticky right-0 bg-gray-50 dark:bg-muted/15 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                      <span className="md:block">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-border/30">
                  {filteredSections.map((section) => (
                    <TableRow key={section.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4 align-middle">
                        <div className="space-y-1 min-w-0 max-w-35 sm:max-w-55 md:max-w-45">
                          <p className="font-semibold text-foreground text-base leading-tight truncate hover:text-primary transition-colors" title={section.name}>
                            {section.name}
                          </p>

                          <p className="text-sm text-foreground/50 truncate md:hidden">{section.sectionCode}</p>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell py-4 align-middle">{section.sectionCode}</TableCell>

                      <TableCell className="py-4 align-middle">
                        <Badge className={section.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-muted text-muted-foreground"}>{section.isActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>

                      <TableCell className="py-4 text-xs font-medium text-muted-foreground hidden lg:table-cell align-middle">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-5 text-muted-foreground/80" />

                          <span className="text-sm">
                            {new Date(section.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 pr-4 sm:pr-6 text-right align-middle w-14 md:w-24 bg-card sticky right-0 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                        <div className="hidden md:flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                            title="Edit section"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => openEditDialog(section)}
                          >
                            <Pencil className="size-5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                            title="Delete section"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => openDeleteDialog(section)}
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </div>

                        <div className="md:hidden flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-9" onPointerDown={(e) => e.stopPropagation()}>
                                <MoreVertical className="size-5" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(section)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => openDeleteDialog(section)} className="text-destructive">
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
            </div>
          )}
        </div>
      </div>

      <Dialog open={editSectionOpen} onOpenChange={setEditSectionOpen}>
        <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Edit Section</DialogTitle>

                <DialogDescription>Update Section details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Section Name</Label>

                <Input
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    clearEditError("name");
                  }}
                  className=""
                />
                {editErrors.name && <p className="text-sm text-red-500 mt-1">{editErrors.name}</p>}
              </Field>

              <Field>
                <Label>Active Section</Label>

                <div className="mt-3">
                  <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
                </div>
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !isSectionChanged} className="min-w-32.5 gap-2 px-5">
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

      <AlertDialog open={deleteSectionOpen} onOpenChange={setDeleteSectionOpen}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete section?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove <span className="inline-block max-w-60 truncate align-bottom font-semibold text-foreground">{deletingSection?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} disabled={!!deletingId} className="h-11 bg-destructive text-white hover:bg-destructive/90">
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete section
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
