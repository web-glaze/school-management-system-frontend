"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { gatepassService, uploadIdProofs, type CreateMovementRequestPayload, type MovementType, type PickupPersonPayload, type StudentCard } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { DatePicker, DateTimePicker, parseLocalValue } from "./pickers";
import { StudentSummary, apiError } from "./shared";

const ID_TYPES = ["Aadhaar card", "Driving licence", "Voter ID", "Passport", "PAN card", "Other"];
const MAX_PERSONS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const TYPE_OPTIONS: { value: MovementType; title: string; hint: string }[] = [
  { value: "OUTPASS", title: "Outpass", hint: "One student, picked up by family" },
  { value: "VISITOR", title: "Visitor pass", hint: "Visitors coming for the day" },
  { value: "EVENT_TRIP", title: "Event trip", hint: "Several students, with a teacher" },
];

interface PickupDraft {
  key: string;
  name: string;
  relation: string;
  phone: string;
  idProofType: string;
  idProofNumber: string;
  file: File | null;
}

let draftCounter = 0;

const emptyPerson = (): PickupDraft => ({
  key: `person-${++draftCounter}`,
  name: "",
  relation: "",
  phone: "",
  idProofType: "",
  idProofNumber: "",
  file: null,
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function RaiseRequestDialog({ open, onOpenChange, onCreated }: Props) {
  const createRequest = useGatepassStore((s) => s.createRequest);

  const [parentOnly, setParentOnly] = useState(false);
  const [type, setType] = useState<MovementType>("OUTPASS");

  // shared
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // visitor pass
  const [visitDate, setVisitDate] = useState("");
  const [visitMode, setVisitMode] = useState<"student" | "staff">("student");
  const [hostName, setHostName] = useState("");

  // students: always found one at a time, by the exact admission number
  const [admissionNo, setAdmissionNo] = useState("");
  const [selected, setSelected] = useState<StudentCard[]>([]);
  const [looking, setLooking] = useState(false);

  // pickup persons (outpass) or visitors (visitor pass)
  const [persons, setPersons] = useState<PickupDraft[]>(() => [emptyPerson()]);

  // event trip
  const [accompanying, setAccompanying] = useState("");

  // A parent login can only raise a request for its own child.
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];

      setParentOnly(roles.includes("STUDENT") && !roles.includes("TEACHER") && !user?.teacherId);
    } catch {
      setParentOnly(false);
    }
  }, []);

  const typeOptions = parentOnly ? TYPE_OPTIONS.filter((o) => o.value !== "EVENT_TRIP") : TYPE_OPTIONS;

  // One student (outpass, or a parent's visitor pass) or several (event trip, visitor pass raised by staff).
  const singleStudent = type === "OUTPASS" || (type === "VISITOR" && parentOnly);
  const multiStudents = type === "EVENT_TRIP" || (type === "VISITOR" && !parentOnly && visitMode === "student");
  const needsStudents = singleStudent || multiStudents;
  const metStaff = type === "VISITOR" && !parentOnly && visitMode === "staff";
  const wantsPersons = type !== "EVENT_TRIP";
  const personLabel = type === "VISITOR" ? "Visitor" : "Pickup person";
  const student = selected[0] ?? null;

  const reset = () => {
    setType("OUTPASS");
    setPurpose("");
    setDestination("");
    setFrom("");
    setTo("");
    setVisitDate("");
    setVisitMode("student");
    setHostName("");
    setAdmissionNo("");
    setSelected([]);
    setPersons([emptyPerson()]);
    setAccompanying("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const changeType = (next: MovementType) => {
    setType(next);
    setAdmissionNo("");
    setSelected([]);
  };

  const changeVisitMode = (next: "student" | "staff") => {
    setVisitMode(next);
    setAdmissionNo("");
    setSelected([]);
  };

  // Find a student by the exact admission number.
  const lookup = async () => {
    const value = admissionNo.trim();

    if (!value) {
      toast.error("Enter the admission number");
      return;
    }

    try {
      setLooking(true);

      const found = await gatepassService.movement.students({ admissionNo: value });

      if (found.length === 0) {
        toast.error("No student found with this admission number");
        return;
      }

      const card = found[0];

      if (multiStudents) {
        if (selected.some((s) => s.id === card.id)) {
          toast.info(`${card.name} is already added`);
        } else {
          setSelected((prev) => [...prev, card]);
        }

        setAdmissionNo("");
      } else {
        setSelected([card]);
      }
    } catch (error) {
      toast.error(apiError(error, "Could not find the student"));
    } finally {
      setLooking(false);
    }
  };

  const removeStudent = (id: string) => setSelected((prev) => prev.filter((s) => s.id !== id));

  const updatePerson = (key: string, patch: Partial<PickupDraft>) => setPersons((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const addPerson = () => setPersons((prev) => [...prev, emptyPerson()]);

  const removePerson = (key: string) => setPersons((prev) => prev.filter((p) => p.key !== key));

  // submit

  const submit = async () => {
    if (!purpose.trim()) {
      toast.error(type === "OUTPASS" ? "Enter the reason for the outpass" : type === "VISITOR" ? "Enter the purpose of the visit" : "Enter the event or purpose");
      return;
    }

    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (type === "VISITOR") {
      if (!visitDate) {
        toast.error("Choose the day of the visit");
        return;
      }
    } else {
      fromDate = parseLocalValue(from);
      toDate = parseLocalValue(to);

      if (!fromDate || !toDate) {
        toast.error("Choose the departure and return date and time");
        return;
      }

      if (toDate <= fromDate) {
        toast.error("The return time must be after the departure time");
        return;
      }

      if (toDate <= new Date()) {
        toast.error("The return time must be in the future");
        return;
      }
    }

    let studentIds: string[] = [];

    if (needsStudents) {
      if (selected.length === 0) {
        toast.error(singleStudent ? "Enter the admission number and fetch the student first" : type === "VISITOR" ? "Add the student being visited" : "Add at least one student");
        return;
      }

      if (type === "OUTPASS" && student) {
        if (!student.hostelName) {
          toast.error("This student is not assigned to a hostel. Please contact the school office.");
          return;
        }

        if (!student.housemotherName) {
          toast.error("This student's hostel has no housemother yet. Please contact the school office.");
          return;
        }

        if (!destination.trim()) {
          toast.error("Enter the destination");
          return;
        }
      }

      studentIds = selected.map((s) => s.id);
    } else if (metStaff && !hostName.trim()) {
      toast.error("Enter the staff member being met");
      return;
    }

    if (type === "EVENT_TRIP" && !accompanying.trim()) {
      toast.error("Enter the name of the maitre / home mother going with the students");
      return;
    }

    if (wantsPersons) {
      for (const [index, person] of persons.entries()) {
        const label = `${personLabel} ${index + 1}`;

        if (!person.name.trim() || !person.relation.trim()) {
          toast.error(`${label}: enter the name and relation`);
          return;
        }

        if (!person.idProofType) {
          toast.error(`${label}: choose the ID proof type`);
          return;
        }

        if (!person.file) {
          toast.error(`${label}: upload a photo of the ID proof`);
          return;
        }

        if (!IMAGE_TYPES.includes(person.file.type)) {
          toast.error(`${label}: the ID proof must be a JPG, PNG or WebP image`);
          return;
        }

        if (person.file.size > MAX_FILE_SIZE) {
          toast.error(`${label}: the image must be under 10 MB`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      let pickupPersons: PickupPersonPayload[] | undefined;

      if (wantsPersons) {
        const urls = await uploadIdProofs(persons.map((p) => p.file as File));

        pickupPersons = persons.map((p, index) => ({
          name: p.name.trim(),
          relation: p.relation.trim(),
          phone: p.phone.trim() || undefined,
          idProofType: p.idProofType,
          idProofNumber: p.idProofNumber.trim() || undefined,
          idProofUrl: urls[index],
        }));
      }

      const payload: CreateMovementRequestPayload =
        type === "VISITOR"
          ? {
              type,
              studentIds,
              visitDate,
              purpose: purpose.trim(),
              hostName: metStaff ? hostName.trim() : undefined,
              pickupPersons,
            }
          : {
              type,
              studentIds,
              requestedFrom: fromDate?.toISOString(),
              requestedTo: toDate?.toISOString(),
              purpose: purpose.trim(),
              destination: destination.trim() || undefined,
              accompanyingPerson: type === "EVENT_TRIP" ? accompanying.trim() : undefined,
              pickupPersons,
            };

      const created = await createRequest(payload);

      toast.success(`Request ${created.requestNo} submitted`);
      reset();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(apiError(error, "Could not submit the request"));
    } finally {
      setSubmitting(false);
    }
  };

  const description =
    type === "OUTPASS"
      ? "Enter the admission number to fetch the student, then fill in the details."
      : type === "VISITOR"
        ? "A visitor pass is valid for the whole day you choose."
        : "Add the students going on the trip by their admission numbers, then add the event details.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New request</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className={cn("grid gap-3", typeOptions.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeType(option.value)}
                className={cn("rounded-lg border p-3 text-left text-sm transition", type === option.value ? "border-primary bg-primary/5" : "hover:bg-muted")}
              >
                <p className="font-medium">{option.title}</p>
                <p className="text-muted-foreground">{option.hint}</p>
              </button>
            ))}
          </div>

          {type === "VISITOR" && !parentOnly && (
            <section className="space-y-3">
              <Label>Who are the visitors coming to see?</Label>

              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { value: "student", title: "A student" },
                    { value: "staff", title: "A staff member" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changeVisitMode(option.value)}
                    className={cn("rounded-lg border p-3 text-left text-sm transition", visitMode === option.value ? "border-primary bg-primary/5" : "hover:bg-muted")}
                  >
                    {option.title}
                  </button>
                ))}
              </div>

              {metStaff && (
                <div className="space-y-2">
                  <Label htmlFor="host-name">Staff member being met</Label>
                  <Input id="host-name" value={hostName} placeholder="Full name" onChange={(e) => setHostName(e.target.value)} />
                </div>
              )}
            </section>
          )}

          {needsStudents && (
            <section className="space-y-3">
              <Label htmlFor="admission-no">{singleStudent ? "Admission number" : type === "VISITOR" ? "Student being visited (admission number)" : "Add students by admission number"}</Label>

              <div className="flex gap-2">
                <Input
                  id="admission-no"
                  value={admissionNo}
                  placeholder="Enter admission number"
                  onChange={(e) => {
                    setAdmissionNo(e.target.value);
                    if (singleStudent) setSelected([]);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void lookup();
                    }
                  }}
                />

                <Button type="button" onClick={lookup} disabled={looking} className="gap-2">
                  {looking ? <Loader2 className="size-4 animate-spin" /> : multiStudents ? <Plus className="size-4" /> : <Search className="size-4" />}
                  {multiStudents ? "Add student" : "Fetch student"}
                </Button>
              </div>

              {singleStudent && student && (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                  <StudentSummary student={student} />

                  {type === "OUTPASS" && (!student.hostelName || !student.housemotherName) && (
                    <p className="text-sm text-amber-600">
                      {!student.hostelName ? "This student is not assigned to a hostel yet." : "This student's hostel has no housemother yet."} A request cannot be raised until the school office fixes this.
                    </p>
                  )}
                </div>
              )}

              {multiStudents && selected.length > 0 && (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium">Added ({selected.length})</p>

                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {selected.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <StudentSummary student={item} compact />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStudent(item.id)} aria-label={`Remove ${item.name}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="purpose">{type === "OUTPASS" ? "Reason for outpass" : type === "VISITOR" ? "Purpose of visit" : "Event / purpose"}</Label>
              <Textarea
                id="purpose"
                value={purpose}
                rows={2}
                placeholder={type === "OUTPASS" ? "Enter the reason for the outpass" : type === "VISITOR" ? "Enter the purpose of the visit" : "Enter the name of the competition, event or activity"}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            {type !== "VISITOR" && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="destination">Destination{type === "EVENT_TRIP" ? " (optional)" : ""}</Label>
                <Input id="destination" value={destination} placeholder="Where are they going?" onChange={(e) => setDestination(e.target.value)} />
              </div>
            )}

            {type === "VISITOR" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>Date of visit</Label>
                <DatePicker value={visitDate} onChange={setVisitDate} minDate={new Date()} placeholder="Pick the visit date" />
                <p className="text-sm text-muted-foreground">The pass stays valid for the whole day.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Leaves on</Label>
                  <DateTimePicker value={from} onChange={setFrom} minDate={new Date()} placeholder="Pick date and time" />
                </div>

                <div className="space-y-2">
                  <Label>Returns by</Label>
                  <DateTimePicker value={to} onChange={setTo} minDate={parseLocalValue(from) ?? new Date()} placeholder="Pick date and time" />
                </div>
              </>
            )}
          </section>

          {type === "EVENT_TRIP" && (
            <section className="space-y-2">
              <Label htmlFor="accompanying">Maitre / home mother going with the students</Label>
              <Input id="accompanying" value={accompanying} placeholder="Full name" onChange={(e) => setAccompanying(e.target.value)} />
            </section>
          )}

          {wantsPersons && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{type === "VISITOR" ? "Visitors" : "People coming to pick up the student"}</Label>
                  <p className="text-sm text-muted-foreground">ID proof is checked by guard at the gate.</p>
                </div>

                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addPerson} disabled={persons.length >= MAX_PERSONS}>
                  <Plus className="size-4" />
                  Add {type === "VISITOR" ? "visitor" : "person"}
                </Button>
              </div>

              {persons.map((person, index) => (
                <div key={person.key} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {personLabel} {index + 1}
                    </p>

                    {persons.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePerson(person.key)} aria-label={`Remove ${personLabel.toLowerCase()} ${index + 1}`}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={person.name} placeholder="Full name" onChange={(e) => updatePerson(person.key, { name: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label>{type === "VISITOR" ? "Relation (to the student or school)" : "Relation to the student"}</Label>
                      <Input
                        value={person.relation}
                        placeholder={type === "VISITOR" ? "Uncle, family friend, vendor..." : "Father, mother, uncle..."}
                        onChange={(e) => updatePerson(person.key, { relation: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone (optional)</Label>
                      <Input value={person.phone} inputMode="tel" onChange={(e) => updatePerson(person.key, { phone: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label>ID proof type</Label>
                      <Select value={person.idProofType} onValueChange={(value) => updatePerson(person.key, { idProofType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          {ID_TYPES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>ID number (optional)</Label>
                      <Input value={person.idProofNumber} onChange={(e) => updatePerson(person.key, { idProofNumber: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label>ID proof photo</Label>
                      <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => updatePerson(person.key, { file: e.target.files?.[0] ?? null })} />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
