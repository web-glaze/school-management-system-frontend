"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import { Field, FieldGroup } from "@/components/ui/field";

import { ChevronRight, Inbox, Loader2, MapPin, Pencil, Plus, Search, Trash2, Settings, MoreVertical, Trash } from "lucide-react";
import { toast } from "sonner";
import { useLocationStore } from "@/store/maintenanceStore";

interface Location {
  id: string;
  name: string;
  parentId?: string | null;
}

export default function LocationPage() {
  const { locations, loading, fetchLocations, createLocation, updateLocation, deleteLocation } = useLocationStore();

  const [rootName, setRootName] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [subLocationMap, setSubLocationMap] = useState<{
    [key: string]: string;
  }>({});

  const [editLocationMap, setEditLocationMap] = useState<{
    [key: string]: string;
  }>({});

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreateRoot = async () => {
    if (!rootName) return;
    try {
      await createLocation(rootName);
      setRootName("");
      setOpen(false);
      toast.success("Location Created", {
        description: `"${rootName}" has been added to location.`,
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to create location");
    }
  };

  const handleCreateSub = async () => {
    if (!selectedLocation) return;
    const name = subLocationMap[selectedLocation.id];
    if (!name) return;

    try {
      await createLocation(name, selectedLocation.id);
      setAddDialogOpen(false);
      toast.success("Location Created", {
        description: `"${name}" has been added to location.`,
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to create sub-location");
    }
  };

  const handleRename = async () => {
    if (!selectedLocation) return;
    const name = editLocationMap[selectedLocation.id];
    if (!name) return;

    try {
      await updateLocation(selectedLocation.id, name, selectedLocation.parentId);
      setEditDialogOpen(false);
      toast.success("Location Updated", {
        description: `"${name}" was updated successfully.`,
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to update location");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedLocation) return;

    try {
      setDeletingId(selectedLocation.id);
      await deleteLocation(selectedLocation.id);
      setDeleteDialogOpen(false);
      toast.success("Location Deleted", {
        description: "The location has been removed.",
      });
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete location");
    } finally {
      setDeletingId(null);
    }
  };

  /* CHILDREN */
  const getChildren = (parentId: string | null) => {
    return locations.filter((location) => location.parentId === parentId);
  };

  /* CHECK MATCH */
  const hasMatchingChild = (locationId: string): boolean => {
    const children = getChildren(locationId);

    return children.some((child) => {
      const matches = child.name.toLowerCase().includes(search.toLowerCase());

      return matches || hasMatchingChild(child.id);
    });
  };

  /* TREE */
  const renderTree = (parentId: string | null = null, level = 0) => {
    return getChildren(parentId)
      .filter((location) => {
        const selfMatch = location.name.toLowerCase().includes(search.toLowerCase());

        const childMatch = hasMatchingChild(location.id);

        return selfMatch || childMatch;
      })
      .map((location) => {
        const children = getChildren(location.id);
        const hasChildren = children.length > 0;

        return (
          <div key={location.id}>
            {/* ROW */}
            <div
              className="group flex items-center justify-between gap-4 rounded-xl shadow-sm/50 bg-card px-4 py-3 hover:bg-muted/30 transition-all"
              style={{
                marginLeft: level * 10,
              }}
            >
              {/* LEFT */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* ICON */}
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="size-4 text-primary" />
                </div>

                {/* CONTENT */}
                <div className="min-w-0">
                  <div className="flex flex-col min-w-0 gap-1">
                    <h3 className="font-medium text-sm truncate">{location.name}</h3>

                    <p className="text-xs text-muted-foreground">
                      Level {level}
                      {children.length > 0 && ` • ${children.length} Children`}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setSelectedLocation(location);
                      setAddDialogOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Add Child
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setSelectedLocation(location);

                      setEditLocationMap((prev) => ({
                        ...prev,
                        [location.id]: location.name,
                      }));

                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setSelectedLocation(location);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedLocation(location);
                          setAddDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 size-4" />
                        Add Child
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedLocation(location);

                          setEditLocationMap((prev) => ({
                            ...prev,
                            [location.id]: location.name,
                          }));

                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 size-4" />
                        Rename
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedLocation(location);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* ADD SUB */}
              </div>
            </div>

            {/* CHILDREN */}
            {children.length > 0 && <div className="mt-2 space-y-2">{renderTree(location.id, level + 1)}</div>}
          </div>
        );
      });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Locations</h1>
            <p className="text-muted-foreground text-sm">Manage and track locations</p>
          </div>
          {/* CREATE ROOT */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 px-4">
                <Plus className="size-4" />
                Add Main Location
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
              <div className="border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="size-5 text-primary" />
                  </div>

                  <div>
                    <DialogTitle className="text-lg">Create Main Location</DialogTitle>

                    <DialogDescription>Add a new main campus location</DialogDescription>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <FieldGroup>
                  <Field>
                    <Label htmlFor="location-name">Location Name</Label>

                    <Input id="location-name" placeholder="Main Building, Block A..." value={rootName} onChange={(e) => setRootName(e.target.value)} className="mt-2" />
                  </Field>
                </FieldGroup>

                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>

                  <Button
                    className="gap-2 min-w-[130px]"
                    disabled={loading}
                    onClick={handleCreateRoot}
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
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* TOP BAR */}
        <div className="bg-card rounded-md p-5 md:p-6 shadow-sm/60 space-y-5">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* SEARCH */}
            <div className="relative w-full lg:w-[350px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <Input type="text" placeholder="Search locations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
            </div>
          </div>

          {/* EMPTY */}
          {!loading && locations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>

              <h3 className="text-lg font-bold text-foreground">No locations created yet.</h3>

              <p className="text-muted-foreground mt-1.5 max-w-sm">Start by creating your first main location.</p>
            </div>
          )}

          {/* TREE */}
          <div className="space-y-4">
            {loading && locations.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              renderTree()
            )}
          </div>
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogTitle>Add Sub Location</DialogTitle>

          <DialogDescription>
            Create a child location under <span className="font-bold">{selectedLocation?.name}</span>
          </DialogDescription>

          <div className="py-4">
            <Input
              placeholder="Sub location name"
              value={selectedLocation ? subLocationMap[selectedLocation.id] || "" : ""}
              onChange={(e) => {
                if (!selectedLocation) return;

                setSubLocationMap((prev) => ({
                  ...prev,
                  [selectedLocation.id]: e.target.value,
                }));
              }}
            />
          </div>

          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              className="gap-2 min-w-[130px]"
              disabled={loading}
              onClick={handleCreateSub}
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
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogTitle>Edit Location</DialogTitle>

          <DialogDescription>Update location name</DialogDescription>

          <div className="py-4">
            <Input
              placeholder="Location name"
              value={selectedLocation ? editLocationMap[selectedLocation.id] || "" : ""}
              onChange={(e) => {
                if (!selectedLocation) return;

                setEditLocationMap((prev) => ({
                  ...prev,
                  [selectedLocation.id]: e.target.value,
                }));
              }}
            />
          </div>

          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              className="gap-2 min-w-[130px]"
              disabled={loading}
              onClick={handleRename}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>

            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-row justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              className="gap-2 min-w-[130px]"
              disabled={!!deletingId}
              onClick={handleDelete}
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 size-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
