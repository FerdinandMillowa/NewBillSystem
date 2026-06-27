import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { activityLogsService } from "../services/activity-logs.service";
import { Card } from "../components/ui/Card";
import { ActivityLogsTable } from "../components/activity-logs/ActivityLogsTable";
import { ActivityLogsFilters } from "../components/activity-logs/ActivityLogsFilters";
import { ActivityLogsStats } from "../components/activity-logs/ActivityLogsStats";
import { useAuth } from "../context/AuthContext";
import {
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import type { QueryActivityLogsParams } from "../types/activity-log.types";

export const ActivityLogs = () => {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState<QueryActivityLogsParams>({
    page: 1,
    limit: 20,
  });

  // Fetch activity logs
  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", filters],
    queryFn: () => activityLogsService.getAll(filters),
    enabled: isAdmin,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["activity-stats"],
    queryFn: () => activityLogsService.getStats(),
    enabled: isAdmin,
  });

  // Fetch timeline
  const { data: timeline } = useQuery({
    queryKey: ["activity-timeline"],
    queryFn: () => activityLogsService.getTimeline(7),
    enabled: isAdmin,
  });

  const handleFilterChange = (newFilters: Partial<QueryActivityLogsParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle forbidden access
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
            <p className="text-gray-600 mt-1">
              System activity and audit trail
            </p>
          </div>
        </div>
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You don't have permission to view system activity logs. Only
              administrators can access this section.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Activities",
      value: stats?.total || 0,
      icon: ClockIcon,
      color: "bg-blue-500",
    },
    {
      name: "Today's Activities",
      value: timeline?.[timeline.length - 1]?.count || 0,
      icon: DocumentTextIcon,
      color: "bg-green-500",
    },
    {
      name: "Unique Actions",
      value: stats?.actions.length || 0,
      icon: ChartBarIcon,
      color: "bg-purple-500",
    },
    {
      name: "Active Users",
      value: "N/A",
      icon: UserGroupIcon,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-1">System activity and audit trail</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats Chart & Timeline */}
      {stats && timeline && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityLogsStats stats={stats} />
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Timeline (Last 7 Days)
            </h3>
            <div className="space-y-3">
              {timeline.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">{day.date}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (day.count /
                              Math.max(...timeline.map((t) => t.count))) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {day.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <ActivityLogsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </Card>

      {/* Table */}
      <Card>
        <ActivityLogsTable
          logs={data?.logs || []}
          isLoading={isLoading}
          total={data?.total || 0}
          page={filters.page || 1}
          limit={filters.limit || 20}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
};
