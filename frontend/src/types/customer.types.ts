export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string | null;
    status: 'pending' | 'approved';
    createdAt: string;
    updatedAt: string;
    balance?: number;
  }
  
  export interface CreateCustomerRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
  }
  