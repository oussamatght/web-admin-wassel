"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers (max 5 visible)
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
    if (page >= totalPages - 2)
      return [
        1,
        "ellipsis",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
  };

  return (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-slate-500">
        Affichage de{" "}
        <span className="font-medium text-slate-700">{startItem}</span> à{" "}
        <span className="font-medium text-slate-700">{endItem}</span> sur{" "}
        <span className="font-medium text-slate-700">{total}</span> résultats
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((pageNum, idx) =>
          pageNum === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "outline"}
              size="icon"
              className={`h-8 w-8 text-xs ${
                page === pageNum
                  ? "bg-[#FF6B00] hover:bg-[#CC5200] text-white"
                  : ""
              }`}
              onClick={() => onPageChange(pageNum)}>
              {pageNum}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
