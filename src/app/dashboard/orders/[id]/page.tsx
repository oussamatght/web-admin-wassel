"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import {
  formatDA,
  formatDate,
  formatDateTime,
  getOrderStatusLabel,
  getOrderStatusColor,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusColor,
} from "@/lib/utils";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Check,
  Clock,
  Package,
  Truck,
  MapPin,
  User,
  Store,
  CreditCard,
  DollarSign,
  QrCode,
  FileText,
  ShoppingBag,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types";

const TIMELINE_STEPS: {
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { status: "pending", label: "En attente", icon: Clock },
  { status: "confirmed", label: "Confirmée", icon: Check },
  { status: "preparing", label: "En préparation", icon: Package },
  { status: "ready_for_pickup", label: "Prête à enlever", icon: QrCode },
  { status: "in_delivery", label: "En livraison", icon: Truck },
  { status: "delivered", label: "Livrée", icon: Check },
];

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "in_delivery",
  "delivered",
];

function getStepIndex(status: OrderStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => apiGet<{ order: Order }>("/orders/" + id),
    enabled: !!id,
  });

  const order = data?.order;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Commande introuvable</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const isReturned = order.status === "returned";
  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/orders")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Commandes
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A] font-mono">
            #{order.orderNumber}
          </h1>
          <p className="text-sm text-slate-500">
            Créée {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} type="order" size="md" />
      </div>

      {/* Cancelled / Returned banner */}
      {(isCancelled || isReturned) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-red-700">
              {isCancelled ? "Commande annulée" : "Commande retournée"}
              {order.cancelReason && " — Raison : " + order.cancelReason}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          {!isCancelled && !isReturned && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Suivi de la commande
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.status}
                        className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          {idx > 0 && (
                            <div
                              className={`h-0.5 flex-1 ${
                                idx <= currentStepIdx
                                  ? "bg-[#FF6B00]"
                                  : "bg-slate-200"
                              }`}
                            />
                          )}
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                              isCurrent
                                ? "border-[#FF6B00] bg-[#FF6B00] text-white scale-110"
                                : isCompleted
                                  ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                                  : "border-slate-200 bg-white text-slate-400"
                            }`}>
                            <step.icon className="h-4 w-4" />
                          </div>
                          {idx < TIMELINE_STEPS.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 ${
                                idx < currentStepIdx
                                  ? "bg-[#FF6B00]"
                                  : "bg-slate-200"
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`mt-2 text-xs text-center ${
                            isCompleted
                              ? "text-[#FF6B00] font-medium"
                              : "text-slate-400"
                          }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code */}
          {order.status === "ready_for_pickup" && order.qrCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4" /> Code QR de retrait
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <img
                  src={order.qrCode}
                  alt="QR Code"
                  className="h-48 w-48 rounded-lg border border-slate-200 p-2"
                />
              </CardContent>
            </Card>
          )}

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Articles (
                {order.items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                      <th className="pb-2 pr-4">Produit</th>
                      <th className="pb-2 pr-4 text-center">Qté</th>
                      <th className="pb-2 pr-4 text-right">P.U.</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {order.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            {item.product?.images?.[0]?.url ? (
                              <img
                                src={item.product.images[0].url}
                                alt=""
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100">
                                <Package className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                            <span className="font-medium text-[#0D1B2A]">
                              {item.product?.title ?? "Produit supprimé"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-center text-slate-600">
                          {item.quantity}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-600">
                          {formatDA(item.unitPrice)}
                        </td>
                        <td className="py-3 text-right font-medium text-[#0D1B2A]">
                          {formatDA(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" /> Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.client?.firstName ? (
                <p className="font-medium text-[#0D1B2A]">
                  {order.client.firstName} {order.client.lastName}
                </p>
              ) : null}
              {order.client?.wilaya && (
                <p className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {order.client.wilaya}
                </p>
              )}
              {order.deliveryAddress && (
                <p className="text-slate-500">
                  {order.deliveryAddress.address},{" "}
                  {order.deliveryAddress.wilaya}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Seller */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4 text-orange-500" /> Vendeur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.seller?.firstName ? (
                <p className="font-medium text-[#0D1B2A]">
                  {order.seller.firstName} {order.seller.lastName}
                </p>
              ) : null}
              {order.seller?.wilaya && (
                <p className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> {order.seller.wilaya}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Driver */}
          {order.driver && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4 text-teal-500" /> Livreur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-[#0D1B2A]">
                  {order.driver.firstName} {order.driver.lastName}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-500" /> Paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Méthode</span>
                <Badge variant="outline">
                  {getPaymentMethodLabel(order.paymentMethod)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Statut</span>
                <StatusBadge
                  status={order.paymentStatus}
                  type="payment"
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#FF6B00]" /> Détails
                financiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <FinRow label="Sous-total" value={formatDA(order.subtotal)} />
              <FinRow label="Livraison" value={formatDA(order.deliveryCost)} />
              {order.discount > 0 && (
                <FinRow
                  label="Réduction"
                  value={"- " + formatDA(order.discount)}
                  discount
                />
              )}
              <FinRow
                label="Commission plateforme"
                value={formatDA(order.platformCommission)}
              />
              <Separator />
              <div className="flex items-center justify-between font-bold text-[#0D1B2A]">
                <span>Total</span>
                <span className="text-[#FF6B00]">
                  {formatDA(order.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FinRow({
  label,
  value,
  discount,
}: {
  label: string;
  value: string;
  discount?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={discount ? "text-green-600 font-medium" : "text-[#0D1B2A]"}>
        {value}
      </span>
    </div>
  );
}
