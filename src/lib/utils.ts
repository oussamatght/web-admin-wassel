import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDA(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 0 }).format(amount) + ' DA'
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'dd MMM yyyy', { locale: fr })
}

export function formatDateTime(dateString: string): string {
  return format(new Date(dateString), "dd MMM yyyy 'à' HH:mm", { locale: fr })
}

export function timeAgo(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr })
}

export function maskPhone(phone: string): string {
  return phone.slice(0, 4) + '****' + phone.slice(-2)
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`
}

export function getInitials(firstName: string, lastName: string): string {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase()
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    client: 'Client',
    seller: 'Vendeur',
    driver: 'Livreur',
    prestataire: 'Prestataire',
    admin: 'Administrateur',
  }
  return labels[role] ?? role
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    client: 'bg-blue-100 text-blue-700',
    seller: 'bg-orange-100 text-orange-700',
    driver: 'bg-teal-100 text-teal-700',
    prestataire: 'bg-purple-100 text-purple-700',
    admin: 'bg-red-100 text-red-700',
  }
  return colors[role] ?? 'bg-gray-100 text-gray-700'
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    ready_for_pickup: 'Prête à enlever',
    in_delivery: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    returned: 'Retournée',
  }
  return labels[status] ?? status
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    preparing: 'bg-purple-100 text-purple-700 border-purple-200',
    ready_for_pickup: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    in_delivery: 'bg-orange-100 text-orange-700 border-orange-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    returned: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getAccountStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    suspended: 'Suspendu',
    banned: 'Banni',
    pending_verification: 'En attente vérif.',
  }
  return labels[status] ?? status
}

export function getAccountStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-orange-100 text-orange-700',
    banned: 'bg-red-100 text-red-700',
    pending_verification: 'bg-yellow-100 text-yellow-700',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700'
}

export function getDisputeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: 'Ouvert',
    under_review: 'En révision',
    resolved_refund: 'Remboursé',
    resolved_no_refund: 'Non remboursé',
    escalated: 'Escaladé',
    closed: 'Fermé',
  }
  return labels[status] ?? status
}

export function getDisputeStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: 'bg-red-100 text-red-700 border-red-200',
    under_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    resolved_refund: 'bg-green-100 text-green-700 border-green-200',
    resolved_no_refund: 'bg-blue-100 text-blue-700 border-blue-200',
    escalated: 'bg-orange-100 text-orange-700 border-orange-200',
    closed: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getDisputeReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    defective: 'Défectueux',
    incompatible: 'Incompatible',
    wrong_item: 'Mauvais article',
    not_as_described: 'Non conforme',
    not_received: 'Non reçu',
    other: 'Autre',
  }
  return labels[reason] ?? reason
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    moteur: 'Moteur',
    mecatronique: 'Mécatronique',
    electronique: 'Électronique',
    freinage: 'Freinage',
    suspension: 'Suspension',
    transmission: 'Transmission',
    pneumatique: 'Pneumatique',
    electrique: 'Électrique',
    carrosserie: 'Carrosserie',
    interieur: 'Intérieur',
    echappement: 'Échappement',
    refroidissement: 'Refroidissement',
    filtres: 'Filtres',
    accessoires: 'Accessoires',
    autre: 'Autre',
  }
  return labels[category] ?? category
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash_on_delivery: 'Paiement à la livraison',
    online: 'En ligne',
  }
  return labels[method] ?? method
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payé',
    failed: 'Échoué',
  }
  return labels[status] ?? status
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    paid: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getServiceCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    mecanicien: 'Mécanicien',
    tolier: 'Tôlier',
    scanner_auto: 'Scanner auto',
    lavage: 'Lavage',
  }
  return labels[category] ?? category
}

export function getServiceCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    mecanicien: 'bg-blue-100 text-blue-700',
    tolier: 'bg-orange-100 text-orange-700',
    scanner_auto: 'bg-purple-100 text-purple-700',
    lavage: 'bg-cyan-100 text-cyan-700',
  }
  return colors[category] ?? 'bg-gray-100 text-gray-700'
}

export function getSubscriptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    expired: 'Expiré',
    cancelled: 'Annulé',
  }
  return labels[status] ?? status
}

export function getSubscriptionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-700'
}

// ─── Additional helpers ─────────────────────────────────────

/**
 * Format an Algerian phone number: 0555 12 34 56
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
  }
  return phone
}

/**
 * Truncate a string to a given length, appending "…" if needed.
 */
export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Build a query-string from a params object, omitting undefined/null/'' values.
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value))
    }
  })
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}
