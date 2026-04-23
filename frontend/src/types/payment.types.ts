import type { Customer } from "./customer.types";

export type PaymentMethod = 'cash' | 'mobile_money' | 'bank' | 'card';

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  paymentDate: Date | string | null;
  createdAt: string;
  customer?: Customer;
}

export interface CreatePaymentRequest {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  paymentDate?: string;
}