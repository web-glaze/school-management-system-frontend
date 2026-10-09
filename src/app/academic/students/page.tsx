"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, CalendarDays, Calendar as CalendarIconTable, CalendarIcon, ChevronRight, Copy, Inbox, KeyRound, Loader2, Pencil, Plus, Search, Trash2, MoreVertical } from "lucide-react";
import { useAcademicStore, type StudentCredentials } from "@/store/academicStore";
import { academicService } from "@/services/academic.service";
import { Badge } from "@/components/ui/badge";
import { usePermission } from "@/hooks/usePermission";
import { useEffect, useState } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfilePanel from "@/components/profile/profilePanel";

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string>;
};

interface Student {
  id: string;
  studentCode: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string;
  fatherName: string;
  motherName: string;
  phone?: string;
  email?: string;
  admissionDate: string;
  status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    userCode: string;
    userName: string | null;
  } | null;
}

interface PendingStudent {
  admissionNo: string;
  firstName: string;
  lastName: string;
  dob: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  admissionDate: string;
}

export default function StudentsPage() {
  const { students, loading, fetchStudents, createStudent, createStudentLogin, updateStudent, deleteStudent } = useAcademicStore();
  const [admissionNo, setAdmissionNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [editAdmissionNo, setEditAdmissionNo] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editMotherName, setEditMotherName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAdmissionDate, setEditAdmissionDate] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED">("ACTIVE");
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [deleteStudentOpen, setDeleteStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [dobOpen, setDobOpen] = useState(false);
  const [admissionDateOpen, setAdmissionDateOpen] = useState(false);
  const [editDobOpen, setEditDobOpen] = useState(false);
  const [editAdmissionDateOpen, setEditAdmissionDateOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<PendingStudent | null>(null);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<StudentCredentials | null>(null);

  // Adding a login to a student who was created before logins existed.
  const [loginStudent, setLoginStudent] = useState<Student | null>(null);
  const [existingUserName, setExistingUserName] = useState("");
  const [existingPassword, setExistingPassword] = useState("");
  const [existingConfirm, setExistingConfirm] = useState("");
  const [existingErrors, setExistingErrors] = useState<Record<string, string>>({});
  const [existingSubmitting, setExistingSubmitting] = useState(false);

  // Personal info tab
  const [activeTab, setActiveTab] = useState<"students" | "personal">("students");
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const resetAddForm = () => {
    setAdmissionNo("");
    setFirstName("");
    setLastName("");
    setDob("");
    setFatherName("");
    setMotherName("");
    setPhone("");
    setEmail("");
    setAdmissionDate("");
    setUserName("");
    setPassword("");
    setConfirmPassword("");
    setPendingStudent(null);
    setFormErrors({});
    setLoginErrors({});
  };

  // Step 1: check the student details and suggest a username.
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormErrors({});

    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!admissionNo.trim()) errors.admissionNo = "Admission number is required";
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!dob) errors.dob = "Date of birth is required";
    if (!fatherName.trim()) errors.fatherName = "Father name is required";
    if (!motherName.trim()) errors.motherName = "Mother name is required";

    if (!phone.trim()) errors.phone = "Phone number is required";
    else if (!phoneRegex.test(phone.trim())) errors.phone = "Phone number must be a valid 10-digit mobile number";

    if (!email.trim()) errors.email = "Email is required";
    else if (!emailRegex.test(email.trim())) errors.email = "Invalid email address";

    if (!admissionDate) errors.admissionDate = "Admission date is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setChecking(true);

      const response = await academicService.students.generateUsername({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        admissionNo: admissionNo.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      setPendingStudent({
        admissionNo,
        firstName,
        lastName,
        dob,
        fatherName,
        motherName,
        phone,
        email,
        admissionDate,
      });

      setUserName(response.data.data ?? "");
      setPassword("");
      setConfirmPassword("");
      setLoginErrors({});

      setAddStudentOpen(false);
      setLoginDialogOpen(true);
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const apiErrors = apiError.response?.data?.errors;

      if (apiErrors) {
        setFormErrors(apiErrors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Validation failed");
    } finally {
      setChecking(false);
    }
  };

  // Step 2: set the login details and create the student with their login.
  const handleCreateLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingStudent) return;

    const errors: Record<string, string> = {};

    if (!userName.trim()) errors.userName = "Username is required";
    if (password.length < 8) errors.password = "Password must be at least 8 characters";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      const credentials = await createStudent({
        ...pendingStudent,
        userName: userName.trim(),
        password,
      });

      setLoginDialogOpen(false);
      resetAddForm();

      setCreatedCredentials(credentials ?? { userCode: "—", userName: userName.trim() });

      toast.success("Student created successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const apiErrors = apiError.response?.data?.errors;

      if (apiErrors) {
        if (apiErrors.userName) {
          setLoginErrors({ userName: apiErrors.userName });
        } else {
          // Another field clashed since step 1: go back to the details.
          setFormErrors(apiErrors);
          setLoginDialogOpen(false);
          setAddStudentOpen(true);
        }
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to create student");
    } finally {
      setSubmitting(false);
    }
  };

  const openExistingLoginDialog = async (student: Student) => {
    setLoginStudent(student);
    setExistingUserName("");
    setExistingPassword("");
    setExistingConfirm("");
    setExistingErrors({});

    try {
      const response = await academicService.students.suggestUsername(student.id);
      setExistingUserName(response.data?.data ?? "");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      toast.error(apiError.response?.data?.message ?? "Could not suggest a username");
    }
  };

  const closeExistingLoginDialog = () => {
    setLoginStudent(null);
    setExistingPassword("");
    setExistingConfirm("");
    setExistingErrors({});
  };

  const handleCreateExistingLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginStudent) return;

    const errors: Record<string, string> = {};

    if (!existingUserName.trim()) errors.userName = "Username is required";
    if (existingPassword.length < 8) errors.password = "Password must be at least 8 characters";
    else if (existingPassword !== existingConfirm) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setExistingErrors(errors);
      return;
    }

    try {
      setExistingSubmitting(true);

      const credentials = await createStudentLogin(loginStudent.id, {
        userName: existingUserName.trim(),
        password: existingPassword,
      });

      closeExistingLoginDialog();
      setCreatedCredentials(credentials ?? { userCode: "—", userName: existingUserName.trim() });

      toast.success("Login created successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const apiErrors = apiError.response?.data?.errors;

      if (apiErrors?.userName) {
        setExistingErrors({ userName: apiErrors.userName });
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to create login");
    } finally {
      setExistingSubmitting(false);
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStudent) return;

    try {
      await updateStudent(editingStudent.id, {
        admissionNo: editAdmissionNo,
        firstName: editFirstName,
        lastName: editLastName,
        dob: editDob,
        fatherName: editFatherName,
        motherName: editMotherName,
        phone: editPhone,
        email: editEmail,
        admissionDate: editAdmissionDate,
        status: editStatus,
      });

      setEditStudentOpen(false);
      setEditingStudent(null);

      toast.success("Student updated successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        setEditErrors(errors);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to update student");
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!deletingStudent) return;

    try {
      setDeletingId(deletingStudent.id);

      await deleteStudent(deletingStudent.id);

      setDeleteStudentOpen(false);
      setDeletingStudent(null);

      toast.success("Student deleted successfully");
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;

      const errors = apiError.response?.data?.errors;

      if (errors) {
        toast.error(Object.values(errors)[0]);
        return;
      }

      toast.error(apiError.response?.data?.message ?? "Failed to delete student");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (student: Student) => {
    setEditErrors({});
    setEditingStudent(student);
    setEditAdmissionNo(student.admissionNo);
    setEditFirstName(student.firstName);
    setEditLastName(student.lastName);
    setEditDob(student.dob?.slice(0, 10));
    setEditFatherName(student.fatherName);
    setEditMotherName(student.motherName);
    setEditPhone(student.phone ?? "");
    setEditEmail(student.email ?? "");
    setEditAdmissionDate(student.admissionDate.slice(0, 10));
    setEditStatus(student.status);

    setEditStudentOpen(true);
  };

  const openDeleteDialog = (student: Student) => {
    setDeletingStudent(student);
    setDeleteStudentOpen(true);
  };

  const authorized = usePermission("student.read");

  if (authorized === null) return null;

  const clearFormError = (field: string) => {
    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const clearEditError = (field: string) => {
    setEditErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const filteredStudents = students.filter(
    (item) =>
      `${item.firstName} ${item.lastName}`.toLowerCase().includes(search.toLowerCase()) || item.admissionNo.toLowerCase().includes(search.toLowerCase()) || item.studentCode.toLowerCase().includes(search.toLowerCase())
  );

  const hasChanges =
    editingStudent &&
    (editAdmissionNo !== editingStudent.admissionNo ||
      editFirstName !== editingStudent.firstName ||
      editLastName !== editingStudent.lastName ||
      editDob !== (editingStudent.dob?.slice(0, 10) ?? "") ||
      editFatherName !== editingStudent.fatherName ||
      editMotherName !== editingStudent.motherName ||
      editPhone !== (editingStudent.phone ?? "") ||
      editEmail !== (editingStudent.email ?? "") ||
      editAdmissionDate !== editingStudent.admissionDate.slice(0, 10) ||
      editStatus !== editingStudent.status);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground">Manage students</p>
          </div>

          <Dialog
            open={addStudentOpen}
            onOpenChange={(open) => {
              setAddStudentOpen(open);

              if (!open) {
                resetAddForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 px-5">
                <Plus className="size-4" />
                Add Student
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-3xl w-[95vw] p-0 overflow-hidden max-h-[80vh] flex flex-col gap-0">
              {/* Header */}
              <div className="border-b px-5 sm:px-6 py-4 sm:py-5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-9 sm:size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="size-4 sm:size-5 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <DialogTitle className="text-base sm:text-lg leading-tight">Create Student</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">Step 1 of 2: student details</DialogDescription>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable body */}
                <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-7 sm:space-y-8">
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">1</span>
                      <h3 className="text-sm sm:text-base font-semibold">Personal Information</h3>
                    </div>

                    <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field>
                        <Label>Admission No</Label>
                        <Input
                          className={` h-10 ${formErrors.admissionNo ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                          value={admissionNo}
                          onChange={(e) => {
                            setAdmissionNo(e.target.value);
                            clearFormError("admissionNo");
                          }}
                          placeholder="e.g. ADM-2026-001"
                        />
                        {formErrors.admissionNo && <p className="text-xs text-red-500 mt-1.5">{formErrors.admissionNo}</p>}
                      </Field>

                      <Field>
                        <Label>Date of Birth</Label>

                        <Popover open={dobOpen} onOpenChange={setDobOpen}>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className={cn(" h-10 w-full justify-start text-left font-normal", !dob && "text-muted-foreground", formErrors.dob && "border-red-500")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dob ? format(new Date(dob), "dd MMM yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dob ? new Date(dob) : undefined}
                              onSelect={(date) => {
                                if (!date) return;

                                setDob(format(date, "yyyy-MM-dd"));
                                clearFormError("dob");
                                setDobOpen(false);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        {editErrors.dob && <p className="text-xs text-red-500 mt-1.5">{editErrors.dob}</p>}
                        {formErrors.dob && <p className="text-xs text-red-500 mt-1.5">{formErrors.dob}</p>}
                      </Field>

                      <Field>
                        <Label>First Name</Label>
                        <Input
                          className={` h-10 ${formErrors.firstName ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            clearFormError("firstName");
                          }}
                          placeholder="First name"
                        />
                        {formErrors.firstName && <p className="text-xs text-red-500 mt-1.5">{formErrors.firstName}</p>}
                      </Field>

                      <Field>
                        <Label>Last Name</Label>
                        <Input
                          className={` h-10 ${formErrors.lastName ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            clearFormError("lastName");
                          }}
                          placeholder="Last name"
                        />
                        {formErrors.lastName && <p className="text-xs text-red-500 mt-1.5">{formErrors.lastName}</p>}
                      </Field>
                    </FieldGroup>
                  </div>

                  {/* Parent Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">2</span>
                      <h3 className="text-sm sm:text-base font-semibold">Parent Information</h3>
                    </div>

                    <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field>
                        <Label>Father Name</Label>

                        <Input
                          className={` h-10 ${formErrors.fatherName ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                          value={fatherName}
                          onChange={(e) => {
                            setFatherName(e.target.value);
                            clearFormError("fatherName");
                          }}
                          placeholder="Fathers full name"
                        />
                        {editErrors.fatherName && <p className="text-xs text-red-500 mt-1.5">{editErrors.fatherName}</p>}

                        {formErrors.fatherName && <p className="text-xs text-red-500 mt-1.5">{formErrors.fatherName}</p>}
                      </Field>

                      <Field>
                        <Label>Mother Name</Label>

                        <Input
                          className={` h-10 ${formErrors.motherName ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                          value={motherName}
                          onChange={(e) => {
                            setMotherName(e.target.value);
                            clearFormError("motherName");
                          }}
                          placeholder="Mothers full name"
                        />
                        {editErrors.motherName && <p className="text-xs text-red-500 mt-1.5">{editErrors.motherName}</p>}

                        {formErrors.motherName && <p className="text-xs text-red-500 mt-1.5">{formErrors.motherName}</p>}
                      </Field>

                      <Field>
                        <Label>Phone</Label>

                        <Input
                          className={` h-10 ${formErrors.phone ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                          value={phone}
                          inputMode="numeric"
                          maxLength={10}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setPhone(value);
                            clearFormError("phone");
                          }}
                          placeholder="Phone number here"
                        />
                        {editErrors.phone && <p className="text-xs text-red-500 mt-1.5">{editErrors.phone}</p>}

                        {formErrors.phone && <p className="text-xs text-red-500 mt-1.5">{formErrors.phone}</p>}
                      </Field>
                      <Field>
                        <Label>Email</Label>

                        <Input
                          className={` h-10 ${formErrors.email ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clearFormError("email");
                          }}
                          placeholder="name@example.com"
                          inputMode="email"
                        />
                        {editErrors.email && <p className="text-xs text-red-500 mt-1.5">{editErrors.email}</p>}

                        {formErrors.email && <p className="text-xs text-red-500 mt-1.5">{formErrors.email}</p>}
                      </Field>
                    </FieldGroup>
                  </div>

                  {/* Admission Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">3</span>
                      <h3 className="text-sm sm:text-base font-semibold">Admission Information</h3>
                    </div>

                    <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field>
                        <Label>Admission Date</Label>

                        <Popover open={admissionDateOpen} onOpenChange={setAdmissionDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(" h-10 w-full justify-start text-left font-normal", !admissionDate && "text-muted-foreground", formErrors.admissionDate && "border-red-500")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {admissionDate ? format(new Date(admissionDate), "dd MMM yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={admissionDate ? new Date(admissionDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setAdmissionDate(format(date, "yyyy-MM-dd"));
                                  clearFormError("admissionDate");
                                  setAdmissionDateOpen(false);
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        {editErrors.admissionDate && <p className="text-xs text-red-500 mt-1.5">{editErrors.admissionDate}</p>}

                        {formErrors.admissionDate && <p className="text-xs text-red-500 mt-1.5">{formErrors.admissionDate}</p>}
                      </Field>
                    </FieldGroup>
                  </div>
                </div>

                {/* Sticky footer */}
                <DialogFooter className="border-t px-5 py-3 sm:pb-7 shrink-0 flex-col-reverse sm:flex-row gap-2 sm:gap-2 bg-background rounded-b-lg">
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full sm:w-auto" type="button">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button type="submit" disabled={checking} className="w-full sm:w-auto">
                    {checking ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Plus className="size-4 mr-2" />
                        Next
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "students" | "personal")}>
          <TabsList className="rounded-full bg-muted/60 p-1">
            <TabsTrigger value="students" className="rounded-full px-5 py-2 text-sm data-[state=active]:shadow-sm">
              Students
            </TabsTrigger>
            <TabsTrigger value="personal" className="rounded-full px-5 py-2 text-sm data-[state=active]:shadow-sm">
              Personal Info
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "personal" ? (
          profileStudent ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4 bg-card rounded-md p-5 border border-border/60">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">{`${profileStudent.firstName} ${profileStudent.lastName}`}</h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {profileStudent.studentCode} • Admission No {profileStudent.admissionNo}
                  </p>
                </div>

                <Button variant="outline" className="gap-2 shrink-0" onClick={() => setProfileStudent(null)}>
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              </div>

              <ProfilePanel entity="student" mode="edit" personId={profileStudent.id} />
            </div>
          ) : (
            <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-4">
              <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground" />

                <Input className="pl-11" placeholder="Search by student name or code" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {loading && students.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                    <Inbox className="size-6 stroke-[1.5]" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{students.length === 0 ? "No students created yet." : "No students found."}</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => setProfileStudent(student)}
                      className="group flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground group-hover:text-primary">{`${student.firstName} ${student.lastName}`}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {student.studentCode} • {student.admissionNo}
                        </p>
                      </div>

                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-primary/60" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-3">
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground" />

              <Input className="pl-11" placeholder="Search by student name or code" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {loading && students.length === 0 ? (
              <div className="space-y-3">
                <div className="flex gap-4 border-b border-border/50 pb-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 bg-muted rounded flex-1 animate-pulse" />
                  ))}
                </div>

                {[1, 2, 3, 4].map((row) => (
                  <div key={row} className="flex gap-4 py-2 border-b border-border/20">
                    <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                    <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                    <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                    <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                  <Inbox className="size-6 stroke-[1.5]" />
                </div>

                <h3 className="text-lg font-bold text-foreground">{students.length === 0 ? "No students created yet." : "No students found."}</h3>
                <p className="text-muted-foreground mt-1.5 max-w-sm">{students.length === 0 ? "Add your first student to get started." : `Try adjusting your search or filters.`}</p>
              </div>
            ) : (
              <div className="relative w-full overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-muted/15 border-b border-border/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-45">Student</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Student Code</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 hidden md:table-cell">Admission No</TableHead>
                      <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider py-4 text-foreground/80">Date Of Birth</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 w-20 sm:w-50">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30 hidden md:table-cell">Created At</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-4 sm:pr-6 text-foreground/80 text-right w-14 md:w-24 sticky right-0 bg-gray-50 dark:bg-muted/15 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                        <span className="md:block">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-border/30">
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-4 align-middle">
                          <div className="space-y-1 min-w-0 max-w-35 sm:max-w-55 md:max-w-45">
                            <p className="font-semibold text-foreground text-base leading-tight truncate hover:text-primary transition-colors" title={`${student.firstName} ${student.lastName}`}>
                              {`${student.firstName} ${student.lastName}`}
                            </p>

                            <p className="text-sm text-foreground/50 truncate md:hidden">{student.studentCode}</p>
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <span className="font-mono text-sm">{student.studentCode}</span>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">{student.admissionNo}</TableCell>

                        <TableCell className="py-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="size-5 text-muted-foreground/80" />
                            <span className="text-sm">
                              {new Date(student.dob).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-middle">
                          <Badge
                            className={
                              student.status === "ACTIVE"
                                ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                : student.status === "INACTIVE"
                                  ? "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
                                  : student.status === "GRADUATED"
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                            }
                          >
                            {student.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4 text-xs font-medium text-muted-foreground hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <CalendarIconTable className="size-5 text-muted-foreground/80" />

                            <span className="text-sm">
                              {new Date(student.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 pr-4 sm:pr-6 text-right align-middle w-14 md:w-24 bg-card sticky right-0 shadow-lg md:shadow-none border-l border-border/40 md:border-l-0">
                          <div className="hidden md:flex justify-end gap-1">
                            {!student.user && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-lg text-muted-foreground hover:bg-emerald-300/10 hover:text-emerald-700 transition-all"
                                title="Create login"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => openExistingLoginDialog(student)}
                              >
                                <KeyRound className="size-5" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                              title="Edit section"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => openEditDialog(student)}
                            >
                              <Pencil className="size-5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                              title="Delete section"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => openDeleteDialog(student)}
                            >
                              <Trash2 className="size-5" />
                            </Button>
                          </div>

                          <div className="md:hidden flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-9" onPointerDown={(e) => e.stopPropagation()}>
                                  <MoreVertical className="size-5" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(student)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>

                                {!student.user && (
                                  <DropdownMenuItem onClick={() => openExistingLoginDialog(student)}>
                                    <KeyRound className="mr-2 size-4" />
                                    Create login
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem onClick={() => openDeleteDialog(student)} className="text-destructive">
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
      <Dialog
        open={editStudentOpen}
        onOpenChange={(open) => {
          setEditStudentOpen(open);

          if (!open) {
            setEditErrors({});
            setEditingStudent(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl w-[95vw] p-0 overflow-hidden max-h-[80vh] flex flex-col gap-0">
          <div className="border-b px-5 sm:px-6 py-4 sm:py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 sm:size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays className="size-4 sm:size-5 text-primary" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg leading-tight">Edit Student</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">Update student details</DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 sm:py-6 space-y-5">
              <div className="flex items-center gap-2 border-b pb-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">1</span>

                <h3 className="text-sm sm:text-base font-semibold">Personal Information</h3>
              </div>
              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <Label>Admission No</Label>
                  <Input
                    className={` h-10 ${editErrors.admissionNo ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                    value={editAdmissionNo}
                    onChange={(e) => {
                      setEditAdmissionNo(e.target.value);
                      clearEditError("admissionNo");
                    }}
                  />
                  {editErrors.admissionNo && <p className="text-xs text-red-500 mt-1.5">{editErrors.admissionNo}</p>}
                </Field>

                <Field>
                  <Label>First Name</Label>
                  <Input
                    className={` h-10 ${editErrors.firstName ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                    value={editFirstName}
                    onChange={(e) => {
                      setEditFirstName(e.target.value);
                      clearEditError("firstName");
                    }}
                  />
                  {editErrors.firstName && <p className="text-xs text-red-500 mt-1.5">{editErrors.firstName}</p>}
                </Field>

                <Field>
                  <Label>Last Name</Label>
                  <Input
                    className={` h-10 ${editErrors.lastName ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                    value={editLastName}
                    onChange={(e) => {
                      setEditLastName(e.target.value);
                      clearEditError("lastName");
                    }}
                  />
                  {editErrors.lastName && <p className="text-xs text-red-500 mt-1.5">{editErrors.lastName}</p>}
                </Field>

                <Field>
                  <Label>Date of Birth</Label>

                  <Popover open={editDobOpen} onOpenChange={setEditDobOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={cn(" h-10 w-full justify-start text-left font-normal", !editDob && "text-muted-foreground", editErrors.dob && "border-red-500")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editDob ? format(new Date(editDob), "dd MMM yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editDob ? new Date(editDob) : undefined}
                        defaultMonth={editDob ? new Date(editDob) : new Date()}
                        onSelect={(date) => {
                          if (date) {
                            setEditDob(format(date, "yyyy-MM-dd"));
                            clearEditError("dob");
                            setEditDobOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  {editErrors.dob && <p className="text-xs text-red-500 mt-1.5">{editErrors.dob}</p>}
                </Field>
              </FieldGroup>

              <div className="flex items-center gap-2 border-b pb-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">2</span>

                <h3 className="text-sm sm:text-base font-semibold">Parent Information</h3>
              </div>

              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <Label>Father Name</Label>

                  <Input
                    className={` h-10 ${editErrors.fatherName ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                    value={editFatherName}
                    onChange={(e) => {
                      setEditFatherName(e.target.value);
                      clearEditError("fatherName");
                    }}
                  />

                  {editErrors.fatherName && <p className="text-xs text-red-500 mt-1.5">{editErrors.fatherName}</p>}
                </Field>

                <Field>
                  <Label>Mother Name</Label>

                  <Input
                    className={` h-10 ${editErrors.motherName ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                    value={editMotherName}
                    onChange={(e) => {
                      setEditMotherName(e.target.value);
                      clearEditError("motherName");
                    }}
                  />

                  {editErrors.motherName && <p className="text-xs text-red-500 mt-1.5">{editErrors.motherName}</p>}
                </Field>

                <Field>
                  <Label>Phone</Label>

                  <Input
                    className={` h-10 ${editErrors.phone ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                    value={editPhone}
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setEditPhone(value);
                      clearEditError("phone");
                    }}
                  />

                  {editErrors.phone && <p className="text-xs text-red-500 mt-1.5">{editErrors.phone}</p>}
                </Field>

                <Field>
                  <Label>Email</Label>

                  <Input
                    className={` h-10 ${editErrors.email ? "border-red-500 focus-visible:ring-red-500/30" : ""}`}
                    type="email"
                    value={editEmail}
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      clearEditError("email");
                    }}
                  />

                  {editErrors.email && <p className="text-xs text-red-500 mt-1.5">{editErrors.email}</p>}
                </Field>
              </FieldGroup>

              <div className="flex items-center gap-2 border-b pb-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">3</span>

                <h3 className="text-sm sm:text-base font-semibold">Admission Information</h3>
              </div>

              <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <Label>Admission Date</Label>

                  <Popover open={editAdmissionDateOpen} onOpenChange={setEditAdmissionDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(" h-10 w-full justify-start text-left font-normal", !editAdmissionDate && "text-muted-foreground", editErrors.admissionDate && "border-red-500")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editAdmissionDate ? format(new Date(editAdmissionDate), "dd MMM yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editAdmissionDate ? new Date(editAdmissionDate) : undefined}
                        defaultMonth={editAdmissionDate ? new Date(editAdmissionDate) : new Date()}
                        onSelect={(date) => {
                          if (date) {
                            setEditAdmissionDate(format(date, "yyyy-MM-dd"));
                            clearEditError("admissionDate");
                            setEditAdmissionDateOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  {editErrors.admissionDate && <p className="text-xs text-red-500 mt-1.5">{editErrors.admissionDate}</p>}
                </Field>

                <Field>
                  <Label>Status</Label>

                  <Select
                    value={editStatus}
                    onValueChange={(value) => {
                      setEditStatus(value as "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED");
                      clearEditError("status");
                    }}
                  >
                    <SelectTrigger className={cn(" h-10 w-full", editErrors.status && "border-red-500")}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="GRADUATED">Graduated</SelectItem>
                      <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                    </SelectContent>
                  </Select>

                  {editErrors.status && <p className="text-xs text-red-500 mt-1.5">{editErrors.status}</p>}

                  {editingStudent?.user && editStatus !== "ACTIVE" && <p className="text-xs text-muted-foreground mt-1.5">Only Active students can log in. This student&apos;s login will be blocked.</p>}
                </Field>
              </FieldGroup>
            </div>

            <DialogFooter className="border-t px-5 py-3 sm:pb-7 shrink-0 flex-col-reverse sm:flex-row gap-2 sm:gap-2 bg-background rounded-b-lg">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={loading || !hasChanges} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="size-4 mr-2" />
                    Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Step 2: login details for the new student (also used by the parents) */}
      <Dialog
        open={loginDialogOpen}
        onOpenChange={(open) => {
          setLoginDialogOpen(open);

          // Closing with X or Escape returns to the student details.
          if (!open) {
            setAddStudentOpen(true);
            setPassword("");
            setConfirmPassword("");
            setLoginErrors({});
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Create Student Login</DialogTitle>

          <DialogDescription>Step 2 of 2: set the login for this student. Parents use the same login.</DialogDescription>

          <form onSubmit={handleCreateLogin} className="space-y-5 mt-4">
            <Field>
              <Label>Username</Label>

              <Input
                value={userName}
                className={loginErrors.userName ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setLoginErrors((prev) => ({ ...prev, userName: "" }));
                }}
              />

              {loginErrors.userName && <p className="text-xs text-red-500 mt-1.5">{loginErrors.userName}</p>}
            </Field>

            <Field>
              <Label>Password</Label>

              <Input
                type="password"
                value={password}
                className={loginErrors.password ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginErrors((prev) => ({ ...prev, password: "" }));
                }}
              />

              {loginErrors.password && <p className="text-xs text-red-500 mt-1.5">{loginErrors.password}</p>}
            </Field>

            <Field>
              <Label>Confirm Password</Label>

              <Input
                type="password"
                value={confirmPassword}
                className={loginErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setLoginErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
              />

              {loginErrors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{loginErrors.confirmPassword}</p>}
            </Field>

            <Field>
              <Label>Role</Label>

              <Input value="STUDENT" readOnly />
            </Field>

            <p className="text-xs text-muted-foreground">The password must be changed at first login.</p>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLoginDialogOpen(false);
                  setAddStudentOpen(true);
                  setPassword("");
                  setConfirmPassword("");
                  setLoginErrors({});
                }}
              >
                Back
              </Button>

              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Student"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create a login for a student who has none yet */}
      <Dialog
        open={!!loginStudent}
        onOpenChange={(open) => {
          if (!open) closeExistingLoginDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Create Login</DialogTitle>

          <DialogDescription>Set the login for {loginStudent ? `${loginStudent.firstName} ${loginStudent.lastName}` : "this student"}. Parents use the same login.</DialogDescription>

          <form onSubmit={handleCreateExistingLogin} className="space-y-5 mt-4">
            <Field>
              <Label>Username</Label>

              <Input
                value={existingUserName}
                className={existingErrors.userName ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                onChange={(e) => {
                  setExistingUserName(e.target.value);
                  setExistingErrors((prev) => ({ ...prev, userName: "" }));
                }}
              />

              {existingErrors.userName && <p className="text-xs text-red-500 mt-1.5">{existingErrors.userName}</p>}
            </Field>

            <Field>
              <Label>Password</Label>

              <Input
                type="password"
                value={existingPassword}
                className={existingErrors.password ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                onChange={(e) => {
                  setExistingPassword(e.target.value);
                  setExistingErrors((prev) => ({ ...prev, password: "" }));
                }}
              />

              {existingErrors.password && <p className="text-xs text-red-500 mt-1.5">{existingErrors.password}</p>}
            </Field>

            <Field>
              <Label>Confirm Password</Label>

              <Input
                type="password"
                value={existingConfirm}
                className={existingErrors.confirmPassword ? "border-red-500 focus-visible:ring-red-500/30" : ""}
                onChange={(e) => {
                  setExistingConfirm(e.target.value);
                  setExistingErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
              />

              {existingErrors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{existingErrors.confirmPassword}</p>}
            </Field>

            <Field>
              <Label>Role</Label>

              <Input value="STUDENT" readOnly />
            </Field>

            <p className="text-xs text-muted-foreground">The password must be changed at first login.</p>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closeExistingLoginDialog}>
                Cancel
              </Button>

              <Button type="submit" disabled={existingSubmitting} className="gap-2">
                {existingSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Login"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Login details of the student that was just created */}
      <Dialog
        open={!!createdCredentials}
        onOpenChange={(open) => {
          if (!open) setCreatedCredentials(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Login created</DialogTitle>

          <DialogDescription>Share these login details with the student or parent. Log in with the username and the password you just set.</DialogDescription>

          <div className="space-y-3 mt-4">
            {[{ label: "Username", value: createdCredentials?.userName ?? "" }].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="font-mono text-sm truncate">{row.value}</p>
                </div>

                <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" title={`Copy ${row.label.toLowerCase()}`} onClick={() => copyText(row.value)}>
                  <Copy className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" onClick={() => setCreatedCredentials(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteStudentOpen} onOpenChange={setDeleteStudentOpen}>
        <AlertDialogContent className="sm:max-w-105">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="size-6 text-destructive" />
            </div>

            <AlertDialogTitle className="w-full text-center text-xl">Delete student?</AlertDialogTitle>

            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently remove{" "}
              <span className="inline-block max-w-60 truncate align-bottom font-semibold text-foreground">{deletingStudent && `${deletingStudent.firstName} ${deletingStudent.lastName}`}</span>
              {deletingStudent?.user ? " and their login" : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} disabled={!!deletingId} className="h-11 bg-destructive text-white hover:bg-destructive/90">
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete student
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
