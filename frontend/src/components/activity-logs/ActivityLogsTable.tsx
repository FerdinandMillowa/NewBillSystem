import type { ActivityLog } from "../../types/activity-log.types";
import { Button } from "../ui/Button";
import { formatDate } from "../../utils/formatters";
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  CogIcon,
  LockClosedIcon,
  LockOpenIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "create":
      return DocumentTextIcon;
    case "update":
      return ArrowPathIcon;
    case "delete":
      return TrashIcon;
    case "login":
      return LockOpenIcon;
    case "logout":
      return LockClosedIcon;
    case "approve":
      return CheckCircleIcon;
    case "finalize":
      return LockClosedIcon;
    case "unlock":
      return LockOpenIcon;
    default:
      return CogIcon;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "create":
      return "bg-green-100 text-green-800";
    case "update":
      return "bg-blue-100 text-blue-800";
    case "delete":
      return "bg-red-100 text-red-800";
    case "login":
      return "bg-green-100 text-green-800";
    case "logout":
      return "bg-gray-100 text-gray-800";
    case "approve":
      return "bg-purple-100 text-purple-800";
    case "finalize":
      return "bg-indigo-100 text-indigo-800";
    case "unlock":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getEntityIcon = (entity: string) => {
  switch (entity) {
    case "customer":
      return UserIcon;
    case "bill":
      return DocumentTextIcon;
    case "payment":
      return CreditCardIcon;
    case "product":
      return ShoppingBagIcon;
    case "daily_sales":
      return ChartBarIcon;
    default:
      return DocumentTextIcon;
  }
};

const getEntityLabel = (entity: string) => {
  return entity
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const ActivityLogsTable = ({
  logs,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
}: ActivityLogsTableProps) => {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No activity logs found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => {
              const ActionIcon = getActionIcon(log.action);
              const EntityIcon = getEntityIcon(log.entity);

              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        {log.user ? (
                          <span className="text-primary-600 font-medium text-xs">
                            {log.user.fullName.charAt(0)}
                          </span>
                        ) : (
                          <UserIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {log.user?.fullName || "System"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.user?.username || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                        log.action
                      )}`}
                    >
                      <ActionIcon className="w-3 h-3 mr-1" />
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <EntityIcon className="w-4 h-4 mr-2 text-gray-400" />
                      {getEntityLabel(log.entity)}
                    </div>
                    {log.entityId && (
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        {log.entityId.substring(0, 8)}...
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {log.details ? (
                        <span className="text-gray-600">
                          {typeof log.details === "object"
                            ? JSON.stringify(log.details).substring(0, 50)
                            : log.details.substring(0, 50)}
                          {(typeof log.details === "object"
                            ? JSON.stringify(log.details).length
                            : log.details.length) > 50 && "..."}
                        </span>
                      ) : (
                        <span className="text-gray-400">No details</span>
                      )}
                    </div>
                    {log.ipAddress && (
                      <div className="text-xs text-gray-500 mt-1">
                        IP: {log.ipAddress}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)}{" "}
            of {total} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 1 && p <= page + 1)
              )
              .map((p, idx, arr) => (
                <div key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <Button
                    variant={p === page ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </Button>
                </div>
              ))}
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
