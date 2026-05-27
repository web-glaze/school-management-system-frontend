"use client";

import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Progress } from "@/components/ui/progress";

import {
  Search,
  Plus,
  MoreHorizontal,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Ticket,
} from "lucide-react";

const tickets = [
  {
    id: 25,
    title: "Request bulb replacement",
    location: "Grade 11 • Room 102",
    status: "NEW",
    priority: "Medium",
    tech: "Waiting",
    progress: 10,
  },

  {
    id: 24,
    title: "AC Not Working",
    location: "Grade 10 • Room 201",
    status: "IN_PROGRESS",
    priority: "High",
    tech: "John",
    progress: 70,
  },

  {
    id: 23,
    title: "Projector Issue",
    location: "Grade 9 • Lab",
    status: "CLOSED",
    priority: "Low",
    tech: "David",
    progress: 100,
  },
];

const stats = [
  {
    title: "Total Tickets",
    value: "125",
    icon: Ticket,
  },

  {
    title: "Open",
    value: "32",
    icon: AlertTriangle,
  },

  {
    title: "Assigned",
    value: "14",
    icon: Clock3,
  },

  {
    title: "Closed",
    value: "79",
    icon: CheckCircle2,
  },
];

function statusColor(status: string) {
  if (status === "NEW") return "bg-blue-100 text-blue-700";

  if (status === "IN_PROGRESS") return "bg-amber-100 text-amber-700";

  return "bg-green-100 text-green-700";
}

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="bg-slate-50">
        {/* HEADER */}

        <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
          <div className="h-20 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Maintenance Tickets</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        </header>

        <div className="space-y-6 p-6">
          {/* TOP */}

          <div>
            <h1 className="text-3xl font-bold">Ticket Management</h1>

            <p className="text-muted-foreground">
              Track, assign and resolve requests
            </p>
          </div>

          {/* KPI */}

          <div className="grid gap-5 lg:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {item.title}
                        </p>

                        <h2 className="mt-2 text-4xl font-bold">
                          {item.value}
                        </h2>
                      </div>

                      <div className="rounded-xl bg-primary/10 p-3">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FILTER BAR */}

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    placeholder="Search by ticket, room, technician..."
                    className="pl-10"
                  />
                </div>

                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>

                    <SelectItem value="new">New</SelectItem>

                    <SelectItem value="progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>

                    <SelectItem value="medium">Medium</SelectItem>

                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* QUICK FILTER */}

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>

              <TabsTrigger value="new">New</TabsTrigger>

              <TabsTrigger value="progress">In Progress</TabsTrigger>

              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* TABLE */}

          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>

                  <TableHead>Ticket</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead>Technician</TableHead>

                  <TableHead>Progress</TableHead>

                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>#{ticket.id}</TableCell>

                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.title}</div>

                        <div className="text-sm text-muted-foreground">
                          {ticket.location}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={statusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback>{ticket.tech[0]}</AvatarFallback>
                        </Avatar>

                        {ticket.tech}
                      </div>
                    </TableCell>

                    <TableCell className="w-[220px]">
                      <Progress value={ticket.progress} />
                    </TableCell>

                    <TableCell align="right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                          <DropdownMenuItem>View</DropdownMenuItem>

                          <DropdownMenuItem>Assign</DropdownMenuItem>

                          <DropdownMenuItem>Close</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
