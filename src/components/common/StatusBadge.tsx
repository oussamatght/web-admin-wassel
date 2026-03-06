"use client";

import { Badge } from "@/components/ui/badge";
import {
  cn,
  getOrderStatusLabel,
  getOrderStatusColor,
  getAccountStatusLabel,
  getAccountStatusColor,
  getDisputeStatusLabel,
  getDisputeStatusColor,
} from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type: "order" | "account" | "dispute" | "payment";
  size?: "sm" | "md";
}

const paymentStatusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

export function StatusBadge({ status, type, size = "sm" }: StatusBadgeProps) {
  let label: string;
  let colorClass: string;

  switch (type) {
    case "order":
      label = getOrderStatusLabel(status);
      colorClass = getOrderStatusColor(status);
      break;
    case "account":
      label = getAccountStatusLabel(status);
      colorClass = getAccountStatusColor(status);
      break;
    case "dispute":
      label = getDisputeStatusLabel(status);
      colorClass = getDisputeStatusColor(status);
      break;
    case "payment":
      label = paymentStatusLabels[status] ?? status;
      colorClass = paymentStatusColors[status] ?? "bg-gray-100 text-gray-700";
      break;
    default:
      label = status;
      colorClass = "bg-gray-100 text-gray-700";
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border font-medium",
        colorClass,
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
      )}>
      {label}
    </Badge>
  );
}
