"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarDays, Calendar, Inbox, Loader2, Pencil, Plus, Search, Trash2, MoreVertical, GripVertical } from "lucide-react";
import { useAcademicStore } from "@/store/academicStore";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useRef, useState } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent, Modifier } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface AcademicClass {
  id: string;
  classCode: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

function SortableRow({
  classItem,
  children,
}: {
  classItem: AcademicClass;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: classItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandle = (
    <span className="text-muted-foreground/60">
      <GripVertical className="size-4" />
    </span>
  );

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`hover:bg-muted/20 transition-colors ${listeners ? "cursor-grab active:cursor-grabbing" : ""} ${isDragging ? "touch-none" : ""}`}
    >
      {children(dragHandle)}
    </TableRow>
  );
}

export default function ClassesPage() {
  const { classes, loading, fetchClasses, createClass, updateClass, reorderClasses, deleteClass } = useAcademicStore();
  const [editName, setEditName] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editIsActive, setEditIsActive] = useState(true);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [deleteClassOpen, setDeleteClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<AcademicClass | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );
  const [orderedClasses, setOrderedClasses] = useState<AcademicClass[]>([]);
  const isReorderingRef = useRef(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (isReorderingRef.current) return;
    setOrderedClasses(classes);
  }, [classes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createClass({
        name,
        isActive,
      });

      setName("");
      setIsActive(true);

      setFormErrors({});
      setAddClassOpen(false);

      toast.success("Class created successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        setFormErrors(errors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to create class");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingClass) return;

    try {
      await updateClass(editingClass.id, {
        name: editName,
        isActive: editIsActive,
      });

      setEditClassOpen(false);
      setEditingClass(null);

      toast.success("Class updated successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        setEditErrors(errors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to update class");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deletingClass) return;

    try {
      setDeletingId(deletingClass.id);

      await deleteClass(deletingClass.id);
      setDeleteClassOpen(false);
      setDeletingClass(null);

      toast.success("Class deleted successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors?.session) {
        toast.error(errors.session);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to delete class");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (classItem: AcademicClass) => {
    setEditingClass(classItem);
    setEditName(classItem.name);
    setEditIsActive(classItem.isActive);
    setEditErrors({});
    setEditClassOpen(true);
  };

  const openDeleteDialog = (classItem: AcademicClass) => {
    setDeletingClass(classItem);
    setDeleteClassOpen(true);
  };

  const authorized = usePermission("class.read");

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

  const isClassChanged = editingClass && (editName.trim() !== editingClass.name || editIsActive !== editingClass.isActive);

  const filteredClasses = orderedClasses.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.classCode.toLowerCase().includes(search.toLowerCase()));

  const dragEnabled = search.trim() === "";

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredClasses.findIndex((c) => c.id === active.id);
    const newIndex = filteredClasses.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousOrder = orderedClasses;
    const reordered = arrayMove(filteredClasses, oldIndex, newIndex);

    const payload = reordered.map((item, index) => ({ id: item.id, sortOrder: index + 1 }));

    isReorderingRef.current = true;
    setOrderedClasses(reordered);

    try {
      await reorderClasses(payload);
      await fetchClasses();
    } catch (error) {
      setOrderedClasses(previousOrder);
      const apiError = error as AxiosError<ApiErrorResponse>;
      toast.error(apiError.response?.data?.message ?? "Failed to reorder classes");
    } finally {
      isReorderingRef.current = false;
      setIsDragActive(false);
    }
  };

  const handleDragStart = () => setIsDragActive(true);
  const handleDragCancel = () => setIsDragActive(false);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Classes</h1>
            <p className="text-muted-foreground">Manage classes</p>
          </div>
          <Dialog open={addClassOpen} onOpenChange={setAddClassOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add Class
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="size-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Create Class</DialogTitle>
                    <DialogDescription>Add a new Class</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-6 p-6">
                <FieldGroup>
                  <Field>
                    <Label>Class Name</Label>

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
                    <Label>Active Class</Label>

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
        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60  space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-87.5 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type="text" placeholder="Search by class name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
            </div>
          </div>
          {loading && classes.length === 0 ? (
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
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{classes.length === 0 ? "No classes created yet." : "No classes found."}</h3>

              <p className="text-muted-foreground mt-1.5 max-w-sm">{classes.length === 0 ? "Add your first class to get started." : `Try adjusting your search or filters.`}</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              modifiers={[restrictToVerticalAxis]}
              autoScroll={false}
            >
              <div className="relative w-full overflow-x-auto">
                <Table className="table-auto">
                  <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8 py-4 pl-4 sm:pl-6"></TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 md:min-w-45">Class</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 hidden md:table-cell">Code</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 w-20 sm:w-50">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30 hidden lg:table-cell">Created At</TableHead>
                      <TableHead
                        className={`font-bold text-xs uppercase tracking-wider py-4 pr-4 sm:pr-6 text-foreground/80 text-right w-14 md:w-24 bg-gray-50 dark:bg-muted/15 ${
                          isDragActive ? "" : "sticky right-0 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0"
                        }`}
                      >
                        <span className="md:block">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/30">
                    <SortableContext items={filteredClasses.map((c) => c.id)} strategy={verticalListSortingStrategy} disabled={!dragEnabled}>
                      {filteredClasses.map((classItem) => (
                        <SortableRow key={classItem.id} classItem={classItem}>
                          {(dragHandle) => (
                            <>
                              <TableCell className="py-4 pl-4 sm:pl-6 align-middle">{dragEnabled ? dragHandle : null}</TableCell>

                              <TableCell className="py-4 align-middle">
                                <div className="space-y-1 min-w-0 max-w-35 sm:max-w-55 md:max-w-45">
                                  <p
                                    className="font-semibold text-foreground text-base leading-tight truncate hover:text-primary transition-colors"
                                    title={classItem.name}
                                  >
                                    {classItem.name}
                                  </p>

                                  <p className="text-sm text-foreground/50 truncate md:hidden">{classItem.classCode}</p>
                                </div>
                              </TableCell>

                              <TableCell className="hidden md:table-cell py-4 align-middle">{classItem.classCode}</TableCell>

                              <TableCell className="py-4 align-middle">
                                <Badge className={classItem.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-muted text-muted-foreground"}>{classItem.isActive ? "Active" : "Inactive"}</Badge>
                              </TableCell>

                              <TableCell className="py-4 text-xs font-medium text-muted-foreground hidden lg:table-cell align-middle">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="size-5 text-muted-foreground/80" />
                                  <span className="text-sm">
                                    {new Date(classItem.createdAt).toLocaleString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell
                                className={`py-4 pr-4 sm:pr-6 text-right align-middle w-14 md:w-24 bg-card ${
                                  isDragActive ? "" : "sticky right-0 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0"
                                }`}
                              >
                                <div className="hidden md:flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                                    title="Edit class"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => openEditDialog(classItem)}
                                  >
                                    <Pencil className="size-5" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                    title="Delete class"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => openDeleteDialog(classItem)}
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
                                      <DropdownMenuItem onClick={() => openEditDialog(classItem)}>
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                      </DropdownMenuItem>

                                      <DropdownMenuItem onClick={() => openDeleteDialog(classItem)} className="text-destructive">
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </SortableRow>
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </div>
            </DndContext>
          )}
        </div>
      </div>

      <Dialog open={editClassOpen} onOpenChange={setEditClassOpen}>
        <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Edit Class</DialogTitle>

                <DialogDescription>Update Class details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Class Name</Label>

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
                <Label>Active Class</Label>
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

              <Button type="submit" disabled={loading || !isClassChanged} className="min-w-32.5 gap-2 px-5">
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

      <AlertDialog open={deleteClassOpen} onOpenChange={setDeleteClassOpen}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete class?</AlertDialogTitle>

            <AlertDialogDescription className="text-center wrap-break-word">
              This action cannot be undone. This will permanently remove{" "}
              <span className="inline-block max-w-60 truncate align-bottom font-semibold text-foreground">{deletingClass?.name}</span>.
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
                  Delete class
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}