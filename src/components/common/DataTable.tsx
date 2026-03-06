"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageOpen } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Aucun résultat trouvé",
  emptyIcon: EmptyIcon = PackageOpen,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white overflow-x-auto">
        <Table className="min-w-175">
          <TableHeader>
            <TableRow className="bg-slate-50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                  style={col.width ? { width: col.width } : undefined}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <EmptyIcon className="h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white overflow-x-auto">
      <Table className="min-w-175">
        <TableHeader>
          <TableRow className="bg-slate-50">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow
              key={rowIdx}
              className={onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}
              onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <TableCell key={col.key} className="whitespace-nowrap">
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
