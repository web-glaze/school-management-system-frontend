"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/** 2026-11-30 */
export function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Reads 2026-11-30 as a local date, with no time zone shifting. */
export function parseDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

/** Reads 2026-11-30T14:30 as a local date and time. Returns null when empty or invalid. */
export function parseLocalValue(value: string) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function blockedDays(minDate?: Date, maxDate?: Date): Matcher[] | undefined {
  const days: Matcher[] = [];

  if (minDate) days.push({ before: startOfDay(minDate) });
  if (maxDate) days.push({ after: startOfDay(maxDate) });

  return days.length ? days : undefined;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/** Hour, minute and AM / PM as dropdowns. The value is 24-hour "HH:mm". */
export function TimeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [hour24 = 9, minute = 0] = value.split(":").map(Number);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const emit = (hour: number, min: number, per: string) => {
    const base = hour % 12;

    onChange(`${pad(per === "PM" ? base + 12 : base)}:${pad(min)}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={String(hour12)} onValueChange={(v) => emit(Number(v), minute, period)}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((hour) => (
            <SelectItem key={hour} value={String(hour)}>
              {pad(hour)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">:</span>

      <Select value={String(minute)} onValueChange={(v) => emit(hour12, Number(v), period)}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((min) => (
            <SelectItem key={min} value={String(min)}>
              {pad(min)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={(v) => emit(hour12, minute, v)}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface DatePickerProps {
  /** 2026-11-30, or empty */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  id?: string;
}

/** A date with the shadcn calendar. */
export function DatePicker({ value, onChange, placeholder = "Pick a date", minDate, maxDate, disabled, id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseDateString(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" disabled={disabled} className={cn("w-full justify-start gap-2 font-normal", !selected && "text-muted-foreground")}>
          <CalendarDays className="size-4" />
          {selected ? format(selected, "dd MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate}
          disabled={blockedDays(minDate, maxDate)}
          onSelect={(date) => {
            if (!date) return;

            onChange(toDateString(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

interface DateTimePickerProps {
  /** 2026-11-30T14:30, or empty */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  id?: string;
}

/** A date and a time, with the shadcn calendar and dropdowns. */
export function DateTimePicker({ value, onChange, placeholder = "Pick date and time", minDate, maxDate, disabled, id }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseLocalValue(value);
  const time = selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : "09:00";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" disabled={disabled} className={cn("w-full justify-start gap-2 font-normal", !selected && "text-muted-foreground")}>
          <CalendarDays className="size-4" />
          {selected ? format(selected, "dd MMM yyyy, hh:mm a") : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          defaultMonth={selected ?? minDate}
          disabled={blockedDays(minDate, maxDate)}
          onSelect={(date) => {
            if (date) onChange(`${toDateString(date)}T${time}`);
          }}
        />

        <div className="flex items-center justify-between gap-3 border-t p-3">
          <TimeSelect value={time} onChange={(next) => onChange(`${toDateString(selected ?? minDate ?? new Date())}T${next}`)} />

          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** 2026-11-30T14:30 from a date */
export function toLocalValue(date: Date) {
  return `${toDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
