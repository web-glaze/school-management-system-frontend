"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarDays, Calendar as CalendarIcon, Inbox, Loader2, Pencil, Plus, Search, Trash2, MoreVertical } from "lucide-react";
import { useAcademicStore } from "@/store/academicStore";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useState } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface AcademicSession {
  id: string;
  sessionCode: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export default function AcademicSessionPage() {
  const { sessions, loading, fetchSessions, createSession, updateSession, deleteSession } = useAcademicStore();
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);

  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editIsActive, setEditIsActive] = useState(false);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [editSessionOpen, setEditSessionOpen] = useState(false);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [editStartDateOpen, setEditStartDateOpen] = useState(false);
  const [editEndDateOpen, setEditEndDateOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<AcademicSession | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormErrors({
        name: "Session name is required",
      });
      return;
    }

    try {
      await createSession({
        name,
        startDate,
        endDate,
        isActive,
      });

      setName("");
      setStartDate("");
      setEndDate("");
      setIsActive(false);
      setFormErrors({});
      setAddSessionOpen(false);

      toast.success("Academic Session created successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const errors = apiError.response?.data?.errors;
      if (errors) {
        setFormErrors(errors);
        return;
      }
      toast.error(apiError.response?.data?.message ?? "Failed to create session");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSession) return;

    const id = editingSession.id;
    if (!editName.trim()) {
      setEditErrors({
        name: "Session name is required",
      });
      return;
    }
    try {
      await updateSession(id, {
        name: editName,
        startDate: editStartDate,
        endDate: editEndDate,
        isActive: editIsActive,
      });

      setEditSessionOpen(false);
      setEditingSession(null);

      toast.success("Academic session updated successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      const errors = apiError.response?.data?.errors;
      if (errors) {
        setEditErrors(errors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to update session");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deletingSession) return;

    try {
      setDeletingId(deletingSession.id);

      await deleteSession(deletingSession.id);

      setDeleteSessionOpen(false);
      setDeletingSession(null);

      toast.success("Academic session deleted successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors?.session) {
        toast.error(errors.session);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (session: AcademicSession) => {
    setEditingSession(session);
    setEditName(session.name);
    setEditStartDate(session.startDate.split("T")[0]);
    setEditEndDate(session.endDate.split("T")[0]);
    setEditIsActive(session.isActive);
    setEditErrors({});
    setEditSessionOpen(true);
  };

  const openDeleteDialog = (session: AcademicSession) => {
    setDeletingSession(session);
    setDeleteSessionOpen(true);
  };

  const authorized = usePermission("academic-session.read");

  if (authorized === null) {
    return null;
  }

  const isSessionChanged =
    editingSession &&
    (editName.trim() !== editingSession.name || editStartDate !== editingSession.startDate.split("T")[0] || editEndDate !== editingSession.endDate.split("T")[0] || editIsActive !== editingSession.isActive);

  const filteredSessions = sessions.filter((session) => session.name.toLowerCase().includes(search.toLowerCase()) || session.sessionCode.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Academic Sessions</h1>
            <p className="text-muted-foreground">Manage academic sessions</p>
          </div>
          <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add Session
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="size-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Create Academic session</DialogTitle>
                    <DialogDescription>Add a new Academic session</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-6 p-6">
                <FieldGroup>
                  <Field>
                    <Label>Session Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, "");

                        setName(value);

                        if (value.length > 0) {
                          setFormErrors((prev) => ({
                            ...prev,
                            name: "",
                          }));
                        }
                      }}
                      placeholder="2025-26"
                      className="mt-2"
                    />
                    {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                  </Field>

                  <Field>
                    <Label>Start Date</Label>

                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className={cn("mt-2 h-10 w-full justify-start text-left font-normal", !startDate && "text-muted-foreground", formErrors.startDate && "border-red-500")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(new Date(startDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Calendar
                          mode="single"
                          selected={startDate ? new Date(startDate) : undefined}
                          onSelect={(date) => {
                            if (!date) return;

                            setStartDate(format(date, "yyyy-MM-dd"));

                            setFormErrors((prev) => ({
                              ...prev,
                              startDate: "",
                            }));

                            setStartDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    {formErrors.startDate && <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>}
                  </Field>

                  <Field>
                    <Label>End Date</Label>

                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className={cn("mt-2 h-10 w-full justify-start text-left font-normal", !endDate && "text-muted-foreground", formErrors.endDate && "border-red-500")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(new Date(endDate), "dd MMM yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <Calendar
                          mode="single"
                          selected={endDate ? new Date(endDate) : undefined}
                          onSelect={(date) => {
                            if (!date) return;

                            setEndDate(format(date, "yyyy-MM-dd"));

                            setFormErrors((prev) => ({
                              ...prev,
                              endDate: "",
                            }));

                            setEndDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    {formErrors.endDate && <p className="text-sm text-red-500 mt-1">{formErrors.endDate}</p>}
                  </Field>

                  <Field>
                    <Label>Active Session</Label>

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
              <Input type="text" placeholder="Search by session name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
            </div>
          </div>
          {loading && sessions.length === 0 ? (
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
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{sessions.length === 0 ? "No sessions created yet." : "No sessions found."}</h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm">{sessions.length === 0 ? "Add your first session to get started." : `Try adjusting your search or filters.`}</p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-45">Session</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Start Date</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">End Date</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30 hidden lg:table-cell">Created At</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-6 text-foreground/80 text-right min-w-12.5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {filteredSessions.map((session) => {
                    return (
                      <TableRow key={session.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-4 pl-6 align-top">
                          <div className="space-y-1 max-w-45">
                            <p className="font-semibold text-foreground text-base leading-tight hover:text-primary transition-colors">{session.name}</p>

                            <p className="text-sm text-foreground/50">{session.sessionCode}</p>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">{new Date(session.startDate).toLocaleDateString("en-IN")}</TableCell>

                        <TableCell className="py-4">{new Date(session.endDate).toLocaleDateString("en-IN")}</TableCell>

                        <TableCell className="py-4">
                          <Badge className={session.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-muted text-muted-foreground"}>{session.isActive ? "Active" : "Inactive"}</Badge>
                        </TableCell>

                        {/* Created At */}
                        <TableCell className="py-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="size-5 text-muted-foreground/80" />
                            <span className="text-sm">
                              {new Date(session.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 pr-6 text-right align-top max-w-12.5">
                          <div className="hidden md:flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                              title="Edit session"
                              onClick={() => openEditDialog(session)}
                            >
                              <Pencil className="size-5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                              title="Delete session"
                              onClick={() => openDeleteDialog(session)}
                            >
                              <Trash2 className="size-5" />
                            </Button>
                          </div>
                          <div className="md:hidden flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-9">
                                  <MoreVertical className="size-5" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(session)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => openDeleteDialog(session)} className="text-destructive">
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={editSessionOpen} onOpenChange={setEditSessionOpen}>
        <DialogContent className="sm:max-w-115 p-0 overflow-hidden">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Pencil className="size-5 text-primary" />
              </div>

              <div>
                <DialogTitle className="text-lg">Edit Academic session</DialogTitle>

                <DialogDescription>Update Academic session details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6 p-6">
            <FieldGroup>
              <Field>
                <Label>Session Name</Label>

                <Input
                  value={editName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9-]/g, "");

                    setEditName(value);

                    if (value.length > 0) {
                      setEditErrors((prev) => ({
                        ...prev,
                        name: "",
                      }));
                    }
                  }}
                  className="mt-2"
                />

                {editErrors.name && <p className="text-sm text-red-500 mt-1">{editErrors.name}</p>}
              </Field>

              <Field>
                <Label>Start Date</Label>

                <Popover open={editStartDateOpen} onOpenChange={setEditStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("mt-2 h-10 w-full justify-start text-left font-normal", !editStartDate && "text-muted-foreground", editErrors.startDate && "border-red-500")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editStartDate ? format(new Date(editStartDate), "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={editStartDate ? new Date(editStartDate) : undefined}
                      defaultMonth={editStartDate ? new Date(editStartDate) : new Date()}
                      onSelect={(date) => {
                        if (!date) return;

                        setEditStartDate(format(date, "yyyy-MM-dd"));

                        setEditErrors((prev) => ({
                          ...prev,
                          startDate: "",
                        }));

                        setEditStartDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {editErrors.startDate && <p className="text-sm text-red-500 mt-1">{editErrors.startDate}</p>}
              </Field>

              <Field>
                <Label>End Date</Label>

                <Popover open={editEndDateOpen} onOpenChange={setEditEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={cn("mt-2 h-10 w-full justify-start text-left font-normal", !editEndDate && "text-muted-foreground", editErrors.endDate && "border-red-500")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editEndDate ? format(new Date(editEndDate), "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={editEndDate ? new Date(editEndDate) : undefined}
                      defaultMonth={editEndDate ? new Date(editEndDate) : new Date()}
                      onSelect={(date) => {
                        if (!date) return;

                        setEditEndDate(format(date, "yyyy-MM-dd"));

                        setEditErrors((prev) => ({
                          ...prev,
                          endDate: "",
                        }));

                        setEditEndDateOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {editErrors.endDate && <p className="text-sm text-red-500 mt-1">{editErrors.endDate}</p>}
              </Field>

              <Field>
                <Label>Active Session</Label>

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

              <Button type="submit" disabled={loading || !isSessionChanged} className="min-w-32.5 gap-2 px-5">
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

      <AlertDialog open={deleteSessionOpen} onOpenChange={setDeleteSessionOpen}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete session?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove
              <span className="font-semibold text-foreground"> {deletingSession?.name}</span>.
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
                  Delete session
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
