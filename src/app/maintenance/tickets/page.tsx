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
  Eye,
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
  Check,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useComplaintStore, Complaint } from "@/store/maintenanceStore";
import { usePermission } from "@/hooks/usePermission";

export default function ComplaintsPage() {
  const { complaints, loading, fetchComplaints, deleteComplaint } = useComplaintStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const userRole = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")?.roles?.[0] || "" : "";
  const canEditTickets = ["SUPERADMIN", "ADMIN", "MANAGER"].includes(userRole);
  const canDeleteTickets = ["SUPERADMIN", "ADMIN"].includes(userRole);
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

      const matchesStatus = statusFilter === "ALL" || complaint.status === statusFilter;

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

  const totalPages = Math.ceil(filteredAndSortedComplaints.length / pageSize) || 1;

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

  const authorized = usePermission("ticket.read");

  if (authorized === null) {
    return null;
  }

  const statusStats = [
    {
      id: "ALL",
      label: "All Complaints",
      count: complaints.length,
      icon: ClipboardList,
      colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
    },
    {
      id: "PENDING",
      label: "Pending",
      count: complaints.filter((c) => c.status === "PENDING").length,
      icon: Clock,
      colorClass: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    },
    {
      id: "IN_PROGRESS",
      label: "In Progress",
      count: complaints.filter((c) => c.status === "IN_PROGRESS").length,
      icon: Activity,
      colorClass: "text-sky-600 bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30",
    },
    {
      id: "RESOLVED",
      label: "Resolved",
      count: complaints.filter((c) => c.status === "RESOLVED").length,
      icon: CheckCircle2,
      colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    },
    {
      id: "CLOSED",
      label: "Closed",
      count: complaints.filter((c) => c.status === "CLOSED").length,
      icon: XCircle,
      colorClass: "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
            <p className="text-muted-foreground">Manage and track tickets</p>
          </div>
          <Link href="/maintenance/tickets/create">
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Plus size={18} className="mr-2" /> Create Ticket
            </Button>
          </Link>
        </div>

        {/* Stats Grid Dashboard Buttons */}
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6">
          {statusStats.map((stat) => {
            const Icon = stat.icon;
            const isFilterActive = statusFilter === stat.id;

            return (
              <button
                key={stat.id}
                onClick={() => setStatusFilter(stat.id)}
                className={cn(
                  "group relative text-left rounded-lg p-3 md:p-6  bg-card border transition-all duration-300 overflow-hidden hover:shadow-md hover:-translate-y-1",
                  isFilterActive ? "border-primary/30 ring-1 ring-primary/20" : "border-border/60 hover:border-primary/20"
                )}
              >
                <div className="flex justify-between items-start relative z-10">
                  <div className={cn("p-3 rounded-lg border transition-transform duration-300 group-hover:scale-110", stat.colorClass)}>
                    <Icon className="size-5" />
                  </div>
                  {isFilterActive && (
                    <div className="bg-sky-50 text-sky-600 rounded-full font-bold size-6 md:size-8 grid place-items-center">
                      <Check className="size-4 md:size-6" />
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-1 relative z-10">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {stat.label === "All Complaints" ? (
                      <>
                        All <span className="text-muted-foreground hidden md:inline">Complaints</span>
                      </>
                    ) : (
                      stat.label
                    )}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">{loading ? <span className="inline-block w-8 h-8 rounded bg-muted animate-pulse" /> : stat.count}</h2>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filtering & Controls Section */}
        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-87.5 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input type="text" placeholder="Search by title, location, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
            </div>

            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto">
              <TabsList className="w-full lg:w-auto rounded-full bg-muted/60 p-1 overflow-x-auto no-scrollbar">
                {statusStats.map((stat) => (
                  <TabsTrigger key={stat.id} value={stat.id} className="rounded-full px-2 md:px-4 py-2 whitespace-nowrap text-sm data-[state=active]:shadow-sm">
                    {stat.label.split(" ")[0]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <div className="relative group/sel">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-muted-foreground">
                  <SlidersHorizontal className="size-3.5" />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full max-w-40 pl-8">
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

              <div>
                <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
                  <SelectTrigger className="w-27.5">
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
          </div>

          {/* Table / Skeleton UI Data rendering */}
          {loading && complaints.length === 0 ? (
            <div className="p-6 space-y-4">
              <div className="flex gap-4 border-b border-border/50 pb-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-6 bg-muted rounded flex-1 animate-pulse" />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex gap-4 py-2 border-b border-border/20">
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <div key={c} className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          ) : paginatedComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground/75">
                <Inbox className="size-6 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No Complaints Registered</h3>
              <p className="text-muted-foreground mt-1.5 max-w-sm">No matching records were found. Check search queries or reset filters.</p>
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
                <TableHeader className="bg-gray-50 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-42.5"># Issue Details</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-50 pr-7">Location</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-37.5">Priority / Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-30 hidden lg:table-cell">Created At</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 text-right min-w-12.5 sticky right-0 bg-gray-50 shadow-lg md:shadow-none">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {paginatedComplaints.map((complaint, index) => {
                    return (
                      <TableRow key={complaint.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="py-4 align-top font-semibold text-sm">
                          <p className="font-semibold text-foreground text-base leading-tight hover:text-primary transition-colors">{complaint.title || complaint.description.slice(0, 40)}</p>
                          <p className="text-sm text-foreground/50">{complaint.ticketCode}</p>
                        </TableCell>

                        <TableCell className="py-4 align-top pr-7">
                          <div className="space-y-0.5 font-medium leading-tight text-sm">
                            <p className="font-semibold text-foreground/90">{complaint.locationType}</p>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <Badge
                            variant="outline"
                            className={cn(
                              "min-w-22.5 justify-center rounded-lg font-bold text-xs py-1 px-2.5 mr-2",
                              complaint.priority === "LOW" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
                              complaint.priority === "MEDIUM" && "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
                              complaint.priority === "HIGH" && "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400",
                              complaint.priority === "URGENT" && "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                            )}
                          >
                            {complaint.priority}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={cn(
                              "min-w-25 justify-center rounded-lg font-bold text-xs py-1 px-2.5",
                              complaint.status === "PENDING" && "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                              complaint.status === "ASSIGNED" && "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400",
                              complaint.status === "IN_PROGRESS" && "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
                              complaint.status === "RESOLVED" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
                              complaint.status === "CLOSED" && "border-zinc-200 bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                            )}
                          >
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4 text-sm font-medium text-muted-foreground align-top hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Calendar className="size-3.5 text-muted-foreground/80" />
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

                        <TableCell className="py-4 text-right align-top space-x-1  sticky right-0 bg-card shadow-lg md:shadow-none">
                          <div className="hidden md:flex justify-end gap-1">
                            {canEditTickets ? (
                              <>
                                <Link href={`/maintenance/tickets/${complaint.id}`}>
                                  <Button variant="ghost" size="icon" className="size-10 text-muted-foreground hover:bg-blue-600/10 hover:text-blue-600 transition-all">
                                    <Pencil className="size-5" />
                                  </Button>
                                </Link>

                                {canDeleteTickets && (
                                  <Button variant="ghost" size="icon" className="size-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => setTargetDeleteComplaint(complaint)}>
                                    <Trash2 className="size-5" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Link href={`/maintenance/tickets/${complaint.id}`}>
                                <Button variant="ghost" size="icon" className="size-10 text-muted-foreground hover:bg-blue-600/10 hover:text-blue-600 transition-all">
                                  <Eye className="size-5" />
                                </Button>
                              </Link>
                            )}
                          </div>
                          <div className="md:hidden flex justify-end">
                            {canEditTickets ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-9">
                                    <MoreVertical className="size-5" />
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/maintenance/tickets/${complaint.id}`}>
                                      <Pencil className="mr-2 size-4" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>

                                  {canDeleteTickets && (
                                    <DropdownMenuItem onClick={() => setTargetDeleteComplaint(complaint)} className="text-destructive">
                                      <Trash2 className="mr-2 size-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Link href={`/maintenance/tickets/${complaint.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Eye className="size-5" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <AlertDialog open={!!targetDeleteComplaint} onOpenChange={(open) => !open && setTargetDeleteComplaint(null)}>
          <AlertDialogContent className="sm:max-w-105">
            <AlertDialogHeader>
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="size-6 text-destructive" />
              </div>
              <AlertDialogTitle className="w-full text-center text-xl">Delete Ticket?</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                This action cannot be undone. This will permanently remove ticket <span className="font-semibold text-foreground">{`"${targetDeleteComplaint?.title || targetDeleteComplaint?.description.slice(0, 25)}..."`}</span>
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

        {/* Pagination Footers Controls */}
        {filteredAndSortedComplaints.length > 0 && (
          <div className="bg-card rounded-lg p-5 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * pageSize, filteredAndSortedComplaints.length)}</span> of{" "}
              <span className="font-semibold text-foreground">{filteredAndSortedComplaints.length}</span> complaints
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="size-8">
                <ChevronsLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="size-8">
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={pageNum} className="text-muted-foreground/60 text-xs px-1 select-none">
                          ..
                        </span>
                      );
                    }
                    return null;
                  }
                  return (
                    <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} onClick={() => setCurrentPage(pageNum)} className={cn("size-8 font-bold text-xs", currentPage === pageNum ? "bg-sky-600 text-white" : "")}>
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="size-8">
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="size-8">
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}