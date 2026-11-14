"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Hostel } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { apiError } from "../shared";

export default function HostelsPanel() {
  const hostels = useGatepassStore((s) => s.hostels);
  const housemothers = useGatepassStore((s) => s.housemothers);
  const loading = useGatepassStore((s) => s.loading.hostels);
  const fetchHostels = useGatepassStore((s) => s.fetchHostels);
  const fetchHousemothers = useGatepassStore((s) => s.fetchHousemothers);
  const createHostel = useGatepassStore((s) => s.createHostel);
  const updateHostel = useGatepassStore((s) => s.updateHostel);
  const setHostelHousemother = useGatepassStore((s) => s.setHostelHousemother);
  const removeHostel = useGatepassStore((s) => s.removeHostel);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hostel | null>(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [housemotherId, setHousemotherId] = useState("none");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Hostel | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchHostels().catch((error) => toast.error(apiError(error, "Could not load the hostels")));
    fetchHousemothers().catch(() => undefined);
  }, [fetchHostels, fetchHousemothers]);

  const activeHousemothers = housemothers.filter((h) => h.status === "ACTIVE");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setCapacity("");
    setHousemotherId("none");
    setOpen(true);
  };

  const openEdit = (hostel: Hostel) => {
    setEditing(hostel);
    setName(hostel.name);
    setCapacity(hostel.capacity > 0 ? String(hostel.capacity) : "");
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Enter the hostel name");
      return;
    }

    const capacityNumber = capacity.trim() === "" ? 0 : Number(capacity);

    if (!Number.isInteger(capacityNumber) || capacityNumber < 0) {
      toast.error("Capacity must be a whole number, or empty for no limit");
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        await updateHostel(editing.id, { name: name.trim(), capacity: capacityNumber });
      } else {
        await createHostel({
          name: name.trim(),
          capacity: capacityNumber,
          housemotherId: housemotherId === "none" ? undefined : housemotherId,
        });
      }

      toast.success(editing ? "Hostel updated" : "Hostel added");
      setOpen(false);
    } catch (error) {
      toast.error(apiError(error, "Could not save the hostel"));
    } finally {
      setSaving(false);
    }
  };

  const changeHousemother = async (hostel: Hostel, id: string) => {
    try {
      await setHostelHousemother(hostel.id, id);
      toast.success(`Housemother updated for ${hostel.name}`);
    } catch (error) {
      toast.error(apiError(error, "Could not change the housemother"));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    try {
      setRemoving(true);
      await removeHostel(deleting.id);
      toast.success("Hostel deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(apiError(error, "Could not delete the hostel"));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">Each hostel has one housemother, who approves the outpass requests of its students. One housemother can look after more than one hostel.</p>

        <Button className="gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Add hostel
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hostel</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Housemother</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && hostels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : hostels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No hostels yet. Add a hostel, then link students to it.
                </TableCell>
              </TableRow>
            ) : (
              hostels.map((hostel) => (
                <TableRow key={hostel.id}>
                  <TableCell className="font-medium">{hostel.name}</TableCell>

                  <TableCell>
                    {hostel.studentCount}
                    {hostel.capacity > 0 ? ` / ${hostel.capacity}` : ""}
                  </TableCell>

                  <TableCell>
                    <Select value={hostel.housemother?.id ?? ""} onValueChange={(value) => changeHousemother(hostel, value)}>
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Assign a housemother" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeHousemothers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No housemothers yet</div>
                        ) : (
                          activeHousemothers.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(hostel)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleting(hostel)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit hostel" : "Add hostel"}</DialogTitle>
            <DialogDescription>{editing ? "Change the name or the capacity." : "Create a hostel and, if you like, choose its housemother."}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hostel-name">Name</Label>
              <Input id="hostel-name" value={name} placeholder="Rose House" onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostel-capacity">Capacity (optional)</Label>
              <Input id="hostel-capacity" inputMode="numeric" value={capacity} placeholder="Leave empty for no limit" onChange={(e) => setCapacity(e.target.value)} />
            </div>

            {!editing && (
              <div className="space-y-2">
                <Label>Housemother (optional)</Label>
                <Select value={housemotherId} onValueChange={setHousemotherId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Assign later</SelectItem>
                    {activeHousemothers.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>A hostel can only be deleted when no students are linked to it. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Keep hostel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {removing ? "Deleting..." : "Delete hostel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
