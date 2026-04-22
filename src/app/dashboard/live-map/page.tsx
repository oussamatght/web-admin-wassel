"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { MapPin, Navigation, Route } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";

type LocationPoint = {
  address?: string;
  lat?: number;
  lng?: number;
  updatedAt?: string;
};

type LivePoint = {
  orderId: string;
  orderCode: string;
  status: string;
  updatedAt: string;
  sellerLocation?: LocationPoint | null;
  driverLocation?: LocationPoint | null;
  clientLocation?: LocationPoint | null;
  driver?: { firstName?: string; lastName?: string } | null;
};

type LiveMapResponse = {
  points: LivePoint[];
  totalLiveOrders: number;
};

function mapLink(point?: LocationPoint | null) {
  if (!point || typeof point.lat !== "number" || typeof point.lng !== "number")
    return null;
  return `https://www.google.com/maps?q=${point.lat},${point.lng}`;
}

export default function LiveMapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-live-map"],
    queryFn: () => apiGet<LiveMapResponse>("/admin/live-map"),
    refetchInterval: 5000,
  });

  const points = useMemo(() => data?.points ?? [], [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">
          Live map monitoring
        </h1>
        <p className="text-sm text-slate-500">
          Tracking en temps réel des positions vendeur/livreur/client sur les
          commandes actives.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm text-slate-700">
        Total commandes live:{" "}
        <span className="font-semibold">{data?.totalLiveOrders ?? 0}</span>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
          Chargement live map...
        </div>
      ) : points.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
          Aucune commande active.
        </div>
      ) : (
        <div className="grid gap-4">
          {points.map((p) => {
            const driverLabel = p.driver?.firstName
              ? `${p.driver.firstName} ${p.driver?.lastName ?? ""}`.trim()
              : "Non assigné";

            return (
              <div key={p.orderId} className="rounded-xl border bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-[#FF6B00]" />
                    <span className="font-mono text-sm font-semibold text-[#0D1B2A]">
                      {p.orderCode}
                    </span>
                  </div>
                  <StatusBadge
                    status={p.status as any}
                    type="order"
                    size="sm"
                  />
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="mb-1 font-medium text-slate-700">
                      Seller point
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.sellerLocation?.address || "—"}
                    </p>
                    {mapLink(p.sellerLocation) && (
                      <a
                        href={mapLink(p.sellerLocation)!}
                        target="_blank"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#FF6B00]"
                        rel="noreferrer">
                        <MapPin className="h-3.5 w-3.5" /> Ouvrir map
                      </a>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="mb-1 font-medium text-slate-700">
                      Driver point
                    </p>
                    <p className="text-xs text-slate-500">{driverLabel}</p>
                    {mapLink(p.driverLocation) ? (
                      <a
                        href={mapLink(p.driverLocation)!}
                        target="_blank"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#FF6B00]"
                        rel="noreferrer">
                        <Navigation className="h-3.5 w-3.5" /> Position live
                      </a>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">
                        Pas de position live
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="mb-1 font-medium text-slate-700">
                      Client point
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.clientLocation?.address || "—"}
                    </p>
                    {mapLink(p.clientLocation) && (
                      <a
                        href={mapLink(p.clientLocation)!}
                        target="_blank"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#FF6B00]"
                        rel="noreferrer">
                        <MapPin className="h-3.5 w-3.5" /> Ouvrir map
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
