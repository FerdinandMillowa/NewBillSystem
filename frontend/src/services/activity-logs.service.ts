import api from "./api";
import type {
  ActivityLog,
  ActivityLogsResponse,
  ActivityLogStats,
  ActivityTimeline,
  UserActivityStats,
  QueryActivityLogsParams,
} from "../types/activity-log.types";

class ActivityLogsService {
  /**
   * Get all activity logs with filters (Admin only)
   */
  async getAll(params: QueryActivityLogsParams): Promise<ActivityLogsResponse> {
    const response = await api.get<ActivityLogsResponse>("/activity-logs", {
      params: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        search: params.search,
        startDate: params.startDate,
        endDate: params.endDate,
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });
    return response.data;
  }

  /**
   * Get action statistics (Admin only)
   */
  async getStats(): Promise<ActivityLogStats> {
    const response = await api.get<ActivityLogStats>("/activity-logs/stats");
    return response.data;
  }

  /**
   * Get activity timeline for specified number of days (Admin only)
   * @param days - Number of days to include in timeline (default: 7)
   */
  async getTimeline(days: number = 7): Promise<ActivityTimeline[]> {
    const response = await api.get<ActivityTimeline[]>(
      "/activity-logs/timeline",
      {
        params: { days },
      }
    );
    return response.data;
  }

  /**
   * Get recent activity logs (Admin only)
   * @param limit - Number of recent logs to retrieve (default: 20)
   */
  async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[]>("/activity-logs/recent", {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get current user's activity logs
   * @param limit - Number of logs to retrieve (default: 50)
   */
  async getMyActivity(limit: number = 50): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[]>("/activity-logs/me", {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get activity logs for a specific user (Admin only)
   * @param userId - User ID
   * @param limit - Number of logs to retrieve (default: 50)
   */
  async getByUser(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[]>(
      `/activity-logs/user/${userId}`,
      {
        params: { limit },
      }
    );
    return response.data;
  }

  /**
   * Get user activity statistics (Admin only)
   * @param userId - User ID
   */
  async getUserStats(userId: string): Promise<UserActivityStats> {
    const response = await api.get<UserActivityStats>(
      `/activity-logs/user/${userId}/stats`
    );
    return response.data;
  }

  /**
   * Clear old activity logs (Admin only)
   * @param days - Number of days to keep (default: 90)
   */
  async clearOldLogs(days: number = 90): Promise<{ deleted: number }> {
    const response = await api.delete<{ deleted: number }>(
      "/activity-logs/cleanup",
      {
        params: { days },
      }
    );
    return response.data;
  }

  /**
   * Export activity logs (Admin only)
   * Note: This is a placeholder for future implementation
   */
  async exportLogs(params: QueryActivityLogsParams): Promise<Blob> {
    const response = await api.get("/activity-logs/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  }

  /**
   * Get activity logs for a specific entity (Admin only)
   * @param entity - Entity type
   * @param entityId - Entity ID
   */
  async getByEntity(
    entity: string,
    entityId: string
  ): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[]>("/activity-logs", {
      params: {
        entity,
        entityId,
        limit: 100,
      },
    });
    return (response.data as any).logs || response.data;
  }

  /**
   * Get formatted action label
   */
  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: "Created",
      update: "Updated",
      delete: "Deleted",
      login: "Logged In",
      logout: "Logged Out",
      approve: "Approved",
      finalize: "Finalized",
      unlock: "Unlocked",
      reset_password: "Reset Password",
      change_password: "Changed Password",
      export: "Exported",
    };
    return labels[action] || action;
  }

  /**
   * Get formatted entity label
   */
  getEntityLabel(entity: string): string {
    const labels: Record<string, string> = {
      customer: "Customer",
      bill: "Bill",
      payment: "Payment",
      product: "Product",
      product_category: "Product Category",
      daily_sales: "Daily Sales",
      user: "User",
      stock_purchase: "Stock Purchase",
      inventory_transfer: "Inventory Transfer",
      expense: "Expense",
    };
    return labels[entity] || entity;
  }

  /**
   * Format activity details for display
   */
  formatDetails(details: any): string {
    if (!details) return "No details";
    
    if (typeof details === "string") {
      try {
        details = JSON.parse(details);
      } catch {
        return details;
      }
    }

    if (typeof details === "object") {
      // Extract meaningful information from details object
      const parts: string[] = [];
      
      if (details.changes) {
        const changes = Object.entries(details.changes)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
        parts.push(changes);
      }
      
      if (details.description) {
        parts.push(details.description);
      }
      
      if (details.amount) {
        parts.push(`Amount: MK ${details.amount}`);
      }
      
      if (details.status) {
        parts.push(`Status: ${details.status}`);
      }

      return parts.length > 0 ? parts.join(" | ") : JSON.stringify(details);
    }

    return String(details);
  }
}

export const activityLogsService = new ActivityLogsService();