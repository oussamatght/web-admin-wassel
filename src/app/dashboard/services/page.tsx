"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import {
  formatDate,
  getServiceCategoryLabel,
  getServiceCategoryColor,
  getSubscriptionStatusLabel,
  getSubscriptionStatusColor,
} from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wrench,
  Eye,
  MapPin,
  Clock,
  Star,
  User,
  CalendarDays,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types";

const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "mecanicien", label: "Mécanicien" },
  { value: "tolier", label: "Tôlier" },
  { value: "scanner_auto", label: "Scanner auto" },
  { value: "lavage", label: "Lavage" },
];

interface ServicesResponse {
  services: Service[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function ServicesPage() {
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Service | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-services", category, page],
    queryFn: () =>
      apiGet<ServicesResponse>("/services", {
        params: {
          category: category || undefined,
          page,
          limit: 20,
        },
      }),
  });

  const columns: Column<Service>[] = [
    {
      key: "title",
      header: "Titre",
      cell: (s) => (
        <span className="font-medium text-slate-900">
          {s.title || "Sans titre"}
        </span>
      ),
    },
    {
      key: "provider",
      header: "Prestataire",
      cell: (s) =>
        s.provider ? `${s.provider.firstName} ${s.provider.lastName}` : "—",
    },
    {
      key: "category",
      header: "Catégorie",
      cell: (s) => (
        <Badge
          variant="outline"
          className={cn("border", getServiceCategoryColor(s.category))}>
          {getServiceCategoryLabel(s.category)}
        </Badge>
      ),
    },
    {
      key: "wilaya",
      header: "Wilaya",
      cell: (s) => s.wilaya,
    },
    {
      key: "subscription",
      header: "Abonnement",
      cell: (s) => (
        <Badge
          variant="outline"
          className={cn(
            "border",
            getSubscriptionStatusColor(s.subscription?.status ?? "expired"),
          )}>
          {getSubscriptionStatusLabel(s.subscription?.status ?? "expired")}
        </Badge>
      ),
    },
    {
      key: "rating",
      header: "Note",
      cell: (s) => (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm">
            {s.rating?.average?.toFixed(1) ?? "—"}
          </span>
          <span className="text-xs text-slate-400">
            ({s.rating?.count ?? 0})
          </span>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Statut",
      cell: (s) => (
        <Badge
          variant="outline"
          className={
            s.isActive
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }>
          {s.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (s) => (
        <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>
          <Eye className="mr-1 h-4 w-4" />
          Détails
        </Button>
      ),
    },
  ];

  const services = data?.services ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Wrench className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="text-sm text-slate-500">
            {pagination?.total ?? 0} services enregistrés
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setCategory(tab.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === tab.value
                ? "bg-[#FF6B00] text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable columns={columns} data={services} isLoading={isLoading} />

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

      {/* Detail Dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              {selected?.title || "Détails du service"}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              {/* Provider */}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                  {selected.provider?.firstName?.[0]}
                  {selected.provider?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {selected.provider?.firstName} {selected.provider?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">Prestataire</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Catégorie
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 border",
                      getServiceCategoryColor(selected.category),
                    )}>
                    {getServiceCategoryLabel(selected.category)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Abonnement
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 border",
                      getSubscriptionStatusColor(
                        selected.subscription?.status ?? "expired",
                      ),
                    )}>
                    {getSubscriptionStatusLabel(
                      selected.subscription?.status ?? "expired",
                    )}
                  </Badge>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Adresse
                    </p>
                    <p className="text-sm text-slate-700">
                      {selected.address}
                      {selected.commune && `, ${selected.commune}`}
                      {selected.wilaya && `, ${selected.wilaya}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Horaires
                    </p>
                    <p className="text-sm text-slate-700">
                      {selected.workingHours?.start} -{" "}
                      {selected.workingHours?.end}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Jours</p>
                    <p className="text-sm text-slate-700">
                      {selected.workingDays?.join(", ") ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="mt-0.5 h-4 w-4 text-yellow-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Note</p>
                    <p className="text-sm text-slate-700">
                      {selected.rating?.average?.toFixed(1) ?? "—"} (
                      {selected.rating?.count ?? 0} avis)
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Description
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selected.description}
                  </p>
                </div>
              )}

              {/* Subscription dates */}
              {selected.subscription?.startDate && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Période d&apos;abonnement
                  </p>
                  <p className="text-sm text-slate-700">
                    {formatDate(selected.subscription.startDate)}
                    {selected.subscription.endDate &&
                      ` → ${formatDate(selected.subscription.endDate)}`}
                  </p>
                </div>
              )}

              {/* Images */}
              {selected.images && selected.images.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Photos ({selected.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.images.map((img, i) => (
                      <a
                        key={i}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="overflow-hidden rounded-lg border">
                        <img
                          src={img.url}
                          alt={`Service ${i + 1}`}
                          className="h-24 w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
