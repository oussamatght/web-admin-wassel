"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Route,
  Search,
  Eye,
  Navigation,
  Truck,
  Store,
  User,
} from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

const LIVE_STATUSES: OrderStatus[] = [
  "ready_for_pickup",
  "driver_selected",
  "picked_up",
  "in_delivery",
  "arrived",
];

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all_live", label: "Tout en cours" },
  { value: "ready_for_pickup", label: "Prête à enlever" },
  { value: "driver_selected", label: "Livreur assigné" },
  { value: "picked_up", label: "Récupérée" },
  { value: "in_delivery", label: "En livraison" },
  { value: "arrived", label: "Arrivée client" },
];

function whereIsOrder(order: Order): {
  label: string;
  icon: React.ElementType;
} {
  switch (order.status) {
    case "ready_for_pickup":
      return { label: "Chez le vendeur (préparation retrait)", icon: Store };
    case "driver_selected":
      return { label: "Livreur en route vers vendeur", icon: Navigation };
    case "picked_up":
      return { label: "Colis récupéré — départ livraison", icon: Truck };
    case "in_delivery":
      return { label: "En route vers le client", icon: Truck };
    case "arrived":
      return { label: "Arrivé chez le client", icon: User };
    default:
      return { label: "Hors suivi en direct", icon: Route };
  }
}

export default function LiveOrdersPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("all_live");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-live-orders", status, search],
    queryFn: async () => {
      const searchValue = search.trim();

      if (status === "all_live") {
        const all = await Promise.all(
          LIVE_STATUSES.map((s) =>
            apiGet<OrdersResponse>("/admin/orders", {
              params: {
                status: s,
                page: 1,
                limit: 30,
                search: searchValue || undefined,
              },
            }),
          ),
        );

        const merged = all.flatMap((r) => r.orders);
        const uniqueById = new Map<string, Order>();
        for (const order of merged) {
          uniqueById.set(order._id, order);
        }

        return Array.from(uniqueById.values()).sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      }

      const single = await apiGet<OrdersResponse>("/admin/orders", {
        params: {
          status,
          page: 1,
          limit: 100,
          search: searchValue || undefined,
        },
      });

      return single.orders;
    },
  });

  const orders = useMemo(() => data ?? [], [data]);

  const summary = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const s of LIVE_STATUSES) byStatus[s] = 0;
    for (const order of orders) {
      if (byStatus[order.status] !== undefined) byStatus[order.status] += 1;
    }
    return byStatus;
  }, [orders]);

  const columns: Column<Order>[] = [
    {
      key: "orderCode",
      header: "Commande",
      cell: (o) => (
        <div className="space-y-0.5">
          <p className="font-mono text-sm font-semibold text-[#0D1B2A]">
            {o.orderCode ?? o.orderNumber}
          </p>
          <p className="text-[11px] text-slate-400">
            Maj: {timeAgo(o.updatedAt)}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (o) => <StatusBadge status={o.status} type="order" size="sm" />,
    },
    {
      key: "where",
      header: "Où est la commande ?",
      cell: (o) => {
        const state = whereIsOrder(o);
        const Icon = state.icon;
        return (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Icon className="h-4 w-4 text-[#FF6B00]" />
            {state.label}
          </div>
        );
      },
    },
    {
      key: "client",
      header: "Client",
      cell: (o) => (
        <span className="text-sm text-slate-700">
          {o.client?.firstName
            ? `${o.client.firstName} ${o.client.lastName ?? ""}`.trim()
            : "—"}
        </span>
      ),
    },
    {
      key: "seller",
      header: "Vendeur",
      cell: (o) => (
        <span className="text-sm text-slate-700">
          {o.seller?.firstName
            ? `${o.seller.firstName} ${o.seller.lastName ?? ""}`.trim()
            : "—"}
        </span>
      ),
    },
    {
      key: "driver",
      header: "Livreur",
      cell: (o) => (
        <span className="text-sm text-slate-700">
          {o.driver?.firstName
            ? `${o.driver.firstName} ${o.driver.lastName ?? ""}`.trim()
            : "Non assigné"}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Dernier événement",
      cell: (o) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(o.updatedAt)}
        </span>
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
          onClick={() => router.push(`/dashboard/orders/${o._id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
      width: "50px",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">
            Suivi commandes en direct
          </h1>
          <p className="text-sm text-slate-500">
            Visualisez immédiatement où se trouvent les commandes acceptées et
            en cours.
          </p>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            placeholder="Recherche code commande"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {LIVE_STATUSES.map((s) => (
          <div key={s} className="rounded-xl border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {s}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#0D1B2A]">
              {summary[s] ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value
                ? "bg-[#FF6B00] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="Aucune commande en suivi direct"
        emptyIcon={Route}
        onRowClick={(o) => router.push(`/dashboard/orders/${o._id}`)}
      />
    </div>
  );
}
