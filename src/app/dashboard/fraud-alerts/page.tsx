"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ShieldAlert, AlertTriangle } from "lucide-react";

type FraudAlert = {
  kind: "order_risk" | "client_behavior";
  severity: "high" | "medium" | "low";
  reasons: string[];
  order?: {
    _id: string;
    orderCode?: string;
    orderNumber?: string;
    status?: string;
    totalAmount?: number;
  };
  client?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  cancelledCount?: number;
  cancelledAmount?: number;
};

type FraudResponse = {
  generatedAt: string;
  windowDays: number;
  alerts: FraudAlert[];
  summary: {
    total: number;
    high: number;
    medium: number;
  };
};

const reasonLabels: Record<string, string> = {
  high_value_order: "Commande de valeur élevée",
  multiple_driver_rejections: "Multiples rejets livreur",
  completed_without_proof_of_delivery: "Livraison complétée sans preuve",
  payment_financial_state_mismatch: "Incohérence paiement/finance",
  high_client_cancellation_rate: "Taux d'annulation client élevé",
};

function severityClass(severity: string): string {
  if (severity === "high") return "bg-red-50 text-red-700 border-red-200";
  if (severity === "medium")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function FraudAlertsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-fraud-alerts"],
    queryFn: () => apiGet<FraudResponse>("/admin/fraud-alerts"),
    refetchInterval: 30000,
  });

  const alerts = useMemo(() => data?.alerts ?? [], [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Fraud detection</h1>
        <p className="text-sm text-slate-500">
          Alertes automatiques basées sur des règles de risque (7 derniers
          jours).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Total alerts</p>
          <p className="text-2xl font-bold text-[#0D1B2A]">
            {data?.summary.total ?? 0}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-slate-400">High severity</p>
          <p className="text-2xl font-bold text-red-600">
            {data?.summary.high ?? 0}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Medium severity</p>
          <p className="text-2xl font-bold text-amber-600">
            {data?.summary.medium ?? 0}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
          Chargement des alertes...
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
          Aucune alerte détectée.
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert, idx) => (
            <div
              key={`${alert.kind}-${idx}`}
              className="rounded-xl border bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {alert.severity === "high" ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="font-semibold text-[#0D1B2A]">
                    {alert.kind === "order_risk"
                      ? "Order risk"
                      : "Client behavior risk"}
                  </span>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClass(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>

              <div className="mb-2 flex flex-wrap gap-2">
                {alert.reasons.map((r) => (
                  <span
                    key={r}
                    className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {reasonLabels[r] || r}
                  </span>
                ))}
              </div>

              {alert.order && (
                <p className="text-sm text-slate-600">
                  Commande:{" "}
                  <span className="font-mono">
                    {alert.order.orderCode || alert.order.orderNumber}
                  </span>
                  {typeof alert.order.totalAmount === "number" && (
                    <>
                      {" "}
                      · Montant:{" "}
                      <span className="font-semibold">
                        {alert.order.totalAmount} DZD
                      </span>
                    </>
                  )}
                </p>
              )}

              {alert.client && (
                <p className="text-sm text-slate-600">
                  Client:{" "}
                  <span className="font-semibold">
                    {`${alert.client.firstName ?? ""} ${alert.client.lastName ?? ""}`.trim()}
                  </span>
                  {typeof alert.cancelledCount === "number" && (
                    <>
                      {" "}
                      · Annulations:{" "}
                      <span className="font-semibold">
                        {alert.cancelledCount}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
