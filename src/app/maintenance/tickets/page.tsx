"use client";
import { logError } from "@/lib/api-helpers";


import DashboardLayout from "@/components/layout/DashboardLayout";
import axios from "axios";
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
  Eye,
  XCircle,
  Calendar,
  Plus,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Complaint {
  id: string;
  ticketCode?: string;
  title: string;
  description: string;
  locationType: string;
  subLocation: string;
  priority: string;
  status: string;
  managerRemark?: string;
  createdAt: string;
  user?: { email: string };
  assignedTechnician?: { id: string; name: string };
}

interface Technician {
  id: string;
  name: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [complaintsRes, techniciansRes] = await Promise.all([
        axios.get(`${API_URL}/api/complaints`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        axios.get(`${API_URL}/api/technicians`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      setComplaints(
        Array.isArray(complaintsRes.data)
          ? complaintsRes.data
          : complaintsRes.data.data || [],
      );

      setTechnicians(
        Array.isArray(techniciansRes.data)
          ? techniciansRes.data
          : techniciansRes.data.data || [],
      );
    } catch (error) {
      logError("tickets.page", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 0);
  }, []);

  // Reset page when filters, sorting or page size changes
  useEffect(() => {
    setTimeout(()=>{
    setCurrentPage(1);},0);
  }, [search, statusFilter, sortBy, pageSize]);

  // Client side filtration and sorting
  const filteredAndSortedComplaints = useMemo(() => {
    const filtered = complaints.filter((complaint) => {
      const matchesSearch =
        complaint.description
          
          .slice(0, 60)
          
          .toLowerCase()
          
          .includes(search.toLowerCase()) ||
        complaint.description.toLowerCase().includes(search.toLowerCase()) ||
        complaint.locationType.toLowerCase().includes(search.toLowerCase()) ||
        complaint.subLocation.toLowerCase().includes(search.toLowerCase()) ||
        (complaint.user?.email || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || complaint.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "NEWEST") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "OLDEST") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      const getPriorityWeight = (priority: string) => {
        switch (priority) {
          case "URGENT":
            return 4;
          case "HIGH":
            return 3;
          case "MEDIUM":
            return 2;
          case "LOW":
            return 1;
          default:
            return 0;
        }
      };

      if (sortBy === "PRIORITY_HIGH") {
        // Highest priority first; tie-break on newest createdAt.
        return (
          getPriorityWeight(b.priority) - getPriorityWeight(a.priority) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "PRIORITY_LOW") {
        return (
          getPriorityWeight(a.priority) - getPriorityWeight(b.priority) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      // Default: newest first.
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [complaints, search, statusFilter, sortBy]);

  // Client side pagination slice
  const paginatedComplaints = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedComplaints.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedComplaints, currentPage, pageSize]);

  const totalPages =
    Math.ceil(filteredAndSortedComplaints.length / pageSize) || 1;

  const updateStatus = async (complaintId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/complaints/${complaintId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchData();
    } catch (error) {
      logError("tickets.page", error);
    }
  };

  const updatePriority = async (complaintId: string, priority: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/complaints/${complaintId}/priority`,
        {
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchData();
    } catch (error) {
      logError("tickets.page", error);
    }
  };

  const assignTechnician = async (
    complaintId: string,
    technicianId: string,
  ) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${API_URL}/api/complaints/${complaintId}/assign`,
        {
          technicianId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchData();
    } catch (error) {
      logError("tickets.page", error);
    }
  };

  const deleteComplaint = async (complaintId: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/api/complaints/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchData();
    } catch (error) {
      logError("tickets.page", error);
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
      activeColorClass: "bg-indigo-600 text-white shadow-indigo-600/10",
      accentGlow: "from-indigo-500/20 to-indigo-600/0",
    },
    {
      id: "PENDING",
      label: "Pending",
      count: complaints.filter((c) => c.status === "PENDING").length,
      icon: Clock,
      colorClass:
        "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
      activeColorClass: "bg-amber-500 text-white shadow-amber-500/10",
      accentGlow: "from-amber-500/20 to-amber-600/0",
    },
    {
      id: "IN_PROGRESS",
      label: "In Progress",
      count: complaints.filter((c) => c.status === "IN_PROGRESS").length,
      icon: Activity,
      colorClass:
        "text-sky-600 bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30",
      activeColorClass: "bg-sky-500 text-white shadow-sky-500/10",
      accentGlow: "from-sky-500/20 to-sky-600/0",
    },
    {
      id: "RESOLVED",
      label: "Resolved",
      count: complaints.filter((c) => c.status === "RESOLVED").length,
      icon: CheckCircle2,
      colorClass:
        "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      activeColorClass: "bg-emerald-500 text-white shadow-emerald-500/10",
      accentGlow: "from-emerald-500/20 to-emerald-600/0",
    },
    {
      id: "CLOSED",
      label: "Closed",
      count: complaints.filter((c) => c.status === "CLOSED").length,
      icon: XCircle,
      colorClass:
        "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
      activeColorClass: "bg-slate-600 text-white shadow-slate-600/10",
      accentGlow: "from-slate-500/20 to-slate-600/0",
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
              <Plus size={18} /> Create Ticket
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {statusStats.map((stat) => {
            const Icon = stat.icon;
            const isFilterActive = statusFilter === stat.id;

            return (
              <button
                key={stat.id}
                onClick={() => setStatusFilter(stat.id)}
                className={cn(
                  "group relative  text-left rounded-lg p-6 bg-card border transition-all duration-300 overflow-hidden  hover:shadow-md hover:-translate-y-1",
                  isFilterActive
                    ? "border-primary/30 ring-1 ring-primary/20 "
                    : "border-border/60 hover:border-primary/20",
                )}
              >
                <div className="flex justify-between items-start relative z-10">
                  <div
                    className={cn(
                      "p-3 rounded-lg border transition-transform duration-300 group-hover:scale-110",
                      stat.colorClass,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  {isFilterActive && (
                    <Badge className="bg-sky-50 text-sky-600 rounded-full font-bold p-3">
                      Selected
                    </Badge>
                  )}
                </div>

                <div className="mt-5 space-y-1 relative z-10">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {stat.label}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
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

        <div className="bg-card rounded-md p-5 md:p-6 border border-border/60  space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-[350px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search by title, location, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
              />
            </div>

            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full lg:w-auto"
            >
              <TabsList className="w-full lg:w-auto rounded-full bg-muted/60 p-1 overflow-x-auto no-scrollbar">
                {statusStats.map((stat) => (
                  <TabsTrigger
                    key={stat.id}
                    value={stat.id}
                    className="
                      rounded-full
                      px-4
                      py-2
                      whitespace-nowrap
                      text-sm
                      data-[state=active]:shadow-sm
                    "
                  >
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

                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value)}
                >
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

              <div className="relative">
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-[110px]">
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

          {loading ? (
            <div className="p-6 space-y-4">
              <div className="flex gap-4 border-b border-border/50 pb-3">
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
                  className="flex gap-4 py-2 border-b border-border/20"
                >
                  <div className="h-8 bg-muted rounded flex-1.5 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
                  <div className="h-8 bg-muted rounded flex-1 animate-pulse" />
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
                No matching records were found in the database. Check search
                queries or reset parameters.
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
                <TableHeader className="bg-muted/40 dark:bg-muted/15 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-[20px]">
                      # ID
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6 text-foreground/80 min-w-[220px]">
                      Title
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[170px]">
                      Location
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[110px]">
                      Priority
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[155px]">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 text-foreground/80 min-w-[120px]">
                      Created At
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pr-6 text-foreground/80 text-right min-w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {paginatedComplaints.map((complaint, rowIndex) => {
                    const isUrgent = complaint.priority === "URGENT";
                    const isHigh = complaint.priority === "HIGH";
                    const isMedium = complaint.priority === "MEDIUM";

                    const priorityStyles = isUrgent
                      ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-500/20"
                      : isHigh
                        ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20"
                        : isMedium
                          ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20";

                    // Prefer the server-issued ticket code (e.g. TKT-007);
                    // fall back to a running row number that respects pagination.
                    const displayId =
                      complaint.ticketCode ??
                      String((currentPage - 1) * pageSize + rowIndex + 1);

                    return (
                      <TableRow
                        key={complaint.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="py-4 pl-6 align-top">
                          <div className="space-y-1 max-w-[20px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {displayId}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 pl-6 align-top">
                          <div className="space-y-1 max-w-[260px]">
                            <p className="font-semibold text-foreground text-sm leading-tight hover:text-primary transition-colors">
                              {complaint.description.slice(0, 60)}
                            </p>
                            <p className="text-muted-foreground text-xs font-light line-clamp-2 leading-relaxed">
                              {complaint.description}
                            </p>
                          </div>
                        </TableCell>

                        {/* Location */}
                        <TableCell className="py-4 align-top">
                          <div className="flex items-start gap-1.5 text-sm text-foreground/95">
                            <div className="space-y-0.5 font-medium leading-tight">
                              <p className="font-semibold text-foreground/90">
                                {complaint.locationType}
                              </p>
                              <p className="text-muted-foreground text-[11px] font-normal">
                                {complaint.subLocation}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <Badge
                            variant="outline"
                            className={cn(
                              "min-w-[90px] justify-center rounded-lg font-bold text-md py-3 px-5",

                              complaint.priority === "LOW" &&
                                "border-emerald-200 bg-emerald-50 text-emerald-700",

                              complaint.priority === "MEDIUM" &&
                                "border-amber-200 bg-amber-50 text-amber-700",

                              complaint.priority === "HIGH" &&
                                "border-orange-200 bg-orange-50 text-orange-700",

                              complaint.priority === "URGENT" &&
                                "border-rose-200 bg-rose-50 text-rose-700",
                            )}
                          >
                            {complaint.priority}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <Badge
                            variant="outline"
                            className={cn(
                              "min-w-[100px] justify-center rounded-lg font-bold text-md py-3 px-5",

                              complaint.status === "PENDING" &&
                                "border-slate-200 bg-slate-50 text-slate-700",

                              complaint.status === "ASSIGNED" &&
                                "border-blue-200 bg-blue-50 text-blue-700",

                              complaint.status === "IN_PROGRESS" &&
                                "border-amber-200 bg-amber-50 text-amber-700",

                              complaint.status === "RESOLVED" &&
                                "border-emerald-200 bg-emerald-50 text-emerald-700",

                              complaint.status === "CLOSED" &&
                                "border-zinc-200 bg-zinc-100 text-zinc-700",
                            )}
                          >
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        {/* Created At */}
                        <TableCell className="py-4 text-xs font-medium text-muted-foreground align-top">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-5 text-muted-foreground/80" />
                            <span className="text-base">
                              {new Date(complaint.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 pr-6 text-right align-top">
                          <Link
                            href={`/maintenance/tickets/${complaint.id}`}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-lg text-muted-foreground hover:bg-blue-300/10 hover:text-blue-700 transition-all"
                              title="View Complaint"
                            >
                              <Eye className="size-5" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteComplaint(complaint.id)}
                            className="size-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                            title="Delete Complaint"
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {filteredAndSortedComplaints.length > 0 && (
          <div className="bg-card rounded-lg p-5 border border-border/60  flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Counts info */}
            <div className="text-sm font-medium text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(
                  currentPage * pageSize,
                  filteredAndSortedComplaints.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">
                {filteredAndSortedComplaints.length}
              </span>{" "}
              complaints
            </div>

            {/* Navigation controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-border/80 text-muted-foreground disabled:opacity-40"
              >
                <ChevronsLeft className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border/80 text-muted-foreground disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Only display specific boundaries of page numbers for clean design
                  const isNearCurrent = Math.abs(currentPage - pageNum) <= 1;
                  const isEdge = pageNum === 1 || pageNum === totalPages;

                  if (!isNearCurrent && !isEdge) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span
                          key={pageNum}
                          className="text-muted-foreground/60 text-xs px-1 select-none"
                        >
                          ..
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon-sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "rounded-lg border text-xs font-bold",
                        currentPage === pageNum
                          ? "bg-sky-600 text-white"
                          : "border-border/80 text-muted-foreground",
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              {/* Next Page */}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border/80 text-muted-foreground disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </Button>

              {/* Last Page */}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border/80 text-muted-foreground disabled:opacity-40"
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
