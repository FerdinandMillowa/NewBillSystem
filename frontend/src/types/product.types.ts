export interface ProductCategory {
    id: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    products?: Product[];
  }
  
  export interface Product {
    costPrice: number;
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
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    category?: ProductCategory;
    priceHistory?: PriceHistory[];
  }
  
  export interface PriceHistory {
    id: string;
    productId: string;
    userId: string;
    oldPrice: number;
    newPrice: number;
    effectiveDate: string;
    reason: string | null;
    createdAt: string;
    user?: {
      id: string;
      fullName: string;
    };
  }
  
  export interface CreateProductDto {
    categoryId: string;
    name: string;
    unit?: string;
    size?: string;
    currentPrice: number;
    currentStock?: number;
    shotsPerBottle?: number;
    linkedShotProductId?: string;
    notes?: string;
  }
  
  export interface UpdateProductDto {
    categoryId?: string;
    name?: string;
    unit?: string;
    size?: string;
    currentPrice?: number;
    currentStock?: number;
    costPrice?: number;
    shotsPerBottle?: number;
    linkedShotProductId?: string;
    isActive?: boolean;
    notes?: string;
  }
  
  export interface UpdatePriceDto {
    newPrice: number;
    reason?: string;
  }
  
  export interface CreateCategoryDto {
    name: string;
    description?: string;
    displayOrder?: number;
  }
  
  export interface UpdateCategoryDto {
    name?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  }
  
  export interface ProductStats {
    total: number;
    active: number;
    inactive: number;
    totalInventoryValue: number;
    lowStock: number;
  }