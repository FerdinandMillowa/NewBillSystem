import type { Customer } from "./customer.types";

export type PaymentMethod = 'cash' | 'mobile_money' | 'bank' | 'card' | 'mpamba' | 'airtel_money';

export type PaymentStatus = 'pending' | 'verified';

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  paymentDate: string | null;
  referenceNumber: string | null;
  paymentStatus: PaymentStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
  customer?: Customer;
}

export interface CreatePaymentRequest {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  paymentDate?: string;
  referenceNumber?: string;
}