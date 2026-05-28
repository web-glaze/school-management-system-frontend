"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import axios from "axios";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

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

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import { Field, FieldGroup } from "@/components/ui/field";

import {
  ChevronRight,
  Inbox,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Location {
  id: string;

  name: string;

  parentId?: string | null;
}

export default function LocationPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [rootName, setRootName] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [subLocationMap, setSubLocationMap] = useState<{
    [key: string]: string;
  }>({});

  /* FETCH */
  const fetchLocations = async () => {
    try {
      setLoading(true);
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
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchLocations();
    }, 0);
  }, []);

  /* CREATE */
  const createLocation = async (name: string, parentId?: string) => {
    if (!name) return;

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/locations`,
        {
          name,
          parentId: parentId || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchLocations();
    } catch (error) {
      console.log(error);
    }
  };

  /* DELETE */
  const deleteLocation = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/api/locations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchLocations();
    } catch (error) {
      console.log(error);
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
        const selfMatch = location.name
          .toLowerCase()
          .includes(search.toLowerCase());

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
              className="
              group
              flex
              items-center
              justify-between
              gap-4
              rounded-xl
              border
              border-border/50
              bg-card
              px-4
              py-3
              hover:bg-muted/30
              transition-all
            "
              style={{
                marginLeft: level * 22,
              }}
            >
              {/* LEFT */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* ICON */}
                <div
                  className="
                  size-9
                  rounded-lg
                  bg-primary/10
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
                >
                  <MapPin className="size-4 text-primary" />
                </div>

                {/* CONTENT */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {location.name}
                    </h3>

                    {children.length > 0 && (
                      <span
                        className="
                        text-[11px]
                        px-2
                        py-0.5
                        rounded-full
                        bg-muted
                        text-muted-foreground
                      "
                      >
                        {children.length} Sub Locations
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    {level === 0 ? "Root Location" : `Nested Level ${level}`}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-2">
                {/* ADD SUB */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <Plus className="size-4" />
                      Add
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[420px]">
                    <DialogTitle>Add Sub Location</DialogTitle>
                    <DialogDescription>
                      Create a child location under{" "}
                      <span className="font-bold">{location.name}</span>
                    </DialogDescription>

                    <div className="space-y-4 py-4">
                      <Input
                        placeholder="Sub location name"
                        value={subLocationMap[location.id] || ""}
                        onChange={(e) =>
                          setSubLocationMap((prev) => ({
                            ...prev,
                            [location.id]: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        className="gap-2 px-5"
                        onClick={async () => {
                          await createLocation(
                            subLocationMap[location.id],
                            location.id,
                          );

                          setSubLocationMap((prev) => ({
                            ...prev,
                            [location.id]: "",
                          }));
                        }}
                      >
                        <Plus className="size-4" />
                        Create Location
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* DELETE */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="
                      text-muted-foreground
                      hover:text-destructive
                      hover:bg-destructive/10
                    "
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Location?</AlertDialogTitle>

                      <AlertDialogDescription asChild>
                        <div className="space-y-2">
                          <div>This action cannot be undone.</div>

                          {hasChildren && (
                            <div
                              className="
                                rounded-lg
                                border
                                border-destructive/20
                                bg-destructive/5
                                p-3
                                text-sm
                                text-destructive
                                font-medium
                              "
                            >
                              This location has sub locations. Deleting it will
                              remove all child locations too.
                            </div>
                          )}
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>

                      <AlertDialogAction
                        onClick={() => deleteLocation(location.id)}
                        className="h-11 bg-destructive text-white hover:bg-destructive/90 gap-2 px-5"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* CHILDREN */}
            {children.length > 0 && (
              <div className="mt-2 space-y-2">
                {renderTree(location.id, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* TOP BAR */}
        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-5">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* SEARCH */}
            <div className="relative w-full lg:w-[350px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <Input
                type="text"
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>

            {/* CREATE ROOT */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 px-5">
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
                      <DialogTitle className="text-lg">
                        Create Main Location
                      </DialogTitle>

                      <DialogDescription>
                        Add a new main campus location
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <FieldGroup>
                    <Field>
                      <Label htmlFor="location-name">Location Name</Label>

                      <Input
                        id="location-name"
                        placeholder="Main Building, Block A..."
                        value={rootName}
                        onChange={(e) => setRootName(e.target.value)}
                        className="mt-2"
                      />
                    </Field>
                  </FieldGroup>

                  <DialogFooter className="gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>

                    <Button
                      className="gap-2 min-w-[130px]"
                      onClick={async () => {
                        setLoading(true);

                        await createLocation(rootName);

                        setRootName("");

                        setLoading(false);

                        setOpen(false);
                      }}
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

          {/* EMPTY */}
          {!loading && locations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>

              <h3 className="text-lg font-bold text-foreground">
                No locations created yet.
              </h3>

              <p className="text-muted-foreground mt-1.5 max-w-sm">
                Start by creating your first main location.
              </p>
            </div>
          )}

          {/* TREE */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : (
              renderTree()
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
