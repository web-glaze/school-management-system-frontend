"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Power } from "lucide-react";
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
import { RowActions, TH, THEAD_CLASS, TableCard, TableEmptyRow, TableLoadingRow, apiError } from "../shared";

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

  const unchanged = !!editing && name.trim() === editing.name && location.trim() === (editing.location ?? "") && type === editing.type;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">Guards pick one of these gates when they scan. Switch a gate off to hide it from the guard.</p>

        <Button className="gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Add gate
        </Button>
      </div>

      <TableCard>
        <Table>
          <TableHeader className={THEAD_CLASS}>
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${TH} pl-4 sm:pl-6`}>Gate</TableHead>
              <TableHead className={`${TH} hidden sm:table-cell`}>Location</TableHead>
              <TableHead className={`${TH} hidden md:table-cell`}>Type</TableHead>
              <TableHead className={TH}>Status</TableHead>
              <TableHead className={`${TH} w-14 pr-4 text-right sm:pr-6 md:w-28`}>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border/30">
            {loading && gates.length === 0 ? (
              <TableLoadingRow colSpan={5} />
            ) : gates.length === 0 ? (
              <TableEmptyRow colSpan={5} title="No gates yet" text="Add your main gate to start." />
            ) : (
              gates.map((gate) => {
                const typeLabel = GATE_TYPES.find((t) => t.value === gate.type)?.label ?? gate.type;

                return (
                  <TableRow key={gate.id}>
                    <TableCell className="py-4 pl-4 align-middle sm:pl-6">
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold leading-tight">{gate.name}</p>
                        {gate.location && <p className="text-sm text-foreground/50 sm:hidden">{gate.location}</p>}
                        <p className="text-xs text-muted-foreground md:hidden">{typeLabel}</p>
                      </div>
                    </TableCell>

                    <TableCell className="hidden py-4 align-middle sm:table-cell">{gate.location || "—"}</TableCell>

                    <TableCell className="hidden py-4 align-middle md:table-cell">{typeLabel}</TableCell>

                    <TableCell className="py-4 align-middle">
                      <Badge variant="outline" className={gate.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-600"}>
                        {gate.isActive ? "Active" : "Off"}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-4 pr-4 text-right align-middle sm:pr-6">
                      <RowActions
                        actions={[
                          { label: "Edit", icon: Pencil, onClick: () => openEdit(gate) },
                          { label: gate.isActive ? "Switch off" : "Switch on", icon: Power, onClick: () => toggleActive(gate), danger: gate.isActive },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableCard>

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
            <Button onClick={save} disabled={saving || unchanged} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
