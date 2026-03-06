"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { formatDA, formatDate, formatDateTime } from "@/lib/utils";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { FinancialReport, Transaction } from "@/types";

interface Withdrawal {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    wallet?: number;
  };
  amount: number;
  status: string;
  createdAt: string;
}

interface WithdrawalData {
  withdrawals: Withdrawal[];
}

const MONTH_NAMES = [
  "",
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export default function FinancialsPage() {
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data: financials, isLoading } = useQuery({
    queryKey: ["admin-financials"],
    queryFn: () => apiGet<FinancialReport>("/admin/financials"),
  });

  const { data: withdrawalsData } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: () => apiGet<WithdrawalData>("/admin/withdrawals/pending"),
  });

  const approveMutation = useMutation({
    mutationFn: ({
      withdrawalId,
      amount,
    }: {
      withdrawalId: string;
      amount: number;
    }) => apiPost(`/admin/withdrawals/${withdrawalId}/approve`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-financials"] });
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      setApprovingId(null);
    },
  });

  const chartData = (financials?.revenueByMonth ?? []).map((m) => ({
    name: `${MONTH_NAMES[m._id.month]} ${m._id.year}`,
    revenue: m.revenue,
    orders: m.count,
  }));

  const withdrawals = withdrawalsData?.withdrawals ?? [];
  const pendingWithdrawals = withdrawals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finances</h1>
          <p className="text-sm text-slate-500">
            Vue d&apos;ensemble financière de la plateforme
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Crédits"
          value={formatDA(financials?.totalCredits ?? 0)}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatsCard
          title="Total Débits"
          value={formatDA(financials?.totalDebits ?? 0)}
          icon={TrendingDown}
          iconColor="text-red-600"
          iconBg="bg-red-100"
        />
        <StatsCard
          title="Balance Nette"
          value={formatDA(financials?.netBalance ?? 0)}
          icon={Wallet}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatsCard
          title="Retraits en attente"
          value={String(pendingWithdrawals.length)}
          icon={ArrowUpRight}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenus par mois</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(value) => formatDA(value as number)}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenus"
                  fill="#FF6B00"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Withdrawals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-orange-500" />
              Retraits en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingWithdrawals.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun retrait en attente</p>
            ) : (
              <div className="space-y-3">
                {pendingWithdrawals.map((w) => (
                  <div
                    key={w._id}
                    className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {w.user?.firstName} {w.user?.lastName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDA(w.amount)} • {formatDate(w.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={
                        approveMutation.isPending && approvingId === w._id
                      }
                      onClick={() => {
                        setApprovingId(w._id);
                        approveMutation.mutate({
                          withdrawalId: w._id,
                          amount: w.amount,
                        });
                      }}>
                      {approveMutation.isPending && approvingId === w._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approuver
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              Transactions récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(financials?.recentTransactions ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">Aucune transaction</p>
            ) : (
              <div className="max-h-100 space-y-2 overflow-y-auto">
                {(financials?.recentTransactions ?? [])
                  .slice(0, 20)
                  .map((t) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            t.type === "credit"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}>
                          {t.type === "credit" ? (
                            <ArrowDownRight className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {t.user?.firstName} {t.user?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t.reason ?? t.type} • {formatDate(t.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          t.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                        {t.type === "credit" ? "+" : "-"}
                        {formatDA(t.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
