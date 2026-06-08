"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Clock,
  Activity,
  CheckCircle2,
  Search,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  XCircle,
  Calendar,
  Plus,
  Pencil,
  Loader2,
  CheckCircle,
  Check,
  MoreVertical,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useComplaintStore, Complaint } from "@/store/maintenanceStore";

export default function ComplaintsPage() {
  const { complaints, loading, fetchComplaints, deleteComplaint } = useComplaintStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Isolated state to handle targeting a specific ticket for deletion safely
  const [targetDeleteComplaint, setTargetDeleteComplaint] = useState<Complaint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Reset page when filters, sorting or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy, pageSize]);

  // Client side filtration and sorting
  const filteredAndSortedComplaints = useMemo(() => {
    const searchLower = search.toLowerCase();

    const filtered = complaints.filter((complaint) => {
      const matchesSearch =
        complaint.description.toLowerCase().includes(searchLower) ||
        complaint.locationType.toLowerCase().includes(searchLower) ||
        complaint.subLocation.toLowerCase().includes(searchLower) ||
        (complaint.user?.email || "").toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "ALL" || complaint.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === "NEWEST" ? timeB - timeA : timeA - timeB;
    });
  }, [complaints, search, statusFilter, sortBy]);

  // Client side pagination slice
  const paginatedComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedComplaints.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedComplaints, currentPage, pageSize]);

  const totalPages =
    Math.ceil(filteredAndSortedComplaints.length / pageSize) || 1;

  const handleDelete = async () => {
    if (!targetDeleteComplaint) return;
    setIsDeleting(true);
    try {
      await deleteComplaint(targetDeleteComplaint.id);

      toast.success("Ticket deleted successfully");
      setTargetDeleteComplaint(null);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const statusStats = [
    {
      id: "ALL",
      label: "All Complaints",
      count: complaints.length,
      icon: ClipboardList,
      colorClass:
        "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
    },
    {
      id: "PENDING",
      label: "Pending",
      count: complaints.filter((c) => c.status === "PENDING").length,
      icon: Clock,
      colorClass:
        "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    },
    {
      id: "IN_PROGRESS",
      label: "In Progress",
      count: complaints.filter((c) => c.status === "IN_PROGRESS").length,
      icon: Activity,
      colorClass:
        "text-sky-600 bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30",
    },
    {
      id: "RESOLVED",
      label: "Resolved",
      count: complaints.filter((c) => c.status === "RESOLVED").length,
      icon: CheckCircle2,
      colorClass:
        "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    },
    {
      id: "CLOSED",
      label: "Closed",
      count: complaints.filter((c) => c.status === "CLOSED").length,
      icon: XCircle,
      colorClass:
        "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
            <p className="text-muted-foreground text-sm">Manage and track maintenance tickets</p>
          </div>
          <Link href="/maintenance/tickets/create">
            <Button className="gap-2">
              <Plus size={16} /> Create Ticket
            </Button>
          </Link>
        </div>

        {/* Stats Grid Dashboard Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
          {statusStats.map((stat) => {
            const Icon = stat.icon;
            const isFilterActive = statusFilter === stat.id;

            return (
              <button
                key={stat.id}
                onClick={() => setStatusFilter(stat.id)}
                className={cn(
                  "group relative text-left rounded-xl p-3 md:p-4 bg-card shadow-sm transition-all duration-200 overflow-hidden hover:shadow-md",
                  isFilterActive ? "ring-2 ring-primary/30 shadow-md" : "",
                )}
              >
                <div className="flex justify-between items-start relative z-10">
                  <div
                    className={cn(
                      "p-2 md:p-3 rounded-lg bg-muted/50 transition-transform duration-300 group-hover:scale-110",
                      stat.colorClass,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  {isFilterActive && (
                    <div className="bg-sky-50 text-sky-600 rounded-full font-bold size-6 md:size-8 grid place-items-center">
                      <Check className="size-4 md:size-6" />
                    </div>
                  )}
                </div>

                <div className="mt-2 md:mt-4 space-y-0.5 relative z-10">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {stat.label === "All Complaints" ? (
                      <>
                        All{" "}
                        <span className="text-muted-foreground hidden md:inline">
                          Complaints
                        </span>
                      </>
                    ) : (
                      stat.label
                    )}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                    {loading ? (
                      <span className="inline-block w-8 h-8 rounded bg-muted animate-pulse" />
                    ) : (
                      stat.count
                    )}
                  </h2>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filtering & Controls Section */}
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">

          {/* Status filter tabs row */}
          <div className="flex items-center overflow-x-auto no-scrollbar border-b border-border/40">
            {statusStats.map((stat) => {
              const Icon = stat.icon;
              const isActive = statusFilter === stat.id;
              return (
                <button
                  key={stat.id}
                  onClick={() => setStatusFilter(stat.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 justify-center border-b-2",
                    isActive
                      ? "text-primary border-primary bg-primary/[0.04]"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/60")} />
                  <span className="hidden sm:inline">{stat.label}</span>
                  <span className="sm:hidden">{stat.label.split(" ")[0]}</span>
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[11px] font-bold px-1.5 transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {stat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Sort + Rows */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center justify-between p-3.5">
            <div className="relative w-full sm:w-[280px] group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search by title, location, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9 text-sm bg-muted/30 border-0 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-muted-foreground">
                  <SlidersHorizontal className="size-3.5" />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[145px] pl-8 h-9 text-sm">
                    <SelectValue placeholder="Sort Tickets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sort By</SelectLabel>
                      <SelectItem value="NEWEST">Newest First</SelectItem>
                      <SelectItem value="OLDEST">Oldest First</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Select
                value={String(pageSize)}
                onValueChange={(val) => setPageSize(Number(val))}
              >
                <SelectTrigger className="w-[100px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 rows</SelectItem>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table / Skeleton UI Data rendering */}
          {loading && complaints.length === 0 ? (
            <div className="p-6 space-y-4">
              <div className="flex gap-4 pb-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-6 bg-muted rounded flex-1 animate-pulse"
                  />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="flex gap-4 py-2"
                >
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <div
                      key={c}
                      className="h-8 bg-muted rounded flex-1 animate-pulse"
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : paginatedComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                No Complaints Registered
              </h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm">
                No matching records were found. Check search queries or reset
                filters.
              </p>
              {(search !== "" || statusFilter !== "ALL") && (
                <Button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-5 px-6"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-50/80 border-b border-slate-200/80">
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-widest py-3.5 px-5 text-slate-500 min-w-[200px]">
                      # Issue Details
                    </TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-widest py-3.5 text-slate-500 min-w-[160px]">
                      Location
                    </TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-widest py-3.5 text-slate-500 min-w-[170px]">
                      Priority / Status
                    </TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-widest py-3.5 text-slate-500 min-w-[130px] hidden lg:table-cell">
                      Created At
                    </TableHead>
                    <TableHead className="font-extrabold text-[11px] uppercase tracking-widest py-3.5 text-slate-500 text-right min-w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComplaints.map((complaint, index) => (
                    <TableRow
                      key={complaint.id}
                      className="hover:bg-primary/[0.025] transition-colors border-b border-slate-100 group"
                    >
                      <TableCell className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 text-primary font-black text-xs">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                              {complaint.title || complaint.description.slice(0, 40)}
                            </p>
                            <p className="text-[11px] text-muted-foreground/60 font-semibold mt-0.5">
                              {complaint.ticketCode}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="text-sm font-semibold text-foreground/80 leading-tight">
                            {complaint.locationType}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 align-middle">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold tracking-wide",
                            complaint.priority === "LOW" && "bg-emerald-100 text-emerald-700",
                            complaint.priority === "MEDIUM" && "bg-amber-100 text-amber-700",
                            complaint.priority === "HIGH" && "bg-orange-100 text-orange-700",
                            complaint.priority === "URGENT" && "bg-rose-100 text-rose-700",
                          )}>
                            {complaint.priority}
                          </span>
                          <span className={cn(
                            "inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold tracking-wide",
                            complaint.status === "PENDING" && "bg-slate-100 text-slate-600",
                            complaint.status === "ASSIGNED" && "bg-blue-100 text-blue-700",
                            complaint.status === "IN_PROGRESS" && "bg-amber-100 text-amber-700",
                            complaint.status === "RESOLVED" && "bg-emerald-100 text-emerald-700",
                            complaint.status === "CLOSED" && "bg-zinc-100 text-zinc-600",
                          )}>
                            {complaint.status.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 align-middle hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>
                            {new Date(complaint.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 text-right align-middle sticky right-0 bg-card">
                        <div className="hidden md:flex justify-end gap-1">
                          <Link href={`/maintenance/tickets/${complaint.id}`}>
                            <Button variant="ghost" size="icon"
                              className="size-8 rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-all">
                              <Pencil className="size-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon"
                            className="size-8 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all"
                            onClick={() => setTargetDeleteComplaint(complaint)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="md:hidden flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/maintenance/tickets/${complaint.id}`}>
                                  <Pencil className="mr-2 size-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTargetDeleteComplaint(complaint)}
                                className="text-destructive">
                                <Trash2 className="mr-2 size-4" /> Delete
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

        <AlertDialog
          open={!!targetDeleteComplaint}
          onOpenChange={(open) => !open && setTargetDeleteComplaint(null)}
        >
          <AlertDialogContent className="sm:max-w-[420px]">
            <AlertDialogHeader>
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="size-6 text-destructive" />
              </div>
              <AlertDialogTitle className="w-full text-center text-xl">
                Delete Ticket?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                This action cannot be undone. This will permanently remove
                ticket{" "}
                <span className="font-semibold text-foreground">
                  {`"${targetDeleteComplaint?.title || targetDeleteComplaint?.description.slice(0, 25)}..."`}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 gap-2">
              <AlertDialogCancel className="h-11" disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="h-11 bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 size-4" /> Delete Ticket
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Pagination */}
        {filteredAndSortedComplaints.length > 0 && (
          <div className="bg-card rounded-xl px-5 py-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs font-semibold text-muted-foreground">
              Showing{" "}
              <span className="text-foreground font-bold">{(currentPage - 1) * pageSize + 1}</span>
              {" – "}
              <span className="text-foreground font-bold">{Math.min(currentPage * pageSize, filteredAndSortedComplaints.length)}</span>
              {" of "}
              <span className="text-foreground font-bold">{filteredAndSortedComplaints.length}</span>
              {" tickets"}
            </p>

            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none">
                <ChevronsLeft className="size-4" />
              </button>
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none">
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                    if (pageNum === 2 || pageNum === totalPages - 1)
                      return <span key={pageNum} className="text-muted-foreground/50 text-xs px-0.5 select-none">…</span>;
                    return null;
                  }
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "size-8 rounded-lg text-xs font-bold transition-all",
                        currentPage === pageNum
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      )}>
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none">
                <ChevronRight className="size-4" />
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none">
                <ChevronsRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
