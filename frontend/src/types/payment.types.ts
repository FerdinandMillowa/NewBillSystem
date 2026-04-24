import type { Customer } from "./customer.types";

export type PaymentMethod = 'cash' | 'mobile_money' | 'bank' | 'card' | 'mpamba' | 'airtel_money';

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  paymentDate: string | null;
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