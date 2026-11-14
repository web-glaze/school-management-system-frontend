"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gatepassService, type HostelStudent, type HostelStudentParams, type Option } from "@/services/gatepass.service";
import { useGatepassStore } from "@/store/gatepassStore";
import { StudentAvatar, apiError } from "../shared";

export default function HostelStudentsPanel() {
  const hostels = useGatepassStore((s) => s.hostels);
  const fetchHostels = useGatepassStore((s) => s.fetchHostels);
  const assignStudents = useGatepassStore((s) => s.assignStudents);

  const [options, setOptions] = useState<{ classes: Option[]; sections: Option[] }>({
    classes: [],
    sections: [],
  });

  const [hostelFilter, setHostelFilter] = useState("unassigned");
  const [classId, setClassId] = useState("all");
  const [sectionId, setSectionId] = useState("all");
  const [query, setQuery] = useState("");

  const [students, setStudents] = useState<HostelStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const [target, setTarget] = useState("");
  const [moving, setMoving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setSelected([]);

      const params: HostelStudentParams = {
        classId: classId === "all" ? undefined : classId,
        sectionId: sectionId === "all" ? undefined : sectionId,
        q: query.trim() || undefined,
      };

      if (hostelFilter === "unassigned") params.unassigned = true;
      else if (hostelFilter !== "all") params.hostelId = hostelFilter;

      setStudents(await gatepassService.hostel.students.getAll(params));
    } catch (error) {
      toast.error(apiError(error, "Could not load the students"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels().catch(() => undefined);

    gatepassService.movement
      .options()
      .then(setOptions)
      .catch(() => toast.error("Could not load classes and sections"));

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSelected = students.length > 0 && selected.length === students.length;

  const toggleAll = () => setSelected(allSelected ? [] : students.map((s) => s.id));

  const toggleOne = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const apply = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one student");
      return;
    }

    if (!target) {
      toast.error("Choose the hostel to move them to");
      return;
    }

    try {
      setMoving(true);

      const moved = await assignStudents({
        hostelId: target === "none" ? null : target,
        studentIds: selected,
      });

      toast.success(moved === 0 ? "Nothing to change" : `${moved} student${moved === 1 ? "" : "s"} updated`);
      await load();
    } catch (error) {
      toast.error(apiError(error, "Could not update the students"));
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Link students to their hostel. A student needs a hostel with a housemother before a request can be raised for them.</p>

      <div className="flex flex-col gap-2 lg:flex-row">
        <Select value={hostelFilter} onValueChange={setHostelFilter}>
          <SelectTrigger className="lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Not in a hostel</SelectItem>
            <SelectItem value="all">All students</SelectItem>
            {hostels.map((hostel) => (
              <SelectItem key={hostel.id} value={hostel.id}>
                {hostel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="lg:w-40">
            <SelectValue />
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
          <SelectTrigger className="lg:w-40">
            <SelectValue />
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

        <Input
          value={query}
          placeholder="Name or admission number"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void load();
            }
          }}
        />

        <Button onClick={load} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
        <p className="text-sm font-medium sm:min-w-32">{selected.length} selected</p>

        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Move to hostel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No hostel (remove)</SelectItem>
            {hostels.map((hostel) => (
              <SelectItem key={hostel.id} value={hostel.id}>
                {hostel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={apply} disabled={moving || selected.length === 0} className="gap-2">
          {moving && <Loader2 className="size-4 animate-spin" />}
          Apply
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" className="size-4 accent-primary" checked={allSelected} onChange={toggleAll} aria-label="Select all students" />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Hostel</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No students found for these filters.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <input type="checkbox" className="size-4 accent-primary" checked={selected.includes(student.id)} onChange={() => toggleOne(student.id)} aria-label={`Select ${student.name}`} />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <StudentAvatar name={student.name} photoUrl={student.photoUrl} size={32} />
                      <div className="text-sm">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">Adm. no. {student.admissionNo}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{[student.className, student.sectionName].filter(Boolean).join(" - ") || "—"}</TableCell>

                  <TableCell>{student.hostelName ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {students.length >= 300 && <p className="text-sm text-muted-foreground">Showing the first 300 students. Narrow the filters to see the rest.</p>}
    </div>
  );
}
