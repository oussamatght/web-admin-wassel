"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import {
  getServiceCategoryLabel,
  getServiceCategoryColor,
  getSubscriptionStatusLabel,
  getSubscriptionStatusColor,
} from "@/lib/utils";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pagination } from "@/components/common/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Wrench, Eye, Search, Route } from "lucide-react";
import type { Service } from "@/types";

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
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-services", category, page, search],
    queryFn: () =>
      apiGet<ServicesResponse>("/services", {
        params: {
          category: category || undefined,
          search: search.trim() || undefined,
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
        <div>
          <p className="text-sm font-medium text-slate-900">
            {s.title || "Sans titre"}
          </p>
          <p className="text-xs text-slate-400">
            {s.provider
              ? `${s.provider.firstName} ${s.provider.lastName}`
              : "—"}
          </p>
        </div>
      ),
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
      key: "isActive",
      header: "Statut",
      cell: (s) => (
        <Badge
          variant="outline"
          className={
            s.isActive
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-gray-200 bg-gray-50 text-gray-600"
          }>
          {s.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (s) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/services/${s._id}`)}>
          <Eye className="mr-1 h-4 w-4" /> Détails
        </Button>
      ),
    },
  ];

  const services = data?.services ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
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

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            placeholder="Rechercher un service"
          />
        </div>
      </div>

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
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={services}
        isLoading={isLoading}
        emptyMessage="Aucun service trouvé"
        emptyIcon={Route}
        onRowClick={(s) => router.push(`/dashboard/services/${s._id}`)}
      />

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
