"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { apiGet } from "@/lib/api";
import { formatDA, timeAgo, getPaymentMethodLabel } from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  Eye,
  Package,
  Truck,
  MapPin,
  Search,
  FilterX,
  Route,
} from "lucide-react";
import type { Order } from "@/types";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "rejected", label: "Rejetées" },
  { value: "confirmed", label: "Confirmées" },
  { value: "preparing", label: "En préparation" },
  { value: "ready_for_pickup", label: "À enlever" },
  { value: "driver_selected", label: "Livreur assigné" },
  { value: "picked_up", label: "Récupérées" },
  { value: "in_delivery", label: "En livraison" },
  { value: "arrived", label: "Arrivées" },
  { value: "delivered", label: "Livrées" },
  { value: "completed", label: "Terminées" },
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

interface DriverListResponse {
  users: Array<{ _id: string; firstName: string; lastName: string }>;
}

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [courierId, setCourierId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: drivers = [] } = useQuery({
    queryKey: ["admin-drivers-list"],
    queryFn: () =>
      apiGet<DriverListResponse>("/admin/users", {
        params: { role: "driver", page: 1, limit: 200 },
      }),
    select: (d) => d.users,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-orders",
      status,
      page,
      search,
      courierId,
      fromDate,
      toDate,
    ],
    queryFn: () =>
      apiGet<OrdersResponse>("/admin/orders", {
        params: {
          status: status || undefined,
          page,
          limit: 20,
          search: search.trim() || undefined,
          courierId: courierId || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
      }),
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  // Socket real-time updates
  useEffect(() => {
    const accessToken =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (!accessToken) return;

    const socket: Socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ??
        "http://localhost:5000",
      {
        auth: { token: accessToken },
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
        <div className="space-y-0.5">
          <span className="text-sm font-mono font-semibold text-[#0D1B2A]">
            {o.orderCode ?? o.orderNumber}
          </span>
          {o.orderCode && o.orderCode !== o.orderNumber && (
            <p className="text-[11px] text-slate-400">#{o.orderNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (o) => (
        <div>
          <p className="text-sm font-medium text-slate-700">
            {o.client?.firstName
              ? `${o.client.firstName} ${o.client.lastName ?? ""}`.trim()
              : "—"}
          </p>
          {o.client?.wilaya && (
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3 w-3" />
              {o.client.wilaya}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "seller",
      header: "Vendeur",
      cell: (o) => (
        <div>
          <p className="text-sm font-medium text-slate-700">
            {o.seller?.firstName
              ? `${o.seller.firstName} ${o.seller.lastName ?? ""}`.trim()
              : "—"}
          </p>
          {o.seller?.wilaya && (
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3 w-3" />
              {o.seller.wilaya}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "driver",
      header: "Livreur",
      cell: (o) =>
        o.driver?.firstName ? (
          <div>
            <p className="text-sm font-medium text-slate-700">
              {`${o.driver.firstName} ${o.driver.lastName ?? ""}`.trim()}
            </p>
            {o.driver?.wilaya && (
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3" />
                {o.driver.wilaya}
              </p>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Truck className="h-3.5 w-3.5" /> Non assigné
          </span>
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Commandes</h1>
          <p className="text-sm text-slate-500">
            {pagination?.total ?? 0} commande
            {(pagination?.total ?? 0) > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => router.push("/dashboard/live-orders")}>
          <Route className="h-4 w-4" /> Suivi en direct
        </Button>
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

      {/* Filters */}
      <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-12">
        <div className="relative md:col-span-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par code commande"
            className="pl-9"
          />
        </div>

        <div className="md:col-span-3">
          <Select
            value={courierId || "all"}
            onValueChange={(value) => {
              setCourierId(value === "all" ? "" : value);
              setPage(1);
            }}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les livreurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les livreurs</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex md:col-span-1 md:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setSearch("");
              setCourierId("");
              setFromDate("");
              setToDate("");
              setStatus("");
              setPage(1);
            }}
            title="Réinitialiser les filtres">
            <FilterX className="h-4 w-4" />
          </Button>
        </div>
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
