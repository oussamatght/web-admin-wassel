"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { apiGet } from "@/lib/api";
import {
  formatDA,
  timeAgo,
  getOrderStatusLabel,
  getPaymentMethodLabel,
} from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Eye, Package, MapPin } from "lucide-react";
import type { Order, OrderStatus } from "@/types";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmées" },
  { value: "preparing", label: "En préparation" },
  { value: "ready_for_pickup", label: "À enlever" },
  { value: "in_delivery", label: "En livraison" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
  { value: "returned", label: "Retournées" },
];

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status, page],
    queryFn: () =>
      apiGet<OrdersResponse>("/admin/orders", {
        params: {
          status: status || undefined,
          page,
          limit: 20,
        },
      }),
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  // Socket real-time updates
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const socket: Socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ??
        "http://localhost:5000",
      {
        auth: { token },
      },
    );

    const handleRefetch = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    };

    socket.on("order:new", handleRefetch);
    socket.on("order:status_update", handleRefetch);
    socket.on("delivery:completed", handleRefetch);

    return () => {
      socket.off("order:new", handleRefetch);
      socket.off("order:status_update", handleRefetch);
      socket.off("delivery:completed", handleRefetch);
      socket.disconnect();
    };
  }, [queryClient]);

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      header: "N° Commande",
      cell: (o) => (
        <span className="text-sm font-mono font-medium text-[#0D1B2A]">
          {o.orderNumber}
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (o) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm text-slate-600">
            {o.client?.wilaya ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "seller",
      header: "Vendeur",
      cell: (o) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm text-slate-600">
            {o.seller?.wilaya ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "items",
      header: "Articles",
      cell: (o) => (
        <div className="flex items-center gap-2">
          {o.items?.[0]?.product?.images?.[0]?.url ? (
            <img
              src={o.items[0].product.images[0].url}
              alt=""
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100">
              <Package className="h-3.5 w-3.5 text-slate-400" />
            </div>
          )}
          <span className="text-sm text-slate-600">
            {o.items?.length ?? 0} article
            {(o.items?.length ?? 0) > 1 ? "s" : ""}
          </span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Montant",
      cell: (o) => (
        <span className="text-sm font-medium text-[#FF6B00]">
          {formatDA(o.totalAmount)}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Paiement",
      cell: (o) => (
        <div className="space-y-0.5">
          <Badge variant="outline" className="text-xs">
            {getPaymentMethodLabel(o.paymentMethod)}
          </Badge>
          <StatusBadge status={o.paymentStatus} type="payment" size="sm" />
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (o) => <StatusBadge status={o.status} type="order" />,
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (o) => (
        <span className="text-xs text-slate-400">{timeAgo(o.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (o) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/dashboard/orders/" + o._id)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
      width: "50px",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Commandes</h1>
        <p className="text-sm text-slate-500">
          {pagination?.total ?? 0} commande
          {(pagination?.total ?? 0) > 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              status === tab.value
                ? "text-[#FF6B00] border-[#FF6B00]"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="Aucune commande trouvée"
        emptyIcon={ShoppingBag}
        onRowClick={(o) => router.push("/dashboard/orders/" + o._id)}
      />

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
