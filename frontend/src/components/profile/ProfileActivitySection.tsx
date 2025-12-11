import { useQuery } from "@tanstack/react-query";
import { activityLogsService } from "../../services/activity-logs.service";
import { Card } from "../ui/Card";
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
} from "@heroicons/react/24/outline";
import type { ActivityLog } from "../../types/activity-log.types";

interface ProfileActivitySectionProps {
  userId?: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "create":
      return DocumentTextIcon;
    case "update":
      return ArrowPathIcon;
    case "delete":
      return DocumentTextIcon;
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
      return "text-green-600 bg-green-100";
    case "update":
      return "text-blue-600 bg-blue-100";
    case "delete":
      return "text-red-600 bg-red-100";
    case "login":
      return "text-green-600 bg-green-100";
    case "logout":
      return "text-gray-600 bg-gray-100";
    case "approve":
      return "text-purple-600 bg-purple-100";
    case "finalize":
      return "text-indigo-600 bg-indigo-100";
    case "unlock":
      return "text-yellow-600 bg-yellow-100";
    default:
      return "text-gray-600 bg-gray-100";
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

const getActionDescription = (log: ActivityLog) => {
  const entity = getEntityLabel(log.entity);
  const action = log.action.charAt(0).toUpperCase() + log.action.slice(1);

  if (log.details) {
    // Try to extract meaningful details
    const details =
      typeof log.details === "string" ? JSON.parse(log.details) : log.details;
    if (details.name) {
      return `${action} ${entity}: ${details.name}`;
    }
    if (details.description) {
      return `${action} ${entity}: ${details.description}`;
    }
    if (details.amount) {
      return `${action} ${entity}: MK ${details.amount}`;
    }
  }

  return `${action} ${entity}`;
};

export const ProfileActivitySection = ({
  userId,
}: ProfileActivitySectionProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["user-activity", userId],
    queryFn: () => activityLogsService.getMyActivity(50),
  });

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Activity Yet
          </h3>
          <p className="text-gray-600">
            Your activity history will appear here as you use the system.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">
                {activities.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Last Activity</p>
              <p className="text-lg font-bold text-gray-900">
                {formatDate(activities[0].createdAt)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-500">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Most Active</p>
              <p className="text-lg font-bold text-gray-900">
                {activities[0] ? getEntityLabel(activities[0].entity) : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
          <span className="text-sm text-gray-500">
            Last {activities.length} actions
          </span>
        </div>

        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, idx) => {
              const ActionIcon = getActionIcon(activity.action);
              const EntityIcon = getEntityIcon(activity.entity);
              const isLast = idx === activities.length - 1;

              return (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActionColor(
                            activity.action
                          )}`}
                        >
                          <ActionIcon className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-900">
                            {getActionDescription(activity)}
                          </p>
                          {activity.entityId && (
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {activity.entityId.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time>{formatDate(activity.createdAt)}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>

      {/* Activity Tips */}
      <Card className="bg-blue-50 border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ClockIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Activity Tracking
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Your activities are logged for security and audit purposes
                </li>
                <li>
                  Activities include logins, data creation, updates, and
                  deletions
                </li>
                <li>This helps maintain system integrity and accountability</li>
                <li>
                  Only you and system administrators can view your activity log
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
