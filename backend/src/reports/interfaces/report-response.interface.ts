export interface DailySummary {
  date: string;
  totalBills: number;
  billsAmount: number;
  totalPayments: number;
  paymentsAmount: number;
  totalExpenses: number;
  stockPurchasesAmount?: number;
  netRevenue: number;
}

export interface MonthlySummary {
  month: string;
  totalBills: number;
  billsAmount: number;
  totalPayments: number;
  paymentsAmount: number;
  totalExpenses: number;
  totalStockPurchases?: number;
  netRevenue: number;
}

export interface OutstandingBalance {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  totalBills: number;
  totalPayments: number;
  balance: number;
}

export interface PaymentMethodDistribution {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface RevenueReport {
  period: string;
  totalBills: number;
  billsAmount: number;
  totalPayments: number;
  paymentsAmount: number;
  outstandingAmount: number;
  collectionRate: number;
}

export interface DashboardStats {
  customers: {
    total: number;
    approved: number;
    pending: number;
  };
  bills: {
    total: number;
    amount: number;
  };
  payments: {
    total: number;
    amount: number;
  };
  revenue: {
    outstanding: number;
    collected: number;
    collectionRate: number;
    totalStockPurchases?: number;
  };
}
