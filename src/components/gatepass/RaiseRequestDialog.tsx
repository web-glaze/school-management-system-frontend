"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    gatepassService,
    uploadIdProofs,
    type MovementType,
    type Option,
    type PickupPersonPayload,
    type StudentCard,
} from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { StudentSummary, apiError } from "./shared";

const ID_TYPES = ["Aadhaar card", "Driving licence", "Voter ID", "Passport", "PAN card", "Other"];
const MAX_PERSONS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

/** Current time in the format a datetime-local input expects. */
function nowLocal() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}

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

    // outpass
    const [admissionNo, setAdmissionNo] = useState("");
    const [student, setStudent] = useState<StudentCard | null>(null);
    const [looking, setLooking] = useState(false);
    const [persons, setPersons] = useState<PickupDraft[]>(() => [emptyPerson()]);

    // event trip
    const [accompanying, setAccompanying] = useState("");
    const [options, setOptions] = useState<{ classes: Option[]; sections: Option[] }>({
        classes: [],
        sections: [],
    });
    const [optionsLoaded, setOptionsLoaded] = useState(false);
    const [classId, setClassId] = useState("all");
    const [sectionId, setSectionId] = useState("all");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<StudentCard[]>([]);
    const [selected, setSelected] = useState<StudentCard[]>([]);
    const [searching, setSearching] = useState(false);

    // A parent login can only raise an outpass for its own child.
    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];

            setParentOnly(roles.includes("STUDENT") && !roles.includes("TEACHER") && !user?.teacherId);
        } catch {
            setParentOnly(false);
        }
    }, []);

    useEffect(() => {
        if (!open || type !== "EVENT_TRIP" || optionsLoaded) return;

        setOptionsLoaded(true);

        gatepassService.movement
            .options()
            .then(setOptions)
            .catch(() => toast.error("Could not load classes and sections"));
    }, [open, type, optionsLoaded]);

    const reset = () => {
        setType("OUTPASS");
        setPurpose("");
        setDestination("");
        setFrom("");
        setTo("");
        setAdmissionNo("");
        setStudent(null);
        setPersons([emptyPerson()]);
        setAccompanying("");
        setClassId("all");
        setSectionId("all");
        setQuery("");
        setResults([]);
        setSelected([]);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    // outpass

    const lookup = async () => {
        const value = admissionNo.trim();

        if (!value) {
            toast.error("Enter the admission number");
            return;
        }

        try {
            setLooking(true);
            setStudent(null);

            const found = await gatepassService.movement.students({ admissionNo: value });

            if (found.length === 0) {
                toast.error("No student found with this admission number");
                return;
            }

            setStudent(found[0]);
        } catch (error) {
            toast.error(apiError(error, "Could not find the student"));
        } finally {
            setLooking(false);
        }
    };

    const updatePerson = (key: string, patch: Partial<PickupDraft>) =>
        setPersons((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

    const addPerson = () => setPersons((prev) => [...prev, emptyPerson()]);

    const removePerson = (key: string) => setPersons((prev) => prev.filter((p) => p.key !== key));

    // event trip

    const searchStudents = async () => {
        if (!query.trim() && classId === "all" && sectionId === "all") {
            toast.error("Choose a class or section, or type a name");
            return;
        }

        try {
            setSearching(true);

            const found = await gatepassService.movement.students({
                q: query.trim() || undefined,
                classId: classId === "all" ? undefined : classId,
                sectionId: sectionId === "all" ? undefined : sectionId,
            });

            setResults(found);

            if (found.length === 0) toast.info("No students found");
        } catch (error) {
            toast.error(apiError(error, "Could not search students"));
        } finally {
            setSearching(false);
        }
    };

    const isSelected = (id: string) => selected.some((s) => s.id === id);

    const toggleStudent = (item: StudentCard) =>
        setSelected((prev) =>
            prev.some((s) => s.id === item.id) ? prev.filter((s) => s.id !== item.id) : [...prev, item],
        );

    const selectAllShown = () =>
        setSelected((prev) => [...prev, ...results.filter((r) => !prev.some((s) => s.id === r.id))]);

    // submit

    const submit = async () => {
        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (!from || !to || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
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

        if (!purpose.trim()) {
            toast.error(type === "OUTPASS" ? "Enter the reason for the outpass" : "Enter the event or purpose");
            return;
        }

        let studentIds: string[] = [];

        if (type === "OUTPASS") {
            if (!student) {
                toast.error("Enter the admission number and fetch the student first");
                return;
            }

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

            for (const [index, person] of persons.entries()) {
                const label = `Pickup person ${index + 1}`;

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

            studentIds = [student.id];
        } else {
            if (selected.length === 0) {
                toast.error("Select at least one student");
                return;
            }

            if (!accompanying.trim()) {
                toast.error("Enter the name of the maitre / home mother going with the students");
                return;
            }

            studentIds = selected.map((s) => s.id);
        }

        try {
            setSubmitting(true);

            let pickupPersons: PickupPersonPayload[] | undefined;

            if (type === "OUTPASS") {
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

            const created = await createRequest({
                type,
                studentIds,
                requestedFrom: fromDate.toISOString(),
                requestedTo: toDate.toISOString(),
                purpose: purpose.trim(),
                destination: destination.trim() || undefined,
                accompanyingPerson: type === "EVENT_TRIP" ? accompanying.trim() : undefined,
                pickupPersons,
            });

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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[88vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>New request</DialogTitle>
                    <DialogDescription>
                        {type === "OUTPASS"
                            ? "Enter the admission number to fetch the student, then fill in the details."
                            : "Select the students going on the trip and add the event details."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {!parentOnly && (
                        <div className="grid grid-cols-2 gap-3">
                            {(
                                [
                                    { value: "OUTPASS", title: "Outpass", hint: "One student, picked up by family" },
                                    { value: "EVENT_TRIP", title: "Event trip", hint: "Several students, with a teacher" },
                                ] as const
                            ).map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setType(option.value)}
                                    className={cn(
                                        "rounded-lg border p-3 text-left text-sm transition",
                                        type === option.value ? "border-primary bg-primary/5" : "hover:bg-muted",
                                    )}
                                >
                                    <p className="font-medium">{option.title}</p>
                                    <p className="text-muted-foreground">{option.hint}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {type === "OUTPASS" ? (
                        <section className="space-y-3">
                            <Label htmlFor="admission-no">Admission number</Label>

                            <div className="flex gap-2">
                                <Input
                                    id="admission-no"
                                    value={admissionNo}
                                    placeholder="Enter the admission number"
                                    onChange={(e) => {
                                        setAdmissionNo(e.target.value);
                                        setStudent(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            void lookup();
                                        }
                                    }}
                                />
                                <Button type="button" onClick={lookup} disabled={looking} className="gap-2">
                                    {looking ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                                    Fetch student
                                </Button>
                            </div>

                            {student && (
                                <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                                    <StudentSummary student={student} />

                                    {(!student.hostelName || !student.housemotherName) && (
                                        <p className="text-sm text-amber-600">
                                            {!student.hostelName
                                                ? "This student is not assigned to a hostel yet."
                                                : "This student's hostel has no housemother yet."}{" "}
                                            A request cannot be raised until the school office fixes this.
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="space-y-3">
                            <Label>Students</Label>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                    value={query}
                                    placeholder="Name or admission number"
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            void searchStudents();
                                        }
                                    }}
                                />

                                <Select value={classId} onValueChange={setClassId}>
                                    <SelectTrigger className="sm:w-40">
                                        <SelectValue placeholder="Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All classes</SelectItem>
                                        {options.classes.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={sectionId} onValueChange={setSectionId}>
                                    <SelectTrigger className="sm:w-40">
                                        <SelectValue placeholder="Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All sections</SelectItem>
                                        {options.sections.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button type="button" onClick={searchStudents} disabled={searching} className="gap-2">
                                    {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                                    Search
                                </Button>
                            </div>

                            {results.length > 0 && (
                                <div className="rounded-lg border">
                                    <div className="flex items-center justify-between border-b px-3 py-2 text-sm">
                                        <span className="text-muted-foreground">{results.length} students found</span>
                                        <Button type="button" variant="ghost" size="sm" onClick={selectAllShown}>
                                            Select all shown
                                        </Button>
                                    </div>

                                    <div className="max-h-56 divide-y overflow-y-auto">
                                        {results.map((item) => (
                                            <label
                                                key={item.id}
                                                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="size-4 accent-primary"
                                                    checked={isSelected(item.id)}
                                                    onChange={() => toggleStudent(item)}
                                                />
                                                <StudentSummary student={item} compact />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selected.length > 0 && (
                                <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                                    <p className="text-sm font-medium">Selected ({selected.length})</p>

                                    <div className="max-h-40 space-y-2 overflow-y-auto">
                                        {selected.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between gap-2">
                                                <StudentSummary student={item} compact />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleStudent(item)}
                                                    aria-label={`Remove ${item.name}`}
                                                >
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
                            <Label htmlFor="purpose">{type === "OUTPASS" ? "Reason for outpass" : "Event / purpose"}</Label>
                            <Textarea
                                id="purpose"
                                value={purpose}
                                rows={2}
                                placeholder={type === "OUTPASS" ? "Why is the student going out?" : "Competition, event or activity"}
                                onChange={(e) => setPurpose(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="destination">
                                Destination{type === "EVENT_TRIP" ? " (optional)" : ""}
                            </Label>
                            <Input
                                id="destination"
                                value={destination}
                                placeholder="Where are they going?"
                                onChange={(e) => setDestination(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="from">Leaves on</Label>
                            <Input
                                id="from"
                                type="datetime-local"
                                min={nowLocal()}
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="to">Returns by</Label>
                            <Input
                                id="to"
                                type="datetime-local"
                                min={from || nowLocal()}
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>
                    </section>

                    {type === "EVENT_TRIP" && (
                        <section className="space-y-2">
                            <Label htmlFor="accompanying">Maitre / home mother going with the students</Label>
                            <Input
                                id="accompanying"
                                value={accompanying}
                                placeholder="Full name"
                                onChange={(e) => setAccompanying(e.target.value)}
                            />
                        </section>
                    )}

                    {type === "OUTPASS" && (
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>People coming to pick up the student</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Their ID proof is checked by the guard at the gate.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={addPerson}
                                    disabled={persons.length >= MAX_PERSONS}
                                >
                                    <Plus className="size-4" />
                                    Add person
                                </Button>
                            </div>

                            {persons.map((person, index) => (
                                <div key={person.key} className="space-y-3 rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Person {index + 1}</p>

                                        {persons.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removePerson(person.key)}
                                                aria-label={`Remove person ${index + 1}`}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={person.name}
                                                placeholder="Full name"
                                                onChange={(e) => updatePerson(person.key, { name: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Relation to the student</Label>
                                            <Input
                                                value={person.relation}
                                                placeholder="Father, mother, uncle..."
                                                onChange={(e) => updatePerson(person.key, { relation: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Phone (optional)</Label>
                                            <Input
                                                value={person.phone}
                                                inputMode="tel"
                                                onChange={(e) => updatePerson(person.key, { phone: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>ID proof type</Label>
                                            <Select
                                                value={person.idProofType}
                                                onValueChange={(value) => updatePerson(person.key, { idProofType: value })}
                                            >
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
                                            <Input
                                                value={person.idProofNumber}
                                                onChange={(e) => updatePerson(person.key, { idProofNumber: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>ID proof photo</Label>
                                            <Input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(e) => updatePerson(person.key, { file: e.target.files?.[0] ?? null })}
                                            />
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