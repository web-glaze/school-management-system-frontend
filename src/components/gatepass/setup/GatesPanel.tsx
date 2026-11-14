"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Gate } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { apiError } from "../shared";

const GATE_TYPES: { value: Gate["type"]; label: string }[] = [
  { value: "MAIN", label: "Main gate" },
  { value: "HOSTEL", label: "Hostel gate" },
  { value: "SERVICE", label: "Service gate" },
];

export default function GatesPanel() {
  const gates = useGatepassStore((s) => s.gates);
  const loading = useGatepassStore((s) => s.loading.gates);
  const fetchGates = useGatepassStore((s) => s.fetchGates);
  const createGate = useGatepassStore((s) => s.createGate);
  const updateGate = useGatepassStore((s) => s.updateGate);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gate | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<Gate["type"]>("MAIN");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGates().catch((error) => toast.error(apiError(error, "Could not load the gates")));
  }, [fetchGates]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setLocation("");
    setType("MAIN");
    setOpen(true);
  };

  const openEdit = (gate: Gate) => {
    setEditing(gate);
    setName(gate.name);
    setLocation(gate.location ?? "");
    setType(gate.type);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Enter the gate name");
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        await updateGate(editing.id, { name: name.trim(), location: location.trim(), type });
      } else {
        await createGate({ name: name.trim(), location: location.trim() || undefined, type });
      }

      toast.success(editing ? "Gate updated" : "Gate added");
      setOpen(false);
    } catch (error) {
      toast.error(apiError(error, "Could not save the gate"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (gate: Gate) => {
    try {
      await updateGate(gate.id, { isActive: !gate.isActive });
      toast.success(gate.isActive ? "Gate switched off" : "Gate switched on");
    } catch (error) {
      toast.error(apiError(error, "Could not update the gate"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">Guards pick one of these gates when they scan. Switch a gate off to hide it from the guard.</p>

        <Button className="gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Add gate
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gate</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && gates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : gates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No gates yet. Add your main gate to start.
                </TableCell>
              </TableRow>
            ) : (
              gates.map((gate) => (
                <TableRow key={gate.id}>
                  <TableCell className="font-medium">{gate.name}</TableCell>
                  <TableCell>{gate.location || "—"}</TableCell>
                  <TableCell>{GATE_TYPES.find((t) => t.value === gate.type)?.label ?? gate.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={gate.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-600"}>
                      {gate.isActive ? "Active" : "Off"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(gate)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(gate)}>
                        {gate.isActive ? "Switch off" : "Switch on"}
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
            <DialogTitle>{editing ? "Edit gate" : "Add gate"}</DialogTitle>
            <DialogDescription>Where the guard records students leaving and returning.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gate-name">Name</Label>
              <Input id="gate-name" value={name} placeholder="Main gate" onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gate-location">Location (optional)</Label>
              <Input id="gate-location" value={location} placeholder="Near the school office" onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as Gate["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GATE_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
    </div>
  );
}
