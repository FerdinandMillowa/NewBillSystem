export interface Product {
  id: string;
  categoryId: string;
  name: string;
  unit: string | null;
  size: string | null;
  currentPrice: number;
  currentStock: number;
  shotsPerBottle: number | null;
  linkedShotProductId: string | null;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
    displayOrder: number;
  };
}

export interface DailyInventoryItem {
  productId: string;
  openingStock: number;
  stockIn: number;
  closingStock: number;
  convertedOut?: number;
  convertedIn?: number;
  soldQuantity?: number;
  productName?: string;
  unit?: string;
  categoryId?: string;
  revenue?: number;
  productPrice?: number;
}

export interface DailyExpenseItem {
  category: string; // utilities, supplies, wages, transport, maintenance, other
  description: string;
  amount: number;
  paymentMethod?: string; // defaults to 'cash'
}

export interface StockPurchaseItem {
  productId: string;
  quantity: number;
  unitCost: number;
  paymentMethod: string;
  supplierId?: string;
  notes?: string;
}

export interface CreateDailySalesDto {
  date: string;
  cash?: number;
  airtelMoney?: number;
  mpamba?: number;
  bank?: number;
  billsAmount?: number;
  inventories: DailyInventoryItem[];
  expenses?: DailyExpenseItem[];
  stockPurchases?: StockPurchaseItem[];
  notes?: string;
}

export interface UpdateDailySalesDto {
  cash?: number;
  airtelMoney?: number;
  mpamba?: number;
  bank?: number;
  billsAmount?: number;
  inventories?: DailyInventoryItem[];
  expenses?: DailyExpenseItem[];
  stockPurchases?: StockPurchaseItem[];
  notes?: string;
}

export interface DailyInventory {
  id: string;
  dailySalesId: string;
  productId: string;
  openingStock: number;
  stockIn: number;
  closingStock: number;
  soldQuantity: number;
  productPrice: number;
  revenue: number;
  product: Product;
}

export interface DailyExpense {
  id: string;
  dailySalesId: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

export interface StockPurchase {
  id: string;
  dailySalesId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  paymentMethod: string;
  supplierId?: string | null;
  notes: string | null;
  product: Product;
  createdAt: string;
}

export interface InventoryTransfer {
  id: string;
  dailySalesId: string;
  fromProductId: string;
  toProductId: string;
  quantity: number;
  conversionRate: number;
  resultingQuantity: number;
  userId: string;
  notes: string | null;
  createdAt: string;
  fromProduct: Product;
  toProduct: Product;
}

export interface DailySales {
  id: string;
  date: string;
  cash: number;
  airtelMoney: number;
  mpamba: number;
  bank: number;
  totalCollected: number;
  totalSales: number;
  billsAmount: number;
  shortage: number;
  totalExpenses: number;
  cashExpenses: number;
  netRevenue: number;
  cashAtHand: number;
  totalStockPurchases: number;
  notes: string | null;
  status: 'draft' | 'finalized';
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
  inventories: DailyInventory[];
  expenses: DailyExpense[];
  stockPurchases: StockPurchase[];
  inventoryTransfers: InventoryTransfer[];
}

export interface CreateInventoryTransferDto {
  fromProductId: string;
  toProductId: string;
  quantity: number;
  notes?: string;
}

export interface DailySalesSummary {
  date: string;
  totalSales: number;
  totalCollected: number;
  totalExpenses: number;
  netRevenue: number;
  shortage: number;
  status: 'draft' | 'finalized';
}

export interface WeeklySummary {
  period: string;
  days: number;
  totalSales: number;
  totalCollected: number;
  totalExpenses: number;
  netRevenue: number;
  averageDailySales: number;
  dailyBreakdown: DailySales[];
}

export interface MonthlySummary {
  period: string;
  days: number;
  totalSales: number;
  totalCollected: number;
  totalExpenses: number;
  netRevenue: number;
  averageDailySales: number;
  dailyBreakdown: DailySales[];
}