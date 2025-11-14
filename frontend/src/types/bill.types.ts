import type { Customer } from "./customer.types";

export interface Bill {
    id: string;
    customerId: string;
    amount: number;
    description: string;
    createdAt: string;
    updatedAt: string;
    customer?: Customer;
  }
  
  export interface CreateBillRequest {
    customerId: string;
    amount: number;
    description: string;
  }