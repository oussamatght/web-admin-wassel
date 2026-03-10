// ═══════════════════════════════════════════
// WASSLA Admin — Type Definitions
// ═══════════════════════════════════════════

export type Role = 'client' | 'seller' | 'driver' | 'prestataire' | 'admin'
export type AccountStatus = 'active' | 'suspended' | 'banned' | 'pending_verification'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'in_delivery' | 'delivered' | 'cancelled' | 'returned'
export type PaymentMethod = 'cash_on_delivery' | 'online'
export type PaymentStatus = 'pending' | 'paid' | 'failed'
export type DisputeReason = 'defective' | 'incompatible' | 'wrong_item' | 'not_as_described' | 'not_received' | 'other'
export type DisputeStatus = 'open' | 'under_review' | 'resolved_refund' | 'resolved_no_refund' | 'escalated' | 'closed'
export type ServiceCategory = 'mecanicien' | 'tolier' | 'scanner_auto' | 'lavage'
export type ProductCategory = 'moteur' | 'mecatronique' | 'electronique' | 'freinage' | 'suspension' | 'transmission' | 'pneumatique' | 'electrique' | 'carrosserie' | 'interieur' | 'echappement' | 'refroidissement' | 'filtres' | 'accessoires' | 'autre'
export type VehicleType = 'voitures' | 'camions' | 'motos' | 'tracteurs' | 'machines_agricoles' | 'navires'

export interface UserSummary {
  _id: string
  firstName: string
  lastName: string
  wilaya: string
  avatar?: { url: string; publicId: string }
  role: Role
}

export interface ProductSummary {
  _id: string
  title: string
  price: number
  images: { url: string; publicId: string }[]
  category: ProductCategory
}

export interface User {
  _id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  role: Role
  accountStatus: AccountStatus
  avatar?: { url: string; publicId: string }
  wilaya: string
  wallet: number
  rating: { average: number; count: number }
  shopName?: string
  baridiMobAccount?: string
  commerceRegister?: string
  isVerified: boolean
  fcmToken?: string
  documents?: { type: string; url: string; publicId: string }[]
  createdAt: string
}

export interface Product {
  _id: string
  title: string
  description: string
  category: ProductCategory
  condition: 'neuf' | 'occasion'
  price: number
  stock: number
  wilaya: string
  images: { url: string; publicId: string }[]
  vehicleTypes: VehicleType[]
  compatibleVINs: string[]
  engineCodes: string[]
  manufacturerRef?: string
  seller: UserSummary
  isActive: boolean
  isApproved?: boolean
  createdAt: string
}

export interface OrderItem {
  product: ProductSummary
  quantity: number
  unitPrice: number
  total: number
}

export interface Order {
  _id: string
  orderNumber: string
  client: UserSummary
  seller: UserSummary
  driver?: UserSummary
  items: OrderItem[]
  totalAmount: number
  subtotal: number
  deliveryCost: number
  platformCommission: number
  discount: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  deliveryAddress: { wilaya: string; address: string; lat: number; lng: number }
  qrCode?: string
  notes?: string
  cancelReason?: string
  createdAt: string
  updatedAt: string
}

export interface Dispute {
  _id: string
  order: Order | string
  client: UserSummary
  seller?: UserSummary
  reason: DisputeReason
  description: string
  status: DisputeStatus
  evidenceImages: { url: string; publicId: string }[]
  resolution?: string
  adminNote?: string
  resolvedAt?: string
  resolvedBy?: string
  createdAt: string
  updatedAt?: string
}

export interface Service {
  _id: string
  provider: UserSummary
  category: ServiceCategory
  title: string
  description: string
  wilaya: string
  commune?: string
  address: string
  location?: { lat: number; lng: number }
  images: { url: string; publicId: string }[]
  workingHours: { start: string; end: string }
  workingDays: string[]
  subscription: { status: 'active' | 'expired' | 'cancelled'; startDate?: string; endDate?: string }
  rating: { average: number; count: number }
  isActive: boolean
  createdAt: string
}

export interface Appointment {
  _id: string
  service: string
  client: UserSummary
  date: string
  time: string
  vehicleInfo: { brand: string; model: string; year: number; plateNumber?: string }
  notes?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
}

export interface Review {
  _id: string
  reviewer: UserSummary
  target: string
  targetType: 'seller' | 'driver' | 'product'
  rating: number
  comment: string
  createdAt: string
}

export interface PromoCode {
  _id: string
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  maxUses?: number
  usedCount: number
  usedBy?: { user: string; usedAt: string }[]
  expiresAt?: string
  isActive: boolean
  createdBy?: UserSummary
  createdAt: string
}

export interface Notification {
  _id: string
  user: string
  title: string
  message: string
  type: string
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

export interface PlatformSettings {
  _id: string
  key: string
  commissionType: 'percentage' | 'fixed'
  commissionValue: number
  deliveryCommissionPercent: number
  serviceSubscriptionFee: number
  deliverySplitClient: number
  deliverySplitSeller: number
  minWithdrawalAmount: number
  // Legacy
  sellerCommission: number
  driverCommissionPercent: number
  serviceProviderSubscription: number
  sellerLocalDeliverySharePercent: number
  updatedAt: string
  createdAt: string
}

export interface ChargilyPaymentStatus {
  isLive?: boolean
  mode: string
  currency?: string
  error?: string
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeUsers: number
  totalCommission: number
  ordersByStatus: Record<string, number>
  revenueByMonth: { month: string; revenue: number }[]
  topSellers: { seller: UserSummary; totalSales: number; orderCount: number }[]
  recentOrders: Order[]
  salesByWilaya?: { _id: string; totalRevenue: number; orderCount: number }[]
  bestSellingProducts?: { title: string; totalQty: number; totalRevenue: number }[]
}

export interface FinancialReport {
  totalCredits: number
  totalDebits: number
  netBalance: number
  revenueByMonth: { _id: { year: number; month: number }; revenue: number; count: number }[]
  recentTransactions: Transaction[]
}

export interface Transaction {
  _id: string
  user: UserSummary
  type: 'credit' | 'debit'
  amount: number
  balanceBefore: number
  balanceAfter: number
  reason?: string
  relatedOrder?: string
  relatedDispute?: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  status: string
  statusCode: number
}
