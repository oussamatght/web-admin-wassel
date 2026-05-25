'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDA, getCategoryLabel, timeAgo } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Power,
  User,
  MapPin,
  ListFilter,
  Save,
  RotateCcw,
} from 'lucide-react';
import type { Product } from '@/types';

function normalizeVinInput(vin: string): string {
  return String(vin ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/[IOQ]/g, '');
}

function parseVinList(value: string): string[] {
  const items = value
    .split(/[\n,;]+/g)
    .map((item) => normalizeVinInput(item))
    .filter((item) => item.length >= 7);

  return Array.from(new Set(items));
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [vinText, setVinText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-product-detail', id],
    queryFn: () => apiGet<{ product: Product }>(`/products/${id}`),
    enabled: !!id,
  });

  const product = data?.product;

  useEffect(() => {
    if (!product) return;
    const vins = product.compatibilityVins?.length
      ? product.compatibilityVins
      : product.compatibleVINs || [];
    setVinText(vins.join('\n'));
  }, [product]);

  const parsedVins = useMemo(() => parseVinList(vinText), [vinText]);
  const originalVins = product?.compatibilityVins?.length
    ? product.compatibilityVins
    : product?.compatibleVINs || [];
  const invalidCount = Math.max(
    0,
    vinText.split(/[\n,;]+/g).filter(Boolean).length - parsedVins.length
  );
  const duplicateCount = Math.max(
    0,
    originalVins.length - new Set(originalVins.map(normalizeVinInput)).size
  );

  const approveMutation = useMutation({
    mutationFn: (isApproved: boolean) => apiPatch(`/admin/products/${id}/approve`, { isApproved }),
    onSuccess: () => {
      toast.success('Statut d’approbation mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-detail', id] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const toggleMutation = useMutation({
    mutationFn: () => apiPatch(`/admin/products/${id}/toggle-status`),
    onSuccess: () => {
      toast.success('Statut actif mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-detail', id] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const compatibilityMutation = useMutation({
    mutationFn: (compatibilityVins: string[]) =>
      apiPatch(`/admin/products/${id}/compatibility`, { compatibilityVins }),
    onSuccess: () => {
      toast.success('Compatibilité VIN mise à jour');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-detail', id] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour de la compatibilité VIN'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Produit introuvable</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/dashboard/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour produits
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/products')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Produits
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B2A]">{product.title}</h1>
          <p className="mt-1 text-sm text-slate-500">Ajouté {timeAgo(product.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getCategoryLabel(product.category)}
          </Badge>
          <Badge
            variant="outline"
            className={
              product.condition === 'neuf'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }
          >
            {product.condition === 'neuf' ? 'Neuf' : 'Occasion'}
          </Badge>
          <Badge
            variant="outline"
            className={
              product.isActive
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }
          >
            {product.isActive ? 'Actif' : 'Inactif'}
          </Badge>
          <Badge
            variant="outline"
            className={
              product.isApproved
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }
          >
            {product.isApproved ? 'Approuvé' : 'Non approuvé'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Galerie produit</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images?.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {product.images.map((img, i) => (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-lg border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={product.title} className="h-36 w-full object-cover" />
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description & compatibilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                {product.description || 'Aucune description'}
              </p>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Types de véhicules</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {product.vehicleTypes?.length ? product.vehicleTypes.join(', ') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Référence fabricant</p>
                  <p className="mt-1 text-sm text-slate-700">{product.manufacturerRef || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Codes moteur</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {product.engineCodes?.length ? product.engineCodes.join(', ') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">VIN compatibles</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {product.compatibleVINs?.length ? product.compatibleVINs.join(', ') : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListFilter className="h-4 w-4" /> VIN compatibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Liste éditable</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700"
                    onClick={() => setVinText(originalVins.join('\n'))}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
                  </button>
                </div>
                <Textarea
                  value={vinText}
                  onChange={(e) => setVinText(e.target.value)}
                  placeholder={'VF73A9HZC12345678\nVF73A9HZC\nPK12345'}
                  className="min-h-32 font-mono text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {parsedVins.length} VIN valides
                </Badge>
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  {invalidCount} ignorés
                </Badge>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  {duplicateCount} doublons existants
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {parsedVins.slice(0, 8).map((vin) => (
                  <Badge key={vin} variant="secondary" className="font-mono text-[11px]">
                    {vin}
                  </Badge>
                ))}
                {parsedVins.length > 8 && (
                  <Badge variant="secondary" className="text-[11px]">
                    +{parsedVins.length - 8} autres
                  </Badge>
                )}
              </div>

              <Button
                className="w-full"
                disabled={compatibilityMutation.isPending}
                onClick={() => compatibilityMutation.mutate(parsedVins)}
              >
                <Save className="mr-2 h-4 w-4" /> Enregistrer la compatibilité VIN
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations clés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Prix</span>
                <span className="font-semibold text-[#FF6B00]">{formatDA(product.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stock</span>
                <span className="font-semibold text-[#0D1B2A]">{product.stock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Wilaya</span>
                <span className="font-medium">{product.wilaya}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vendeur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                {product.seller?.firstName} {product.seller?.lastName}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-slate-400" />
                {product.seller?.wilaya || '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {product.isApproved ? (
                <Button
                  variant="outline"
                  className="w-full justify-start border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => approveMutation.mutate(false)}
                  disabled={approveMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Rejeter le produit
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => approveMutation.mutate(true)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approuver le produit
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                {product.isActive ? 'Désactiver' : 'Activer'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
