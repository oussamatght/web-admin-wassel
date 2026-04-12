"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import {
  formatDate,
  getServiceCategoryLabel,
  getServiceCategoryColor,
  getSubscriptionStatusLabel,
  getSubscriptionStatusColor,
  cn,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  MapPin,
  Clock,
  CalendarDays,
  Star,
  ExternalLink,
} from "lucide-react";
import type { Service } from "@/types";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-service-detail", id],
    queryFn: () => apiGet<{ service: Service }>(`/services/${id}`),
    enabled: !!id,
  });

  const service = data?.service;

  const mapsHref =
    service?.location?.lat != null && service?.location?.lng != null
      ? `https://www.google.com/maps?q=${service.location.lat},${service.location.lng}`
      : service?.address
        ? `https://www.google.com/maps?q=${encodeURIComponent(service.address)}`
        : null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Service introuvable</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => router.push("/dashboard/services")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour services
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/services")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Services
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">
            {service.title || "Service"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Publié le {formatDate(service.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("border", getServiceCategoryColor(service.category))}>
            {getServiceCategoryLabel(service.category)}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "border",
              getSubscriptionStatusColor(
                service.subscription?.status ?? "expired",
              ),
            )}>
            {getSubscriptionStatusLabel(
              service.subscription?.status ?? "expired",
            )}
          </Badge>
          <Badge
            variant="outline"
            className={
              service.isActive
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-gray-200 bg-gray-50 text-gray-600"
            }>
            {service.isActive ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                {service.description || "Aucune description"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Galerie</CardTitle>
            </CardHeader>
            <CardContent>
              {service.images?.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {service.images.map((img, i) => (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={service.title || "service"}
                        className="h-36 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-400">
                  Aucune image
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Prestataire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                {service.provider
                  ? `${service.provider.firstName} ${service.provider.lastName}`
                  : "—"}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-slate-400" />
                {[service.address, service.commune, service.wilaya]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </div>
              {mapsHref && (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#FF6B00] hover:underline">
                  Ouvrir sur Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Disponibilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" />
                {service.workingHours?.start} - {service.workingHours?.end}
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{service.workingDays?.join(", ") || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Star className="h-4 w-4 text-amber-400" />
                {(service.rating?.average ?? 0).toFixed(1)} (
                {service.rating?.count ?? 0} avis)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Abonnement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>
                Début:{" "}
                {service.subscription?.startDate
                  ? formatDate(service.subscription.startDate)
                  : "—"}
              </p>
              <p>
                Fin:{" "}
                {service.subscription?.endDate
                  ? formatDate(service.subscription.endDate)
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
