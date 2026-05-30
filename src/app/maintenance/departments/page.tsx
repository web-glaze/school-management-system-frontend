"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import axios from "axios";
import {
  Building2,
  Calendar,
  Eye,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import Link from "next/link";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Department {
  id: string;
  name: string;
  departmentCode?: string;
  createdAt: string;
}

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);

  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [editName, setEditName] = useState("");

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/departments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDepartments(
        Array.isArray(response.data) ? response.data : response.data.data || [],
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchDepartments();
    }, 0);
  }, []);

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/departments`,
        {
          name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setName("");

      await fetchDepartments();

      setOpen(false);
    } catch (error) {
      console.log(error);

      setLoading(false);
    }
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setEditName(department.name);
    setEditOpen(true);
  };

  const updateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDepartment) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/departments/${editingDepartment.id}`,
        {
          name: editName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await fetchDepartments();

      setEditOpen(false);
      setEditingDepartment(null);
      setEditName("");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      toast.success("Department updated successfully");
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      setDeletingId(id);
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/api/departments/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchDepartments();
    } catch (error) {
      console.log(error);

      setLoading(false);
    } finally {
      setDeletingId(null);
    }
  };

  /* FILTER */
  const filteredDepartments = departments.filter((department) =>
    department.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Departments</h1>
            <p className="text-muted-foreground">
              Manage and track departments
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add Department
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">
                      Create Department
                    </DialogTitle>
                    <DialogDescription>
                      Add a new maintenance department
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={createDepartment} className="space-y-6 p-6">
                <FieldGroup>
                  <Field>
                    <Label htmlFor="department-name">Department Name</Label>
                    <Input
                      id="department-name"
                      placeholder="Electrical, Plumbing, IT..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-2"
                    />
                  </Field>
                </FieldGroup>

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="min-w-[130px] gap-2 px-5"
                  >
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
            <div className="relative w-full lg:w-[350px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search by title, location, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>
          </div>
          {loading ? (
            <div className="space-y-4">
              <div className="flex gap-4 border-b border-border/50 pb-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-6 bg-muted rounded flex-1 animate-pulse"
                  />
                ))}
              </div>
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="flex gap-4 py-2 border-b border-border/20"
                >
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                No departments created yet.
              </h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm">
                No matching records were found in the database. Check search
                queries or reset parameters.
              </p>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40 dark:bg-muted/15 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-[20px]">
                      # ID
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-[220px]">
                      Title
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[120px]">
                      Created At
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-6 text-foreground/80 text-right min-w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {filteredDepartments.map((department) => {
                    return (
                      <TableRow
                        key={department.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="py-4 pl-6 align-top">
                          <div className="space-y-1 max-w-[20px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {department.departmentCode}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 pl-6 align-top">
                          <div className="space-y-1 max-w-[260px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {department.name}
                            </p>
                          </div>
                        </TableCell>

                        {/* Created At */}
                        <TableCell className="py-4 text-xs font-medium text-muted-foreground align-top">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-5 text-muted-foreground/80" />
                            <span className="text-base">
                              {new Date(department.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 pr-6 text-right align-top">
                          <Dialog open={editOpen} onOpenChange={setEditOpen}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(department)}
                              className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                              title="Edit Department"
                            >
                              <Pencil className="size-5" />
                            </Button>

                            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
                              <div className="border-b px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Pencil className="size-5 text-primary" />
                                  </div>

                                  <div>
                                    <DialogTitle className="text-lg">
                                      Edit Department
                                    </DialogTitle>

                                    <DialogDescription>
                                      Update department details
                                    </DialogDescription>
                                  </div>
                                </div>
                              </div>

                              <form
                                onSubmit={updateDepartment}
                                className="space-y-6 p-6"
                              >
                                <FieldGroup>
                                  <Field>
                                    <Label htmlFor="edit-department-name">
                                      Department Name
                                    </Label>

                                    <Input
                                      id="edit-department-name"
                                      placeholder="Electrical, Plumbing, IT..."
                                      value={editName}
                                      onChange={(e) =>
                                        setEditName(e.target.value)
                                      }
                                      required
                                      className="mt-2"
                                    />
                                  </Field>
                                </FieldGroup>

                                <DialogFooter className="gap-2">
                                  <DialogClose asChild>
                                    <Button variant="outline" type="button">
                                      Cancel
                                    </Button>
                                  </DialogClose>

                                  <Button
                                    type="submit"
                                    disabled={loading}
                                    className="min-w-[130px] gap-2 px-5"
                                  >
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                title="Delete Department"
                              >
                                <Trash2 className="size-5" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="sm:max-w-[420px]">
                              <AlertDialogHeader>
                                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
                                  <Trash2 className="size-6 text-destructive" />
                                </div>

                                <AlertDialogTitle className="w-full text-center text-xl">
                                  Delete Department?
                                </AlertDialogTitle>

                                <AlertDialogDescription className="text-center">
                                  This action cannot be undone. This will
                                  permanently remove
                                  <span className="font-semibold text-foreground">
                                    {" "}
                                    {department.name}
                                  </span>
                                  .
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel className="h-11">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteDepartment(department.id)
                                  }
                                  disabled={deletingId === department.id}
                                  className="h-11 bg-destructive text-white hover:bg-destructive/90 gap-2 px-5"
                                >
                                  {deletingId === department.id ? (
                                    <>
                                      <Loader2 className="size-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="size-4" />
                                      Delete Department
                                    </>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </DashboardLayout>
  );
}
