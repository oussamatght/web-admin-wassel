"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import {
  formatDA,
  timeAgo,
  getOrderStatusLabel,
  getOrderStatusColor,
  getInitials,
} from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { StatsCard } from "@/components/common/StatsCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Truck,
  Eye,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { DashboardStats, Order, PlatformSettings } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#EAB308",
  confirmed: "#3B82F6",
  preparing: "#8B5CF6",
  ready_for_pickup: "#06B6D4",
  in_delivery: "#F97316",
  delivered: "#22C55E",
  cancelled: "#EF4444",
  returned: "#6B7280",
};

interface LiveEvent {
  icon: string;
  text: string;
  time: Date;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [liveFeed, setLiveFeed] = useState<LiveEvent[]>([]);

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiGet<DashboardStats>("/admin/dashboard"),
    refetchInterval: 60000,
  });

  const { data: settings } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => apiGet<PlatformSettings>("/admin/settings"),
  });

  // --- Socket live feed ---
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOrderNew = ({
      orderNumber,
      totalAmount,
    }: {
      orderNumber: string;
      totalAmount: number;
    }) => {
      toast.success("Nouvelle commande #" + orderNumber, {
        description: formatDA(totalAmount),
      });
      setLiveFeed((prev) => [
        {
          icon: "\uD83D\uDED2",
          text:
            "Nouvelle commande #" +
            orderNumber +
            " \u2014 " +
            formatDA(totalAmount),
          time: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
      refetch();
    };

    const handleStatusUpdate = ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      setLiveFeed((prev) => [
        {
          icon: "\uD83D\uDCE6",
          text:
            "Commande " +
            orderId.slice(-6) +
            " \u2192 " +
            getOrderStatusLabel(status),
          time: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    };

    const handleDeliveryComplete = ({
      orderNumber,
    }: {
      orderNumber: string;
    }) => {
      setLiveFeed((prev) => [
        {
          icon: "\u2705",
          text: "Livraison compl\u00E8te #" + orderNumber,
          time: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
      refetch();
    };

    socket.on("order:new", handleOrderNew);
    socket.on("order:status_update", handleStatusUpdate);
    socket.on("delivery:completed", handleDeliveryComplete);
    return () => {
      socket.off("order:new", handleOrderNew);
      socket.off("order:status_update", handleStatusUpdate);
      socket.off("delivery:completed", handleDeliveryComplete);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Revenue trend calc ---
  const revTrend = (() => {
    const months = stats?.revenueByMonth;
    if (!months || months.length < 2) return undefined;
    const cur = months[months.length - 1].revenue;
    const prev = months[months.length - 2].revenue;
    if (prev === 0) return undefined;
    return {
      value: Math.round(((cur - prev) / prev) * 100),
      label: "vs mois pr\u00E9c.",
    };
  })();

  // --- Normalize ordersByStatus (backend sends [{_id, count}], frontend expects Record) ---
  const orderStatusMap: Record<string, number> = (() => {
    const raw = stats?.ordersByStatus;
    if (!raw) return {};
    if (Array.isArray(raw)) {
      const map: Record<string, number> = {};
      for (const item of raw as { _id: string; count: number }[]) {
        map[item._id] = item.count;
      }
      return map;
    }
    return raw as Record<string, number>;
  })();

  // --- Donut data ---
  const donutData =
    Object.keys(orderStatusMap).length > 0
      ? Object.entries(orderStatusMap).map(([name, value]) => ({
          name: getOrderStatusLabel(name),
          value,
          color: STATUS_COLORS[name] ?? "#6B7280",
        }))
      : [];
  const totalDonut = donutData.reduce((s, d) => s + d.value, 0);

  // --- Recent orders columns ---
  const recentCols: Column<Order>[] = [
    {
      key: "orderNumber",
      header: "N\u00B0",
      cell: (r) => (
        <span className="font-mono text-sm font-bold text-[#FF6B00]">
          #{r.orderNumber}
        </span>
      ),
      width: "100px",
    },
    {
      key: "clientWilaya",
      header: "Client",
      cell: (r) => (
        <span className="text-sm text-slate-600">
          {r.client?.wilaya ?? "\u2014"}
        </span>
      ),
    },
    {
      key: "sellerWilaya",
      header: "Vendeur",
      cell: (r) => (
        <span className="text-sm text-slate-600">
          {r.seller?.wilaya ?? "\u2014"}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Montant",
      cell: (r) => (
        <span className="font-bold text-sm">{formatDA(r.totalAmount)}</span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Paiement",
      cell: (r) => (
        <Badge
          variant="outline"
          className={
            r.paymentMethod === "online"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-gray-50 text-gray-700 border-gray-200"
          }>
          {r.paymentMethod === "online" ? "En ligne" : "Cash"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (r) => <StatusBadge status={r.status} type="order" />,
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (r) => (
        <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
      ),
    },
    {
      key: "action",
      header: "",
      cell: (r) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-[#FF6B00] hover:text-[#CC5200]"
          onClick={(e) => {
            e.stopPropagation();
            router.push("/dashboard/orders/" + r._id);
          }}>
          <Eye className="h-4 w-4 mr-1" /> Voir
        </Button>
      ),
      width: "80px",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">Tableau de bord</h1>
          <p className="text-sm text-slate-500">
            Bienvenue, {user?.firstName ?? "Admin"}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-6">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-2 h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border bg-white p-6">
            <Skeleton className="h-70 w-full" />
          </div>
          <div className="rounded-xl border bg-white p-6">
            <Skeleton className="h-70 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Tableau de bord</h1>
        <p className="text-sm text-slate-500">
          Bienvenue, {user?.firstName ?? "Admin"}
        </p>
      </div>

      {/* Business Rules Banner */}
      <div className="rounded-xl border border-[#FF6B00]/20 bg-[#FFF3E8] p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="font-semibold text-[#FF6B00]">
            R\u00E8gles business :
          </span>
          <span className="text-slate-700">
            Commission vendeur :{" "}
            <strong>{settings?.sellerCommission ?? 5}%</strong> / commande
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700">
            Commission livreur :{" "}
            <strong>{settings?.driverCommissionPercent ?? 8.7}%</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700">
            Abonnement prestataire :{" "}
            <strong>
              {formatDA(settings?.serviceProviderSubscription ?? 800)}
            </strong>{" "}
            / mois
          </span>
        </div>
      </div>

      {/* ROW 1: KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Revenus totaux"
          value={formatDA(stats?.totalRevenue ?? 0)}
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          trend={revTrend}
          subtitle="Chiffre d'affaires global"
        />
        <StatsCard
          title="Commandes"
          value={(stats?.totalOrders ?? 0).toLocaleString("fr-DZ")}
          icon={ShoppingCart}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          subtitle={(orderStatusMap.pending ?? 0) + " en attente"}
        />
        <StatsCard
          title="Utilisateurs actifs"
          value={(stats?.activeUsers ?? 0).toLocaleString("fr-DZ")}
          icon={Users}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          subtitle="Clients, vendeurs, livreurs"
        />
        <StatsCard
          title="Commissions"
          value={formatDA(stats?.totalCommission ?? 0)}
          icon={TrendingUp}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          subtitle={
            (settings?.sellerCommission ?? 5) +
            "% vendeur + " +
            (settings?.driverCommissionPercent ?? 8.7) +
            "% livraison"
          }
        />
      </div>

      {/* ROW 2: Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-[#0D1B2A] mb-4">
            \u00C9volution des revenus
          </h2>
          {stats?.revenueByMonth && stats.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatDA(v)}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg bg-white p-3 shadow-lg border text-sm">
                        <p className="font-medium text-[#0D1B2A]">{label}</p>
                        <p className="text-[#FF6B00] font-bold">
                          {formatDA(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  fill="#FFF3E8"
                  stroke="#FF6B00"
                  strokeWidth={2}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-70 text-slate-400 text-sm">
              Aucune donn\u00E9e de revenus disponible
            </div>
          )}
        </div>

        {/* Orders Donut Chart */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-[#0D1B2A] mb-4">
            R\u00E9partition commandes
          </h2>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}>
                    {donutData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="47%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-[#0D1B2A] text-2xl font-bold">
                    {totalDonut}
                  </text>
                  <text
                    x="50%"
                    y="57%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-400 text-xs">
                    commandes
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-slate-600 truncate">{d.name}</span>
                    <span className="ml-auto font-bold text-slate-700">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-70 text-slate-400 text-sm">
              Aucune commande
            </div>
          )}
        </div>
      </div>

      {/* ROW 3: Sales by Wilaya + Best Selling Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Wilaya */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-[#0D1B2A] mb-4">
            Ventes par wilaya
          </h2>
          {stats?.salesByWilaya && stats.salesByWilaya.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.salesByWilaya.slice(0, 10)}
                layout="vertical"
                margin={{ left: 60 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal
                />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => formatDA(v)}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="_id"
                  tick={{ fontSize: 12, fill: "#334155" }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as {
                      _id: string;
                      totalRevenue: number;
                      orderCount: number;
                    };
                    return (
                      <div className="rounded-lg bg-white p-3 shadow-lg border text-sm">
                        <p className="font-medium text-[#0D1B2A]">{d._id}</p>
                        <p className="text-[#FF6B00] font-bold">
                          {formatDA(d.totalRevenue)}
                        </p>
                        <p className="text-slate-500">
                          {d.orderCount} commandes
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="totalRevenue"
                  fill="#FF6B00"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-75 text-slate-400 text-sm">
              Aucune donn\u00E9e disponible
            </div>
          )}
        </div>

        {/* Best Selling Products */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-[#0D1B2A] mb-4">
            Produits les plus vendus
          </h2>
          {stats?.bestSellingProducts &&
          stats.bestSellingProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.bestSellingProducts.slice(0, 8)}
                layout="vertical"
                margin={{ left: 80 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  horizontal
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fontSize: 11, fill: "#334155" }}
                  axisLine={false}
                  tickLine={false}
                  width={75}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as {
                      title: string;
                      totalQty: number;
                      totalRevenue: number;
                    };
                    return (
                      <div className="rounded-lg bg-white p-3 shadow-lg border text-sm">
                        <p className="font-medium text-[#0D1B2A]">{d.title}</p>
                        <p className="text-[#3B82F6] font-bold">
                          {d.totalQty} vendus
                        </p>
                        <p className="text-slate-500">
                          {formatDA(d.totalRevenue)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="totalQty" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-75 text-slate-400 text-sm">
              Aucun produit vendu
            </div>
          )}
        </div>
      </div>

      {/* ROW 4: Live Feed + Top Sellers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live Activity Feed */}
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-[#0D1B2A]">
              Activit\u00E9 en temps r\u00E9el
            </h2>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
          </div>
          {liveFeed.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              En attente d&apos;\u00E9v\u00E9nements...
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {liveFeed.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{event.icon}</span>
                    <span className="text-sm text-slate-700 flex-1">
                      {event.text}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">
                      {timeAgo(event.time.toISOString())}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Top Sellers */}
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0D1B2A]">
              Top Vendeurs
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#FF6B00] text-xs"
              onClick={() => router.push("/dashboard/users?role=seller")}>
              Voir tous
            </Button>
          </div>
          {stats?.topSellers && stats.topSellers.length > 0 ? (
            <div className="space-y-3">
              {stats.topSellers.slice(0, 5).map((item, idx) => {
                const rankColors = [
                  "bg-yellow-400 text-yellow-900",
                  "bg-gray-300 text-gray-700",
                  "bg-orange-300 text-orange-800",
                ];
                return (
                  <div
                    key={item.seller._id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        rankColors[idx] ?? "bg-slate-100 text-slate-500"
                      }`}>
                      {idx + 1}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6B00]/10 text-sm font-bold text-[#FF6B00]">
                      {getInitials(item.seller.firstName, item.seller.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0D1B2A]">
                        {item.seller.firstName} {item.seller.lastName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.seller.wilaya}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#FF6B00]">
                        {formatDA(item.totalSales)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.orderCount} cmd
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Aucun vendeur
            </div>
          )}
        </div>
      </div>

      {/* ROW 4: Order Flow */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-[#0D1B2A] mb-4">
          Flux des commandes
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "En attente",
              key: "pending",
              icon: ShoppingCart,
              color: "bg-yellow-100 text-yellow-700",
            },
            {
              label: "Confirm\u00E9e",
              key: "confirmed",
              icon: ShoppingCart,
              color: "bg-blue-100 text-blue-700",
            },
            {
              label: "En pr\u00E9paration",
              key: "preparing",
              icon: ShoppingCart,
              color: "bg-purple-100 text-purple-700",
            },
            {
              label: "Pr\u00EAte",
              key: "ready_for_pickup",
              icon: ShoppingCart,
              color: "bg-cyan-100 text-cyan-700",
            },
            {
              label: "En livraison",
              key: "in_delivery",
              icon: Truck,
              color: "bg-orange-100 text-orange-700",
            },
            {
              label: "Livr\u00E9e",
              key: "delivered",
              icon: ShoppingCart,
              color: "bg-green-100 text-green-700",
            },
          ].map((s, idx, arr) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${s.color}`}>
                <span>{s.label}</span>
                {orderStatusMap[s.key] !== undefined && (
                  <span className="ml-1.5 font-bold">
                    ({orderStatusMap[s.key]})
                  </span>
                )}
              </div>
              {idx < arr.length - 1 && (
                <span className="text-slate-300 text-lg">\u2192</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          QR code g\u00E9n\u00E9r\u00E9 au statut &quot;Pr\u00EAte \u00E0
          enlever&quot; \u2014 scann\u00E9 par le livreur
        </p>
      </div>

      {/* ROW 5: Recent Orders */}
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#0D1B2A]">
            Commandes r\u00E9centes
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#FF6B00] text-xs"
            onClick={() => router.push("/dashboard/orders")}>
            Voir toutes
          </Button>
        </div>
        <DataTable
          columns={recentCols}
          data={stats?.recentOrders?.slice(0, 10) ?? []}
          emptyMessage="Aucune commande r\u00E9cente"
        />
      </div>
    </div>
  );
}
