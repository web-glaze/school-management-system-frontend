"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gatepassService, type Housemother } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { apiError } from "../shared";

interface Form {
  name: string;
  email: string;
  phone: string;
  userName: string;
  password: string;
}

interface CreatedLogin {
  name: string;
  userName: string;
  userCode: string;
  password: string;
}

const emptyForm: Form = { name: "", email: "", phone: "", userName: "", password: "" };

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));

  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

export default function HousemothersPanel() {
  const housemothers = useGatepassStore((s) => s.housemothers);
  const loading = useGatepassStore((s) => s.loading.housemothers);
  const fetchHousemothers = useGatepassStore((s) => s.fetchHousemothers);
  const createHousemother = useGatepassStore((s) => s.createHousemother);
  const updateHousemother = useGatepassStore((s) => s.updateHousemother);
  const setHousemotherStatus = useGatepassStore((s) => s.setHousemotherStatus);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Housemother | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [created, setCreated] = useState<CreatedLogin | null>(null);

  useEffect(() => {
    fetchHousemothers().catch((error) => toast.error(apiError(error, "Could not load the housemothers")));
  }, [fetchHousemothers]);

  const patch = (changes: Partial<Form>) => setForm((prev) => ({ ...prev, ...changes }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, password: randomPassword() });
    setOpen(true);
  };

  const openEdit = (item: Housemother) => {
    setEditing(item);
    setForm({
      name: item.name,
      email: item.user.email ?? "",
      phone: item.user.phone ?? item.phone ?? "",
      userName: item.user.userName ?? "",
      password: "",
    });
    setOpen(true);
  };

  const suggestUserName = async () => {
    if (!form.name.trim()) {
      toast.error("Enter the name first");
      return;
    }

    try {
      setSuggesting(true);
      patch({ userName: await gatepassService.hostel.housemothers.generateUserName(form.name) });
    } catch (error) {
      toast.error(apiError(error, "Could not suggest a username"));
    } finally {
      setSuggesting(false);
    }
  };

  const save = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name) {
      toast.error("Enter the name");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Phone number must be a valid 10-digit mobile number");
      return;
    }

    if (!editing) {
      if (!form.userName.trim()) {
        toast.error("Enter a username");
        return;
      }

      if (form.password.length < 8) {
        toast.error("The password must be at least 8 characters");
        return;
      }
    }

    try {
      setSaving(true);

      if (editing) {
        await updateHousemother(editing.id, { name, email, phone });
        toast.success("Housemother updated");
      } else {
        const login = await createHousemother({
          name,
          email,
          phone,
          userName: form.userName.trim(),
          password: form.password,
        });

        setCreated({ name, userName: login.userName, userCode: login.userCode, password: form.password });
        toast.success("Housemother registered");
      }

      setOpen(false);
    } catch (error) {
      toast.error(apiError(error, "Could not save the housemother"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: Housemother) => {
    const makeActive = item.status !== "ACTIVE";

    try {
      await setHousemotherStatus(item.id, makeActive);
      toast.success(makeActive ? "Housemother activated" : "Housemother deactivated");
    } catch (error) {
      toast.error(apiError(error, "Could not change the status"));
    }
  };

  const copyLogin = async () => {
    if (!created) return;

    try {
      await navigator.clipboard.writeText(`Username: ${created.userName}\nPassword: ${created.password}`);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy. Please note the details down.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">
          Housemothers get a login and approve the outpass requests of the students in their hostel. Their role is <span className="font-medium">HOUSEMOTHER</span>.
        </p>

        <Button className="gap-2" onClick={openCreate}>
          <Plus className="size-4" />
          Register housemother
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Hostels</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && housemothers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : housemothers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No housemothers registered yet.
                </TableCell>
              </TableRow>
            ) : (
              housemothers.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.employeeNo}</p>
                  </TableCell>

                  <TableCell className="text-sm">
                    <p>{item.user.userName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{item.user.userCode}</p>
                  </TableCell>

                  <TableCell className="text-sm">
                    <p>{item.user.phone ?? item.phone ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{item.user.email ?? ""}</p>
                  </TableCell>

                  <TableCell className="text-sm">{item.hostels.length > 0 ? item.hostels.map((h) => h.name).join(", ") : "—"}</TableCell>

                  <TableCell>
                    <Badge variant="outline" className={item.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-600"}>
                      {item.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(item)}>
                        {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
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
        <DialogContent className="max-h-[88vh] w-[95vw] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit housemother" : "Register housemother"}</DialogTitle>
            <DialogDescription>{editing ? "Change her name or contact details." : "This creates her login. She must change the password the first time she signs in."}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hm-name">Full name</Label>
              <Input id="hm-name" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hm-email">Email</Label>
              <Input id="hm-email" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hm-phone">Mobile number</Label>
              <Input id="hm-phone" inputMode="tel" maxLength={10} value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
            </div>

            {!editing && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hm-username">Username</Label>
                  <div className="flex gap-2">
                    <Input id="hm-username" value={form.userName} onChange={(e) => patch({ userName: e.target.value })} />
                    <Button type="button" variant="outline" onClick={suggestUserName} disabled={suggesting}>
                      {suggesting ? <Loader2 className="size-4 animate-spin" /> : "Suggest"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hm-password">Password</Label>
                  <div className="flex gap-2">
                    <Input id="hm-password" value={form.password} onChange={(e) => patch({ password: e.target.value })} />
                    <Button type="button" variant="outline" onClick={() => patch({ password: randomPassword() })}>
                      New
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save" : "Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!created} onOpenChange={(next) => !next && setCreated(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login created</DialogTitle>
            <DialogDescription>Share these details with {created?.name}. The password is shown only now.</DialogDescription>
          </DialogHeader>

          {created && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">Username: </span>
                <span className="font-medium">{created.userName}</span>
              </p>
              <p>
                <span className="text-muted-foreground">User code: </span>
                <span className="font-medium">{created.userCode}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Password: </span>
                <span className="font-mono font-medium">{created.password}</span>
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={copyLogin}>
              Copy login
            </Button>
            <Button onClick={() => setCreated(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
