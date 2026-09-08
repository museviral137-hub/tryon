export type LegalTab = 
  | 'terms' 
  | 'privacy' 
  | 'refund-policy' 
  | 'ai-disclaimer' 
  | 'photo-consent' 
  | 'cookie-policy' 
  | 'data-deletion' 
  | 'contact-support';

export type PaymentTab =
  | 'upgrade'
  | 'credit-history'
  | 'payment-success'
  | 'payment-failed'
  | 'payment-pending';

export type NavTab = 
  | 'dashboard' 
  | 'trial-room' 
  | 'garments' 
  | 'customers' 
  | 'history' 
  | 'settings'
  | PaymentTab
  | LegalTab;

export type GarmentCategory = 
  | 'Sarees' 
  | 'Dresses' 
  | 'Shirts' 
  | 'Kurtas' 
  | 'Trousers' 
  | 'Lehengas' 
  | 'Suits' 
  | 'Ethnic Wear' 
  | 'Other';

export type StockStatus = 'Available' | 'Low Stock' | 'Out of Stock';

export interface Garment {
  id: string;
  shopId?: string;
  productId: string; // SKU e.g. "J001", "S102"
  name: string;
  category: GarmentCategory;
  price: number;
  imageUrl: string;
  brand?: string;
  size?: string;
  color?: string;
  stockStatus: StockStatus;
  notes?: string;
  createdAt: string;
  tryOnCount: number;
}

export interface Customer {
  id: string;
  shopId?: string;
  customerId: string; // e.g. "C001", "C002"
  name: string;
  phone: string;
  imageUrl: string;
  gender?: 'Female' | 'Male' | 'Unisex';
  notes?: string;
  consentAgreed?: boolean;
  createdAt: string;
  tryOnCount: number;
}

export type TryOnStatus = 'Completed' | 'Processing' | 'Failed';

export interface TryOnResult {
  id: string;
  shopId?: string;
  customerId: string;
  customerName: string;
  customerPhoto: string;
  customerPhone?: string;
  garmentId: string;
  garmentProductId: string;
  garmentName: string;
  garmentPhoto: string;
  garmentPrice: number;
  garmentCategory: GarmentCategory;
  resultImageUrl?: string;
  status: TryOnStatus;
  createdAt: string;
  notes?: string;
  sessionId?: string;
  errorMessage?: string;
  progressPhase?: string;
}

export interface TryOnSession {
  id: string;
  customer: Customer;
  results: TryOnResult[];
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'staff' | 'admin';
  shopId: string;
}

export interface AIUsage {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  tryOnsToday: number;
  lastResetDate: string;
}

export interface ShopSettings {
  id?: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  productPrefix: string;
  customerPrefix: string;
  productStartNum: number;
  customerStartNum: number;
  currencySymbol: string;
  currencyCode?: string;
  watermarkEnabled: boolean;
  autoSaveHistory: boolean;
  theme: 'light' | 'dark';
  isOnboarded?: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'paid' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export interface PaymentPackage {
  id: 'starter' | 'popular' | 'pro' | 'business';
  name: string;
  credits: number;
  price: number;
  currency: string;
  pricePerCredit: number;
  popular?: boolean;
  tagline: string;
  features: string[];
}

export interface PaymentOrder {
  id: string;
  userId?: string;
  shopId?: string;
  packageId: string;
  credits: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: 'razorpay' | 'manual' | 'gateway';
  providerOrderId?: string;
  providerPaymentId?: string;
  providerSignature?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  notes?: Record<string, any>;
}

export type CreditTransactionType = 'deduction' | 'refund' | 'top_up' | 'grant';

export interface CreditTransaction {
  id: string;
  shopId: string;
  tryOnResultId?: string;
  amount: number; // e.g. -1, +150, +1
  type: CreditTransactionType;
  description: string;
  createdAt: string;
  pricePaid?: number;
  currency?: string;
  paymentOrderId?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  order?: PaymentOrder;
  creditsAdded?: number;
  remainingCredits?: number;
  totalCredits?: number;
  alreadyFulfilled?: boolean;
  error?: string;
  message?: string;
}

