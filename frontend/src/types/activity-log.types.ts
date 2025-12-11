
export enum ActivityAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LOGIN = 'login',
    LOGOUT = 'logout',
    APPROVE = 'approve',
    FINALIZE = 'finalize',
    UNLOCK = 'unlock',
    RESET_PASSWORD = 'reset_password',
    CHANGE_PASSWORD = 'change_password',
    EXPORT = 'export',
  }
  
  export enum ActivityEntity {
    CUSTOMER = 'customer',
    BILL = 'bill',
    PAYMENT = 'payment',
    PRODUCT = 'product',
    PRODUCT_CATEGORY = 'product_category',
    DAILY_SALES = 'daily_sales',
    USER = 'user',
    STOCK_PURCHASE = 'stock_purchase',
    INVENTORY_TRANSFER = 'inventory_transfer',
    EXPENSE = 'expense',
  }
  
  export interface ActivityLog {
    id: string;
    userId: string | null;
    action: ActivityAction;
    entity: ActivityEntity;
    entityId: string | null;
    details: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user?: {
      id: string;
      username: string;
      fullName: string;
      role: string;
    };
  }
  
  export interface ActivityLogStats {
    total: number;
    actions: {
      action: string;
      count: number;
      percentage: number;
    }[];
  }
  
  export interface ActivityTimeline {
    date: string;
    count: number;
  }
  
  export interface UserActivityStats {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: string;
    };
    totalActions: number;
    actionBreakdown: {
      action: string;
      count: number;
    }[];
    lastActivity: string | null;
  }
  
  export interface QueryActivityLogsParams {
    userId?: string;
    action?: ActivityAction;
    entity?: ActivityEntity;
    entityId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
  
  export interface ActivityLogsResponse {
    logs: ActivityLog[];
    total: number;
    page: number;
    limit: number;
  }