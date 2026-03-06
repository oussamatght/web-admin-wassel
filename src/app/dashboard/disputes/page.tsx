"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import {
  formatDate,
  getDisputeStatusLabel,
  getDisputeReasonLabel,
} from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye } from "lucide-react";
import type { Dispute } from "@/types";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "open", label: "Ouverts" },
  { value: "under_review", label: "En révision" },
  { value: "resolved_refund", label: "Remboursés" },
  { value: "resolved_no_refund", label: "Non remboursés" },
  { value: "escalated", label: "Escaladés" },
  { value: "closed", label: "Fermés" },
];

interface DisputesResponse {
  disputes: Dispute[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function DisputesPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-disputes", status, page],
    queryFn: () =>
      apiGet<DisputesResponse>("/disputes/admin/all", {
        params: {
          status: status || undefined,
          page,
          limit: 20,
        },
      }),
  });

  const columns: Column<Dispute>[] = [
    {
      key: "client",
      header: "Client",
      cell: (d) =>
        d.client ? `${d.client.firstName} ${d.client.lastName}` : "—",
    },
    {
      key: "seller",
      header: "Vendeur",
      cell: (d) =>
        d.seller ? `${d.seller.firstName} ${d.seller.lastName}` : "—",
    },
    {
      key: "reason",
      header: "Raison",
      cell: (d) => getDisputeReasonLabel(d.reason),
    },
    {
      key: "status",
      header: "Statut",
      cell: (d) => <StatusBadge status={d.status} type="dispute" />,
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (d) => formatDate(d.createdAt),
    },
    {
      key: "actions",
      header: "",
      cell: (d) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/disputes/${d._id}`)}>
          <Eye className="mr-1 h-4 w-4" />
          Voir
        </Button>
      ),
    },
  ];

  const disputes = data?.disputes ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Litiges</h1>
            <p className="text-sm text-slate-500">
              {pagination?.total ?? 0} litiges au total
            </p>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value
                ? "bg-[#FF6B00] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable columns={columns} data={disputes} isLoading={isLoading} />

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.pages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
