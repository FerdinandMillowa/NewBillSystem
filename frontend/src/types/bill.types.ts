import type { Customer } from "./customer.types";

export interface Bill {
    id: string;
    customerId: string;
    amount: number;
    description: string;
    transactionDate: string;
    createdAt: string;
    updatedAt: string;
    customer?: Customer;
    dailySales?: any;
  }
  
  export interface CreateBillRequest {
    customerId: string;
    amount: number;
    description: string;
    dailySalesId?: string; 
    transactionDate?: string;
  }