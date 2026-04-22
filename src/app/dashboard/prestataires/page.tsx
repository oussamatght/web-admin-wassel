"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import {
  Bell,
  Check,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  ReceiptText,
  X,
} from "lucide-react";
import type { User } from "@/types";

type UsersResponse = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

type PrestataireStats = {
  activeCount: number;
  expiredCount: number;
};

type RejectPayload = {
  prestataireId: string;
  reason: string;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: unknown }).response !== null
  ) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
}

function isUrl(value?: string | null): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value.trim());
}

export default function PrestatairesPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["admin-prestataires-pending"],
    queryFn: () =>
      apiGet<UsersResponse>("/admin/users", {
        params: {
          role: "prestataire",
          accountStatus: "pending_subscription",
          page: 1,
          limit: 100,
        },
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-prestataires-stats"],
    queryFn: async () => {
      const [activeRes, expiredRes] = await Promise.all([
        apiGet<UsersResponse>("/admin/users", {
          params: {
            role: "prestataire",
            accountStatus: "active",
            page: 1,
            limit: 1,
          },
        }),
        apiGet<UsersResponse>("/admin/users", {
          params: {
            role: "prestataire",
            accountStatus: "subscription_expired",
            page: 1,
            limit: 1,
          },
        }),
      ]);

      return {
        activeCount: activeRes?.pagination?.total ?? 0,
        expiredCount: expiredRes?.pagination?.total ?? 0,
      } satisfies PrestataireStats;
    },
  });

  const pendingSubscriptions = useMemo(() => data?.users ?? [], [data]);
  const pendingCount = data?.pagination?.total ?? pendingSubscriptions.length;
  const activeCount = stats?.activeCount ?? 0;
  const expiredCount = stats?.expiredCount ?? 0;

  const confirmMutation = useMutation({
    mutationFn: (prestataireId: string) =>
      apiPatch("/prestataires/subscription/confirm", { prestataireId }),
    onSuccess: () => {
      toast.success(
        "Abonnement confirmé! Le prestataire est maintenant actif.",
      );
      qc.invalidateQueries({ queryKey: ["admin-prestataires-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-prestataires-stats"] });
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Erreur confirmation")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ prestataireId, reason }: RejectPayload) =>
      apiPatch(`/admin/users/${prestataireId}/status`, {
        accountStatus: "suspended",
        reason,
      }),
    onSuccess: () => {
      toast.success("Abonnement rejeté.");
      qc.invalidateQueries({ queryKey: ["admin-prestataires-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-prestataires-stats"] });
    },
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Erreur rejet")),
  });

  const confirmingId = confirmMutation.isPending
    ? (confirmMutation.variables as string | undefined)
    : undefined;
  const rejectingId = rejectMutation.isPending
    ? rejectMutation.variables?.prestataireId
    : undefined;

  const handleReject = (prestataireId: string) => {
    const reason =
      typeof window !== "undefined"
        ? window.prompt("Raison du rejet", "Subscription rejected")
        : "Subscription rejected";

    if (reason === null) return;

    rejectMutation.mutate({
      prestataireId,
      reason: reason.trim() || "Subscription rejected",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Prestataires</h1>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          {isRefetching ? "Rafraîchissement..." : "Rafraîchir"}
        </button>
      </div>

      <p className="text-sm text-slate-500 mt-1">
        Gestion des abonnements prestataires
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            En attente
          </p>
          <p className="mt-2 text-2xl font-extrabold text-amber-800">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Actifs
          </p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-800">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
            Expirés
          </p>
          <p className="mt-2 text-2xl font-extrabold text-rose-800">
            {expiredCount}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Chargement des demandes...
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Impossible de charger les demandes d’abonnement. Veuillez réessayer.
        </div>
      ) : pendingSubscriptions.length > 0 ? (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            Abonnements en attente ({pendingSubscriptions.length})
          </h2>
          <div className="space-y-3">
            {pendingSubscriptions.map((p) => (
              <div
                key={p._id}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-bold">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {p.serviceType ?? "prestataire"} · {p.wilaya}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-amber-700 font-semibold break-all">
                    <CircleDollarSign className="h-4 w-4 shrink-0" />
                    <span>{p.subscriptionAmount ?? 800} DA</span>
                    <span>·</span>
                    <ReceiptText className="h-4 w-4 shrink-0" />
                    <span>{p.subscriptionPaymentProof || "aucun reçu"}</span>
                  </p>
                  {isUrl(p.subscriptionPaymentProof) ? (
                    <a
                      href={p.subscriptionPaymentProof!}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-blue-700 underline">
                      Voir le reçu
                    </a>
                  ) : null}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    onClick={() => confirmMutation.mutate(p._id)}
                    className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition"
                    disabled={
                      confirmMutation.isPending || rejectMutation.isPending
                    }>
                    {confirmingId === p._id ? (
                      <>
                        <Clock3 className="h-4 w-4 animate-pulse" />{" "}
                        Validation...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Confirmer
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(p._id)}
                    className="inline-flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl font-bold text-sm transition"
                    disabled={
                      confirmMutation.isPending || rejectMutation.isPending
                    }>
                    {rejectingId === p._id ? (
                      <>
                        <Clock3 className="h-4 w-4 animate-pulse" /> Rejet...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" /> Rejeter
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Aucune demande d’abonnement en attente.
        </div>
      )}
    </div>
  );
}
